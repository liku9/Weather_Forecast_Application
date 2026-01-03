/* ================= DOM ================= */
const userTab = document.querySelector("[data-userWeather]");
const searchTab = document.querySelector("[data-searchWeather]");
const searchForm = document.querySelector("[data-searchForm]");
const searchInput = document.querySelector("[data-searchInput]");
const recentList = document.querySelector("[data-recentList]");

const grantContainer = document.querySelector(".grantLocationContainer");
const grantBtn = document.querySelector("[data-grantAccess]");
const loading = document.querySelector(".loadingContainer");
const errorBox = document.querySelector(".errorContainer");
const errorText = document.querySelector("[data-errorText]");
const userInfo = document.querySelector(".userInfoContainer");
const forecastSection = document.querySelector(".forecastContainer");
const forecastContainer = document.querySelector("[data-forecastContainer]");
const body = document.body;

/* ================= WEATHER FIELDS ================= */
const cityName = document.querySelector("[data-cityName]");
const weatherDesc = document.querySelector("[data-weatherDesc]");
const weatherIcon = document.querySelector("[data-weatherIcon]");
const tempEl = document.querySelector("[data-temp]");
const windEl = document.querySelector("[data-windspeed]");
const humidityEl = document.querySelector("[data-humidity]");
const cloudsEl = document.querySelector("[data-clouds]");
const tempCard = document.querySelector("[data-tempCard]");
const toggleBtn = document.querySelector("[data-toggleTemp]");

/* ================= STATE OF TEMPERATURE ================= */
let currentTemp = 0;
let isCelsius = true;

/* ================= TABS ================= */
function setActive(tab) {
  userTab.classList.remove("bg-white/90");
  searchTab.classList.remove("bg-white/90");
  tab.classList.add("bg-white/90");
}

userTab.onclick = () => {
  setActive(userTab);
  searchForm.classList.add("hidden");
  errorBox.classList.add("hidden");
  forecastSection.classList.add("hidden");
  userInfo.classList.add("hidden");
  checkPermission();
};

searchTab.onclick = () => {
  setActive(searchTab);
  searchForm.classList.remove("hidden");
  grantContainer.classList.add("hidden");
};

/* ================= SEARCH ================= */
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!searchInput.value) return;
  fetchByCity(searchInput.value);
  searchInput.value = "";
  recentList.classList.add("hidden");
});

/* ================= RECENT 5-CITIES================= */
searchInput.addEventListener("focus", showRecentCities);
searchInput.addEventListener("mouseenter", showRecentCities);

searchForm.addEventListener("mouseleave", () => {
  recentList.classList.add("hidden");
});

function showRecentCities() {
  const cities = JSON.parse(localStorage.getItem("cities")) || [];
  if (!cities.length) return;

  recentList.innerHTML = "";
  recentList.classList.remove("hidden");

  cities.forEach((city) => {
    const div = document.createElement("div");
    div.innerText = city;
    div.className =
      "px-3 py-2 cursor-pointer border-b last:border-none hover:bg-blue-100";

    div.onclick = () => {
      fetchByCity(city);
      recentList.classList.add("hidden");
    };

    recentList.appendChild(div);
  });
}

function saveRecentCity(city) {
  let cities = JSON.parse(localStorage.getItem("cities")) || [];
  cities = cities.filter((c) => c.toLowerCase() !== city.toLowerCase());
  cities.unshift(city);
  localStorage.setItem("cities", JSON.stringify(cities.slice(0, 5)));
}

/* ================= LOCATION ================= */
grantBtn.onclick = () => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      sessionStorage.setItem("locationGranted", "true");

      grantContainer.classList.add("hidden");
      fetchByCoords(latitude, longitude);
    },
    () => showError("Location permission denied")
  );
};

function checkPermission() {
  const granted = sessionStorage.getItem("locationGranted");

  errorBox.classList.add("hidden");
  userInfo.classList.add("hidden");
  forecastSection.classList.add("hidden");

  if (granted) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchByCoords(latitude, longitude);
      },
      () => {
        grantContainer.classList.remove("hidden");
      }
    );
  } else {
    grantContainer.classList.remove("hidden");
  }
}

