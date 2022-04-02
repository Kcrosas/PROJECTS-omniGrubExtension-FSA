chrome.runtime.onMessage.addListener((msg, sender, response) => {
  //Uncomment if you've made adjustments to the search params from the frontend
  //console.log("Search params passed from the front: ", msg);

  var urlYelp = `https://api.yelp.com/v3/businesses/search?location=${msg.location}&term=${msg.store}`;

  //Initiate an empty results object
  let results = {};

  //Yelp fetch block
  fetch(urlYelp, {
    headers: {
      Authorization: "Bearer 999",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      results.yelpResult = data;
      response(results);
    });

  return true;
});
