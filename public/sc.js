// Constants
const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 3;
const MAX_SCORE = MAX_QUESTIONS * CORRECT_BONUS; // Maximum score a user can achieve

// Elements
const question = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const loader = document.getElementById('loader');
const game = document.getElementById('game');
const highScoresList = document.getElementById("highScoresList");
const username = document.getElementById('username');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const finalScore = document.getElementById('finalScore');
const categoryButtons = document.querySelectorAll('.category-btn');

// Variables
let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];
let questions = [];
let mostRecentScore = 0;
const highScores = JSON.parse(localStorage.getItem("highScores")) || [];
const MAX_HIGH_SCORES = 5;
let categoryScores = {};
let categoryStatuses = {};
let currentCategory = '';  // Global variable to store the current category
let attemptedQuestions = []; // Stores question, user answer, and correct answer


// List of categories (Add new categories here)
const categories = [
    'activities',
    'adjectives1',
    'adjectives2',
    'adventures', 
    'adverbs',
    'verbs',
    'animals',
    'birds',
    'months',
    'work',
    'family'
    // Add more categories here as needed
];

// Initialize categoryStatuses and categoryScores dynamically
categories.forEach(category => {
    categoryScores[category] = 0;
    categoryStatuses[category] = category === 'activities' ? 'unlocked' : 'locked';
});

// Load questions from JSON file based on category
function loadQuestions(category) {
    console.log(`Loading questions for category: ${category}`);
    if (!category) return; // Ensure category is selected

    currentCategory = category;  // Set current category

    const fileName = `${category}.json`;  // Assuming category name matches the JSON file name
    
    fetch(`data/${fileName}`) // Adjusted path to match 'data' folder
        .then((res) => {
            if (!res.ok) throw new Error(`Error loading file: ${fileName}`);
            return res.json();
        })
        .then((loadedQuestions) => {
            if (!loadedQuestions.length) {
                throw new Error(`No questions found in ${fileName}`);
            }

            questions = loadedQuestions.map((loadedQuestion) => {
                const formattedQuestion = {
                    question: loadedQuestion.question,
                };

                const answerChoices = [
                    loadedQuestion.choice1,
                    loadedQuestion.choice2,
                    loadedQuestion.choice3,
                    loadedQuestion.choice4
                ];

                formattedQuestion.answer = loadedQuestion.answer;
                answerChoices.forEach((choice, index) => {
                    formattedQuestion['choice' + (index + 1)] = choice;
                });

                return formattedQuestion;
            });
            startGame(category);
        })
        .catch((err) => {
            console.error("Error loading questions:", err);
        });
}

// Start Game
function startGame(category) {
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    getNewQuestion();
    
    // Ensure the game element exists before manipulating classList
    if (game) {
        game.classList.remove('hidden');
    }
    if (loader) {
        loader.classList.add('hidden');
    }
    document.getElementById('categories').classList.add('hidden');
    
    categoryStatuses[category] = 'unlocked'; // Unlock current category after game starts
    updateCategoryLocks();
}

// Get new question
let questionHistory = []; // Store question evaluation for end page

// Get new question
function getNewQuestion() {
    if (questionCounter >= MAX_QUESTIONS || availableQuestions.length === 0) {
        mostRecentScore = score;
        localStorage.setItem('mostRecentScore', mostRecentScore);
        categoryScores[currentCategory] = score; 
        return endGamePage(); 
    }

    // Proceed to next question
    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    choices.forEach((choice) => {
        const number = choice.dataset['number'];
        choice.innerText = currentQuestion['choice' + number];
        choice.parentElement.classList.remove('correct', 'incorrect'); // Reset previous styles
    });

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
}

// Choice selection
choices.forEach((choice) => {
    choice.addEventListener('click', (e) => {
        if (!acceptingAnswers) return;
        acceptingAnswers = false;

        const selectedChoice = e.target;
        const selectedAnswer = selectedChoice.dataset['number'];
        const isCorrect = selectedAnswer == currentQuestion.answer;

        if (isCorrect) {
            incrementScore(CORRECT_BONUS);
            selectedChoice.parentElement.classList.add('correct');
        } else {
            selectedChoice.parentElement.classList.add('incorrect');
            // Highlight correct answer
            choices.forEach((choice) => {
                if (choice.dataset['number'] == currentQuestion.answer) {
                    choice.parentElement.classList.add('correct');
                }
            });
        }

        // Store question evaluation for the end page
        attemptedQuestions.push({
            question: currentQuestion.question,
            userAnswer: selectedAnswer,
            correctAnswer: currentQuestion.answer,
            isCorrect: isCorrect
        });

        setTimeout(() => {
            getNewQuestion();
        }, 1000);
    });
});

