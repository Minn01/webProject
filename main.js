// This file needs documentation 
// If any changes are made, add documentation

// IMPORTS
import api_key from './apikey.js'
import CommonEnglishWords from './wordLibraray.js';

// key event listeners for the keyboard visual
document.addEventListener("keydown", event => {
    let key = null;

    if (event.key == " ") {
        key = document.getElementById("space_bar");
    } else {
        key = document.getElementById("k" + event.key.toUpperCase());
    }
    
    if (key) {
        key.classList.add("active");
    }
});

document.addEventListener("keyup", event => {
    let key = null;

    if (event.key == " ") {
        key = document.getElementById("space_bar");
    } else {
        key = document.getElementById("k" + event.key.toUpperCase());
    }
    
    if (key) {
        key.classList.remove("active");
    }
});



// VARIABLES HERE (any new ones should be written here if global-space variables)
let wordPointerIndex = 0;
let sentence = "";
let wordsList = [];
let usingAPI = false;
let startedTypingTime = 0;
let endedTypingTime = 0;
let numOfMistakes = 0;
let mistakeWord = 0;
let alreadyMistaken = false;
let startedTyping = false;
const start_btn = document.getElementById("start_btn");
const type_area = document.getElementById("type_area");
const perf_display = document.getElementById("perf_display");
const keyboard_doc = document.getElementById("keyboard");
const wpm_num = document.getElementById("wpm_num");
const accuracy_num = document.getElementById("accuracy_num");

// Retrieves random words from wordnik api
async function retrieveRandomWords(numOfWords, minWordLength, maxWordLength, wordlevel) {
    try {
        const response = await fetch(`https://api.wordnik.com/v4/words.json/randomWords?hasDictionaryDef=true&minCorpusCount=1&minDictionaryCount=${wordlevel}&maxDictionaryCount=-1&minLength=${minWordLength}&maxLength=${maxWordLength}&limit=${numOfWords}&api_key=${api_key}`);
        const data = await response.json();
        // mapping only the words
        let wordList = data.map(objFormat => {
            return objFormat.word;
        });
        console.log(wordList);
        return wordList;
    } catch (error) {
        console.log(`error fetching data : ${error}`)
    }
}

function switchDisplays(displayMode) {
    if (displayMode == 0) {
        start_btn.style.display = "none";
        type_area.style.display = "flex";
    } else if (displayMode == 1) {
        start_btn.style.display = "inline-block";
        type_area.style.display = "none";
    } else if (displayMode == 2) {
        type_area.style.display = "none";
        keyboard_doc.style.display = "none"
        perf_display.style.display = "flex"
    }
}

function endTyping() {
    // Records the end time
    endedTypingTime = performance.now();
    
    switchDisplays(2);

    let typingPerformance = calculatePerformance(startedTypingTime, endedTypingTime);
    let wpm = Math.round(typingPerformance[0])
    let accuracy = Math.round(typingPerformance[1])
    wpm_num.textContent = wpm;
    accuracy_num.textContent = accuracy;

    // Resets pointer to the beginning
    wordPointerIndex = 0;

    // Removes the key listener for any typing inputs 
    document.removeEventListener('keydown', typingHandler);

    // Resetting the value 
    startedTyping = false;
}

// calculates word per minute
function calculatePerformance(startedTypingTime, endedTypingTime) {
    let timeTakenInSeconds = (endedTypingTime - startedTypingTime)/1000
    let timeTakenInMinutes = timeTakenInSeconds / 60;
    let totalWords = sentence.length / 5; // it's usually divided by 5
    let wpm = totalWords / timeTakenInMinutes;

    let accuracy = ((sentence.length - numOfMistakes) / sentence.length) * 100
    
    return [wpm, accuracy];
}

// Function to handle the checks for typing
function typingHandler(event) {
    // console.log(`${event.key} : ${sentence[wordPointerIndex]}`);

    if (!startedTyping) {
        startedTyping = true;
        startedTypingTime = performance.now();
    }

    // key check with actual sentence
    if (event.key == sentence[wordPointerIndex]) {
        wordPointerIndex++;
        alreadyMistaken = false;
        type_area.innerHTML = `<span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>${sentence.slice(wordPointerIndex)}`;
    } else {
        type_area.innerHTML = 
        `
            <span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>
            <span class='wrongWordColor'>${sentence[wordPointerIndex]}</span>${sentence.slice(wordPointerIndex+1)}
        `;

        if (!alreadyMistaken) {
            mistakeWord = event.key;
            alreadyMistaken = true;
            numOfMistakes++;
        } 
    }

    // end check
    if (wordPointerIndex == sentence.length) {
        endTyping()
    }
}

// onclick function for the start button
async function start_typing() {
    if (usingAPI) {
        wordsList = await retrieveRandomWords(10, 2, 7, 3);
    } else {
        wordsList = CommonEnglishWords.getCommonWordsRandom(10)
    }
    
    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    numOfMistakes = 0;
    alreadyMistaken = false;
    switchDisplays(0);
    document.addEventListener('keydown', typingHandler);
}

start_btn.onclick = start_typing;
