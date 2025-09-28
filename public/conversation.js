// Game state
let currentConversation = null;
let currentLineIndex = 0;
let conversationData = null;
let currentExpectedDialogueLine = "";

// DOM Elements
const categoriesPage = document.getElementById('categories');
const conversationsPage = document.getElementById('conversations');
const practiceContainer = document.getElementById('practice-container');
const conversationsContainer = document.getElementById('conversations-container');
const dialogueBox = document.getElementById('dialogue-box');
const translationBox = document.getElementById('translation-box');
const vocabularyPreview = document.querySelector('#practice-container .vocabulary-preview');

// Utility: Hide all pages, then show the specified one
function showPage(pageElement) {
    categoriesPage.classList.add('hidden');
    conversationsPage.classList.add('hidden');
    practiceContainer.classList.add('hidden');

    pageElement.classList.remove('hidden');
}

// Show conversations based on category
function showConversations(category) {
    showPage(conversationsPage);
    conversationsContainer.innerHTML = '';

    const conversations = category === 'basic' ? conversationData.basicConversations :
        category === 'situations' ? conversationData.situations :
        conversationData.practiceDialogues;

    conversations.forEach(convo => {
        const card = document.createElement('div');
        card.className = 'conversation-card';
        card.innerHTML = `
            <h3>${convo.title || convo.context}</h3>
            <p>${convo.context}</p>
        `;
        card.addEventListener('click', () => startConversation(convo));
        conversationsContainer.appendChild(card);
    });
}

// Start a selected conversation
function startConversation(conversation) {
    showPage(practiceContainer);
    currentConversation = conversation;
    currentLineIndex = 0;

    if (vocabularyPreview) {
        vocabularyPreview.textContent = conversation.vocabularyPreview;
    }

    displayCurrentLine();
}

// Display current dialogue line
function displayCurrentLine() {
    if (!currentConversation || !currentConversation.dialogue[currentLineIndex]) return;

    const line = currentConversation.dialogue[currentLineIndex];
    currentExpectedDialogueLine = line.line;

    dialogueBox.innerHTML = '';
    translationBox.textContent = '';

    const resultBox = document.getElementById('dialogue-speech-result');
    const feedbackBox = document.getElementById('dialogue-feedback');
    if (resultBox) resultBox.textContent = '';
    if (feedbackBox) feedbackBox.textContent = '';

    const lineContainer = document.createElement('div');
    lineContainer.className = 'line-container';

    const speaker = document.createElement('div');
    speaker.className = 'speaker';
    speaker.textContent = line.speaker + ':';
    lineContainer.appendChild(speaker);

    if (line.blank) {
        const parts = line.line.split('___');
        const select = document.createElement('select');
        select.className = 'fill-blank-select';

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select...';
        placeholder.disabled = true;
        placeholder.selected = true;
        select.appendChild(placeholder);

        line.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });

        select.addEventListener('change', (e) => {
            if (e.target.value === line.answer) {
                select.classList.add('correct');
                document.getElementById('next-button').disabled = false;
                document.getElementById('speak-button').disabled = false;
            } else {
                select.classList.add('incorrect');
                document.getElementById('speak-button').disabled = true;
            }
        });

        lineContainer.appendChild(document.createTextNode(parts[0]));
        lineContainer.appendChild(select);
        if (parts[1]) {
            lineContainer.appendChild(document.createTextNode(parts[1]));
        }
    } else {
        lineContainer.appendChild(document.createTextNode(line.line));
    }

    dialogueBox.appendChild(lineContainer);
    translationBox.textContent = line.translation;

    document.getElementById('next-button').disabled = line.blank;
    document.getElementById('speak-button').disabled = line.blank;
}

function nextLine() {
    currentLineIndex++;
    if (currentLineIndex < currentConversation.dialogue.length) {
        displayCurrentLine();
    } else {
        showSuccess();
    }
}

function showSuccess() {
    dialogueBox.innerHTML = `<div class="success-message">¡Excelente trabajo! Has completado esta conversación.</div>`;
    translationBox.textContent = 'Excellent work! You have completed this conversation.';
    document.getElementById('next-button').style.display = 'none';
    document.getElementById('speak-button').style.display = 'none';
}

function resetPractice() {
    showPage(categoriesPage);
    currentConversation = null;
    currentLineIndex = 0;

    // Show buttons again
    document.getElementById('next-button').style.display = '';
    document.getElementById('speak-button').style.display = '';
}

// Text-to-speech
function speak(text) {
    if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    }
}

// Short answer recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'es-ES';

recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (currentConversation && currentConversation.dialogue[currentLineIndex]) {
        const line = currentConversation.dialogue[currentLineIndex];
        if (line.blank) {
            const select = document.querySelector('.fill-blank-select');
            if (select) {
                select.value = transcript;
                select.dispatchEvent(new Event('change'));
            }
        }
    }
};

// Full line recognition
const fullLineRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
fullLineRecognition.lang = 'es-ES';

fullLineRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    const resultBox = document.getElementById('dialogue-speech-result');
    const feedbackBox = document.getElementById('dialogue-feedback');
    if (resultBox) resultBox.textContent = `You said: "${transcript}"`;

    const similarity = getSimilarity(transcript, currentExpectedDialogueLine);
    if (feedbackBox) {
        if (similarity >= 0.5) {
            feedbackBox.textContent = `✔️ Correct! (Similarity: ${(similarity * 100).toFixed(1)}%)`;
            feedbackBox.style.color = 'green';
        } else {
            feedbackBox.textContent = `❌ Incorrect (Similarity: ${(similarity * 100).toFixed(1)}%)`;
            feedbackBox.style.color = 'red';
        }
    }
};

function getSimilarity(a, b) {
    const removePunctuation = str =>
        str.toLowerCase()
           .normalize("NFD").replace(/[\u0300-\u036f]/g, '') // remove accents
           .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()¿¡?¿"]/g, '') // remove punctuation
           .replace(/\s{2,}/g, ' '); // normalize spacing

    a = removePunctuation(a);
    b = removePunctuation(b);

    const aWords = new Set(a.split(/\s+/));
    const bWords = new Set(b.split(/\s+/));
    const intersection = new Set([...aWords].filter(word => bWords.has(word)));
    const union = new Set([...aWords, ...bWords]);
    return intersection.size / union.size;
}


// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/data/dataconversation.json');
        conversationData = await response.json();

        document.getElementById('basicconversation-btn').addEventListener('click', () => showConversations('basic'));
        document.getElementById('commonsituations-btn').addEventListener('click', () => showConversations('situations'));
        document.getElementById('practicedialogues-btn').addEventListener('click', () => showConversations('practice'));
        document.getElementById('go-home-btn').addEventListener('click', () => showPage(categoriesPage));

        document.getElementById('speak-button').addEventListener('click', () => {
            if (currentConversation && currentConversation.dialogue[currentLineIndex]) {
                const line = currentConversation.dialogue[currentLineIndex];
                const textToSpeak = line.blank ? line.line.replace('___', line.answer) : line.line;
                speak(textToSpeak);
            }
        });

        document.getElementById('mic-button').addEventListener('click', () => recognition.start());
        document.getElementById('repeat-dialogue-button').addEventListener('click', () => fullLineRecognition.start());
        document.getElementById('next-button').addEventListener('click', nextLine);
        document.getElementById('practice-again-button').addEventListener('click', resetPractice);

        showPage(categoriesPage); // Start directly at categories
    } catch (error) {
        console.error('Error loading conversation data:', error);
    }
});
