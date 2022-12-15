chrome.runtime.onMessage.addListener((msg, sender, response) => {
  var urlYelp = `https://api.yelp.com/v3/businesses/search?`;
  var urlFour = `https://api.foursquare.com/v3/places/search?`;

  //For use with FourSquare's API call
  let fourCategories = "";
  for (let i = 13000; i < 13387; i++) {
    fourCategories = fourCategories + `,${i}`;
  }
  const fourFields = "rating,name,fsq_id,location,website,stats";

  //Initiate an empty results object
  let results = {};
  // let keys = {};

  const numCall = async () => {
    const settings = {
      method: "POST",
    };
    try {
      const response = await fetch(
        "https://m0ajooyjqb.execute-api.us-east-1.amazonaws.com/default/apiSecureKeys",
        settings
      );
      results.keys = await response.json();
    } catch (error) {
      console.log(error);
    }
  };

  ////////////////////////////////ASYNC yelp call function
  const yelpCall = async () => {
    try {
      const response = await fetch(
        `${urlYelp}location=${msg.location}&term=${msg.store}`,
        {
          headers: {
            //Authorization: `${msg.hi.nums.num2}`,
            Authorization: `${results.keys.num2}`,
          },
        }
      );
      results.yelpResult = await response.json();
    } catch (error) {
      console.log(error);
    }
  };

  ////////////////////////////////ASYNC four call function
  const fourCall = async () => {
    try {
      let zipFour = results.yelpResult.businesses[0].location.zip_code;
      console.log(`${urlFour}near=${zipFour}&query=${msg.store}&categories=${fourCategories}&fields=${fourFields}`)
      //ll=${msg.geo.latitude},${msg.geo.longitude}
      const response = await fetch(
        `${urlFour}ll=${msg.geo.latitude},${msg.geo.longitude}&query=${msg.store}&fields=${fourFields}&sort=distance`,
        {
          headers: {
            Authorization: `${results.keys.num1}`,
          },
        }
      );
      results.fourResult = await response.json();
    } catch (error) {
      console.log(error);
    }
  };

  ////////////////////////////ASYNC google call function
  // const googleCall = async () => {
  //   try {
  //     const response = await fetch(
  //       `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+${msg.location}+${msg.store}&key=999`
  //     );
  //     results.googleResult = await response.json();
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  //API calls made in order
  (async () => {
    // await keyCall();
    await numCall();
    await yelpCall();
    await fourCall();

    // await googleCall();
    response(results);
  })();

  return true;
});
