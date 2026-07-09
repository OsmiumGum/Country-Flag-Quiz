// Map Quiz Game Logic - Handles quiz flow, scoring, and interactions
// This connects the map functionality with the quiz game mechanics

class MapQuizGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.totalQuestions = 25;
        this.quiz = [];
        this.currentAnswer = '';
        this.isAnswered = false;
        this.hintUsed = false;
        this.gameStartTime = null;
        this.questionStartTime = null;
        
        // UI elements
        this.elements = {
            currentQ: document.getElementById('current-q'),
            totalQ: document.getElementById('total-q'),
            score: document.getElementById('score'),
            accuracy: document.getElementById('accuracy'),
            progressFill: document.getElementById('progress-fill'),
            flagImage: document.getElementById('flag-image'),
            hintBtn: document.getElementById('hint-btn'),
            skipBtn: document.getElementById('skip-btn'),
            endBtn: document.getElementById('end-quiz-btn'),
            feedback: document.getElementById('feedback'),
            loading: document.getElementById('loading'),
            autoAdvanceInfo: document.getElementById('auto-advance-info'),
            countdown: document.getElementById('countdown')
        };
        
        this.bindEvents();
    }
    
    // Initialize the game
    async init() {
        try {
            console.log('Initializing Map Quiz Game...');
            
            // Initialize the map
            const mapInitialized = await window.mapQuizCore.initializeMap();
            if (!mapInitialized) {
                throw new Error('Failed to initialize map');
            }
            
            // Generate quiz questions
            this.generateQuiz();
            
            // Start the game
            this.gameStartTime = Date.now();
            this.showQuestion();
            
            // Hide loading screen
            this.elements.loading.style.display = 'none';
            
            console.log('Game initialization complete');
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showError('Failed to initialize the map quiz. Please refresh and try again.');
        }
    }
    
    // Generate quiz questions
    generateQuiz() {
        console.log('Generating quiz questions...');
        
        // Get questions based on configuration
        this.quiz = generateQuizQuestions(quizConfig.difficulty, this.totalQuestions);
        
        // Update UI
        this.elements.totalQ.textContent = this.totalQuestions;
        
        console.log(`Generated ${this.quiz.length} questions`);
    }
    
    // Show current question
    showQuestion() {
        if (this.currentQuestion >= this.totalQuestions) {
            this.endGame();
            return;
        }
        
        const question = this.quiz[this.currentQuestion];
        this.currentAnswer = question.name;
        this.questionStartTime = Date.now();
        
        // Update UI
        this.elements.currentQ.textContent = this.currentQuestion + 1;
        this.elements.flagImage.src = question.flag;
        this.elements.flagImage.alt = `Flag of ${question.name}`;
        
        // Reset state
        this.isAnswered = false;
        this.hintUsed = false;
        window.mapQuizCore.isAnswered = false; // Update map core state
        
        // Reset button states and hide countdown
        this.elements.hintBtn.disabled = false;
        if (this.elements.autoAdvanceInfo) {
            this.elements.autoAdvanceInfo.style.display = 'none';
        }
        
        // Reset map styles
        window.mapQuizCore.resetMapStyles();
        
        // Update progress
        this.updateProgress();
        
        console.log(`Showing question ${this.currentQuestion + 1}: ${question.name}`);
    }
    
    // Handle country click from map
    handleCountryClick(clickedCountry, layer) {
        if (this.isAnswered) return;
        
        console.log(`Country clicked: ${clickedCountry}`);
        
        this.isAnswered = true;
        window.mapQuizCore.isAnswered = true;
        
        const currentCountryData = this.quiz[this.currentQuestion];
        const isCorrect = this.isAnswerCorrect(clickedCountry, currentCountryData.name);
        
        if (isCorrect) {
            this.handleCorrectAnswer(clickedCountry, layer);
        } else {
            this.handleIncorrectAnswer(clickedCountry, layer, currentCountryData.name);
        }
        
        // Update statistics
        this.updateStats();
        
        // Disable hint button
        this.elements.hintBtn.disabled = true;
        
        // Auto-advance to next question after feedback delay
        const delay = isCorrect ? 2000 : 3500;
        this.startCountdown(delay);
        
        setTimeout(() => {
            this.nextQuestion();
        }, delay);
        
        // Calculate response time
        const responseTime = Date.now() - this.questionStartTime;
        console.log(`Response time: ${responseTime}ms`);
    }
    
    // Check if answer is correct
    isAnswerCorrect(clickedCountry, correctCountry) {
        const normalizedClicked = normalizeCountryName(clickedCountry);
        const normalizedCorrect = normalizeCountryName(correctCountry);
        
        // Also check if the clicked country matches any of the geo names
        const currentCountryData = this.quiz[this.currentQuestion];
        const allValidNames = [
            currentCountryData.name,
            ...(currentCountryData.geoNames || [])
        ].map(name => normalizeCountryName(name));
        
        return allValidNames.includes(normalizedClicked);
    }
    
    // Handle correct answer
    handleCorrectAnswer(clickedCountry, layer) {
        console.log('Correct answer!');
        
        // Update score
        this.score++;
        
        // Visual feedback on map
        window.mapQuizCore.highlightCountry(clickedCountry, true);
        
        // Show feedback message
        this.showFeedback('🎉 Correct! Well done!', 'correct');
        
        // Add some visual flair
        this.celebrateCorrectAnswer();
    }
    
    // Handle incorrect answer
    handleIncorrectAnswer(clickedCountry, layer, correctCountry) {
        console.log(`Incorrect answer. Clicked: ${clickedCountry}, Correct: ${correctCountry}`);
        
        // Visual feedback on map
        window.mapQuizCore.highlightCountry(clickedCountry, false);
        
        // Show feedback message
        const message = `❌ Incorrect. That's ${clickedCountry}. The correct answer is ${correctCountry}.`;
        this.showFeedback(message, 'incorrect');
        
        // Highlight correct country after a delay
        setTimeout(() => {
            window.mapQuizCore.highlightCountry(correctCountry, true);
        }, 1500);
    }
    
    // Show hint
    showHint() {
        if (this.isAnswered || this.hintUsed) return;
        
        this.hintUsed = true;
        const currentCountryData = this.quiz[this.currentQuestion];
        const region = currentCountryData.region || 'somewhere in the world';
        
        this.showFeedback(`💡 Hint: This country is located in ${region}`, 'hint');
        this.elements.hintBtn.disabled = true;
        
        console.log(`Hint shown for ${currentCountryData.name}: ${region}`);
    }
    
    // Skip question
    skipQuestion() {
        if (this.isAnswered) return;
        
        const currentCountryData = this.quiz[this.currentQuestion];
        this.isAnswered = true;
        window.mapQuizCore.isAnswered = true;
        
        this.showFeedback(`⏭️ Skipped. The correct answer was ${currentCountryData.name}.`, 'incorrect');
        
        // Highlight correct country
        window.mapQuizCore.highlightCountry(currentCountryData.name, true);
        
        // Start countdown and auto-advance
        this.startCountdown(3000);
        setTimeout(() => {
            this.nextQuestion();
        }, 3000);
        
        console.log(`Question skipped: ${currentCountryData.name}`);
    }
    
    // Start countdown timer
    startCountdown(delay) {
        if (!this.elements.autoAdvanceInfo || !this.elements.countdown) return;
        
        this.elements.autoAdvanceInfo.style.display = 'block';
        
        const seconds = Math.ceil(delay / 1000);
        let remainingSeconds = seconds;
        
        this.elements.countdown.textContent = remainingSeconds;
        
        const countdownInterval = setInterval(() => {
            remainingSeconds--;
            if (remainingSeconds > 0) {
                this.elements.countdown.textContent = remainingSeconds;
            } else {
                clearInterval(countdownInterval);
                this.elements.autoAdvanceInfo.style.display = 'none';
            }
        }, 1000);
    }
    
    // Move to next question
    nextQuestion() {
        this.currentQuestion++;
        this.showQuestion();
    }
    
    // Update statistics display
    updateStats() {
        this.elements.score.textContent = this.score;
        
        const accuracy = this.currentQuestion > 0 ? 
            Math.round((this.score / (this.currentQuestion + 1)) * 100) : 0;
        this.elements.accuracy.textContent = `${accuracy}%`;
    }
    
    // Update progress bar
    updateProgress() {
        const progress = ((this.currentQuestion + 1) / this.totalQuestions) * 100;
        this.elements.progressFill.style.width = `${progress}%`;
    }
    
    // Show feedback message
    showFeedback(message, type) {
        const feedback = this.elements.feedback;
        feedback.textContent = message;
        feedback.className = `feedback show ${type}`;
        
        const duration = type === 'hint' ? 3000 : 4000;
        setTimeout(() => {
            feedback.classList.remove('show');
        }, duration);
    }
    
    // Celebrate correct answer with animation
    celebrateCorrectAnswer() {
        // Add a subtle celebration effect
        const flagImg = this.elements.flagImage;
        flagImg.style.transform = 'scale(1.05)';
        flagImg.style.transition = 'transform 0.3s ease';
        
        setTimeout(() => {
            flagImg.style.transform = 'scale(1)';
        }, 300);
    }
    
    // End game and show results
    endGame() {
        const gameTime = Date.now() - this.gameStartTime;
        const averageTime = Math.round(gameTime / this.totalQuestions / 1000);
        const percentage = Math.round((this.score / this.totalQuestions) * 100);
        
        let message, emoji, grade;
        
        if (percentage >= 90) {
            message = "Outstanding! You're a true geography master!";
            emoji = "🏆";
            grade = "A+";
        } else if (percentage >= 80) {
            message = "Excellent work! You know your world geography very well!";
            emoji = "🌟";
            grade = "A";
        } else if (percentage >= 70) {
            message = "Good job! You have solid geography knowledge.";
            emoji = "🎯";
            grade = "B";
        } else if (percentage >= 60) {
            message = "Not bad! Keep exploring the world map to improve.";
            emoji = "📍";
            grade = "C";
        } else if (percentage >= 50) {
            message = "Keep learning! Practice will help you improve.";
            emoji = "🧭";
            grade = "D";
        } else {
            message = "Keep exploring! Every geography expert started somewhere.";
            emoji = "🌍";
            grade = "F";
        }
        
        const resultsHTML = `
            <div class="results-container">
                <div class="results-header">
                    <h2>${emoji} Quiz Complete! ${emoji}</h2>
                    <div class="grade">${grade}</div>
                </div>
                
                <div class="results-stats">
                    <div class="stat-large">
                        <span class="stat-number">${this.score}</span>
                        <span class="stat-label">out of ${this.totalQuestions}</span>
                    </div>
                    <div class="stat-large">
                        <span class="stat-number">${percentage}%</span>
                        <span class="stat-label">Accuracy</span>
                    </div>
                    <div class="stat-large">
                        <span class="stat-number">${averageTime}s</span>
                        <span class="stat-label">Avg. Time</span>
                    </div>
                </div>
                
                <p class="results-message">${message}</p>
                
                <div class="results-actions">
                    <button onclick="location.reload()" class="result-btn primary">
                        🔄 Play Again
                    </button>
                    <button onclick="window.close()" class="result-btn secondary">
                        🏠 Back to Menu
                    </button>
                </div>
            </div>
        `;
        
        this.elements.loading.innerHTML = resultsHTML;
        this.elements.loading.style.display = 'block';
        
        console.log(`Game completed. Score: ${this.score}/${this.totalQuestions} (${percentage}%)`);
    }
    
    // Show error message
    showError(message) {
        this.elements.loading.innerHTML = `
            <div style="text-align: center; color: #dc3545;">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                ">Refresh Page</button>
            </div>
        `;
    }
    
    // Bind event listeners
    bindEvents() {
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.skipBtn.addEventListener('click', () => this.skipQuestion());
        this.elements.endBtn.addEventListener('click', () => this.endGame());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.showHint();
            } else if (e.key === 's' || e.key === 'S') {
                this.skipQuestion();
            }
        });
        
        console.log('Event listeners bound');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting Map Quiz Game...');
    window.mapQuizGame = new MapQuizGame();
    window.mapQuizGame.init();
});