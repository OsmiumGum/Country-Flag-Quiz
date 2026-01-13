// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const authScreen = document.getElementById('auth-screen');
const restartBtn = document.getElementById('restart-btn');
const flagImage = document.getElementById('flag-image');
const optionsContainer = document.getElementById('options-container');
const currentQuestionSpan = document.getElementById('current-question');
const scoreSpan = document.getElementById('score');
const finalScoreSpan = document.getElementById('final-score');
const feedbackMessage = document.getElementById('feedback-message');
const progressFill = document.getElementById('progress-fill');

// Game variables
let quiz = [];
let currentQuestion = 0;
let score = 0;
let usedCountries = [];
let totalQuestions = 25;
let isUnlimitedMode = false;

// Function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Function to get random countries
function getRandomCountries(count) {
    // Create a copy of countries array to avoid modifying the original
    let availableCountries = [...countries];
    // Shuffle the array to randomize selection
    availableCountries = shuffleArray(availableCountries);
    // Return the first 'count' elements
    return availableCountries.slice(0, count);
}

// Function to get country flag code from flag URL
function getFlagCodeFromUrl(flagUrl) {
    const match = flagUrl.match(/\/w320\/([a-z]{2})\.png$/);
    return match ? match[1] : null;
}

// Function to generate quiz questions
function generateQuiz(unlimited = false) {
    console.log('generateQuiz called with unlimited:', unlimited);
    
    // Reset game variables
    quiz = [];
    currentQuestion = 0;
    score = 0;
    usedCountries = [];
    isUnlimitedMode = unlimited;
    
    console.log('Game variables reset');
    
    if (unlimited) {
        totalQuestions = Infinity;
        const totalQuestionsDisplay = document.getElementById('total-questions-display');
        const endGameBtn = document.getElementById('end-game-btn');
        
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = '';
        if (endGameBtn) endGameBtn.classList.remove('hidden');
        
        // Generate first question only
        generateNextQuestion();
        console.log('Unlimited mode setup complete');
    } else {
        totalQuestions = 25;
        const totalQuestionsDisplay = document.getElementById('total-questions-display');
        const endGameBtn = document.getElementById('end-game-btn');
        
        if (totalQuestionsDisplay) totalQuestionsDisplay.textContent = '/25';
        if (endGameBtn) endGameBtn.classList.add('hidden');
        
        // Generate all 25 questions
        generateAllQuestions();
        console.log('25 questions mode setup complete');
    }

    // Start the quiz
    console.log('About to display first question');
    displayQuestion();
}

// Generate all questions for limited mode
function generateAllQuestions() {
    const quizCountries = getRandomCountries(totalQuestions);

    for (let i = 0; i < totalQuestions; i++) {
        const correctAnswer = quizCountries[i];
        usedCountries.push(correctAnswer.name);

        // Get three random incorrect options
        let options = [correctAnswer.name];
        while (options.length < 4) {
            const randomCountry = countries[Math.floor(Math.random() * countries.length)];
            if (!options.includes(randomCountry.name) && !usedCountries.includes(randomCountry.name)) {
                options.push(randomCountry.name);
                usedCountries.push(randomCountry.name);
            }
        }

        // Shuffle options
        options = shuffleArray(options);

        // Create question object
        quiz.push({
            flag: correctAnswer.flag,
            correctAnswer: correctAnswer.name,
            options: options
        });
    }
}

// Function to generate the next question (for unlimited mode)
function generateNextQuestion() {
    // Get available countries (exclude recently used ones in unlimited mode)
    let availableCountries = [...countries];
    if (isUnlimitedMode && usedCountries.length > countries.length - 10) {
        // Reset used countries if we've used most of them
        usedCountries = usedCountries.slice(-5); // Keep only last 5
    }
    
    // Remove recently used countries
    availableCountries = availableCountries.filter(country => 
        !usedCountries.slice(-10).includes(country.name)
    );
    
    if (availableCountries.length === 0) {
        availableCountries = [...countries]; // Fallback
        usedCountries = [];
    }

    const correctAnswer = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    usedCountries.push(correctAnswer.name);

    // Get three random incorrect options
    let options = [correctAnswer.name];
    let attemptCount = 0;
    while (options.length < 4 && attemptCount < 50) {
        const randomCountry = countries[Math.floor(Math.random() * countries.length)];
        if (!options.includes(randomCountry.name)) {
            options.push(randomCountry.name);
        }
        attemptCount++;
    }

    // Shuffle options
    options = shuffleArray(options);

    // Create question object
    const question = {
        flag: correctAnswer.flag,
        correctAnswer: correctAnswer.name,
        options: options
    };

    // Add to quiz (for unlimited, we keep generating)
    quiz[currentQuestion] = question;
}

// Function to display the current question
function displayQuestion() {
    // Update question number and progress bar
    currentQuestionSpan.textContent = currentQuestion + 1;
    
    if (isUnlimitedMode) {
        progressFill.style.width = '100%'; // Full bar for unlimited
    } else {
        progressFill.style.width = `${((currentQuestion + 1) / totalQuestions) * 100}%`;
    }
    
    // Get the current question
    const question = quiz[currentQuestion];
    
    // Display the flag
    flagImage.src = question.flag;
    flagImage.alt = `Flag for quiz question ${currentQuestion + 1}`;
    
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Add the options
    question.options.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        optionElement.textContent = option;
        optionElement.addEventListener('click', () => selectOption(option));
        optionsContainer.appendChild(optionElement);
    });
}

