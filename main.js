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



// VARIABLES HERE (any new ones should be written here if global-space variables)
let wordPointerIndex = 0;
let sentence = "";
let typingOn = false;
let wordsList = [];
const start_btn = document.getElementById("start_btn");
const type_area = document.getElementById("type_area");


async function fetchTopics(numOfTopics) {
    try {
        const response = await fetch(`https://random-word-api.herokuapp.com/word?number=${numOfTopics}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.log("ERROR FACED WHEN FETCHING TOPIC");
        console.log(error);
    }
}

async function retrieveRandomWords(topics, numOfWordsToFetch, numOfWordsToRetrieve) {
    try {
        const promises = topics.map(topicWord => {
            return fetchRelatedWordsForTopic(topicWord, numOfWordsToFetch);
        });

        const resultsOfPromises = await Promise.all(promises);

        let otpList = [];

        for (result of resultsOfPromises) {
            for (word of result) {
                otpList.push(word);
            }
        }


        return randomShuffle(otpList).slice(0, numOfWordsToRetrieve);
    } catch (error) {
        console.log("ERROR FACED WHEN RETRIEVING RELATED WORDS WITH TOPICS");
        console.log(error);
    }
}

async function fetchRelatedWordsForTopic(topic, numOfWords) {
    try {
        const response = await fetch(`https://api.datamuse.com/words?ml=${topic}&max=${numOfWords}&f=1&md=f`);
        const data = await response.json();

        let wordsList = data.map(word => {
            return word["word"];
        });

        return wordsList;
    } catch (error) {
        console.log("ERROR FACED WHEN FETCHING RELATED WORDS");
        console.log(error);
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
    let topics = await fetchTopics(5);
    wordsList = await retrieveRandomWords(topics, 10, 10);
    console.log(wordsList);
    sentence = wordsList.join(" ");
    type_area.textContent = sentence;

    switchDisplays(typingOn=true);

    document.addEventListener('keydown', typingHandler);
}

// async function main() {
//     let topics = await fetchTopics(5);
//     console.log(retrieveRandomWords(topics, 10, 10));
// }

// main()
