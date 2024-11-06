// This file needs documentation 
// If any changes are made, add documentation

// IMPORTS
import api_key from './apikey.js'
import {calculatePerformance, processConsistencyScore, pickWeakWords,} from './processingUtils.js'
import CommonEnglishWords from './wordLibraray.js';

// key event listeners for the keyboard visual
document.addEventListener("keydown", event => {
    
    if (event.key == "Escape") {
        switchDisplays(1);
    }

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
let accOvertime = [];
let errorRate = [];
let countingInterval = null; // suppose to store a setInterval() counting seconds
let timeOfFirstWordTyped = 0;
let perf_chart = null;
const nonoWords = new Set(['Shift', 'BackSpace', 'Enter', 'Tab', 'Alt', 'Meta', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight', 'Escape']);

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
    // switch display to the typing screen
    if (displayMode == 0) {
        start_btn.style.display = "none";
        type_area.style.display = "flex";

    // switch display back to the start screen
    } else if (displayMode == 1) {
        start_btn.style.display = "inline-block";
        type_area.style.display = "none";
        perf_display.style.display = "none"
        keyboard_doc.style.display = "flex";
        // ensure typing handler is closed for optimization
        document.removeEventListener('keydown', typingHandler);
    
        // switch display to the performance screen
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

    // Calculate wpm and and accuracy
    const typingPerformance = calculatePerformance(startedTypingTime, endedTypingTime, sentence.length, numOfMistakes);

    // Picking the 5 weakest words among the key press durations
    const weakWords = pickWeakWords(timeOfWords);

    const consistencyScore = processConsistencyScore(wpmOverTime, accOvertime, timeOfWords);
    
    // Making the actual change of numbers to what is being displayed
    displayPerformance(typingPerformance, weakWords, consistencyScore);
    
    // function that draws the chart
    drawChart(
        [wpmOverTime], 
        wpmOverTime.length, 
        ["wpm"], 
        ["rgb(255, 255, 255)"], 
        1,
        ["line"]
    );

    // TODO Error rate yet to be utilized
    
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

function drawChart(timeSeriesData, seriesLength, seriesNames, seriesColors, mainSeriesNum, chartTypeList) {
    let seriesIndex = 0;
    let dataSeriesList = [];

    timeSeriesData.forEach(seriesData => {

        if (seriesData.length != seriesLength) {
            throw new Error("Error! every series must have the same length");
        }

        const dataConfig = {
            // the label names should be in a list accordingly
            label: seriesNames[seriesIndex],

            // you can specify specific chart type for different  series
            type: chartTypeList[seriesIndex],

            // border config
            borderColor: seriesColors[seriesIndex],
            borderWidth: 1,

            // data point config
            pointBackgroundColor: (seriesIndex == mainSeriesNum-1) ? "rgb(0, 0, 0)" : seriesColors[seriesIndex],
            pointBorderWidth: 1,
            
            // the data displayed in the chart added here
            data: seriesData,
        }

        seriesIndex++;
        dataSeriesList.push(dataConfig);
    });
    

    // TODO this needs to be optimized
    let timeSeries = [];
    for (let i = 0; i < seriesLength; i++) {
        timeSeries.push(i);
    }

    // refer to chart.js documentation for config
    // https://www.chartjs.org/docs/latest/

    const ctx = document.getElementById("perf_chart");

    perf_chart = new Chart(ctx, {
        // type: 'line',
        data: {
            // y-axis data series added here
            labels: timeSeries,
            // all the data series are added here
            datasets: dataSeriesList
        },
        options: {
            plugins: {
                legend: {display: false}
            },

            scales: {
                x: {
                    // not necessary but added anyways
                    border: {display: true},
                    grid: {
                        display: true,
                        color: "rgba(255, 255, 255, 0.15)"
                    }
                },

                y: {
                    // not necessary but added anyways
                    border: {display: true},
                    grid: {
                        display: true,
                        color: "rgba(255, 255, 255, 0.15)"
                    }
                }
            }
        }
      });
}

function countData() {
    // this function repeats second by second
    let [wpmPerformance, accPerformance, errors] = calculatePerformance(startedTypingTime, performance.now(), wordPointerIndex+1, numOfMistakes);

    // the data is stored in a list
    wpmOverTime.push(wpmPerformance);
    accOvertime.push(accPerformance);
    errorRate.push(errors);
}

function initialize() {
    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    numOfMistakes = 0;
    alreadyMistaken = false;

    // Resets pointer to the beginning
    wordPointerIndex = 0;

    // Resetting the value 
    startedTyping = false;

    // Destroy exsisting chart 
    if (perf_chart != null) {
        perf_chart.destroy();
    }

    wpmOverTime = []; 
    accOvertime = [];
    errorRate = []; 
    timeOfWords = [];
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

    // Any keys not meant to be counted are skiped
    if (!nonoWords.has(event.key)) {
        // Calculating the time by using the time of the first word typed and current time
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
        wordsList = CommonEnglishWords.getCommonWordsRandom(10);
    }
    
    initialize();
    switchDisplays(0);
    document.addEventListener('keydown', typingHandler);
}

start_btn.onclick = start_typing;
