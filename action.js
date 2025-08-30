// action.js — resilient extraction + mount UI just above "Reviews"

// ===== Boot log =====
const pageUrl = window.location.href;
console.log(pageUrl, "Extension has been activated");

// ===== Small DOM helpers =====
function createElement(tagName, classListArr = [], textValue = null) {
  const domNode = document.createElement(tagName);
  if (classListArr && classListArr.length) domNode.classList.add(...classListArr);
  if (textValue != null) domNode.textContent = textValue;
  return domNode;
}

function getHeaderNode() {
  return document.querySelector("header") || document.body;
}

function getRatingImagePath(roundedValue) {
  return chrome.runtime.getURL(`./small_${roundedValue}.png`);
}

// ===== "Reviews" anchor helpers =====
function findReviewsAnchor() {
  // Primary: your provided selector (most reliable on DoorDash)
  let anchorNode = document.querySelector('[data-category-scroll-selector="review-menu-nav"]');
  if (anchorNode) return anchorNode;

  // Fallback: any a/span whose text is "Reviews" (case-insensitive)
  const candidates = Array.from(document.querySelectorAll('a, span, h2, h3, div'));
  const norm = (t) => (t || "").replace(/\s+/g, " ").trim().toLowerCase();
  return candidates.find((n) => norm(n.textContent) === "reviews") || null;
}

