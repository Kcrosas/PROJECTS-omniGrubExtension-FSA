chrome.runtime.onMessage.addListener((msg, sender, response) => {
  //Uncomment if you've made adjustments to the search params from the frontend
  //console.log("Search params passed from the front: ", msg);

  var urlYelp = `https://api.yelp.com/v3/businesses/search?location=${msg.location},NY&term=${msg.store}`;

  var urlFour = `https://api.foursquare.com/v3/places/search?`;

  let fourCategories = "";
  for (let i = 13000; i < 13387; i++) {
    fourCategories = fourCategories + `,${i}`;
  }
  const fourFields = "rating,name,fsq_id,location,website,stats";

  //Initiate an empty results object
  let results = {};

  //Yelp fetch block
  fetch(urlYelp, {
    headers: {
      Authorization:
        "Bearer 7Sx1VUh0USPACiiBiWX7XGU9IT6E0TPgGnxNHHQIzSiUUl1Kfgdp2HlEFJJ-i0rVrt00nRi3MItgQSwvqLebEa7sRiUFF1Q6_gOXiyEqYzSkGldDEAwbtfD8NQ4pYnYx",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      results.yelpResult = data;
      let zipFour = results.yelpResult.businesses[0].location.zip_code;

      fetch(
        `${urlFour}near=${zipFour}&query=${msg.store}$categories=${fourCategories}&fields=${fourFields}`,
        {
          headers: {
            Authorization: `fsq3H3P89by6yV/anQjoZ//7MnOwHmyKwcJMn3aH+eEpV4w=`,
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          results.fourResult = data.results;
          response(results);
        });
    });

  return true;
});
