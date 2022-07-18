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
  var address = document.querySelectorAll(".gUHrYg");
  var addressText = address[1].innerHTML;

  //Grabs current rating of restaurant
  var rating = document.querySelectorAll("[data-testid=storeRatingInfo]");
  var ratingText = rating[0].innerHTML;

  //Grabs API Keys
  const keys = {};
  const keyCall = async () => {
    const settings = {
      method: "POST",
    };
    try {
      const response = await fetch(
        "https://m0ajooyjqb.execute-api.us-east-1.amazonaws.com/default/apiSecureKeys",
        settings
      );
      console.log("this is respones", response);
      keys.theKeys = await response.json();
    } catch (error) {
      console.log(error);
    }
  };

  keyCall();

  //Search params to be passed to background script as an object that can be referenced by multiple APIs
  const searchParams = {
    location: addressText,
    store: placeText,
    keys: keys,
  };

  const stringParams = JSON.stringify(searchParams);

  console.log("Compiled Params: ", searchParams);

  //Sends out a message to the background script's message listener with the search params
  chrome.runtime.sendMessage(searchParams, (response) => {
    const results = response.yelpResult;
    // const googleResults = response.googleResult;
    const fourResults = response.fourResult;
    const keys = response.theKeys;

    const yelp = results.businesses[0];
    // const google = googleResults.results[0];
    const four = fourResults.results[0];

    console.log("Result: ", yelp);
    console.log("THIS IS FOURSQUARE", fourResults);
    // console.log("Result: GOOGLE ", googleResults);

    let header = document.querySelector("header");

    //Checks if either return undefined or don't have a rating, if that happens error message
    //else the chrome extension runs
    if (!yelp || !four || !four.rating || !yelp.rating) {
      let errorDiv = document.createElement("div");

      //H1 for the Whoops
      let errorH1 = document.createElement("h1");
      let topDiv = document.createElement("div");
      //H1 stacked on top of h4
      let errorMessage = document.createElement("h4");
      let bottomDiv = document.createElement("div");
      //error classlist assignment
      errorDiv.classList.add("errorContainer");
      topDiv.classList.add("errorTop");
      bottomDiv.classList.add("errorBottom");

      //html construction
      header.appendChild(errorDiv);
      errorDiv.appendChild(topDiv);
      errorDiv.appendChild(bottomDiv);
      topDiv.appendChild(errorH1);
      bottomDiv.appendChild(errorMessage);

      //text insertion
      errorH1.innerHTML = "Whoops!";
      errorMessage.innerHTML = "OmniGrub Restaurant Match Not Found.";
    } else {
      //Element and variable declaration
      let divContainer = document.createElement("div");
      let yelpDiv = document.createElement("div");
      let ratingContainerDiv = document.createElement("div");
      let ratingDiv = document.createElement("div");
      let reviewDiv = document.createElement("div");
      let externalDiv = document.createElement("div");
      let a = document.createElement("a");
      let roundedRating = Math.ceil(yelp.rating * 2) / 2; // 2.5

      //google Variables
      // let googleDiv = document.createElement("div");
      // let ratingContainerDivG = document.createElement("div");
      // let ratingDivG = document.createElement("div");
      // let reviewDivG = document.createElement("div");
      // let externalDivG = document.createElement("div");
      // let roundedRatingG = Math.ceil(google.rating * 2) / 2; // 2.5

      //foursquare varibles
      let fourDiv = document.createElement("div");
      let ratingContainerDivF = document.createElement("div");
      let ratingDivF = document.createElement("div");
      let reviewDivF = document.createElement("div");
      let externalDivF = document.createElement("div");
      let aF = document.createElement("a");
      let roundedRatingF = Math.ceil(four.rating) / 2; // 2.5

      //class list assignment
      divContainer.classList.add("container");
      ratingContainerDiv.classList.add("ratingContainer");
      reviewDiv.classList.add("review");
      externalDiv.classList.add("linky");

      // ratingContainerDivG.classList.add("ratingContainer");
      // reviewDivG.classList.add("review");

      ratingContainerDivF.classList.add("ratingContainer");
      reviewDivF.classList.add("review");

      //HTML construction
      header.appendChild(divContainer);
      divContainer.appendChild(yelpDiv);
      divContainer.appendChild(ratingContainerDiv);
      divContainer.appendChild(externalDiv);
      ratingContainerDiv.appendChild(ratingDiv);
      ratingContainerDiv.appendChild(reviewDiv);
      externalDiv.appendChild(a);

      // divContainer.appendChild(googleDiv);
      // divContainer.appendChild(ratingContainerDivG);
      // divContainer.appendChild(externalDivG);
      // ratingContainerDivG.appendChild(ratingDivG);
      // ratingContainerDivG.appendChild(reviewDivG);

      divContainer.appendChild(fourDiv);
      divContainer.appendChild(ratingContainerDivF);
      divContainer.appendChild(externalDivF);
      ratingContainerDivF.appendChild(ratingDivF);
      ratingContainerDivF.appendChild(reviewDivF);
      externalDivF.appendChild(aF);
      //Image construction
      const ratingImg = document.createElement("img");
      ratingImg.classList.add("ratingImage");
      ratingImg.src = chrome.runtime.getURL(`./small_${roundedRating}.png`);

      const yelpImg = document.createElement("img");
      yelpImg.classList.add("yelpImage");
      yelpImg.src = chrome.runtime.getURL(`./yelp-logo.png`);

      // const googleImg = document.createElement("img");
      // googleImg.classList.add("googleImage");
      // googleImg.src = chrome.runtime.getURL(`./googleLogo.png`);

      const fourImg = document.createElement("img");
      fourImg.classList.add("fourImage");
      fourImg.src = chrome.runtime.getURL("./fourlogo.jpeg");

      const externalImg = document.createElement("img");
      externalImg.classList.add("externalImage");
      externalImg.src = chrome.runtime.getURL("./external.png");

      const externalImgF = document.createElement("img");
      externalImgF.classList.add("externalImage");
      externalImgF.src = chrome.runtime.getURL("./external.png");

      // const ratingImgGoogle = document.createElement("img");
      // ratingImgGoogle.classList.add("ratingImage");
      // ratingImgGoogle.src = chrome.runtime.getURL(
      //   `./small_${roundedRatingG}.png`
      // );

      const ratingImgFour = document.createElement("img");
      ratingImgFour.classList.add("ratingImage");
      ratingImgFour.src = chrome.runtime.getURL(
        `./small_${roundedRatingF}.png`
      );

      //Variable assignment
      reviewDiv.innerHTML = `(${yelp.review_count} reviews)`;
      a.href = `${yelp.url}`;

      // reviewDivG.innerHTML = `(${google.user_ratings_total} reviews)`;

      reviewDivF.innerHTML = `(${four.stats.total_ratings} reviews)`;
      aF.href = `https://foursquare.com/v/${four.name}/${four.fsq_id}`;
      //final HTML construction
      ratingDiv.appendChild(ratingImg);
      yelpDiv.appendChild(yelpImg);
      a.appendChild(externalImg);

      // ratingDivG.appendChild(ratingImgGoogle);
      // googleDiv.appendChild(googleImg);

      ratingDivF.appendChild(ratingImgFour);
      fourDiv.appendChild(fourImg);
      aF.appendChild(externalImgF);
    }
  });
});

//https://foursquare.com/v/${fourResults.results[0].name}/${fourResults.results[0].fsq_id}
