window.saveDataAcrossSessions = false;

let webgazerReady = false 
webgazer.setGazeListener(function(data, elapsedTime) {
	if (data == null) {
		return;
	}
	calibration.innerHTML = "Calibration. Click "+remainingClicks+" dots while looking at your mouse :)" // who cares about perf?
	
	webgazerReady = true;
	var xprediction = data.x; //these x coordinates are relative to the viewport
	var yprediction = data.y; //these y coordinates are relative to the viewport
    // console.log(xprediction, yprediction)
	// console.log(elapsedTime); //elapsed time is based on time since begin was called
	// updatePositionOfInterest(xprediction, yprediction)

}).begin();

const calibration = document.getElementById("calibration")
const calibrationCirle = document.getElementById("calibration-circle")
const content = document.getElementById("content")
const infoBox = document.getElementById("info-box")
const infoBoxTitle = document.getElementById("info-box-title")
const infoBoxContent = document.getElementById("info-box-content")

content.style.display= "none"

let remainingClicks = 20;

function placeCircle() {
	var width = screen.width;

var height = screen.height;
	calibrationCirle.style.left = Math.random() * window.innerWidth +"px";
	calibrationCirle.style.top = Math.random() * window.innerHeight+"px";
	calibrationCirle.innerHTML = remainingClicks
};

document.addEventListener("mousedown", ()=> {
	// if(remainingClicks == 0 || !webgazerReady){
	// 	return; // should probably unbind the function but oh well :D
	// }
	if(remainingClicks == 0 ){
		return; // should probably unbind the function but oh well :D
	}
	remainingClicks--;
	placeCircle();
	if (remainingClicks == 0) {
		calibrationCirle.style.display = "none"
		calibration.style.display = "none"
		calibration.style.display = "display"
		content.style.display = "block"
	}
})

onmousemove = function(e){
	console.log("mouse location:", e.clientX, e.clientY)
	// updatePositionOfInterest(e.clientX, e.clientY)
}

let thingsOfInterest = [];
for(let interest of document.getElementsByClassName("interest")) {
	thingsOfInterest.push({
		elem:interest,
		distances: Array(50).map(() => 20000000)
	})
}

let currFocus = null

function markInterest(interest) {
	let interestElement = interest.elem
	infoBoxTitle.innerHTML = interestElement.innerHTML;
	infoBoxContent.innerHTML = interestElement.dataset.context;
	infoBox.style.display = "block"
}

// let loseFocusThreshold = 300000
function sum(distances) {
	let sum = 0
	for (let x of distances) {
		sum += x;
	}
	return sum
}

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
		console.log("dist", interest.elem.innerHTML, totalDist)
		if(totalDist < minDist) {
			minDist = totalDist
			minInterest = interest 
		} 
	}
	
	// Todo add rules to avoid edge conditions, you have to win by a margin for the topic to switch.
	if(minInterest != null && minDist < 15000){
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



