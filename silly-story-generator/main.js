//1. COMPLETE VARIABLE AND FUNCTION DEFINITIONS

let customName = document.getElementById('customname');
let randomize = document.querySelector('.randomize');
let story = document.querySelector('.story');

function randomValueFromArray(array){
  return array[Math.floor(Math.random()*array.length)];
}


//2. RAW TEXT STRINGS

let storyText = 'It was 94 farenheit outside, so :insertx: went for a walk. When they got to :inserty:, they stared in horror for a few moments, then :insertz:. Bob saw the whole thing, but was not surprised — :insertx: weighs 300 pounds, and it was a hot day.';


let insertX = ['Willy the Goblin', 'Big Daddy','Father Christmas'];

let insertY = ['the soup kitchen', 'Disneyland', 'the White House'];

let insertZ = ['spontaneously combusted', 'melted into a puddle on the sidewalk', 'turned into a slug and crawled away'];


//3. EVENT LISTENER AND PARTIAL FUNCTION DEFINITION

randomize.addEventListener('click', result);

function result() {

	let newStory = storyText;

	let xItem = randomValueFromArray(insertX);
	let yItem = randomValueFromArray(insertY);
	let zItem = randomValueFromArray(insertZ);

	newStory = newStory.replace(':insertx:', xItem);
	newStory = newStory.replace(':inserty:', yItem);
	newStory = newStory.replace(':insertz:', zItem);
	newStory = newStory.replace(':insertx:', xItem);

  	if(customName.value != '') {
    	let name = customName.value;
    	newStory = newStory.replace('Bob', name);

  	}

  	if(document.getElementById("uk").checked) {
	    let weight = Math.round(21.4286) + ' stone';
	    let temperature =  Math.round(34.4444) + ' centigrade';

	    newStory = newStory.replace('300 pounds', weight);
	    newStory = newStory.replace('94 farenheit', temperature);

  	}

  	story.textContent = newStory;
  	story.style.visibility = 'visible';
}