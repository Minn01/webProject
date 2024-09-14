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
let typingOn = false;
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

function switchDisplays(typingOn) {
    if (typingOn) {
        start_btn.style.display = "none";
        type_area.style.display = "flex";
    } else {
        start_btn.style.display = "inline-block";
        type_area.style.display = "none";
    }
}

// calculates word per minute
function calculatePerformance(startedTypingTime, endedTypingTime) {
    let timeTakenInSeconds = (endedTypingTime - startedTypingTime)/1000
    let timeTakenInMinutes = timeTakenInSeconds / 60;
    let totalWords = sentence.length / 5; // it's usually divided by 5
    let wpm = totalWords / timeTakenInMinutes;
    
    return [wpm, timeTakenInSeconds, timeTakenInMinutes, totalWords];
}

// Function to handle the checks for typing
function typingHandler(event) {
    // console.log(`${event.key} : ${sentence[wordPointerIndex]}`);

    if (!startedTyping) {
        startedTyping = true;
        console.log('STARTED TYPING');
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
        switchDisplays(typingOn=false);
        wordPointerIndex = 0;
        document.removeEventListener('keydown', typingHandler);
        endedTypingTime = performance.now();

        let typiing_performance = calculatePerformance(startedTypingTime, endedTypingTime);

        console.log(`time taken in seconds: ${typiing_performance[1]}`);
        console.log(`time taken in minutes : ${typiing_performance[2]}`);
        console.log(`totalWords : ${typiing_performance[3]}`);
        console.log(`WPM : ${typiing_performance[0]}`);

        startedTyping = false;
    }
}

// onclick function for the start button
async function start_typing() {
    if (usingAPI) {
        wordsList = await retrieveRandomWords(10, 2, 7, 3);
    } else {
        wordsList = CommonEnglishWords.getCommonWordsRandom(10)
    }
    
    console.log(wordsList);
    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    console.log(sentence.length);

    numOfMistakes = 0;
    alreadyMistaken = false;
    switchDisplays(typingOn=true);
    document.addEventListener('keydown', typingHandler);
}

start_btn.onclick = start_typing;

// async function main() {
//     let randomWords = await retrieveRandomWords(10, 2, 7, 3);
//     console.log(randomWords);
// }

// main()