/* ================= API ================= */
const API_KEY = "168771779c71f3d64106d8a88376808a";
async function fetchWeather(url) {
  loading.classList.remove("hidden");

  const res = await fetch(url);
  if (!res.ok) {
    loading.classList.add("hidden");
    throw new Error("API Error");
  }

  const data = await res.json();
  loading.classList.add("hidden");
  return data;
}

async function fetchByCity(city) {
  try {
    const data = await fetchWeather(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    updateUI(data);
    saveRecentCity(city);
    fetchForecast(city);
  } catch {
    showError("City not found");
  }
}

async function fetchByCoords(lat, lon) {
  try {
    const data = await fetchWeather(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    updateUI(data);
    saveRecentCity(data.name);
    fetchForecast(data.name);
  } catch {
    showError("Location weather not found");
  }
}

/* ================= UI ================= */
function updateUI(data) {
  userInfo.classList.remove("hidden");
  errorBox.classList.add("hidden");

  cityName.innerText = data.name;
  weatherDesc.innerText = data.weather[0].description;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  currentTemp = data.main.temp;
  isCelsius = true;
  updateTemp();

  windEl.innerText = `${data.wind.speed} m/s`;
  humidityEl.innerText = `${data.main.humidity}%`;
  tempCard.innerText = `${data.main.temp} °C`;

  /* === IF TEMPERATURE IS ABOVE 40 DEGREES, DISPLAY AN ALEAT ====== */
  updateBackground(data.weather[0].main);
  if (data.main.temp >= 40) {
    showError("Extreme Heat Alert! Temperature above 40°C");
  }
}

/* ================= TEMPERATURE TOGGLE °C/°F ================= */
toggleBtn.onclick = () => {
  isCelsius = !isCelsius;
  updateTemp();
};

function updateTemp() {
  tempEl.innerText = isCelsius
    ? `${currentTemp} °C`
    : `${((currentTemp * 9) / 5 + 32).toFixed(1)} °F`;

  toggleBtn.innerText = isCelsius ? "°F" : "°C";
}

/* ================= FORECAST ================= */
async function fetchForecast(city) {
  try {
    const data = await fetchWeather(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );

    forecastContainer.innerHTML = "";
    forecastSection.classList.remove("hidden");

    const sixDays = getNextForecasts(data.list);

    sixDays.forEach((d) => {
      forecastContainer.innerHTML += `
        <div class="bg-white/90 p-3 rounded-xl text-black text-center shadow-md hover:scale-105 transition-transform duration-300">

          <p class="text-xs font-semibold mb-2">
            ${new Date(d.dt_txt).toDateString()}
          </p>

          <div class="flex justify-center items-center gap-1 text-sm font-bold">
            <img src="./images/temp.png" class="w-4" />
            ${d.main.temp} °C
          </div>

          <div class="flex justify-center items-center gap-1 text-xs mt-1">
            <img src="./images/wind.png" class="w-4" />
            ${d.wind.speed} m/s
          </div>

          <div class="flex justify-center items-center gap-1 text-xs mt-1">
            <img src="./images/humidity.png" class="w-4" />
            ${d.main.humidity} %
          </div>

        </div>`;
    });
  } catch {
    showError("Forecast data not available");
  }
}

function getNextForecasts(list) {
  const days = {};
  const today = new Date().toDateString();

  list.forEach((item) => {
    const date = new Date(item.dt_txt).toDateString();

    if (date === today) return;

    if (!days[date]) {
      days[date] = item;
    }
  });

  return Object.values(days).slice(0, 6);
}

/* ================= BACKGROUND CHANGES ON THE BASIS OF WEATHER LOCATION ================= */
function updateBackground(main) {
  const map = {
    Rain: "rainy.png",
    Clouds: "cloudy.jpg",
    Clear: "sunny.jpg",
    Snow: "snow.png",
  };
  body.style.backgroundImage = `url('./images/${map[main] || "sunny.jpg"}')`;
}

/* ================= ERROR ================= */
function showError(msg) {
  errorText.innerText = msg;
  errorBox.classList.remove("hidden");
}

setActive(userTab);
checkPermission();