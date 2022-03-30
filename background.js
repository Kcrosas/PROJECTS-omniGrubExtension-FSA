//Testing background script

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  // if(msg.name == "fetchWords"){
  let searchParams = msg;
  console.log("Search params passed from the front: ", searchParams);

  //Confirmed working
  var url = "https://api.yelp.com/v3/businesses/search" + searchParams;
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url);
  xhr.setRequestHeader("Authorization", "Bearer 999");
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
