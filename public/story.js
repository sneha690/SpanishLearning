let quizData = {};
let currentQuestion = 0;
let selectedQuiz = '';
const audioPlayer = document.getElementById("audio-player");
const resultText = document.getElementById("result");
const phraseText = document.getElementById("phrase-text");

function fetchQuizData() {
    fetch('data/stories.json')
        .then(response => response.json())
        .then(data => {
            quizData = data;
        })
        .catch(error => console.error('Error loading quiz data:', error));
}

function startQuiz(quiz) {
    selectedQuiz = quiz;
    document.getElementById("home-page").style.display = "none";
    document.getElementById("quiz-page").style.display = "block";
    currentQuestion = 0;
    loadQuestion();
}

function loadQuestion() {
    const questions = quizData[selectedQuiz];
    if (currentQuestion >= questions.length) {
        resultText.textContent = "Quiz completed!";
        phraseText.textContent = "";
        document.getElementById("go-home").style.display = "block";
        return;
    }

    const question = questions[currentQuestion];
    audioPlayer.src = question.audio;
    phraseText.textContent = `Phrase: ${question.phrase}`;
    resultText.textContent = "";
    document.querySelectorAll("#options button").forEach((btn, index) => {
        btn.textContent = question.options[index];
    });
    dictatePhrase(question.phrase);
}

function dictatePhrase(text) {
    const message = new SpeechSynthesisUtterance(text);
    message.lang = "es-ES";
    message.rate = 0.9;
    window.speechSynthesis.speak(message);
}

function replayPhrase() {
    const question = quizData[selectedQuiz][currentQuestion];
    dictatePhrase(question.phrase);
}

function checkAnswer(selected) {
    if (selected === quizData[selectedQuiz][currentQuestion].correct) {
        resultText.textContent = "Correct! Moving to the next question...";
        setTimeout(() => {
            currentQuestion++;
            loadQuestion();
        }, 2000);
    } else {
        resultText.textContent = "Try again!";
    }
}

function startVoiceInput() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'es-ES';
    recognition.start();

    recognition.onresult = (event) => {
        let spokenText = event.results[0][0].transcript.toLowerCase().trim();
        console.log("Recognized:", spokenText); 
        let correctAnswer = quizData[selectedQuiz][currentQuestion].phrase.toLowerCase().trim();

        // Normalize input (remove punctuation, convert numbers to words)
        spokenText = normalizeText(spokenText);
        correctAnswer = normalizeText(correctAnswer);

        // Allow fuzzy matching (partial matches)
        if (spokenText.includes(correctAnswer) || correctAnswer.includes(spokenText)) {
            resultText.textContent = "✅ Correct!";
            setTimeout(() => {
                currentQuestion++;
                loadQuestion();
            }, 1500);
        } else {
            resultText.textContent = `❌ Try again! You said: "${spokenText}"`;
        }
    };

    recognition.onerror = () => {
        resultText.textContent = "⚠️ Error! Speak clearly.";
    };
}

// Function to normalize text (removes special characters & converts numbers)
function normalizeText(text) {
    const numberWords = { "1": "uno", "2": "dos", "3": "tres", "4": "cuatro", "5": "cinco", 
                          "6": "seis", "7": "siete", "8": "ocho", "9": "nueve", "10": "diez" };

    text = text.replace(/[^\w\s]/g, ""); // Remove special characters
    Object.keys(numberWords).forEach(num => {
        text = text.replace(new RegExp(`\\b${num}\\b`, "g"), numberWords[num]);
    });

    return text.trim();
}


function quitQuiz() {
    document.getElementById("quit-modal").style.display = "block"; // Show the modal
}

document.getElementById("confirm-quit").addEventListener("click", function () {
    document.getElementById("quiz-page").style.display = "none";
    document.getElementById("home-page").style.display = "block";
    document.getElementById("quit-modal").style.display = "none"; // Hide modal after quitting
});

document.getElementById("cancel-quit").addEventListener("click", function () {
    document.getElementById("quit-modal").style.display = "none"; // Hide modal when canceled
});


function goHome() {
    document.getElementById("home-page").style.display = "block";
    document.getElementById("quiz-page").style.display = "none";
    document.getElementById("go-home").style.display = "none";
    resultText.textContent = "";
    phraseText.textContent = "";
}

window.onload = fetchQuizData;
