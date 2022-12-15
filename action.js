const url = window.location.href;
//Confirms that the extension is getting triggered
console.log(url, "Extension has been activated");

//Function is called and only proceeds once a certain class is loaded
function myFunc() {
  if (
    document.getElementsByClassName(
      "LayerManager__ChildrenContainer-sc-1k2ulq-0 gYRZjj"
    )
  ) {
    //This is responsible for getting the address of the restaurant
    const target = document
      .getElementsByClassName(
        "LayerManager__ChildrenContainer-sc-1k2ulq-0 gYRZjj"
      )[0]
      .getElementsByTagName("script")[0].innerHTML;
    const obj = JSON.parse(target);
    const actual = obj.address;
    const geo = obj.geo
    console.log(geo)
    const address = `${actual.streetAddress} ${actual.addressLocality} ${actual.addressRegion} ${actual.addressCountry}`;

    //Grabs current rating of restaurant
    var rating = document.querySelectorAll("[data-testid=storeRatingInfo]");
    var ratingText = rating[0].innerHTML;
    const main = {};
    //Grabs name of restaurant
    var place = document.querySelectorAll("h1")[0];
    var placeText = place.innerHTML;
    //Search params to be passed to background script as an object that can be referenced by multiple APIs
    const searchParams = {
      location: address,
      store: placeText,
      geo, 
      //hi: main,
    };

    console.log(searchParams, 'searchParams')

    const stringParams = JSON.stringify(searchParams);

    // console.log("Compiled Params: ", searchParams);
    //console.log("key1", searchParams.hi[nums]);
    //console.log("key2", searchParams.hi);

    //Sends out a message to the background script's message listener with the search params
    chrome.runtime.sendMessage(searchParams, (response) => {
      // console.log('This is the response from the background script', response)
      const results = response.yelpResult;
      // const googleResults = response.googleResult;
      const fourResults = response.fourResult;

      const yelp = results.businesses[0];
      // const google = googleResults.results[0];
      const four = fourResults.results[0];

      // console.log("Result: ", yelp);
      // console.log("THIS IS FOURSQUARE", fourResults);
      // console.log("Result: GOOGLE ", googleResults);

      let header = document.querySelector("header");

      //Checks if either return undefined or don't have a rating, if that happens error message
      //else the chrome extension runs
      if (!yelp && !four) {
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
      } else if (yelp && four && yelp.rating && four.rating) {
        //Both Yelp and Foursquare have results:
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

        //Add in FourSquare
        divContainer.appendChild(fourDiv);
        divContainer.appendChild(ratingContainerDivF);
        divContainer.appendChild(externalDivF);
        ratingContainerDivF.appendChild(ratingDivF);
        ratingContainerDivF.appendChild(reviewDivF);
        externalDivF.appendChild(aF);

        //Add in Yelp
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
        ratingDivF.appendChild(ratingImgFour);
        fourDiv.appendChild(fourImg);
        aF.appendChild(externalImgF);

        // ratingDivG.appendChild(ratingImgGoogle);
        // googleDiv.appendChild(googleImg);

        ratingDiv.appendChild(ratingImg);
        yelpDiv.appendChild(yelpImg);
        a.appendChild(externalImg);
      } else if (!four || !four.rating) {
        //Only Foursquare has Results:
        //Yelp Variable Declaration
        let divContainer = document.createElement("div");
        let yelpDiv = document.createElement("div");
        let ratingContainerDiv = document.createElement("div");
        let ratingDiv = document.createElement("div");
        let reviewDiv = document.createElement("div");
        let externalDiv = document.createElement("div");
        let a = document.createElement("a");
        let roundedRating = Math.ceil(yelp.rating * 2) / 2; // 2.5

        //class list assignment
        divContainer.classList.add("container");
        ratingContainerDiv.classList.add("ratingContainer");
        reviewDiv.classList.add("review");
        externalDiv.classList.add("linky");

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
        reviewDiv.innerHTML = `(${yelp.review_count} reviews)`;
        a.href = `${yelp.url}`;

        //final HTML construction
        ratingDiv.appendChild(ratingImg);
        yelpDiv.appendChild(yelpImg);
        a.appendChild(externalImg);
      } else if (!yelp) {
        //Only Foursquare has Results:
        //foursquare varibles
        let divContainer = document.createElement("div");
        let fourDiv = document.createElement("div");
        let ratingContainerDivF = document.createElement("div");
        let ratingDivF = document.createElement("div");
        let reviewDivF = document.createElement("div");
        let externalDivF = document.createElement("div");
        let aF = document.createElement("a");
        let roundedRatingF = Math.ceil(four.rating) / 2; // 2.5

        //class list assignment
        divContainer.classList.add("container");
        externalDivF.classList.add("linky");
        ratingContainerDivF.classList.add("ratingContainer");
        reviewDivF.classList.add("review");

        //HTML construction
        header.appendChild(divContainer);
        divContainer.appendChild(fourDiv);
        divContainer.appendChild(ratingContainerDivF);
        divContainer.appendChild(externalDivF);
        ratingContainerDivF.appendChild(ratingDivF);
        ratingContainerDivF.appendChild(reviewDivF);
        externalDivF.appendChild(aF);

        //Image construction
        const fourImg = document.createElement("img");
        fourImg.classList.add("fourImageSolo");
        fourImg.src = chrome.runtime.getURL("./fourlogo.jpeg");

        const externalImgF = document.createElement("img");
        externalImgF.classList.add("externalImage");
        externalImgF.src = chrome.runtime.getURL("./external.png");

        const ratingImgFour = document.createElement("img");
        ratingImgFour.classList.add("ratingImage");
        ratingImgFour.src = chrome.runtime.getURL(
          `./small_${roundedRatingF}.png`
        );

        //variable assignment
        reviewDivF.innerHTML = `(${four.stats.total_ratings} reviews)`;
        aF.href = `https://foursquare.com/v/${four.name}/${four.fsq_id}`;

        //final HTML construction
        ratingDivF.appendChild(ratingImgFour);
        fourDiv.appendChild(fourImg);
        aF.appendChild(externalImgF);
      }
    });
  } else {
    setTimeout(myFunc, 15);
  }
}

myFunc();

//https://foursquare.com/v/${fourResults.results[0].name}/${fourResults.results[0].fsq_id}
