window.saveDataAcrossSessions = false;

let webgazerReady = false 
// webgazer.setGazeListener(function(data, elapsedTime) {
// 	if (data == null) {
// 		return;
// 	}

// 	if(!webgazerReady){
// 		calibration.innerHTML = "Calibration. Click dots while looking at your mouse :)" // who cares about perf?
// 	}
	
// 	webgazerReady = true;
// 	var xprediction = data.x; //these x coordinates are relative to the viewport
// 	var yprediction = data.y; //these y coordinates are relative to the viewport
//     // console.log(xprediction, yprediction)
// 	// console.log(elapsedTime); //elapsed time is based on time since begin was called
// 	// updatePositionOfInterest(xprediction, yprediction)

// }).begin();

const calibration = document.getElementById("calibration")
const calibrationCirle = document.getElementById("calibration-circle")
const content = document.getElementById("content")
const infoBox = document.getElementById("info-box")
const infoBoxTitle = document.getElementById("info-box-title")
const infoBoxContent = document.getElementById("info-box-content")
const focusIndicator = document.getElementById("focus-indicator")
const arrowLeft = document.getElementById("arrowLeft")
const arrowRight = document.getElementById("arrowRight")

const infoRelativeNavigation = document.getElementById("info-navigation-relative-navigation")
const infoPageCount = document.getElementById("info-navigation-page-count")

const showTextBtn = document.getElementById("showTextBtn");
const showImageBtn = document.getElementById("showImageBtn");


content.style.display= "none"

// how much data do you need for training. 0 to skip training
let remainingClicks = 6;


function showDebugVision() {
	focusIndicator.style.display = "block";
}

function hideDebugVision() {
	focusIndicator.style.display = "none";
}

/**
 * @type {{localX:number, localY:number, remoteX:number, remoteY:number}[]} myObjects
 */
let calibrationData = [];

calibrationCirle.innerHTML = remainingClicks
function placeCircle() {
	calibrationCirle.style.left = Math.random() * window.innerWidth +"px";
	calibrationCirle.style.top = Math.random() * window.innerHeight+"px";
	calibrationCirle.innerHTML = remainingClicks
};



document.addEventListener("mousedown", () => {
	// if(remainingClicks == 0 || !webgazerReady){
	// 	return; // should probably unbind the function but oh well :D
	// }
	if (remainingClicks == 0 ) {
		return; // should probably unbind the function but oh well :D
	}
	remainingClicks--;
	
	calibrationCirle.style
	let localX = $(calibrationCirle).offset().left + $(calibrationCirle).outerHeight()/2;
	let localY = $(calibrationCirle).offset().top + $(calibrationCirle).outerHeight()/2;
	calibrationData.push({localX:localX, localY:localY, remoteX:focus.x, remoteY:focus.y})


	placeCircle();
	if(remainingClicks == 0) {
		contentReady();
	}
})

onmousemove = function(e){
	// console.log("mouse location:", e.clientX, e.clientY)
	// updatePositionOfInterest(e.clientX, e.clientY)
}
/**
 * @typedef {{
 * distances: number[],
 * elem:HTMLElement , 
 * current_page:number, 
 * generated_pages:number,
 * showImage: boolean,
 * focusStart: number
 * }} Interest
 */
/**
 * @type {Interest[]} interests
 */
let allInterests = [];
for(let interest of document.getElementsByClassName("interest")) {
	allInterests.push({
		elem:interest,
		distances: Array(10).map(() => 20000000),
		current_page: 1,
		generated_pages: 1,
		showImage: false,
		focusStart: 0
	})
}

var socket = io();

socket.on('connect', function() {
	socket.emit('connection_established', {data: 'I\'m connected!'});
	console.log("connected!")
	webgazerReady = true
	calibration.innerHTML = "<b>Calibration</b><br/>  look at the green ball and click.<br><b>Note: If you move the window you have to calibrate again</b>"
});
let focus = {x:0,y:0}
socket.on('update_focus', function(d) {
	// console.log("hi", d)
	focus = d
	if(remainingClicks == 0) {
		let predictedPos = translate(focus, currentConfig)
		let xpos = predictedPos.x-$(focusIndicator).outerWidth()/ 2;
		let ypos = predictedPos.y-$(focusIndicator).outerHeight()/ 2;
		focusIndicator.style.left = xpos + "px"
		focusIndicator.style.top = ypos + "px"
		
		updatePositionOfInterest(predictedPos.x, predictedPos.y)
	}
});

