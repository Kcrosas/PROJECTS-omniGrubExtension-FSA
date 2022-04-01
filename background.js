//Testing background script

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log("Search params passed from the front: ", msg);

  var url = `https://api.yelp.com/v3/businesses/search?location=${msg.location}&term=${msg.store}`;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.setRequestHeader(
    "Authorization",
    "Bearer 7Sx1VUh0USPACiiBiWX7XGU9IT6E0TPgGnxNHHQIzSiUUl1Kfgdp2HlEFJJ-i0rVrt00nRi3MItgQSwvqLebEa7sRiUFF1Q6_gOXiyEqYzSkGldDEAwbtfD8NQ4pYnYx"
  );
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
      let results = xhr.responseText;
      response({
        results,
      });
    }
  };
  xhr.send();

  return true;
});
