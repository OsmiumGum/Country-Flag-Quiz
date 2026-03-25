// Authentication and User Management

class UserManager {
    constructor() {
        this.currentUser = null;
        this.userStats = null;
        this.init();
    }

    init() {
        // Check if Firebase is properly configured
        if (!window.isFirebaseConfigured) {
            console.log('🎮 Demo mode: User accounts disabled');
            this.showDemoMode();
            return;
        }
        
        // Listen for authentication state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserStats();
                this.showGameScreens();
            } else {
                this.currentUser = null;
                this.userStats = null;
                this.showLoginAccess();
            }
        });
    }

    // Show demo mode (no authentication)
    showDemoMode() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('login-access').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
        
        // Add demo mode notice
        const startScreen = document.getElementById('start-screen');
        const demoNotice = document.createElement('div');
        demoNotice.className = 'demo-notice';
        demoNotice.innerHTML = `
            <p>🎮 <strong>Demo Mode</strong> - User accounts are disabled</p>
            <p>Your scores won't be saved, but you can still play both game modes!</p>
            <p><small>To enable accounts: Configure Firebase in firebase-config.js</small></p>
        `;
        startScreen.insertBefore(demoNotice, startScreen.firstChild);
    }

    // Register new user
    async register(email, password, username) {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update user profile with username
            await user.updateProfile({
                displayName: username
            });

            // Create user document in Firestore
            await db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                totalGames: 0,
                totalCorrect: 0,
                totalQuestions: 0,
                bestScore: 0,
                currentStreak: 0,
                bestStreak: 0
            });

            this.showMessage('Account created successfully!', 'success');
            return true;
        } catch (error) {
            this.showMessage(error.message, 'error');
            return false;
        }
    }

    // Login user
    async login(email, password) {
        try {
            await auth.signInWithEmailAndPassword(email, password);
            this.showMessage('Logged in successfully!', 'success');
            return true;
        } catch (error) {
            this.showMessage(error.message, 'error');
            return false;
        }
    }

    // Logout user
    async logout() {
        try {
            await auth.signOut();
            this.showMessage('Logged out successfully!', 'success');
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // Load user statistics
    async loadUserStats() {
        if (!this.currentUser) return;

        try {
            // Load user profile
            const userDoc = await db.collection('users').doc(this.currentUser.uid).get();
            this.userProfile = userDoc.exists ? userDoc.data() : null;

            // Load flag statistics
            const flagStatsSnapshot = await db.collection('users')
                .doc(this.currentUser.uid)
                .collection('flagStats')
                .get();

            this.userStats = {};
            flagStatsSnapshot.forEach(doc => {
                this.userStats[doc.id] = doc.data();
            });

            this.updateUserDisplay();
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    // Record flag attempt
    async recordFlagAttempt(countryName, flagCode, isCorrect) {
        if (!this.currentUser) return;

        const userId = this.currentUser.uid;
        const flagStatRef = db.collection('users').doc(userId).collection('flagStats').doc(flagCode);

        try {
            // Update flag statistics
            const flagDoc = await flagStatRef.get();
            
            if (flagDoc.exists) {
                const currentStats = flagDoc.data();
                const newCorrect = currentStats.correct + (isCorrect ? 1 : 0);
                const newTotal = currentStats.total + 1;
                
                await flagStatRef.update({
                    correct: newCorrect,
                    total: newTotal,
                    percentage: Math.round((newCorrect / newTotal) * 100),
                    lastAttempt: firebase.firestore.FieldValue.serverTimestamp(),
                    countryName: countryName
                });
            } else {
                await flagStatRef.set({
                    countryName: countryName,
                    correct: isCorrect ? 1 : 0,
                    total: 1,
                    percentage: isCorrect ? 100 : 0,
                    lastAttempt: firebase.firestore.FieldValue.serverTimestamp(),
                    firstAttempt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Update local stats
            if (!this.userStats[flagCode]) {
                this.userStats[flagCode] = {
                    countryName: countryName,
                    correct: 0,
                    total: 0,
                    percentage: 0
                };
            }
            
            this.userStats[flagCode].correct += (isCorrect ? 1 : 0);
            this.userStats[flagCode].total += 1;
            this.userStats[flagCode].percentage = Math.round(
                (this.userStats[flagCode].correct / this.userStats[flagCode].total) * 100
            );

        } catch (error) {
            console.error('Error recording flag attempt:', error);
        }
    }

    // Update game completion
    async updateGameCompletion(score, totalQuestions) {
        if (!this.currentUser) return;

        const userId = this.currentUser.uid;
        const userRef = db.collection('users').doc(userId);

        try {
            const userDoc = await userRef.get();
            const currentData = userDoc.data();
            
            const newTotalGames = (currentData.totalGames || 0) + 1;
            const newTotalCorrect = (currentData.totalCorrect || 0) + score;
            const newTotalQuestions = (currentData.totalQuestions || 0) + totalQuestions;
            const newBestScore = Math.max(currentData.bestScore || 0, score);
            
            await userRef.update({
                totalGames: newTotalGames,
                totalCorrect: newTotalCorrect,
                totalQuestions: newTotalQuestions,
                bestScore: newBestScore,
                lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
                overallPercentage: Math.round((newTotalCorrect / newTotalQuestions) * 100)
            });

            // Update local profile
            this.userProfile = {
                ...this.userProfile,
                totalGames: newTotalGames,
                totalCorrect: newTotalCorrect,
                totalQuestions: newTotalQuestions,
                bestScore: newBestScore,
                overallPercentage: Math.round((newTotalCorrect / newTotalQuestions) * 100)
            };

        } catch (error) {
            console.error('Error updating game completion:', error);
        }
    }

    // Get flags user struggles with (lowest percentages)
    getWeakestFlags(limit = 10) {
        if (!this.userStats) return [];
        
        const flagArray = Object.entries(this.userStats)
            .map(([flagCode, stats]) => ({ flagCode, ...stats }))
            .filter(flag => flag.total >= 2) // Only flags attempted at least twice
            .sort((a, b) => a.percentage - b.percentage)
            .slice(0, limit);
            
        return flagArray;
    }

    // Get flags user knows well (highest percentages)
    getStrongestFlags(limit = 10) {
        if (!this.userStats) return [];
        
        const flagArray = Object.entries(this.userStats)
            .map(([flagCode, stats]) => ({ flagCode, ...stats }))
            .filter(flag => flag.total >= 3) // Only flags attempted at least 3 times
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, limit);
            
        return flagArray;
    }

    // Show authentication screen
    showAuthScreen() {
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.add('hidden');
        document.getElementById('results-screen').classList.add('hidden');
        document.getElementById('login-access').classList.add('hidden');
        this.closeProfile(); // Close profile modal if open
    }

    // Show game screens (hide auth)
    showGameScreens() {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        document.getElementById('login-access').classList.add('hidden');
        this.updateUserDisplay();
    }

    // Show login access for non-logged in users
    showLoginAccess() {
        document.getElementById('login-access').classList.remove('hidden');
        document.getElementById('user-info').classList.add('hidden');
    }

    // Update user display elements
    updateUserDisplay() {
        const userInfo = document.getElementById('user-info');
        const loginAccess = document.getElementById('login-access');
        
        if (this.currentUser && userInfo) {
            userInfo.classList.remove('hidden'); // Make user info visible
            loginAccess.classList.add('hidden'); // Hide login access
            userInfo.innerHTML = `
                <div class="user-display">
                    <span>Welcome, ${this.currentUser.displayName || this.currentUser.email}!</span>
                    <button onclick="showSimpleProfile()" class="profile-btn">Profile</button>
                    <button id="logout-btn" class="logout-btn">Logout</button>
                </div>
            `;

            // Add event listeners
            document.getElementById('logout-btn').addEventListener('click', () => this.logout());
        } else {
            if (userInfo) userInfo.classList.add('hidden'); // Hide user info when not logged in
            if (loginAccess) loginAccess.classList.remove('hidden'); // Show login access
        }
    }

    // Simple profile display
    updateSimpleProfile() {
        const profileStats = document.getElementById('simple-profile-stats');
        if (!profileStats) {
            console.log('Profile stats element not found');
            return;
        }

        if (!this.userProfile) {
            profileStats.innerHTML = '<div class="no-data">No statistics available. Play some games first!</div>';
            return;
        }

        const totalFlagsAttempted = Object.keys(this.userStats || {}).length;

        const statsHTML = 
            '<div class="simple-stats">' +
                '<div class="stat-row">' +
                    '<strong>Games Played:</strong> <span>' + (this.userProfile.totalGames || 0) + '</span>' +
                '</div>' +
                '<div class="stat-row">' +
                    '<strong>Overall Accuracy:</strong> <span>' + (this.userProfile.overallPercentage || 0) + '%</span>' +
                '</div>' +
                '<div class="stat-row">' +
                    '<strong>Best Score:</strong> <span>' + (this.userProfile.bestScore || 0) + '</span>' +
                '</div>' +
                '<div class="stat-row">' +
                    '<strong>Flags Attempted:</strong> <span>' + totalFlagsAttempted + '</span>' +
                '</div>' +
            '</div>' +
            '<div class="detailed-stats-section">' +
                '<div class="stats-controls">' +
                    '<button id="show-detailed-stats-btn" class="stats-btn">Show Detailed Flag Statistics</button>' +
                '</div>' +
                '<div id="detailed-stats-container" class="hidden">' +
                    '<div class="sort-controls">' +
                        '<label>Sort by: </label>' +
                        '<select id="sort-dropdown">' +
                            '<option value="percentage-desc">Best Performance (% then attempts)</option>' +
                            '<option value="attempts-desc">Most Practiced (attempts then %)</option>' +
                            '<option value="percentage-asc">Needs Practice (lowest % first)</option>' +
                            '<option value="alphabetical">Country Name (A-Z)</option>' +
                            '<option value="attempts-asc">Least Practiced (fewest attempts)</option>' +
                        '</select>' +
                    '</div>' +
                    '<div id="all-flags-list" class="all-flags-container">' +
                        '<!-- Will be populated by JavaScript -->' +
                    '</div>' +
                '</div>' +
            '</div>';

        profileStats.innerHTML = statsHTML;

        // Add event listeners for detailed stats
        this.attachDetailedStatsEventListeners();
    }

    // Attach event listeners for detailed statistics
    attachDetailedStatsEventListeners() {
        const showDetailedBtn = document.getElementById('show-detailed-stats-btn');
        const detailedContainer = document.getElementById('detailed-stats-container');
        const sortDropdown = document.getElementById('sort-dropdown');

        if (showDetailedBtn && detailedContainer) {
            showDetailedBtn.addEventListener('click', () => {
                const isHidden = detailedContainer.classList.contains('hidden');
                if (isHidden) {
                    detailedContainer.classList.remove('hidden');
                    showDetailedBtn.textContent = 'Hide Detailed Statistics';
                    this.displayAllFlags();
                } else {
                    detailedContainer.classList.add('hidden');
                    showDetailedBtn.textContent = 'Show Detailed Flag Statistics';
                }
            });
        }

        if (sortDropdown) {
            sortDropdown.addEventListener('change', () => {
                this.displayAllFlags();
            });
        }
    }

    // Display all flags with sorting
    displayAllFlags() {
        const allFlagsList = document.getElementById('all-flags-list');
        const sortDropdown = document.getElementById('sort-dropdown');
        
        if (!allFlagsList || !this.userStats) return;

        const sortBy = sortDropdown ? sortDropdown.value : 'percentage-desc';
        let flagsArray = Object.entries(this.userStats)
            .map(([flagCode, stats]) => ({ flagCode: flagCode, ...stats }));

        // Sort based on selection
        switch (sortBy) {
            case 'percentage-desc':
                // Sort by percentage first (high to low), then by total attempts (high to low)
                flagsArray.sort((a, b) => {
                    if (a.percentage === b.percentage) {
                        return b.total - a.total; // Higher attempts first for same percentage
                    }
                    return b.percentage - a.percentage; // Higher percentage first
                });
                break;
            case 'percentage-asc':
                // Sort by percentage first (low to high), then by total attempts (high to low)
                flagsArray.sort((a, b) => {
                    if (a.percentage === b.percentage) {
                        return b.total - a.total; // Higher attempts first for same percentage
                    }
                    return a.percentage - b.percentage; // Lower percentage first
                });
                break;
            case 'alphabetical':
                flagsArray.sort((a, b) => a.countryName.localeCompare(b.countryName));
                break;
            case 'attempts-desc':
                // Sort by total attempts first (high to low), then by percentage (high to low)
                flagsArray.sort((a, b) => {
                    if (a.total === b.total) {
                        return b.percentage - a.percentage; // Higher percentage first for same attempts
                    }
                    return b.total - a.total; // Higher attempts first
                });
                break;
            case 'attempts-asc':
                // Sort by total attempts first (low to high), then by percentage (low to high)  
                flagsArray.sort((a, b) => {
                    if (a.total === b.total) {
                        return a.percentage - b.percentage; // Lower percentage first for same attempts
                    }
                    return a.total - b.total; // Lower attempts first
                });
                break;
        }

        let flagsContent = '';
        if (flagsArray.length > 0) {
            flagsContent = flagsArray.map(flag => 
                '<div class="detailed-flag-item ' + this.getFlagPerformanceClass(flag.percentage) + '">' +
                    '<div class="flag-info">' +
                        '<img src="https://flagcdn.com/w40/' + flag.flagCode + '.png" ' +
                             'alt="' + flag.countryName + ' flag" ' +
                             'class="flag-icon" ' +
                             'onerror="this.src=\'https://via.placeholder.com/40x24?text=🏁\'">' +
                        '<div class="flag-country">' + flag.countryName + '</div>' +
                    '</div>' +
                    '<div class="flag-stats">' +
                        '<div class="flag-percentage">' + flag.percentage + '%</div>' +
                        '<div class="flag-attempts">' + flag.correct + '/' + flag.total + ' correct</div>' +
                    '</div>' +
                '</div>'
            ).join('');
        } else {
            flagsContent = '<div class="no-data">No flag statistics available yet. Play some games to see your progress!</div>';
        }

        allFlagsList.innerHTML = 
            '<div class="all-flags-header">' +
                '<div class="stats-summary">' +
                    (flagsArray.length > 0 ? 'Showing ' + flagsArray.length + ' flags attempted' : 'No flags attempted yet') +
                '</div>' +
            '</div>' +
            '<div class="all-flags-grid">' +
                flagsContent +
            '</div>';
    }

    // Get performance class based on percentage
    getFlagPerformanceClass(percentage) {
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'average';
        return 'needs-practice';
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Global functions for simple profile
function showSimpleProfile() {
    console.log('showSimpleProfile called');
    const modal = document.getElementById('profile-modal');
    if (!modal) {
        console.log('Modal not found');
        return;
    }
    
    if (!userManager) {
        console.log('UserManager not found');
        return;
    }
    
    console.log('User profile:', userManager.userProfile);
    userManager.updateSimpleProfile();
    modal.classList.remove('hidden');
}

function closeSimpleProfile() {
    console.log('closeSimpleProfile called');
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Ensure modal is hidden on page load
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
});

// Add escape key listener
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('profile-modal');
        if (modal && !modal.classList.contains('hidden')) {
            closeSimpleProfile();
        }
    }
});

// Initialize user manager
const userManager = new UserManager();

// Global functions for onclick handlers (backup method)
function startGame25() {
    console.log('startGame25 called');
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    
    if (startScreen && quizScreen) {
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        generateQuiz(false);
    } else {
        console.error('Could not find start-screen or quiz-screen elements');
    }
}

function startGameUnlimited() {
    console.log('startGameUnlimited called');
    const startScreen = document.getElementById('start-screen');
    const quizScreen = document.getElementById('quiz-screen');
    
    if (startScreen && quizScreen) {
        startScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        generateQuiz(true);
    } else {
        console.error('Could not find start-screen or quiz-screen elements');
    }
}