function mountContainerAtReviews(containerEl) {
  // If already mounted at the right place, stop.
  if (containerEl.dataset.omniMounted === "true") return;

  const reviewsAnchor = findReviewsAnchor();
  if (reviewsAnchor && reviewsAnchor.parentNode) {
    reviewsAnchor.parentNode.insertBefore(containerEl, reviewsAnchor);
    containerEl.dataset.omniMounted = "true";
    return;
  }

  // Not present yet: mount temporarily and move when anchor arrives.
  if (!containerEl.isConnected) {
    getHeaderNode().appendChild(containerEl);
  }

  const observer = new MutationObserver(() => {
    const anchorLater = findReviewsAnchor();
    if (anchorLater && anchorLater.parentNode) {
      try {
        anchorLater.parentNode.insertBefore(containerEl, anchorLater);
        containerEl.dataset.omniMounted = "true";
      } finally {
        observer.disconnect();
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  // Safety stop after 15s
  setTimeout(() => observer.disconnect(), 15000);
}

// ===== JSON-LD helpers (tertiary fallback) =====
function parseAllJsonLd() {
  const scriptNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const itemList = [];

  for (const scriptNode of scriptNodes) {
    const jsonText = scriptNode.textContent?.trim();
    if (!jsonText) continue;
    try {
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        itemList.push(...parsed);
      } else if (parsed && typeof parsed === "object" && Array.isArray(parsed["@graph"])) {
        itemList.push(...parsed["@graph"]);
      } else {
        itemList.push(parsed);
      }
    } catch {
      // Ignore invalid blocks
    }
  }
  return itemList;
}

function pickBusinessItem(itemList) {
  const preferredTypes = new Set(["Restaurant","FoodEstablishment","LocalBusiness","Organization","Place"]);
  const scoredList = itemList
    .map((itemObj, itemIdx) => {
      const typeVal = itemObj?.["@type"];
      const typesArr = Array.isArray(typeVal) ? typeVal : (typeVal ? [typeVal] : []);
      const hasPreferredType = typesArr.some(t => preferredTypes.has(t));
      const hasAddress = !!itemObj?.address;
      const hasGeo = !!itemObj?.geo || (itemObj?.latitude != null && itemObj?.longitude != null);
      const scoreVal = (hasPreferredType ? 2 : 0) + (hasAddress ? 2 : 0) + (hasGeo ? 1 : 0);
      return { itemObj, scoreVal, itemIdx };
    })
    .filter(row => row.scoreVal > 0)
    .sort((a, b) => b.scoreVal - a.scoreVal || a.itemIdx - b.itemIdx);

  return scoredList.length ? scoredList[0].itemObj : null;
}

function normalizeBusinessFromJsonLd(itemObj) {
  const nameText =
    itemObj?.name ??
    document.querySelector("h1")?.textContent?.trim() ??
    "";

  const addrObj = typeof itemObj?.address === "object" ? itemObj.address : {};
  const addressParts = [
    addrObj.streetAddress,
    addrObj.addressLocality,
    addrObj.addressRegion,
    addrObj.postalCode,
    addrObj.addressCountry
  ].filter(Boolean);
  const addressText = addressParts.join(" ");

  let geoObj = undefined;
  if (itemObj?.geo && typeof itemObj.geo === "object") {
    const latVal = itemObj.geo.latitude ?? itemObj.geo.lat;
    const lonVal = itemObj.geo.longitude ?? itemObj.geo.lng;
    if (latVal != null && lonVal != null) geoObj = { latitude: Number(latVal), longitude: Number(lonVal) };
  } else if (itemObj?.latitude != null && itemObj?.longitude != null) {
    geoObj = { latitude: Number(itemObj.latitude), longitude: Number(itemObj.longitude) };
  }

  const aggRating = itemObj?.aggregateRating?.ratingValue ?? null;
  const reviewTotal = itemObj?.aggregateRating?.reviewCount ?? null;

  return {
    store: nameText,
    location: addressText,
    geo: geoObj,
    aggregateRating: aggRating,
    reviewCount: reviewTotal
  };
}

// ===== DoorDash Next Flight (`self.__next_f.push`) parser =====
function extractJsonObjectByKeyLoose(textBlob, keyName) {
  const keyIdx = textBlob.indexOf(keyName);
  if (keyIdx === -1) return null;
  const colonIdx = textBlob.indexOf(":", keyIdx);
  if (colonIdx === -1) return null;
  const braceStartIdx = textBlob.indexOf("{", colonIdx);
  if (braceStartIdx === -1) return null;
  return extractJsonAt(textBlob, braceStartIdx);
}

function extractJsonAt(textBlob, startIdx) {
  let depthCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let posIdx = startIdx; posIdx < textBlob.length; posIdx++) {
    const chr = textBlob[posIdx];

    if (escapeNext) { escapeNext = false; continue; }
    if (chr === "\\") { escapeNext = true; continue; }
    if (chr === '"') { inString = !inString; continue; }

    if (!inString) {
      if (chr === "{") depthCount++;
      else if (chr === "}") {
        depthCount--;
        if (depthCount === 0) {
          const rawSlice = textBlob.slice(startIdx, posIdx + 1);
          try {
            const decodedText = JSON.parse('"' + rawSlice.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"');
            try { return JSON.parse(decodedText); }
            catch { return JSON.parse(rawSlice); }
          } catch {
            return null;
          }
        }
      }
    }
  }
  return null;
}

function extractFromNextFlightScripts() {
  const scriptNodes = Array.from(document.scripts || []);
  for (const scriptNode of scriptNodes) {
    const textBlob = scriptNode.textContent || "";
    if (!textBlob) continue;
    if (textBlob.indexOf("__next_f") === -1 && textBlob.indexOf("storeHeaderLite") === -1) continue;

    const storeHeaderObj =
      extractJsonObjectByKeyLoose(textBlob, "storeHeaderLite") ||
      extractJsonObjectByKeyLoose(textBlob, "storeHeader");

    if (storeHeaderObj && typeof storeHeaderObj === "object") {
      const storeName = storeHeaderObj?.name || storeHeaderObj?.business?.name || "";
      const addrObj = storeHeaderObj?.address || {};
      const displayAddr = addrObj?.displayAddress || "";
      const addressText =
        displayAddr ||
        [addrObj?.street, addrObj?.city, addrObj?.state, addrObj?.countryShortname]
          .filter(Boolean).join(", ");

      let geoObj = undefined;
      const latVal = addrObj?.lat;
      const lngVal = addrObj?.lng;
      if (latVal != null && lngVal != null) {
        const latNum = Number(latVal);
        const lngNum = Number(lngVal);
        if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
          geoObj = { latitude: latNum, longitude: lngNum };
        }
      }

      return {
        store: storeName,
        location: addressText,
        geo: geoObj,
        ddStoreId: storeHeaderObj?.id || null,
        ddBusinessId: storeHeaderObj?.business?.id || null
      };
    }

    const pageContextStoreObj = extractJsonObjectByKeyLoose(textBlob, "store");
    if (pageContextStoreObj && (pageContextStoreObj.storeName || pageContextStoreObj.menuId !== undefined)) {
      return {
        store: pageContextStoreObj?.storeName || "",
        location: "",
        geo: undefined,
        ddStoreId: pageContextStoreObj?.storeId || null
      };
    }
  }
  return null;
}

// ===== OG meta fallback =====
function extractFromOgMeta() {
  const ogTitleNode = document.querySelector('meta[property="og:title"]');
  const ogDescNode = document.querySelector('meta[property="og:description"]');
  const ogUrlNode = document.querySelector('meta[property="og:url"]');

  const ogTitle = ogTitleNode?.getAttribute("content") || "";
  const ogDesc = ogDescNode?.getAttribute("content") || "";
  const ogUrl = ogUrlNode?.getAttribute("content") || "";

  let storeName = "";
  let addressText = "";

  const descMatch = ogDesc.match(
    /(Get|Order)\s+(?:delivery(?:\s+or\s+takeout)?|pickup|takeout|delivery\s+or\s+pickup)\s+from\s+(.+?)\s+at\s+(.+?)\s+in\s+(.+?)(?:[.!|]|$)/i
  );
  if (descMatch) {
    storeName = (descMatch[2] || "").trim();
    const streetText = (descMatch[3] || "").trim().replace(/\s+USA$/i, "");
    const cityText = (descMatch[4] || "").trim();
    addressText = [streetText, cityText].filter(Boolean).join(", ");
  }

  if (!storeName) {
    const titleMatch = ogTitle.match(/^Order\s+(.+?)\s+-\s+/i);
    if (titleMatch) storeName = titleMatch[1].trim();
  }

  if (storeName || addressText) {
    return { store: storeName, location: addressText, geo: undefined, ogUrl };
  }
  return null;
}

// ===== On-page rating helper =====
function getOnPageRatingText() {
  const ratingNodeList = document.querySelectorAll("[data-testid=storeRatingInfo]");
  return ratingNodeList.length ? ratingNodeList[0].textContent?.trim() || null : null;
}

// ===== UI Renderers (now mount above Reviews) =====
function renderErrorBlock() {
  if (document.querySelector(".omni-container")) return;

  const containerDiv = createElement("div", ["container", "omni-container"]);
  const errorContainer = createElement("div", ["errorContainer"]);
  const topDiv = createElement("div", ["errorTop"]);
  const bottomDiv = createElement("div", ["errorBottom"]);
  const errorTitle = createElement("h1", [], "Whoops!");
  const errorMessage = createElement("h4", [], "OmniGrub Restaurant Match Not Found.");

  errorContainer.appendChild(topDiv);
  errorContainer.appendChild(bottomDiv);
  topDiv.appendChild(errorTitle);
  bottomDiv.appendChild(errorMessage);

  containerDiv.appendChild(errorContainer);
  mountContainerAtReviews(containerDiv);
}

function renderYelpOnly(yelpObj) {
  if (document.querySelector(".omni-container")) return;

  const containerDiv = createElement("div", ["container", "omni-container"]);

  const yelpDiv = createElement("div");
  const ratingContainerDiv = createElement("div", ["ratingContainer"]);
  const ratingDiv = createElement("div");
  const reviewDiv = createElement("div", ["review"]);
  const externalDiv = createElement("div", ["linky"]);
  const linkAnchor = createElement("a");

  const roundedYelp = Math.ceil(((yelpObj?.rating ?? 0) * 2)) / 2;

  containerDiv.appendChild(yelpDiv);
  containerDiv.appendChild(ratingContainerDiv);
  containerDiv.appendChild(externalDiv);
  ratingContainerDiv.appendChild(ratingDiv);
  ratingContainerDiv.appendChild(reviewDiv);
  externalDiv.appendChild(linkAnchor);

  const ratingImg = createElement("img", ["ratingImage"]);
  ratingImg.src = getRatingImagePath(roundedYelp);

  const yelpImg = createElement("img", ["yelpImage"]);
  yelpImg.src = chrome.runtime.getURL("./yelp-logo.png");

  const externalImg = createElement("img", ["externalImage"]);
  externalImg.src = chrome.runtime.getURL("./external.png");

  reviewDiv.textContent = `(${yelpObj?.review_count ?? 0} reviews)`;
  linkAnchor.href = `${yelpObj?.url ?? "#"}`;

  ratingDiv.appendChild(ratingImg);
  yelpDiv.appendChild(yelpImg);
  linkAnchor.appendChild(externalImg);

  mountContainerAtReviews(containerDiv);
}

function renderFourOnly(fourObj) {
  if (document.querySelector(".omni-container")) return;

  const containerDiv = createElement("div", ["container", "omni-container"]);

  const fourDiv = createElement("div");
  const ratingContainerDivF = createElement("div", ["ratingContainer"]);
  const ratingDivF = createElement("div");
  const reviewDivF = createElement("div", ["review"]);
  const externalDivF = createElement("div", ["linky"]);
  const linkAnchorF = createElement("a");

  const roundedFour = Math.ceil((fourObj?.rating ?? 0)) / 2;

  containerDiv.appendChild(fourDiv);
  containerDiv.appendChild(ratingContainerDivF);
  containerDiv.appendChild(externalDivF);
  ratingContainerDivF.appendChild(ratingDivF);
  ratingContainerDivF.appendChild(reviewDivF);
  externalDivF.appendChild(linkAnchorF);

  const fourImg = createElement("img", ["fourImageSolo"]);
  fourImg.src = chrome.runtime.getURL("./fourlogo.jpeg");

  const externalImgF = createElement("img", ["externalImage"]);
  externalImgF.src = chrome.runtime.getURL("./external.png");

  const ratingImgFour = createElement("img", ["ratingImage"]);
  ratingImgFour.src = getRatingImagePath(roundedFour);

  reviewDivF.textContent = `(${fourObj?.stats?.total_ratings ?? 0} reviews)`;
  linkAnchorF.href = `https://foursquare.com/v/${fourObj?.name ?? "venue"}/${fourObj?.fsq_id ?? ""}`;

  ratingDivF.appendChild(ratingImgFour);
  fourDiv.appendChild(fourImg);
  linkAnchorF.appendChild(externalImgF);

  mountContainerAtReviews(containerDiv);
}

function renderBoth(yelpObj, fourObj) {
  if (document.querySelector(".omni-container")) return;

  const containerDiv = createElement("div", ["container", "omni-container"]);

  // Yelp
  const yelpDiv = createElement("div");
  const ratingContainerDiv = createElement("div", ["ratingContainer"]);
  const ratingDiv = createElement("div");
  const reviewDiv = createElement("div", ["review"]);
  const externalDiv = createElement("div", ["linky"]);
  const linkAnchor = createElement("a");
  const roundedYelp = Math.ceil(((yelpObj?.rating ?? 0) * 2)) / 2;

  // Foursquare
  const fourDiv = createElement("div");
  const ratingContainerDivF = createElement("div", ["ratingContainer"]);
  const ratingDivF = createElement("div");
  const reviewDivF = createElement("div", ["review"]);
  const externalDivF = createElement("div", ["linky"]);
  const linkAnchorF = createElement("a");
  const roundedFour = Math.ceil((fourObj?.rating ?? 0)) / 2;

  // Four first (mirror original)
  containerDiv.appendChild(fourDiv);
  containerDiv.appendChild(ratingContainerDivF);
  containerDiv.appendChild(externalDivF);
  ratingContainerDivF.appendChild(ratingDivF);
  ratingContainerDivF.appendChild(reviewDivF);
  externalDivF.appendChild(linkAnchorF);

  // Yelp
  containerDiv.appendChild(yelpDiv);
  containerDiv.appendChild(ratingContainerDiv);
  containerDiv.appendChild(externalDiv);
  ratingContainerDiv.appendChild(ratingDiv);
  ratingContainerDiv.appendChild(reviewDiv);
  externalDiv.appendChild(linkAnchor);

  // Yelp images
  const ratingImgYelp = createElement("img", ["ratingImage"]);
  ratingImgYelp.src = getRatingImagePath(roundedYelp);
  const yelpImg = createElement("img", ["yelpImage"]);
  yelpImg.src = chrome.runtime.getURL("./yelp-logo.png");
  const externalImg = createElement("img", ["externalImage"]);
  externalImg.src = chrome.runtime.getURL("./external.png");

  // Four images
  const ratingImgFour = createElement("img", ["ratingImage"]);
  ratingImgFour.src = getRatingImagePath(roundedFour);
  const fourImg = createElement("img", ["fourImage"]);
  fourImg.src = chrome.runtime.getURL("./fourlogo.jpeg");
  const externalImgF = createElement("img", ["externalImage"]);
  externalImgF.src = chrome.runtime.getURL("./external.png");

  // Text/links
  reviewDiv.textContent = `(${yelpObj?.review_count ?? 0} reviews)`;
  linkAnchor.href = `${yelpObj?.url ?? "#"}`;

  reviewDivF.textContent = `(${fourObj?.stats?.total_ratings ?? 0} reviews)`;
  linkAnchorF.href = `https://foursquare.com/v/${fourObj?.name ?? "venue"}/${fourObj?.fsq_id ?? ""}`;

  // Final structure
  ratingDiv.appendChild(ratingImgYelp);
  yelpDiv.appendChild(yelpImg);
  linkAnchor.appendChild(externalImg);

  ratingDivF.appendChild(ratingImgFour);
  fourDiv.appendChild(fourImg);
  linkAnchorF.appendChild(externalImgF);

  mountContainerAtReviews(containerDiv);
}

// ===== Unified extraction =====
function attemptExtractBusinessInfo() {
  // 1) DoorDash Next Flight
  const ddInfo = extractFromNextFlightScripts();
  if (ddInfo) return ddInfo;

  // 2) JSON-LD
  const jsonLdItems = parseAllJsonLd();
  const jsonLdPick = pickBusinessItem(jsonLdItems);
  if (jsonLdPick) return normalizeBusinessFromJsonLd(jsonLdPick);

  // 3) OG meta
  const ogInfo = extractFromOgMeta();
  if (ogInfo) return ogInfo;

  // 4) Last-ditch: H1 only
  const h1Node = document.querySelector("h1");
  if (h1Node) return { store: h1Node.textContent?.trim() || "", location: "", geo: undefined };
  return null;
}

function waitForBusinessInfo(timeoutMs = 12000) {
  return new Promise(resolve => {
    const readyInfo = attemptExtractBusinessInfo();
    if (readyInfo) { resolve(readyInfo); return; }

    const observer = new MutationObserver(() => {
      const infoNow = attemptExtractBusinessInfo();
      if (infoNow) {
        observer.disconnect();
        clearTimeout(timerId);
        resolve(infoNow);
      }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timerId = setTimeout(() => { observer.disconnect(); resolve(null); }, timeoutMs);
  });
}

// ===== Main logic =====
async function myFunc() {
  const businessInfo = await waitForBusinessInfo(12000);

  if (!businessInfo) {
    console.warn("No business details found after waiting. Showing error.");
    renderErrorBlock();
    return;
  }

  const headingNode = document.querySelector("h1");
  const storeName = businessInfo.store || headingNode?.textContent?.trim() || "";
  const ratingText = getOnPageRatingText();

  const searchParams = {
    location: businessInfo.location || "",
    store: storeName,
    geo: businessInfo.geo,
    ddStoreId: businessInfo.ddStoreId || null,
    ddBusinessId: businessInfo.ddBusinessId || null,
    ogUrl: businessInfo.ogUrl || null,
    pageRatingText: ratingText || null
  };

  console.log(searchParams, "searchParams");

  chrome.runtime.sendMessage(searchParams, (bgResponse) => {
    try {
      const yelpResults = bgResponse?.yelpResult;
      const fourResults = bgResponse?.fourResult;

      const yelpObj = yelpResults?.businesses?.[0];
      const fourObj = fourResults?.results?.[0];

      if (!yelpObj && !fourObj) {
        renderErrorBlock();
        return;
      }

      if (yelpObj && fourObj && yelpObj?.rating && fourObj?.rating) {
        renderBoth(yelpObj, fourObj);
      } else if (!fourObj || !fourObj?.rating) {
        renderYelpOnly(yelpObj);
      } else if (!yelpObj) {
        renderFourOnly(fourObj);
      }
    } catch (err) {
      console.error("Error rendering results:", err);
      renderErrorBlock();
    }
  });
}

// Kick off
myFunc();