// Increment score
function incrementScore(num) {
    score += num;
    scoreText.innerText = score;
}

// Show high scores
function showHighScores() {
    highScoresList.innerHTML = highScores
        .map(score => `<li class="high-score">${score.name} - ${score.score}</li>`)
        .join("");
}

// End game page
function endGamePage() {
    console.log("End Game Page triggered");
    document.getElementById('home').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
    document.getElementById('highScores').classList.add('hidden');
    document.getElementById('end').classList.remove('hidden');
    finalScore.innerText = score;

    // Unlock next category based on the current category
    if (score === MAX_SCORE) {
        const currentCategoryIndex = categories.indexOf(currentCategory);
        if (currentCategoryIndex !== -1 && currentCategoryIndex < categories.length - 1) {
            const nextCategory = categories[currentCategoryIndex + 1];
            categoryStatuses[nextCategory] = "unlocked";  // Unlock the next category
        }
    }
    updateCategoryLocks();  // Update the category button locks

    const evaluationContainer = document.getElementById('evaluation');
    evaluationContainer.innerHTML = '<h2 style="color: #571094;">Question Review</h2>';
    attemptedQuestions.forEach((attempt) => {
        const isCorrect = attempt.userAnswer == attempt.correctAnswer;
        const questionReview = document.createElement('div');
        questionReview.innerHTML = ` 
            <p><strong strong style="color: #571094;">Q:</strong> ${attempt.question}</p>
            <p style="color: ${isCorrect ? 'green' : 'red'};"><strong strong style="color: #571094;">Your Answer:</strong> ${attempt.userAnswer}</p>
            <p style="color: green;"><strong strong style="color: #571094;">Correct Answer:</strong> ${attempt.correctAnswer}</p>
            <hr>
        `;
        evaluationContainer.appendChild(questionReview);
    });
    // Event listener for "Question Review" button
    const reviewButton = document.getElementById('reviewBtn');
    reviewButton.addEventListener('click', () => {
        // This will show the evaluation container with the question reviews
        evaluationContainer.classList.toggle('hidden');
    });
}

// Save high score
saveScoreBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!username.value) return;
    const scoreEntry = {
        score: mostRecentScore,
        name: username.value,
    };
    highScores.push(scoreEntry);
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(MAX_HIGH_SCORES);
    localStorage.setItem("highScores", JSON.stringify(highScores));
    homePage();
});

// Disable save button until username is entered
username.addEventListener('keyup', () => {
    saveScoreBtn.disabled = !username.value;
});

// Navigation functions
function homePage() {
    document.getElementById('home').classList.remove('hidden');
    document.getElementById('categories').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
    document.getElementById('highScores').classList.add('hidden');
    document.getElementById('end').classList.add('hidden');
}

function highScoresPage() {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('categories').classList.add('hidden');
    document.getElementById('game').classList.add('hidden');
    document.getElementById('highScores').classList.remove('hidden');
    document.getElementById('end').classList.add('hidden');
    showHighScores();
}

// Category selection page
function categoryPage() {
    document.getElementById('home').classList.add('hidden');
    document.getElementById('categories').classList.remove('hidden');
    document.getElementById('game').classList.add('hidden');
    document.getElementById('highScores').classList.add('hidden');
    document.getElementById('end').classList.add('hidden');
    updateCategoryLocks();
}

// Update category button locks and scores
function updateCategoryLocks() {
    categoryButtons.forEach((btn) => {
        const category = btn.id.split('-')[0]; // Extract category name from button ID
        const status = categoryStatuses[category];
        const score = categoryScores[category] || 0;
        btn.innerText = `${category.charAt(0).toUpperCase() + category.slice(1)} (${score}/${MAX_SCORE})`;

        if (status === 'locked' && score === MAX_SCORE) {
            categoryStatuses[category] = 'unlocked';
        }

        if (status === 'locked') {
            btn.disabled = true; // Lock button
            btn.style.opacity = 0.5; // Dim the button
        } else {
            btn.disabled = false; // Unlock button
            btn.style.opacity = 1; // Make the button visible
        }
    });
}

// Event listeners for category buttons
categories.forEach((category) => {
    const categoryBtn = document.getElementById(`${category}-btn`);
    categoryBtn.addEventListener("click", () => {
        if (categoryStatuses[category] === 'unlocked') {
            loadQuestions(category);
        } else {
            alert(`Complete previous categories to unlock the '${category}' category!`);
        }
    });
});

// Home page button listeners
document.getElementById('start').addEventListener('click', categoryPage);
document.getElementById('highScoresBtn').addEventListener('click', highScoresPage);
document.getElementById('backToHomeBtn').addEventListener('click', homePage);

