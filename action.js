const url = window.location.href;
//Confirms that the extension is getting triggered
console.log(url, "Extension has been activated");
//Only manipulate the DOM once everything is loaded
window.addEventListener("load", (event) => {
  //Grabs name of restaurant
  var place = document.querySelectorAll("h1")[0];
  var placeText = place.innerHTML;

  //Example use of modifying an existing element
  //place.innerHTML = place.innerHTML + " DoorDash, hire us!";

  //Grabs address of user from top nav bar
  var address = document.querySelectorAll(".hbbgps");
  var addressText = address[1].innerHTML;

  //Grabs current rating of restaurant
  var rating = document.querySelectorAll("[data-testid=storeRatingInfo]");
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

  //Sends out a message to the background script's message listener with the search params
  chrome.runtime.sendMessage(searchParams, (response) => {
    const results = response.yelpResult;
    const singleSpot = results.businesses[0];
    console.log("Result: ", singleSpot);
    place.innerHTML =
      place.innerHTML +
      " YELP RATING IS:" +
      singleSpot.rating +
      "(" +
      singleSpot.review_count +
      ")";
    //From tutorial, example use of modifying existing HTML with response data
    // document.querySelector('h1').innerHTML = response.word;
    // document.querySelector('p').innerHTML = response.desc;
  });
});