let currFocus = null

let currentConfig = {
	translateX: 0,
	translateY: 0,
	scaleX: 1,
	scaleY: 1,
}


if(remainingClicks == 0) {
	contentReady();
}

function contentReady() {
	calibrationCirle.style.display = "none"
	calibration.style.display = "none"
	calibration.style.display = "display"
	content.style.display = "block"
	// focusIndicator.style.display = "block"
	autoConfigure()
}

function translate(position, config) {
	let x = (position.x - config.translateX) * config.scaleX;
	let y = (position.y - config.translateY) * config.scaleY + $(document).scrollTop();
	return {x, y}
}

function testConfig(config) {
	let error = 0;
	for(let calibData of calibrationData) {
		let predictedPos = translate( {x: calibData.remoteX,y: calibData.remoteY}, config)
		error += Math.abs(predictedPos.x - calibData.localX) 
		error += Math.abs(predictedPos.y - calibData.localY) 
	}
	return error
}

function changePropertyUntilWorse(config, property, delta){
	let currError = testConfig(config)
	let conf = {...config}
	console.log("start" ,property)
	while (true) {
		let newConf = {...conf}
		newConf[property] += delta;
		let newError =testConfig(newConf)
		console.log("iterate" ,property, conf[property], currError, newError)
		
		if(newError >= currError) {
			return conf // we are no longer improving give up
		}
		conf = newConf
		currError = newError
	}
}

function autoConfigure() {
	let changeScale = 5;
	
	while(changeScale > 0.01) {
		currentConfig = changePropertyUntilWorse(currentConfig, "translateX", changeScale * 50);
		currentConfig = changePropertyUntilWorse(currentConfig, "translateX", -changeScale * 50);
		currentConfig = changePropertyUntilWorse(currentConfig, "translateY", changeScale * 50);
		currentConfig = changePropertyUntilWorse(currentConfig, "translateY", -changeScale * 50);
		// currentConfig = changePropertyUntilWorse(currentConfig, "scaleX", changeScale * 0.1);
		// currentConfig = changePropertyUntilWorse(currentConfig, "scaleX", -changeScale * 0.1);
		// currentConfig = changePropertyUntilWorse(currentConfig, "scaleY", changeScale * 0.1);
		// currentConfig = changePropertyUntilWorse(currentConfig, "scaleY", -changeScale * 0.1);
		console.log("state", currentConfig)
		changeScale = changeScale / 2;
	}	
}

function capitalizeFirstLetter(string) {
	string = string.trim();
    return string.charAt(0).toUpperCase() + string.slice(1);
}



// let loseFocusThreshold = 300000
function sum(distances) {
	let sum = 0
	for (let x of distances) {
		sum += x;
	}
	return sum
}

let minChangeInterestThreshold = 100

/**
 * @type {Interest}
 */
let nextInterest = null;

