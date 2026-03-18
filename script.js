// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const authScreen = document.getElementById('auth-screen');
const restartBtn = document.getElementById('restart-btn');
const flagImage = document.getElementById('flag-image');
const optionsContainer = document.getElementById('options-container');
const typingContainer = document.getElementById('typing-container');
const countryInput = document.getElementById('country-input');
const submitAnswerBtn = document.getElementById('submit-answer-btn');
const autocompleteDropdown = document.getElementById('autocomplete-dropdown');
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
let isTypingMode = false;
let filteredCountries = [];
let selectedSuggestionIndex = -1;

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
function generateQuiz(unlimited = false, typing = false) {
    console.log('generateQuiz called with unlimited:', unlimited, 'typing:', typing);
    
    // Reset game variables
    quiz = [];
    currentQuestion = 0;
    score = 0;
    usedCountries = [];
    isUnlimitedMode = unlimited;
    isTypingMode = typing;
    
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
    
    // Update mode indicator
    const modeIndicator = document.getElementById('mode-indicator');
    if (modeIndicator) {
        let modeText = '';
        if (isTypingMode) {
            modeText = 'Type your answer or use the suggestions below';
        } else {
            modeText = 'Click on the correct answer';
        }
        modeIndicator.textContent = modeText;
    }
    
    if (isTypingMode) {
        // Show typing interface, hide multiple choice
        optionsContainer.classList.add('hidden');
        typingContainer.classList.remove('hidden');
        
        // Clear and reset input
        countryInput.value = '';
        countryInput.classList.remove('correct', 'incorrect');
        submitAnswerBtn.disabled = true;
        autocompleteDropdown.innerHTML = '';
        autocompleteDropdown.classList.add('hidden');
        filteredCountries = [];
        selectedSuggestionIndex = -1;
        
        // Focus on input
        setTimeout(() => countryInput.focus(), 100);
    } else {
        // Show multiple choice interface, hide typing
        typingContainer.classList.add('hidden');
        optionsContainer.classList.remove('hidden');
        
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

// Function to filter countries based on input
function filterCountries(input) {
    if (!input.trim()) {
        return [];
    }
    
    const searchTerm = input.toLowerCase().trim();
    const allMatches = countries
        .map(country => country.name)
        .filter(name => name.toLowerCase().includes(searchTerm))
        .sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            
            // Prioritize exact matches at start
            const aStartsWith = aLower.startsWith(searchTerm);
            const bStartsWith = bLower.startsWith(searchTerm);
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            
            // Then alphabetical order
            return aLower.localeCompare(bLower);
        });
    
    // Dynamic limit based on search length for better UX
    let limit;
    if (searchTerm.length === 1) {
        limit = 25; // Show more for single letters
    } else if (searchTerm.length === 2) {
        limit = 20; // Moderate amount for 2 characters
    } else {
        limit = Math.min(allMatches.length, 15); // All matches for 3+ chars, max 15
    }
    
    return allMatches.slice(0, limit);
}

// Function to show autocomplete dropdown
function showAutocomplete(suggestions) {
    autocompleteDropdown.innerHTML = '';
    selectedSuggestionIndex = -1;
    
    if (suggestions.length === 0) {
        autocompleteDropdown.innerHTML = '<div class="no-matches">No matching countries found</div>';
    } else {
        suggestions.forEach((country, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = country;
            item.addEventListener('click', () => selectCountryFromDropdown(country));
            autocompleteDropdown.appendChild(item);
        });
    }
    
    autocompleteDropdown.classList.remove('hidden');
}

// Function to hide autocomplete dropdown
function hideAutocomplete() {
    autocompleteDropdown.classList.add('hidden');
    selectedSuggestionIndex = -1;
}

// Function to select country from dropdown
function selectCountryFromDropdown(country) {
    countryInput.value = country;
    hideAutocomplete();
    submitAnswerBtn.disabled = false;
    countryInput.focus();
}

// Function to highlight suggestion
function highlightSuggestion(index) {
    const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
    
    // Remove previous highlight
    items.forEach(item => item.classList.remove('highlighted'));
    
    // Add highlight to selected item
    if (index >= 0 && index < items.length) {
        items[index].classList.add('highlighted');
        selectedSuggestionIndex = index;
    }
}

