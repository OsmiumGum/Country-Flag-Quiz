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
            <p><small>To enable accounts: Configure Firebase in assets/js/firebase-config.js</small></p>
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
                overallPercentage: 0,
                profilePicture: null,
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
            this.closeProfileDrawer();
            this.closeUserMenu();
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
            const userRef = db.collection('users').doc(this.currentUser.uid);
            const userDoc = await userRef.get();
            this.userProfile = userDoc.exists ? userDoc.data() : null;

            // Load flag statistics
            const flagStatsSnapshot = await userRef
                .collection('flagStats')
                .get();

            this.userStats = {};
            flagStatsSnapshot.forEach(doc => {
                this.userStats[doc.id] = doc.data();
            });

            // Load recent game history for charts
            try {
                const historySnapshot = await userRef
                    .collection('gameHistory')
                    .orderBy('playedAt', 'desc')
                    .limit(12)
                    .get();

                this.gameHistory = [];
                historySnapshot.forEach(doc => {
                    this.gameHistory.push(doc.data());
                });
            } catch (historyError) {
                console.warn('Game history not available yet:', historyError);
                this.gameHistory = [];
            }

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
    async updateGameCompletion(score, totalQuestions, gameMode = 'Unknown Mode') {
        if (!this.currentUser) return;

        const userId = this.currentUser.uid;
        const userRef = db.collection('users').doc(userId);
        const historyRef = userRef.collection('gameHistory').doc();

        try {
            const userDoc = await userRef.get();
            const currentData = userDoc.data() || {};
            
            const newTotalGames = (currentData.totalGames || 0) + 1;
            const newTotalCorrect = (currentData.totalCorrect || 0) + score;
            const newTotalQuestions = (currentData.totalQuestions || 0) + totalQuestions;
            const newBestScore = Math.max(currentData.bestScore || 0, score);
            const overallPercentage = newTotalQuestions > 0 ? Math.round((newTotalCorrect / newTotalQuestions) * 100) : 0;
            const gamePercentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

            const batch = db.batch();
            batch.update(userRef, {
                totalGames: newTotalGames,
                totalCorrect: newTotalCorrect,
                totalQuestions: newTotalQuestions,
                bestScore: newBestScore,
                lastPlayed: firebase.firestore.FieldValue.serverTimestamp(),
                overallPercentage: overallPercentage
            });
            batch.set(historyRef, {
                score: score,
                totalQuestions: totalQuestions,
                percentage: gamePercentage,
                mode: gameMode,
                playedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await batch.commit();

            // Update local profile
            this.userProfile = {
                ...this.userProfile,
                totalGames: newTotalGames,
                totalCorrect: newTotalCorrect,
                totalQuestions: newTotalQuestions,
                bestScore: newBestScore,
                overallPercentage: overallPercentage
            };
            this.gameHistory = [{
                score,
                totalQuestions,
                percentage: gamePercentage,
                mode: gameMode
            }, ...(this.gameHistory || [])].slice(0, 12);

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
        this.closeProfileDrawer();
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
            userInfo.classList.remove('hidden');
            loginAccess.classList.add('hidden');
            userInfo.innerHTML = `
                <div class="user-display">
                    <button id="avatar-button" class="avatar-button" aria-label="Open profile"></button>
                </div>
            `;

            this.renderAvatarButton();

            const avatarButton = document.getElementById('avatar-button');
            if (avatarButton) {
                avatarButton.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openProfileDrawer();
                });
            }
        } else {
            if (userInfo) {
                userInfo.classList.add('hidden');
                userInfo.innerHTML = '';
            }
            if (loginAccess) loginAccess.classList.remove('hidden');
        }
    }

    // Simple profile display
    updateSimpleProfile() {
        const profileStats = document.getElementById('simple-profile-stats');
        if (!profileStats) {
            console.log('Profile stats element not found');
            return;
        }

        if (!this.currentUser) {
            profileStats.innerHTML = '<div class="profile-empty-state">Sign in to see your profile.</div>';
            return;
        }

        const totalFlagsAttempted = Object.keys(this.userStats || {}).length;
        const totalGames = this.userProfile?.totalGames || 0;
        const overallPercentage = this.userProfile?.overallPercentage || 0;
        const bestScore = this.userProfile?.bestScore || 0;
        const averageScore = totalGames > 0 ? Math.round((this.userProfile.totalCorrect || 0) / totalGames) : 0;
        const streak = this.userProfile?.currentStreak || 0;
        const recentGames = (this.gameHistory || []).slice(0, 6);

        const profileAvatarMarkup = this.getAvatarMarkup('profile-avatar-large');
        const profileTitle = this.currentUser.displayName || this.currentUser.email || 'Player';

        profileStats.innerHTML = `
            <div class="profile-shell">
                <section class="profile-hero">
                    <div class="profile-hero-top">
                        ${profileAvatarMarkup}
                        <div class="profile-meta">
                            <h3>${profileTitle}</h3>
                            <p>${this.currentUser.email || ''}</p>
                        </div>
                    </div>
                    <div class="profile-badges">
                        <span class="profile-badge">${totalGames} games played</span>
                        <span class="profile-badge">${totalFlagsAttempted} flags attempted</span>
                        <span class="profile-badge">${streak} streak</span>
                    </div>
                </section>

                <section class="profile-section">
                    <h3>Quick stats</h3>
                    <div class="profile-stat-grid">
                        <div class="profile-stat-card">
                            <div class="profile-stat-label">Overall accuracy</div>
                            <div class="profile-stat-value">${overallPercentage}%</div>
                            <div class="profile-stat-subtext">Across all saved games</div>
                        </div>
                        <div class="profile-stat-card">
                            <div class="profile-stat-label">Best score</div>
                            <div class="profile-stat-value">${bestScore}</div>
                            <div class="profile-stat-subtext">Best single-game score</div>
                        </div>
                        <div class="profile-stat-card">
                            <div class="profile-stat-label">Average score</div>
                            <div class="profile-stat-value">${averageScore}</div>
                            <div class="profile-stat-subtext">Average correct answers per game</div>
                        </div>
                        <div class="profile-stat-card">
                            <div class="profile-stat-label">Flags attempted</div>
                            <div class="profile-stat-value">${totalFlagsAttempted}</div>
                            <div class="profile-stat-subtext">Unique flags in your history</div>
                        </div>
                    </div>
                </section>

                <section class="profile-section">
                    <h3>Performance charts</h3>
                    <div class="profile-chart-grid">
                        <div class="profile-chart-card">
                            <h4>Accuracy trend</h4>
                            <div class="chart-canvas-wrap"><canvas id="profile-trend-chart"></canvas></div>
                        </div>
                    </div>
                </section>

                <section class="profile-section">
                    <h3>Your recent games</h3>
                    <div class="profile-chart-card">
                        ${recentGames.length > 0 ? `<div class="practice-preview-grid">
                            ${recentGames.map((game, index) => `
                                <div class="practice-preview-item">
                                    <div class="practice-preview-info">
                                        <div class="profile-stat-label">#${index + 1}</div>
                                        <div class="practice-preview-name">${game.mode || 'Game'} · ${game.score}/${game.totalQuestions}</div>
                                    </div>
                                    <div class="practice-preview-score">${game.percentage || 0}%</div>
                                </div>
                            `).join('')}
                        </div>` : '<div class="profile-empty-state">Your trend chart will appear here after a few games.</div>'}
                    </div>
                </section>

                <section class="profile-section">
                    <div class="avatar-picker-header">
                        <div>
                            <h3>Select profile flag</h3>
                            <p>Pick any country flag to use as your avatar.</p>
                        </div>
                    </div>
                    <div id="avatar-picker-grid" class="avatar-picker-grid"></div>
                </section>

                <div class="profile-drawer-footer">
                    <button class="menu-action-btn profile-btn profile-detail-btn" id="open-detail-stats-btn">
                        <span class="profile-btn-text">
                            <span class="profile-btn-label">Detailed statistics</span>
                            <span class="profile-btn-subtext">All-time flag attempts</span>
                        </span>
                    </button>
                    <button class="menu-action-btn logout-btn profile-logout-btn" id="profile-logout-btn">Logout</button>
                </div>
            </div>
        `;

        this.renderAvatarPicker();
        this.renderProfileCharts();

        const profileDetailBtn = document.getElementById('open-detail-stats-btn');
        const profileLogoutBtn = document.getElementById('profile-logout-btn');
        if (profileDetailBtn) {
            profileDetailBtn.addEventListener('click', () => this.openDetailedStatsWindow());
        }
        if (profileLogoutBtn) {
            profileLogoutBtn.addEventListener('click', () => this.logout());
        }
    }

    getAvatarMarkup(className = '') {
        const displayName = this.currentUser?.displayName || this.currentUser?.email || 'Player';
        const initials = displayName
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();
        const profilePicture = this.userProfile?.profilePicture;

        if (profilePicture) {
            const flagCode = String(profilePicture).toLowerCase();
            return `
                <div class="${className}">
                    <img class="avatar-image" src="https://flagcdn.com/w80/${flagCode}.png" alt="Selected profile flag">
                </div>
            `;
        }

        return `<div class="${className}"><span class="avatar-fallback">${initials}</span></div>`;
    }

    renderAvatarButton() {
        const avatarButton = document.getElementById('avatar-button');
        if (!avatarButton) return;

        const hasProfilePicture = Boolean(this.userProfile?.profilePicture);
        avatarButton.classList.toggle('has-profile-picture', hasProfilePicture);
        avatarButton.innerHTML = this.getAvatarMarkup('avatar-button-content');
        avatarButton.title = 'Open profile menu';
    }

    renderUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (!userMenu || !this.currentUser) return;

        const displayName = this.currentUser.displayName || this.currentUser.email || 'Player';
        userMenu.innerHTML = `
            <div class="user-menu-header">
                <span class="user-menu-name">${displayName}</span>
                <span class="user-menu-email">${this.currentUser.email || ''}</span>
            </div>
            <div class="user-menu-actions">
                <button class="menu-action-btn profile-btn" id="open-profile-btn">
                    ${this.getAvatarMarkup('profile-btn-avatar')}
                    <span class="profile-btn-text">
                        <span class="profile-btn-label">View profile</span>
                        <span class="profile-btn-subtext">${displayName}</span>
                    </span>
                </button>
                <button class="menu-action-btn logout-btn" id="menu-logout-btn">Logout</button>
            </div>
        `;

        const openProfileBtn = document.getElementById('open-profile-btn');
        const menuLogoutBtn = document.getElementById('menu-logout-btn');
        if (openProfileBtn) openProfileBtn.addEventListener('click', () => this.openProfileDrawer());
        if (menuLogoutBtn) menuLogoutBtn.addEventListener('click', () => this.logout());

        requestAnimationFrame(() => userMenu.classList.remove('hidden'));
    }

    toggleUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (!userMenu) return;

        const isHidden = userMenu.classList.contains('hidden');
        if (isHidden) {
            userMenu.classList.remove('hidden');
            requestAnimationFrame(() => userMenu.classList.add('open'));
        } else {
            userMenu.classList.remove('open');
            setTimeout(() => userMenu.classList.add('hidden'), 140);
        }
    }

    closeUserMenu() {
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
            userMenu.classList.remove('open');
            setTimeout(() => userMenu.classList.add('hidden'), 140);
        }
    }

    openProfileDrawer() {
        const drawer = document.getElementById('profile-drawer');
        if (!drawer) return;
        this.closeUserMenu();
        this.updateSimpleProfile();
        drawer.classList.remove('hidden');
        drawer.setAttribute('aria-hidden', 'false');
    }

    closeProfileDrawer() {
        const drawer = document.getElementById('profile-drawer');
        if (drawer) {
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
        }
    }

    openDetailedStatsWindow() {
        const url = 'detailed-stats.html';
        const features = 'width=1200,height=900,resizable=yes,scrollbars=yes';
        const win = window.open(url, '_blank', features);
        if (win) {
            win.focus();
        } else {
            this.showMessage('Pop-up blocked. Please allow pop-ups to open detailed statistics.', 'error');
        }
    }

    async setProfilePicture(flagCode) {
        if (!this.currentUser) return;
        const normalized = String(flagCode || '').toLowerCase();
        try {
            await db.collection('users').doc(this.currentUser.uid).update({
                profilePicture: normalized
            });
            this.userProfile = {
                ...this.userProfile,
                profilePicture: normalized
            };
            this.updateUserDisplay();
            this.updateSimpleProfile();
        } catch (error) {
            console.error('Error updating profile picture:', error);
        }
    }

    renderAvatarPicker() {
        const pickerGrid = document.getElementById('avatar-picker-grid');
        if (!pickerGrid) return;

        const current = String(this.userProfile?.profilePicture || '').toLowerCase();
        const flagsHtml = countries.map(country => {
            const code = getFlagCodeFromUrl(country.flag);
            if (!code) return '';
            const selectedClass = current === code ? 'selected' : '';
            return `
                <button class="flag-avatar-option ${selectedClass}" data-flag-code="${code}" aria-label="Select ${country.name} as your profile picture">
                    <img src="https://flagcdn.com/w80/${code}.png" alt="${country.name} flag" onerror="this.src='https://via.placeholder.com/80x60?text=🏁'">
                </button>
            `;
        }).join('');

        pickerGrid.innerHTML = flagsHtml;
        pickerGrid.querySelectorAll('.flag-avatar-option').forEach(button => {
            button.addEventListener('click', () => {
                const flagCode = button.getAttribute('data-flag-code');
                this.setProfilePicture(flagCode);
            });
        });
    }

    renderProfileCharts() {
        if (typeof Chart === 'undefined') return;

        const trendCanvas = document.getElementById('profile-trend-chart');

        if (this._trendChart) {
            this._trendChart.destroy();
            this._trendChart = null;
        }
        if (this._practiceChart) {
            this._practiceChart.destroy();
            this._practiceChart = null;
        }

        const recent = (this.gameHistory || []).slice().reverse();
        if (trendCanvas && recent.length) {
            this._trendChart = new Chart(trendCanvas, {
                type: 'line',
                data: {
                    labels: recent.map((_, index) => `Game ${index + 1}`),
                    datasets: [{
                        label: 'Accuracy %',
                        data: recent.map(game => game.percentage || 0),
                        borderColor: '#5b86e5',
                        backgroundColor: 'rgba(91,134,229,0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointBackgroundColor: '#36d1dc'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100, ticks: { color: '#666' } },
                        x: { ticks: { color: '#666' } }
                    }
                }
            });
        }


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
    if (userManager) {
        userManager.openProfileDrawer();
    }
}

function closeSimpleProfile() {
    if (userManager) {
        userManager.closeProfileDrawer();
    }
}

function closeProfileDrawer() {
    closeSimpleProfile();
}

// Ensure drawer is hidden on page load
document.addEventListener('DOMContentLoaded', function() {
    const drawer = document.getElementById('profile-drawer');
    if (drawer) {
        drawer.classList.add('hidden');
        drawer.setAttribute('aria-hidden', 'true');
    }
});

// Add escape key listener
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const drawer = document.getElementById('profile-drawer');
        if (drawer && !drawer.classList.contains('hidden')) {
            closeSimpleProfile();
        }
    }
});

// Close the profile menu when clicking anywhere else
document.addEventListener('click', function() {
    if (userManager) {
        userManager.closeUserMenu();
    }
});

// Initialize user manager
const userManager = new UserManager();
window.userManager = userManager;

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