// Function to handle option selection
function selectOption(selectedOption) {
    // Get the current question and correct answer
    const question = quiz[currentQuestion];
    const correctAnswer = question.correctAnswer;
    const isCorrect = selectedOption === correctAnswer;
    
    // Record the attempt for logged-in users
    if (userManager.currentUser) {
        const flagCode = getFlagCodeFromUrl(question.flag);
        if (flagCode) {
            userManager.recordFlagAttempt(correctAnswer, flagCode, isCorrect);
        }
    }
    
    // Disable all options
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.classList.add('disabled');
        if (option.textContent === correctAnswer) {
            option.classList.add('correct');
        }
        if (option.textContent === selectedOption && selectedOption !== correctAnswer) {
            option.classList.add('incorrect');
        }
        if (option.textContent === selectedOption && selectedOption === correctAnswer) {
            option.classList.add('selected');
        }
    });
    
    // Update score if correct
    if (isCorrect) {
        score++;
        scoreSpan.textContent = score;
    }
    
    // Move to next question after a delay
    setTimeout(() => {
        currentQuestion++;
        
        if (isUnlimitedMode) {
            // Generate next question for unlimited mode
            generateNextQuestion();
            displayQuestion();
        } else {
            // Check if quiz is complete for limited mode
            if (currentQuestion < totalQuestions) {
                displayQuestion();
            } else {
                showResults();
            }
        }
    }, 1500);
}

// End game function (for unlimited mode)
function endGame() {
    showResults();
}

// Function to show results
function showResults() {
    // Hide quiz screen, show results screen
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Update final score
    const questionsAnswered = isUnlimitedMode ? currentQuestion : totalQuestions;
    finalScoreSpan.textContent = `${score}/${questionsAnswered}`;
    
    // Record game completion for logged-in users
    if (userManager.currentUser) {
        userManager.updateGameCompletion(score, questionsAnswered);
    }
    
    // Display feedback message
    let feedbackText;
    const percentage = (score / questionsAnswered) * 100;
    
    if (isUnlimitedMode) {
        feedbackText = `Great job! You answered ${questionsAnswered} questions with ${percentage.toFixed(1)}% accuracy!`;
    } else {
        if (percentage >= 90) {
            feedbackText = "Outstanding! You're a geography expert!";
        } else if (percentage >= 75) {
            feedbackText = "Great job! You know your flags very well!";
        } else if (percentage >= 50) {
            feedbackText = "Good effort! You have a solid knowledge of world flags.";
        } else if (percentage >= 25) {
            feedbackText = "Not bad! With a bit more practice, you'll improve your score.";
        } else {
            feedbackText = "Keep learning! Try again to improve your knowledge of world flags.";
        }
    }
    
    feedbackMessage.textContent = feedbackText;
}

// Event Listeners
// Note: Game mode buttons are handled in DOMContentLoaded event listener below

restartBtn.addEventListener('click', () => {
    resultsScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
    startScreen.classList.add('active');
    scoreSpan.textContent = '0';
});

// Handle image load errors
flagImage.addEventListener('error', () => {
    flagImage.src = 'https://th.bing.com/th/id/R.8ac2effe7004fb379ecad626f9729114?rik=9jWMxLdSqJzWwA&riu=http%3a%2f%2fvignette3.wikia.nocookie.net%2fdespicableme%2fimages%2fe%2fef%2fGru_2.jpg%2frevision%2flatest%3fcb%3d20130711231628&ehk=ib1klGWdptxmEyJsyudejq6Xk8vJUoj240E8Y2LGcMI%3d&risl=&pid=ImgRaw&r=0';
});

// Authentication Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Auth tab switching
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        });
    }

    if (registerTab) {
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    // Login form submission
    const loginFormElement = document.getElementById('login-form-element');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            await userManager.login(email, password);
        });
    }

    // Register form submission
    const registerFormElement = document.getElementById('register-form-element');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            
            await userManager.register(email, password, username);
        });
    }

    // Game mode buttons
    const start25Btn = document.getElementById('start-25-btn');
    const startUnlimitedBtn = document.getElementById('start-unlimited-btn');
    const endGameBtn = document.getElementById('end-game-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    console.log('Game mode buttons found:', {
        start25Btn: !!start25Btn,
        startUnlimitedBtn: !!startUnlimitedBtn,
        endGameBtn: !!endGameBtn,
        showLoginBtn: !!showLoginBtn
    });

    if (start25Btn) {
        start25Btn.addEventListener('click', () => {
            console.log('25 Questions button clicked');
            startScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            generateQuiz(false); // 25 questions mode
        });
    } else {
        console.error('start-25-btn not found');
    }

    if (startUnlimitedBtn) {
        startUnlimitedBtn.addEventListener('click', () => {
            console.log('Unlimited Mode button clicked');
            startScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            generateQuiz(true); // Unlimited mode
        });
    } else {
        console.error('start-unlimited-btn not found');
    }

    if (endGameBtn) {
        endGameBtn.addEventListener('click', endGame);
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            userManager.showAuthScreen();
        });
    }
});
