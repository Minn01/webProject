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
let alreadyMistaken = false;
let startedTyping = false;
let timeOfWords = []; // this stores time it takes for pressing a key
let wpmOverTime = [];
let accOvertime = []
let performanceOverTime = [] // this stores wpm and accuracy (in seconds)
let countingInterval = null; // suppose to store a setInterval() counting seconds
let timeOfFirstWordTyped = 0;
const nonoWords = new Set(['Shift', 'BackSpace', 'Enter', 'Tab', 'Alt', 'Meta', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight']);

// Documents
const start_btn = document.getElementById("start_btn");
const type_area = document.getElementById("type_area");
const perf_display = document.getElementById("perf_display");
const keyboard_doc = document.getElementById("keyboard");
const wpm_num = document.getElementById("wpm_num");
const accuracy_num = document.getElementById("accuracy_num");
const weakWordElements = document.querySelectorAll("#weak_words_tb td");
const consistency_display = document.querySelector("#consistency h1");

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

    // End the interval recording wpm and accuracy over time
    clearInterval(countingInterval);

    // switch display to the performance screen
    switchDisplays(2);

    // Removes the key listener for any typing inputs 
    document.removeEventListener('keydown', typingHandler);

    // sorting the key press duration on their time which is 2nd index
    timeOfWords.sort((a, b) => {
        return b[1] - a[1];
    });

    // Calculate wpm and and accuracy
    const typingPerformance = calculatePerformance(startedTypingTime, endedTypingTime, sentence.length);

    // Picking the 5 weakest words among the key press durations
    const weakWords = pickWeakWords(timeOfWords);

    const consistencyScore = processConsistencyScore(wpmOverTime, accOvertime, timeOfWords);
    
    // Making the actual change of numbers to what is being displayed
    displayPerformance(typingPerformance, weakWords, consistencyScore);

    // Resets pointer to the beginning
    wordPointerIndex = 0;

    // Resetting the value 
    startedTyping = false;
}

function displayPerformance(typingPerformance, weakWords, consistencyScore) {
    weakWords = [...weakWords]; // convert to list

    let wpm = Math.round(typingPerformance[0])
    let accuracy = Math.round(typingPerformance[1])

    wpm_num.textContent = wpm; // display wpm
    accuracy_num.textContent = accuracy; // display accuracy
    consistency_display.textContent = `${Math.round(consistencyScore)}%`;  // display consistency score

    // display 5 weak words
    let idxCount = 0;
    weakWordElements.forEach(element => {
        if (weakWords[idxCount] == " ") {
            element.textContent = "_";
        } else {
            element.textContent = weakWords[idxCount];
        } idxCount++;
    });
    
}

function countData() {
    // this function repeats second by second
    let [wpmPerformance, accPerformance] = calculatePerformance(startedTypingTime, performance.now(), wordPointerIndex+1);

    // the data is stored in a list
    wpmOverTime.push(wpmPerformance);
    accOvertime.push(accPerformance);
}

function pickWeakWords(keyTime) {
    let weakWords = new Set();

    function pickWords(n, wordIdx=0) {
        if (n == 0 || wordIdx >= keyTime.length) {
          return;
        } 
      
        if (weakWords.has(keyTime[wordIdx][0])) {
          return pickWords(n, wordIdx+1);
        } else {
          weakWords.add(keyTime[wordIdx][0]);
          return pickWords(n-1, wordIdx+1);
        }
      }

      pickWords(5);
      return weakWords;
}

// This function is meant to process IQR 
function findInterQuartileRange(lis, sortIdx=0, needsSortIdx=false) {
    if (needsSortIdx) {
        lis.sort((a, b) => {
            return b[sortIdx] - a[sortIdx];
        });
    } else {
        lis.sort((a, b) => {
            return b - a;
        });
    }
    
    function median(lis) {
        const mid = Math.floor(lis.length / 2);

        if (needsSortIdx) {
            if (lis.length % 2 === 0) {
                return (lis[mid - 1][sortIdx] + lis[mid][sortIdx]) / 2; 
            } else {
                return lis[mid][sortIdx];
            }
        } else {
            if (lis.length % 2 === 0) {
                return (lis[mid - 1] + lis[mid]) / 2; 
            } else {
                return lis[mid];
            }
        }
    }

    const mid = Math.floor(lis.length / 2);

    let lowerHalf, upperHalf;
    if (lis.length % 2 === 0) {
        lowerHalf = lis.slice(mid);    // Lower half
        upperHalf = lis.slice(0, mid); // Upper half
    } else {
        lowerHalf = lis.slice(mid+1);    // Lower half (exclude the median)
        upperHalf = lis.slice(0, mid);   // Upper half (exclude the median)
    }

    const [q1, q3] = [median(lowerHalf), median(upperHalf)];
    const iqr = q3 - q1;

    return [(q1 - (1.5*iqr)), (q3 + (1.5*iqr))];
}

function processAverage(lis, lowerBound, upperBound, isMultiDimensional=false, index=0) {
    let sumOfElements = 0;
    let n = 0;

    if (isMultiDimensional) {
        lis.forEach(
            (element) => {
                if (!(element[index] < lowerBound || element[index] > upperBound)) {
                    n++;
                    sumOfElements += element[index];
                }
            }
        );
    } else {
        lis.forEach(
            (element) => {
                if (!(element < lowerBound || element > upperBound)) {
                    n++;
                    sumOfElements += element;
                }
            }
        );
    }

    return sumOfElements / n;
}

function processSquaredDeviationSum(lis, avg, lowerBound, upperBound, isMultiDimensional=false, index=0) {
    let SDS = 0; 
    let n = 0;

    if (isMultiDimensional) {
        lis.forEach(
            (element) => {
                if (!(element[index] < lowerBound || element[index] > upperBound)) {
                    n++;
                    SDS += (element[index] - avg)**2;
                }
            }
        );
    } else {
        lis.forEach(
            (element) => {
                if (!(element < lowerBound || element > upperBound)) {
                    n++;
                    SDS += (element - avg)**2;
                }
            }
        );
    }

    return [SDS, n];
}

function processConsistency(lis, isMultiDimensional=false, index=0) { 
    // finds IQR
    const [lowerBound, upperBound] = findInterQuartileRange(lis, index, isMultiDimensional);
    
    // gets the average
    const avg = processAverage(lis, lowerBound, upperBound, isMultiDimensional, index);

    // calculates the standard deviation
    const [squaredDeviationSum, n] = processSquaredDeviationSum(lis, avg, lowerBound, upperBound, isMultiDimensional, index);
    
    const standardDeviation = Math.sqrt(squaredDeviationSum / n);
    
    // returns the consistency 
    return (1 - (standardDeviation / avg)) * 100;
}

function processConsistencyScore(wpmOverTime, accOvertime, keyPressDurations) {    
    const wpmConsistency = processConsistency(wpmOverTime);
    
    // accuracy consistency is yet to be utlizied 
    const accuracyConsistency = processConsistency(accOvertime);

    const keyPressDurationConsistency = processConsistency(keyPressDurations, true, 1);

    const consistencyScore = (wpmConsistency * 0.7) + (keyPressDurationConsistency * 0.3);
    
    return consistencyScore;
}


function calculatePerformance(startedTypingTime, endedTypingTime, charCount) {
    let timeTakenInSeconds = (endedTypingTime - startedTypingTime)/1000
    let timeTakenInMinutes = timeTakenInSeconds / 60;
    let totalWords = charCount / 5; // it's usually divided by 5
    let wpm = totalWords / timeTakenInMinutes;

    let accuracy = ((charCount - numOfMistakes) / charCount) * 100
    
    return [wpm, accuracy];
}

// Function to handle the checks for typing
function typingHandler(event) {
    // console.log(`${event.key} : ${sentence[wordPointerIndex]}`);

    // Counting time only when the typing starts
    if (!startedTyping) {
        startedTyping = true;
        // recording start time
        timeOfFirstWordTyped = startedTypingTime = performance.now();
        countingInterval = setInterval(countData, 1000)
    }

    // Calculating the time by using the time of the first word typed and current time
    if (!nonoWords.has(event.key)) {
        let timeForWord = performance.now() - timeOfFirstWordTyped;
        timeOfWords.push([event.key, timeForWord]);
    }

    // key check with actual sentence
    if (event.key == sentence[wordPointerIndex]) {
        timeOfFirstWordTyped = performance.now();
        wordPointerIndex++;
        alreadyMistaken = false;
        type_area.innerHTML = `<span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>${sentence.slice(wordPointerIndex)}`;
    } else {
        type_area.innerHTML = 
        `
            <span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>
            <span class='wrongWordColor'>${sentence[wordPointerIndex]}</span>${sentence.slice(wordPointerIndex+1)}
        `;

        // to not count repeated mistakes
        if (!alreadyMistaken) {
            alreadyMistaken = true;
            numOfMistakes++;
        } 
    }

    // end check
    if (wordPointerIndex == sentence.length) {
        endTyping() // reinitializes variables and more
    }
}

// onclick function for the start button
async function start_typing() {
    if (usingAPI) {
        wordsList = await retrieveRandomWords(10, 2, 7, 3);
    } else {
        wordsList = CommonEnglishWords.getCommonWordsRandom(15);
    }
    
    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    numOfMistakes = 0;
    alreadyMistaken = false;
    switchDisplays(0);
    document.addEventListener('keydown', typingHandler);
}

start_btn.onclick = start_typing;