function updatePositionOfInterest(x, y) {
	if(remainingClicks >0){
		return; // wait for calibration :)
	}

	let minDist = 2000000000;
	let timeBeforeShow = 1000;

	let minInterest = null;
	for(let interest of allInterests) {
		let dist = calculateDistance($(interest.elem), x, y)
		interest.distances.shift()
		interest.distances.push(dist)
		let totalDist = sum(interest.distances)
		// console.log("dist", interest.elem.innerHTML, totalDist)
		if(totalDist < minDist) {
			minDist = totalDist
			minInterest = interest 
		} 
	}
	
	// Todo add rules to avoid edge conditions, you have to win by a margin for the topic to switch.
	if(minInterest != null && minDist/minInterest.distances.length < minChangeInterestThreshold){
		if(nextInterest != minInterest) {
			if(nextInterest != null) {
				nextInterest.focusStart = 0;
			}
			nextInterest = minInterest;
			nextInterest.focusStart = Date.now()
		} else {
			if(Date.now() - nextInterest.focusStart > timeBeforeShow) {
				markInterest(minInterest)
			}
		}
	} else {
		nextInterest = true;
	}
}
function distanceToFocus(elem) {
	let predictedPos = translate(focus, currentConfig)

	console.log("dist", calculateDistance($(elem), predictedPos.x, predictedPos.y))
}
function calculateDistance(elem, mouseX, mouseY) {
	let x = 0;
	let y = 0;
	const left = elem.offset().left
	const right = elem.offset().left + elem.outerWidth()
	
	if(mouseX < left) {
		x = Math.abs(mouseX - left);
	}
	if(mouseX > right) {
		x = Math.abs(mouseX - right);
	}
	
	const top = elem.offset().top;
	const bottom = elem.offset().top + elem.outerHeight();

	if(mouseY < top) {
		y = Math.abs(mouseY - top);
	}

	if(mouseY > bottom) {
		y = Math.abs(mouseY - bottom);
	}

	return Math.sqrt(x * x + y * y)
	// let res= Math.floor(Math.sqrt(Math.pow(mouseX - (elem.offset().left+(elem.width()/2)), 2) - elem.width()/2 + Math.pow(mouseY - (elem.offset().top+(elem.height()/2)), 2) ) -elem.height()/2);
	// if (isNaN(res)) {
	// 	return 0
	// }
	// return res
}

///// INFO NAVIGATION
/**
 * @type {Interest} currentInterest
 */
let currentInterest = null;

/**
 * @param   {Interest}  interest  [interest description]
 */
function drawInterest(interest) {
	
	let interestElement = interest.elem
	infoBoxTitle.innerHTML = capitalizeFirstLetter(interestElement.innerHTML);
	if (interest.showImage) {
		infoBoxContent.innerHTML = interestElement.dataset.image;
		showTextBtn.style.display = "block";
		showImageBtn.style.display = "none";
	} else {
		if(interest.current_page == 1) {
			infoBoxContent.innerHTML = interestElement.dataset.context;
			arrowLeft.style.display = "none";
			arrowRight.style.display = "inline-block";
		} else {
			infoBoxContent.innerHTML = interestElement.dataset.context2;
			arrowLeft.style.display = "inline-block";
			arrowRight.style.display = "none";
		}
		showTextBtn.style.display = "none";
		showImageBtn.style.display = "block";
	}

	infoBox.style.display = "block"
	infoBox.style.maxWidth = window.innerWidth / 4 - 20 + "px";
	infoBox.style.top = $(interest.elem).offset().top - $(infoBox).outerHeight() / 2 +"px"
	if(interest.generated_pages == 1) {
		infoRelativeNavigation.style.opacity= "0%";
	} else {
		infoRelativeNavigation.style.opacity= "100%";
		infoPageCount.innerHTML = `${interest.current_page}/${interest.generated_pages}`
	}
}

function markInterest(interest) {
	if(interest == currentInterest) {
		drawInterest(interest)
		return
	}
	if(currentInterest != null) {
		currentInterest.elem.classList.remove("highlight")
	}
	drawInterest(interest)
	currentInterest = interest
	currentInterest.elem.classList.add("highlight")
}

function nextInfo() {
	if (currentInterest.current_page < currentInterest.generated_pages) {
		currentInterest.current_page++
	}
	drawInterest(currentInterest)
}

function previousInfo() {
	if (currentInterest.current_page > 1) {
		currentInterest.current_page--
	}
	drawInterest(currentInterest)
}

function regenerateInfo() {
	if(currentInterest == null) { 
		return
	}
	if(currentInterest.generated_pages == 1) {
		currentInterest.generated_pages = 2;
		currentInterest.current_page = 2;
	}
	currentInterest.showImage = false; 	 
	drawInterest(currentInterest)
	console.log("second interest")
}

function toggleImage() {
	if(!currentInterest) {
		return;
	}

	currentInterest.showImage = !currentInterest.showImage;
	drawInterest(currentInterest);
}

