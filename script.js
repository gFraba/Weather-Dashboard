const apiKey = "b22ed152b1c732b77f36539ad4d1f2e3";
const searchBar = $("#search-bar");
const searchButton = $("#search-btn");
const searchHistory = $("#search-history");
let currentWeatherUrl;
let forecastUrl;
let storedSearches = [];

//Restoring past searches
let initStoredSearches = localStorage.getItem("storedSearches");
if (initStoredSearches != null)
    storedSearches = initStoredSearches.split(",");

//Creates current date variable
let today = new Date();
let currentDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;


function getCurrentWeather() {

    $.ajax({
        url: currentWeatherUrl,
        method: "GET"
    }).then(function (response) {

        //Current weather data
        let currentWeather = {
            location: response.name,
            date: currentDate,
            weatherIcon: response.weather[0].icon,
            temperature: Math.round(response.main.temp),
            humidity: response.main.humidity,
            wind: response.wind.speed,
            uvIndex: 0,
            uvIntensity: ""
        };

        //Format the date for the object 
        currentWeather.date = formatDates(currentWeather.date);

        //Requesting UV
        let latitude = response.coord.lat;
        let longitude = response.coord.lon;
        let uvUrl = "https://api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&appid=" + apiKey;

        $.ajax({
            url: uvUrl,
            method: "GET"
        }).then(function (response2) {

            currentWeather.uvIndex = response2.value;

            //Assinging UV index scale for current weather
            if (currentWeather.uvIndex >= 7)
                currentWeather.uvIntensity = "high";
            else if (currentWeather.uvIndex < 3)
                currentWeather.uvIntensity = "low";
            else
                currentWeather.uvIntensity = "medium";

            //Appending current weather
            let currentWeatherCard = $(`<div class="card" id="card"><div class="card-body"><h5 class="card-title">${currentWeather.location} (${currentWeather.date}) 
            <span class="badge badge-primary"><img id="weather-icon" src="http://openweathermap.org/img/wn/${currentWeather.weatherIcon}@2x.png"></span></h5>
            <p class="card-text">Temperature: ${currentWeather.temperature} °F</p>
            <p class="card-text">Humidity: ${currentWeather.humidity}%</p>
            <p class="card-text">Wind Speed: ${currentWeather.wind} MPH</p>
            <p class="card-text">UV Index: <span class="badge badge-secondary ${currentWeather.uvIntensity}">${currentWeather.uvIndex}</span></p></div></div>`)
            $("#weather-col").append(currentWeatherCard);
        });

        appendStoredSearches();

    });
}

function appendForecast() {

    let fiveDayForecast = [];

    //Five day forecast API call
    $.ajax({
        url: forecastUrl,
        method: "GET"
    }).then(function (response) {

        console.log(response);

        let temporaryForecastObj;

        //Gets the weather data for around 24 hours after the API call, and 24 hours after that for the five day forecast, then populates forecast array
        for (let i = 4; i < response.list.length; i += 8) {
            temporaryForecastObj = {
                date: response.list[i].dt_txt.split(" ")[0],
                weatherIcon: response.list[i].weather[0].icon,
                temperature: Math.round(response.list[i].main.temp),
                humidity: response.list[i].main.humidity
            };
            fiveDayForecast.push(temporaryForecastObj);
        }

        //Appending 5 day forecast
        let forecastHeader = $('<h5>5-Day Forecast:</h5>');
        $("#forecast-header").append(forecastHeader);

        for (let i = 0; i < fiveDayForecast.length; i++) {
            let forecastCard = $(`<div class="col-md-2"><span class="badge badge-primary"><h6>${fiveDayForecast[i].date}</h6>
            <img class="w-100" src="http://openweathermap.org/img/wn/${fiveDayForecast[i].weatherIcon}@2x.png">
            <p>Temp: ${fiveDayForecast[i].temperature}°F</p><p>Humidity: ${fiveDayForecast[i].humidity}%</p><span></div>`);
            $("#forecast-row").append(forecastCard);
        }


    });
}

function appendStoredSearches() {

    $("#search-history").empty();

    //Moving currently displayed weather to front of the array
    if ($("#search-bar").val() != "") {
        if (storedSearches.indexOf($("#search-bar").val()) != -1) {
            storedSearches.splice(storedSearches.indexOf($("#search-bar").val()), 1)
        }
        storedSearches.unshift($("#search-bar").val());
    }

    //Saving searches to local
    localStorage.setItem("storedSearches", storedSearches);

    //Displaying past searches from local
    for (let i = 0; i < storedSearches.length; i++) {
        let newListItem = $(`<li class="list-group-item">${storedSearches[i]}</li>`);
        $("#search-history").append(newListItem);
        
    }

    //Populates previous searches upon click
    $("li").on("click", function () {
        $("#search-bar").val($(event.target).text());
        searchButton.click();
    });
}

//Reformating year display
function formatDates(data) {
    let dateArray = data.split("-");
    let formattedDate = `${dateArray[1]}/${dateArray[2]}/${dateArray[0]}`;
    return formattedDate
}

searchButton.on("click", function () {

    currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${searchBar.val()}&units=imperial&appid=${apiKey}`;
    forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${searchBar.val()}&units=imperial&appid=${apiKey}`;

    $("#weather-col").empty();
    $("#forecast-header").empty();
    $("#forecast-row").empty();

    getCurrentWeather();
    appendForecast();
});

//Adds ability to hit enter to submit search
$("#search-bar").keypress(function () {
    if (event.keyCode == 13)
        searchButton.click();
});

appendStoredSearches();