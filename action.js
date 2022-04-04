const url = window.location.href;
//Confirms that the extension is getting triggered
console.log(url, "Extension has been activated");
//Only manipulate the DOM once everything is loaded
window.addEventListener("load", (event) => {
  //Grabs name of restaurant
  var place = document.querySelectorAll("h1")[0];
  var placeText = place.innerHTML;

  // //creating the div thats going to be inserted

  //Example use of modifying an existing element
  //place.innerHTML = place.innerHTML + " DoorDash, hire us!";

  //Grabs address of user from top nav bar
  var address = document.querySelectorAll(".hbbgps");
  var addressText = address[1].innerHTML;

  //Grabs current rating of restaurant
  var rating = document.querySelectorAll("[data-testid=storeRatingInfo]");
  console.log(document.querySelectorAll(".gVcdmK"), "rating array");
  var ratingText = rating[0].innerHTML;

  //Search params to be passed to background script as an object that can be referenced by multiple APIs
  const searchParams = {
    location: addressText,
    store: placeText,
  };

  const stringParams = JSON.stringify(searchParams);

  console.log("Place name: ", placeText);
  console.log("User location ", addressText);
  console.log("Current rating ", ratingText);
  console.log("Compiled Params: ", searchParams);

  let font = new FontFace("TTnorms", "url('TTnorms.otf')");
  document.fonts.add(font);
  //Sends out a message to the background script's message listener with the search params
  chrome.runtime.sendMessage(searchParams, (response) => {
    const results = response.yelpResult;
    const singleSpot = results.businesses[0];

    const fourResults = response.fourResult;
    console.log("Result: ", singleSpot);
    console.log("THIS IS FOURSQUARE", fourResults);

    //Element and variable declaration
    let divContainer = document.createElement("div");
    let yelpDiv = document.createElement("div");
    let ratingContainerDiv = document.createElement("div");
    let ratingDiv = document.createElement("div");
    let reviewDiv = document.createElement("div");
    let externalDiv = document.createElement("div");
    let a = document.createElement("a");
    let header = document.querySelector("header");
    let roundedRating = Math.ceil(singleSpot.rating * 2) / 2; // 2.5


    //class list assignment
    divContainer.classList.add("container");
    ratingContainerDiv.classList.add("ratingContainer");
    reviewDiv.classList.add("review");


    //HTML construction
    header.appendChild(divContainer);
    divContainer.appendChild(yelpDiv);
    divContainer.appendChild(ratingContainerDiv);
    divContainer.appendChild(externalDiv);
    ratingContainerDiv.appendChild(ratingDiv);
    ratingContainerDiv.appendChild(reviewDiv);
    externalDiv.appendChild(a);

    //Image construction
    const ratingImg = document.createElement("img");
    ratingImg.classList.add("ratingImage");
    ratingImg.src = chrome.runtime.getURL(`./small_${roundedRating}.png`);

    const yelpImg = document.createElement("img");
    yelpImg.classList.add("yelpImage");
    yelpImg.src = chrome.runtime.getURL(`./yelp-logo.png`);

    const externalImg = document.createElement("img");
    externalImg.classList.add("externalImage");
    externalImg.src = chrome.runtime.getURL("./external.png");

    //Variable assignment
    reviewDiv.innerHTML = `(${singleSpot.review_count} reviews)`;
    a.href = `${singleSpot.url}`

    //final HTML construction
    ratingDiv.appendChild(ratingImg);
    yelpDiv.appendChild(yelpImg);
    a.appendChild(externalImg);


  });
});
