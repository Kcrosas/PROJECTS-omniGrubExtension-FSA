const url = window.location.href;
//Confirms that the extension is getting triggered
console.log(url, "Extension has been activated");

//Only manipulate the DOM once everything is loaded
window.addEventListener("load", (event) => {
  //Grabs name of restaurant
  var place = document.querySelectorAll(".iIcPdk")[0];
  console.log(place.innerHTML, "- Name of Restaurant");

  place.innerHTML = place.innerHTML + " DoorDash, hire us!";
  //Grabs address of user from top nav bar
  var address = document.querySelectorAll(".hbbgps");
  console.log(address[1].innerHTML, "- Address of user");

  //Grabs current rating of restaurant
  var rating = document.querySelectorAll("[data-testid=storeRatingInfo]");
  console.log(rating[0].innerHTML, "Current rating");
});
