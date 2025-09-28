// Constants
const CORRECT_BONUS = 10;
const MAX_QUESTIONS = 10;

// Elements
const question = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
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

// Function to show category page
function categoryPage() {
    hideAllSections();
    document.getElementById('categories').classList.remove('hidden');
}

// Function to load questions
function loadQuestions(category) {
    if (!category) return;
    const fileName = `${category}.json`;

    fetch(`data/${fileName}`)
        .then(res => res.json())
        .then(loadedQuestions => {
            if (!loadedQuestions.length) throw new Error(`No questions found in ${fileName}`);
            
            questions = loadedQuestions.map(q => ({
                question: q.question,
                choice1: q.choice1,
                choice2: q.choice2,
                choice3: q.choice3,
                choice4: q.choice4,
                answer: q.answer
            }));
            
            startGame();
        })
        .catch(err => console.error("Error loading questions:", err));
}

// Start game function
function startGame() {
    hideAllSections();
    questionCounter = 0;
    score = 0;
    availableQuestions = [...questions];
    document.getElementById('game').classList.remove('hidden');
    getNewQuestion();
}

// Get new question function
function getNewQuestion() {
    if (questionCounter >= MAX_QUESTIONS || availableQuestions.length === 0) {
        localStorage.setItem('mostRecentScore', score);
        return endGamePage();
    }

    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    question.innerText = currentQuestion.question;

    choices.forEach(choice => {
        const number = choice.dataset['number'];
        choice.innerText = currentQuestion['choice' + number];
        choice.parentElement.classList.remove('correct', 'incorrect');
    });

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
}

// Handle answer selection
choices.forEach(choice => {
    choice.addEventListener('click', e => {
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
            choices.forEach(choice => {
                if (choice.dataset['number'] == currentQuestion.answer) {
                    choice.parentElement.classList.add('correct');
                }
            });
        }

        setTimeout(getNewQuestion, 1000);
    });
});

// Increment score
function incrementScore(num) {
    score += num;
    scoreText.innerText = score;
}

// End game function
function endGamePage() {
    hideAllSections();
    document.getElementById('end').classList.remove('hidden');
    finalScore.innerText = score;
}

// Function to hide all sections
function hideAllSections() {
    document.getElementById('home')?.classList.add('hidden');
    document.getElementById('categories')?.classList.add('hidden');
    document.getElementById('game')?.classList.add('hidden');
    document.getElementById('end')?.classList.add('hidden');
    document.getElementById('highScores')?.classList.add('hidden');
    document.getElementById('saveScorePage')?.classList.add('hidden');
    document.getElementById('questionReview')?.classList.add('hidden');
    document.getElementById('scoreContainer')?.classList.add('hidden');
    document.getElementById('playAgainBtn')?.classList.add('hidden');
    document.getElementById('goHomeBtn')?.classList.add('hidden');
}

// Add event listeners for category buttons
categoryButtons.forEach(button => {
    button.addEventListener("click", () => {
        let category = button.id.replace('-btn', '');
        loadQuestions(category);
    });
});

// Home page function
function homePage() {
    hideAllSections();
    document.getElementById('home').classList.remove('hidden');
}

// Event listener for play again button
document.getElementById('playAgainBtn')?.addEventListener('click', () => {
    categoryPage();
});
