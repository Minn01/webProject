// This file needs documentation 
// If any changes are made, add documentation

// IMPORTS
function randomShuffle(lis) {
    for (let i = lis.length-1; i > 0; i--) {
        let rd_index = Math.floor(Math.random() * (i+1));
        [lis[rd_index], lis[i]] = [lis[i], lis[rd_index]];
    }

    return lis;
}

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

async function retrieveRandomWords(wordNumber) {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${wordNumber}`)
        const data = await data.json();
        console.log(data);
    } catch (error) {
        window.alert("Error fetching random words");
        console.log(error);
    }
}

// function to fetch random words from API (datamuse.com / Datamuse)
async function retrieveRelatedWords(wordNumber, numberOfWordsLoaded, topicWord) {
    try {
        // fetching data from api
        const response = await fetch(`https://api.datamuse.com/words?ml=${topicWord}&max=${numberOfWordsLoaded}&f=1&md=f`);
        // fetching json data
        const data = await response.json();
        console.log(data);

        // grabbing only the words from the json file
        let wordsList = data.map(word => {
            return word["word"];
        });

        // using a shuffling algorithm
        let outputList = randomShuffle(wordsList.slice(0, wordNumber));
        return outputList;

    } catch (error) {
        window.alert("Error fetching related words");
        console.log(error);
    }
}

// VARIABLES HERE (any new ones should be written here if global-space variables)
let wordPointerIndex = 0;
let sentence = "";
let typingOn = false;
let wordsList = [];
const start_btn = document.getElementById("start_btn");
const type_area = document.getElementById("type_area");


function switchDisplays(typingOn) {
    if (typingOn) {
        start_btn.style.display = "none";
        type_area.style.display = "flex";
    } else {
        start_btn.style.display = "inline-block";
        type_area.style.display = "none";
    }
}

// Function to handle the checks for typing
function typingHandler(event) {
    // console.log(`${event.key} : ${sentence[wordPointerIndex]}`);

    // key check with actual sentence
    if (event.key == sentence[wordPointerIndex]) {
        wordPointerIndex++;
        type_area.innerHTML = `<span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>${sentence.slice(wordPointerIndex)}`;
    } else {
        type_area.innerHTML = 
        `
            <span class='correctWordColor'>${sentence.slice(0, wordPointerIndex)}</span>
            <span class='wrongWordColor'>${sentence[wordPointerIndex]}</span>${sentence.slice(wordPointerIndex+1)}
        `;
    }

    // end check
    if (wordPointerIndex == sentence.length) {
        switchDisplays(typingOn=false);
        wordPointerIndex = 0;
        document.removeEventListener('keydown', typingHandler);
    }
}

// onclick function for the start button
async function start_typing() {
    wordsList = await retrieveRelatedWords(10, 100, "animal");
    console.log(wordsList);

    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    switchDisplays(typingOn=true);

    document.addEventListener('keydown', typingHandler);
}
