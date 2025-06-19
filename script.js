let weatherObject;
async function fetchWeatherData() {
  try {
    weatherObject = JSON.parse(localStorage.getItem("weatherObject"));
  } catch (error) {
    console.error("Error parsing appData:", error);
    weatherObject = null;
  }
  //let weatherObject = JSON.parse(localStorage.getItem("weatherObject"));
  if (!weatherObject) {
    // First-time setup
    weatherObject = {
      apiCalls: 0,
      lastWatered: null,
      date: null,
    };
    localStorage.setItem("weatherObject", JSON.stringify(weatherObject));
    console.log("Object has been created successfully");
  }
  setDate();
  console.log("WeatherObject", weatherObject);

  const lat = 45.523064; // Updated Portland latitude
  const lon = -122.676483; // Updated Portland longitude

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // Example client-side tracking
  const formatDate = (d) => d.toISOString().split("T")[0];
  const start = formatDate(
    new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000)
  );
  const end = formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,precipitation_sum&temperature_unit=fahrenheit&timezone=auto&start_date=${start}&end_date=${end}`;

  if (weatherObject.apiCalls < 600) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log("data: ", data);
      const dates = data.daily.time;
      const temps = data.daily.temperature_2m_max;
      const maxTemp = data.daily.temperature_2m_max[0].toFixed(1);
      const precips = data.daily.precipitation_sum;

      const idxToday = dates.indexOf(formatDate(today));
      const idxYesterday = dates.indexOf(formatDate(yesterday));
      const idxTomorrow = dates.indexOf(formatDate(tomorrow));

      document.getElementById("temp-today").textContent =
        temps[idxToday].toFixed(1);
      document.getElementById("temp-yesterday").textContent =
        temps[idxYesterday].toFixed(1);
      document.getElementById("temp-tomorrow").textContent =
        temps[idxTomorrow].toFixed(1);

      // Days since last rain
      let daysSinceRain = 0;
      for (let i = idxYesterday; i >= 0; i--) {
        if (precips[i] > 0) break;
        daysSinceRain++;
      }
      document.getElementById("days-since-rain").textContent = daysSinceRain;

      // Days until next rain
      let nextRain = "None in next 7 days";
      for (let i = idxToday + 1; i < precips.length; i++) {
        if (precips[i] > 0) {
          const nextDate = new Date(dates[i + 1]);
          nextRain = nextDate.toDateString();
          break;
        }
      }
      weatherObject.apiCalls += 1;
      weatherObject.date = weatherObject.date;
      weatherObject.lastWatered = weatherObject.lastWatered;
      localStorage.setItem("weatherObject", JSON.stringify(weatherObject));
      console.log(`API has been called ${weatherObject.apiCalls} times today`);

      document.getElementById("next-rain").textContent = nextRain;
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
    console.log("api data: ", data);
  }
  if (wateredToday()) {
    console.log("Already watered today!");
  } else {
    console.log("You haven't watered the plants today.");
  }
}

function updateWateredTimestamp() {
  const now = new Date();
  weatherObject = JSON.parse(localStorage.getItem("weatherObject"));
  weatherObject.lastWatered = now.toISOString();
  weatherObject.date = weatherObject.date;
  weatherObject.apiCalls = weatherObject.apiCalls;
  localStorage.setItem("weatherObject", JSON.stringify(weatherObject));
  document.getElementById(
    "last-watered"
  ).textContent = `Last watered: ${now.toLocaleString()}`;
}

function displayStoredWateredTime() {
  const last = weatherObject.lastWatered;
  //const last = localStorage.getItem("lastWatered");
  if (last) {
    const lastDate = new Date(last);

    if (wateredToday()) {
      document.getElementById("last-watered").textContent = "Watered today";
      document.getElementById("water-button").disabled = true;
    } else if (wateredYesterday()) {
      document.getElementById("last-watered").textContent = "Watered Yesterday";
      document.getElementById("water-button").disabled = false;
    } else {
      const now = new Date();
      const diffMs = now - lastDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      document.getElementById(
        "last-watered"
      ).textContent = `Last watered: ${diffDays} day(s) and ${diffHours} hour(s) ago`;
    }
  }
}

function wateredToday() {
  weatherObject = JSON.parse(localStorage.getItem("weatherObject"));

  const last = weatherObject.lastWatered;
  //const last = localStorage.getItem("lastWatered");
  if (!last) return false;

  const lastDate = new Date(last);
  const today = new Date();

  return (
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate()
  );
}

function wateredYesterday() {
  weatherObject = JSON.parse(localStorage.getItem("weatherObject"));

  const last = weatherObject.lastWatered;

  //const last = localStorage.getItem("lastWatered");
  if (!last) return false;

  const lastDate = new Date(last);
  const today = new Date();
  return (
    lastDate.getFullYear() === today.getFullYear() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getDate() === today.getDate() - 1
  );
}

function setDate() {
  const today = new Date().toISOString().substring(0, 10).trim();

  weatherObject = JSON.parse(localStorage.getItem("weatherObject"));
  /*weatherObject.date = -1;
        weatherObject.lastWatered = last;
        localStorage.setItem("weatherObject", JSON.stringify(weatherObject));*/
  const date = weatherObject.date.trim();

  if (date !== today) {
    weatherObject.date = today;
    weatherObject.apiCalls = 1;
    weatherObject.lastWatered = weatherObject.lastWatered;
    localStorage.setItem("weatherObject", JSON.stringify(weatherObject));
    console.log("Date set successfully");
  }
}

document
  .getElementById("water-button")
  .addEventListener("click", updateWateredTimestamp);

fetchWeatherData();
displayStoredWateredTime();
