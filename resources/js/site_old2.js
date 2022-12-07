import Alpine from 'alpinejs'
import collapse from '@alpinejs/collapse'
import persist from '@alpinejs/persist'
import focus from '@alpinejs/focus'
import 'focus-visible'

import updateOnScroll from 'uos';


// Global get CSRF token function (used by forms).
window.getToken = async () => {
    return await fetch('/!/DynamicToken/refresh')
        .then((res) => res.json())
        .then((data) => {
            return data.csrf_token
        })
        .catch(function (error) {
            this.error = 'Something went wrong. Please try again later.'
        })
}

// Call Alpine.
window.Alpine = Alpine
Alpine.plugin(collapse)
Alpine.plugin(persist)
Alpine.plugin(focus)
Alpine.start()


// site loop effect

let gridContainer;
let grid;
let gridChildren;
let speedText;

document.addEventListener("DOMContentLoaded", function() {
    initGridLoop();
});

function initGridLoop () {
    // get DOM elements
    gridContainer = document.body.querySelector('#grid-container')
    grid = document.body.querySelector('#grid')
    gridChildren = grid.children;
    speedText = document.body.querySelector('#speed')
    // execute fillRow once
    fillRow()

    // duplicate and append grid element for looping
    let gridCopy = grid.cloneNode(true)
    gridCopy.id = "grid-duplicate"
    gridContainer.append(gridCopy)

    // add the copies to array
    gridChildren = []
        .concat(Array.from(gridChildren))
        .concat(Array.from(document.body.querySelector('#grid-duplicate').children));

    // initital 1px scroll to enable loop
    gridContainer.scrollTop = 1




    // scroll loop functions
    function scrollLoop (event) {
        
        // Looper
        if ( event.target.scrollTop >= this.firstElementChild.scrollHeight) {
            event.target.scrollTop = 1
            lastPos = 0
            console.log("Loop Jump");
        }

        if ( event.target.scrollTop === 0 ) {
            event.target.scrollTop = this.firstElementChild.scrollHeight - 1
            lastPos = gridContainer.height
            console.log("Loop Jump");
        }   
    }

    // scroll event listeners
    // gridContainer.addEventListener('scroll', scrollLoop)
    // window.addEventListener('wheel', flickerPrevent)
    // gridContainer.addEventListener('scroll', checkScroll)

    updateOnScroll(0.0, 1.0, progress => {
        console.log(progress)
    });
}

// get number of grid columns
let getCols = (gridNode) => {
    return window.getComputedStyle(gridNode).getPropertyValue("grid-template-columns").split(" ").length;
}

// get cards count
let getCardsCount = (gridNode) => {
    return gridNode.children.length;
}

// fill row if necessary 
let fillRow = () => {
    // get current values
    let cardsCount = getCardsCount(grid)
    let cols = getCols(grid)
    
    // need {fillcount}'s elements to fill up the row
    let fillCount = cols - ( cardsCount % cols )
    
    if( fillCount != 0 ) {
        // get elements from the middle of the array
        let loopStart = Math.round( cardsCount / 2  - cols / 2 ) - 1

        // create array and push numbers withut beginnning and ending of list
        let range = [];
        for (let i = 0 + cols; i < cardsCount - cols; i++) { range.push(i) }
        
        // shuffle array and truncate to necessary fillcount
        for(let j, x, i = range.length; i; j = parseInt(Math.random() * i), x = range[--i], range[i] = range[j], range[j] = x);
        range = range.slice(0, fillCount);

        for (let i = 0; i < range.length; i++) {
            const childCopy = gridChildren[range[i]].cloneNode(true);
            grid.append(childCopy)
        }
    }
}

// select columns in grid
function getEveryNthColumn(arr, nth) {
    const result = [];

    for (let i = nth; i < arr.length; i += getCols(grid) ) {
        result.push(arr[i]);
    }
  
    return result;
}


let isScrolling = false;
let scrollUp = false;
let myTimeout;
let lastPos;

let checkScroll = () => {
   
    if(lastPos < gridContainer.scrollTop ) {
        speedText.innerText = "scrolling down";
        scrollUp = false;
    }
    else if (lastPos > gridContainer.scrollTop  ){
        speedText.innerText = "scrolling up";
        scrollUp = true;
    }
    
    lastPos = gridContainer.scrollTop;
    isScrolling = true;

    // console.log(scrollUp)
    // console.log(lastPos)

    clearTimeout(myTimeout);
    myTimeout = setTimeout( () => {
        isScrolling = false;
        speedText.innerText = "no scrolling";
    }, 200);
}

