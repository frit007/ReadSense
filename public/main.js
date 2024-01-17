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

content.style.display= "none"

let remainingClicks = 6;

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
	if (remainingClicks == 0) {
		calibrationCirle.style.display = "none"
		calibration.style.display = "none"
		calibration.style.display = "display"
		content.style.display = "block"
		focusIndicator.style.display = "block"
		autoConfigure()
	}
})

onmousemove = function(e){
	// console.log("mouse location:", e.clientX, e.clientY)
	// updatePositionOfInterest(e.clientX, e.clientY)
}

let thingsOfInterest = [];
for(let interest of document.getElementsByClassName("interest")) {
	thingsOfInterest.push({
		elem:interest,
		distances: Array(50).map(() => 20000000)
	})
}

var socket = io();

socket.on('connect', function() {
	socket.emit('connection_established', {data: 'I\'m connected!'});
	console.log("connected!")
	webgazerReady = true
	calibration.innerHTML = "<b>Calibration</b><br/>  Put your mouse in the center of the green ball, look at it and click.<br><b>Note: If you move the window you have to calibrate again</b>"
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

function translate(position, config) {
	let x = (position.x - config.translateX) * config.scaleX;
	let y = (position.y - config.translateY) * config.scaleY;
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
		currentConfig = changePropertyUntilWorse(currentConfig, "scaleX", changeScale * 0.1);
		currentConfig = changePropertyUntilWorse(currentConfig, "scaleX", -changeScale * 0.1);
		currentConfig = changePropertyUntilWorse(currentConfig, "scaleY", changeScale * 0.1);
		currentConfig = changePropertyUntilWorse(currentConfig, "scaleY", -changeScale * 0.1);
		console.log("state", currentConfig)
		changeScale = changeScale / 2;
	}	
}

function markInterest(interest) {
	let interestElement = interest.elem
	infoBoxTitle.innerHTML = interestElement.innerHTML;
	infoBoxContent.innerHTML = interestElement.dataset.context;
	infoBox.style.display = "block"
	infoBox.style.maxWidth = window.innerWidth / 4 - 20 + "px";
	infoBox.style.top = $(interest.elem).offset().top - $(infoBox).outerHeight() / 2 +"px"
}

// let loseFocusThreshold = 300000
function sum(distances) {
	let sum = 0
	for (let x of distances) {
		sum += x;
	}
	return sum
}
let minThreshhold = 75

function updatePositionOfInterest(x, y) {
	if(remainingClicks >0){
		return; // wait for calibration :)
	}

	let minDist = 2000000000;
	let minInterest = null;
	for(let interest of thingsOfInterest) {
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
	if(minInterest != null && minDist/minInterest.distances.length < minThreshhold){
		markInterest(minInterest)
	}
}

function calculateDistance(elem, mouseX, mouseY) {
	let res= Math.floor(Math.sqrt(Math.pow(mouseX - (elem.offset().left+(elem.width()/2)), 2) - elem.width()/2 + Math.pow(mouseY - (elem.offset().top+(elem.height()/2)), 2) ) -elem.height()/2);
	if (isNaN(res)) {
		return 1
	}
	return res
}