// Function to handle typing answer submission
function submitTypingAnswer() {
    const userAnswer = countryInput.value.trim();
    if (!userAnswer) return;
    
    const question = quiz[currentQuestion];
    const correctAnswer = question.correctAnswer;
    const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
    
    // Record the attempt for logged-in users
    if (userManager.currentUser) {
        const flagCode = getFlagCodeFromUrl(question.flag);
        if (flagCode) {
            userManager.recordFlagAttempt(correctAnswer, flagCode, isCorrect);
        }
    }
    
    // Show feedback
    if (isCorrect) {
        countryInput.classList.add('correct');
        score++;
        scoreSpan.textContent = score;
    } else {
        countryInput.classList.add('incorrect');
        // Show correct answer
        countryInput.value = `${userAnswer} (Correct: ${correctAnswer})`;
    }
    
    // Disable input and submit button
    countryInput.disabled = true;
    submitAnswerBtn.disabled = true;
    hideAutocomplete();
    
    // Move to next question after a delay
    setTimeout(() => {
        currentQuestion++;
        countryInput.disabled = false;
        
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
    finalScoreSpan.textContent = `${score}`;
    document.getElementById('final-total').textContent = questionsAnswered;
    
    // Display game mode
    const gameModeResult = document.getElementById('game-mode-result');
    let modeText = '';
    if (isUnlimitedMode) {
        modeText = isTypingMode ? 'Unlimited Typing Mode' : 'Unlimited Mode';
    } else {
        modeText = isTypingMode ? 'Typing Mode (25 Questions)' : '25 Questions Mode';
    }
    gameModeResult.textContent = `Game Mode: ${modeText}`;
    
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
    
    // Add typing mode specific feedback
    if (isTypingMode) {
        feedbackText += ` You challenged yourself with typing mode - well done!`;
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
    const startTypingBtn = document.getElementById('start-typing-btn');
    const startUnlimitedTypingBtn = document.getElementById('start-unlimited-typing-btn');
    const startMapQuizBtn = document.getElementById('start-map-quiz-btn');
    const endGameBtn = document.getElementById('end-game-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    console.log('Game mode buttons found:', {
        start25Btn: !!start25Btn,
        startUnlimitedBtn: !!startUnlimitedBtn,
        startTypingBtn: !!startTypingBtn,
        startUnlimitedTypingBtn: !!startUnlimitedTypingBtn,
        startMapQuizBtn: !!startMapQuizBtn,
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

    if (startTypingBtn) {
        startTypingBtn.addEventListener('click', () => {
            console.log('Typing Mode button clicked');
            startScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            generateQuiz(false, true); // 25 questions typing mode
        });
    } else {
        console.error('start-typing-btn not found');
    }

    if (startUnlimitedTypingBtn) {
        startUnlimitedTypingBtn.addEventListener('click', () => {
            console.log('Unlimited Typing Mode button clicked');
            startScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            generateQuiz(true, true); // Unlimited typing mode
        });
    } else {
        console.error('start-unlimited-typing-btn not found');
    }

    if (startMapQuizBtn) {
        startMapQuizBtn.addEventListener('click', () => {
            console.log('Map Quiz Mode button clicked');
            // Open the map quiz in a new window/tab
            window.open('map-quiz.html', '_blank', 'width=1400,height=900,resizable=yes,scrollbars=yes');
        });
    } else {
        console.error('start-map-quiz-btn not found');
    }

    if (endGameBtn) {
        endGameBtn.addEventListener('click', endGame);
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            userManager.showAuthScreen();
        });
    }
<<<<<<< HEAD

    // Typing mode event listeners
    if (countryInput) {
        countryInput.addEventListener('input', (e) => {
            const input = e.target.value;
            
            if (input.trim()) {
                filteredCountries = filterCountries(input);
                showAutocomplete(filteredCountries);
                submitAnswerBtn.disabled = false;
            } else {
                hideAutocomplete();
                submitAnswerBtn.disabled = true;
            }
        });

        countryInput.addEventListener('keydown', (e) => {
            const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
            
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, items.length - 1);
                    highlightSuggestion(selectedSuggestionIndex);
                    break;
                    
                case 'ArrowUp':
                    e.preventDefault();
                    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
                    if (selectedSuggestionIndex === -1) {
                        items.forEach(item => item.classList.remove('highlighted'));
                    } else {
                        highlightSuggestion(selectedSuggestionIndex);
                    }
                    break;
                    
                case 'Enter':
                    e.preventDefault();
                    if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
                        const selectedCountry = items[selectedSuggestionIndex].textContent;
                        selectCountryFromDropdown(selectedCountry);
                    } else if (countryInput.value.trim()) {
                        submitTypingAnswer();
                    }
                    break;
                    
                case 'Escape':
                    hideAutocomplete();
                    break;
            }
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!typingContainer.contains(e.target)) {
                hideAutocomplete();
            }
        });
    }

    if (submitAnswerBtn) {
        submitAnswerBtn.addEventListener('click', submitTypingAnswer);
    }
});
