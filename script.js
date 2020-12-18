$(document).ready(function() {
    // Event click button
    $('#btnValider').click(function (){
        var ville = $("#iptVille").val();
        GetCoordonnees(ville);
    });

    // Event press enter
    $('#iptVille').on('keypress',function(e) {
        if(e.which == 13) {
            var ville = $("#iptVille").val();
            GetCoordonnees(ville);
        }
    });

    // Event click button localisation
    $('#btnLocalisation').click(function (){
        GetLocalisation();
    });

    // Initialise Autocomplete
    var element = document.getElementById("iptVille");
    var autocomplete = new google.maps.places.Autocomplete(element, { types: ['geocode'] });
});

// Appel de l'API OpenCageData pour récupérer les coordonnées depuis le nom d'une ville
function GetCoordonnees(ville) {
    url = "https://api.opencagedata.com/geocode/v1/json?";
    url += "q="+ ville;
    url += "&key=7e92aabac4bb49ee80b4996073df7f0e";
    url += "&limit=1"
    $.ajax({
        url: url,
        type: "GET",
        success: function (response) {
            if (response.results.length) {
                var lon = response.results[0].geometry.lng;
                var lat = response.results[0].geometry.lat;
                GetMeteo(lat,lon);
                fillInput(response.results[0].components);
            }
        },
        error : function (response){
            alert("Une erreur est survenue..");
            console.log(response.error);
        }
    });
}

// Appel de l'API OpenCageData pour récupérer le nom d'une ville depuis les coordonnées
function GetVille(lat, lon) {
    url = "https://api.opencagedata.com/geocode/v1/json?";
    url += "q="+ lat + "%2C%20" + lon;
    url += "&key=7e92aabac4bb49ee80b4996073df7f0e";
    url += "&limit=1"
    $.ajax({
        url: url,
        type: "GET",
        success: function (response) {
            if (response.results.length) {
                GetMeteo(lat,lon);
                fillInput(response.results[0].components);
            }
        },
        error : function (response){
            alert("Une erreur est survenue..");
            console.log(response.error);
        }
    });
}

// Appel de l'API Geolocation pour récupérer la localisation de l'utilisateur
function GetLocalisation() {
    if ( navigator.geolocation ) {
        navigator.geolocation.getCurrentPosition(function(position) {
            GetVille(position.coords.latitude, position.coords.longitude)
        });
    } else {
        // geolocalisation non supportée
        alert("Geolocalisation non supportée par votre navigation")
    }
}

// Appel de l'API OpenWeater pour récupérer la météo de 7 prochains jours
function GetMeteo(lat, lon) {
    var url = "https://api.openweathermap.org/data/2.5/onecall?"
    url += "lat=" + lat;
    url += "&lon=" + lon;
    url += "&exclude=hourly,minutely,current&units=metric&appid=2c1a4159ad7198fa94a6142bd883a91e"
    $.ajax({
        url: url,
        type: "GET",
        success: function (response) {
            var meteo = [];
            for (i = 0; i < 7; i++){
                var jour = {
                    id : parseInt(response.daily[i].weather[0].id),
                    date : timeConverter(response.daily[i].dt),
                    temperature : Math.floor(parseFloat(response.daily[i].temp.night)),
                    sunRise : timeConverterHour(response.daily[i].sunrise),
                    sunSet : timeConverterHour(response.daily[i].sunset),
                    humidite : response.daily[i].humidity,
                    vitesseVent : response.daily[i].wind_speed,
                    ressenti : response.daily[i].feels_like.day
                };
                meteo.push(jour);
            }
            displayMeteo(meteo);
        },
        error : function (response){
            alert("Une erreur est survenue..");
            console.log(response.error);
        }
    })
}

// Affiche le résultat de la recherche
function displayMeteo(meteo) {
    var cardsContainer = $('#cards-container');
    var card = $('#card-template').first();
    cardsContainer.empty();
    for (var i = 0; i < 7; i++) {
        var jour = meteo[i];
        var newCard = card.clone();
        $(newCard).css("display", "block");
        $(newCard).find(".card-header").text(jour.date);
        $(newCard).find(".valeur-temperature").text(jour.temperature);
        $(newCard).find("i").removeClass();
        $(newCard).find("i").addClass(getIcon(jour.id));
        $(newCard).data("sunRise", jour.sunRise);
        $(newCard).data("dateJour", jour.date);
        $(newCard).data("coucher",jour.sunSet);
        $(newCard).data("humidite",jour.humidite);
        $(newCard).data("ressenti",jour.ressenti);
        cardsContainer.append(newCard);
    }
    initaliseModaleDetails();
}

// Récupère le nom de l'icone en fonction de l'id du type de météo
function getIcon(id) {
    if (id >= 200 && id <= 232) {
        return "fas fa-5x fa-bolt yellow";
    }
    else if ((id >= 300 && id <= 321) || (id >= 500 && id <= 531)) {
        return "fas fa-5x fa-cloud-showers-heavy grey";
    }
    else if (id >= 600 && id <= 622) {
        return "fas fa-5x fa-snowflake light-blue";
    }
    else if (id == 800) {
        return "fas fa-5x fa-sun yellow";
    }
    else if (id > 800) {
        return "fas fa-5x fa-cloud grey";
    }
}

// Permet de convertir un timestamp en date JS
function timeConverter(UNIX_timestamp){
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

    var month = months[a.getMonth()];
    var date = a.getDate();

    var time = date + ' ' + month + ' ';
    return time;
}

// Permet de convertir in timestamp en date heure JS
function timeConverterHour(UNIX_timestamp){
    var t = new Date(UNIX_timestamp*1000);

    var hour = t.getHours();
    var min = (t.getMinutes() < 10) ? "0"+t.getMinutes() : t.getMinutes();
    var dateTime = hour+':'+min ;
    return dateTime;
}

// Initialise l'ouverture de la modale des détails
function initaliseModaleDetails() {
    $('.card').click(function() {
        // On récupère les données stockées dans la card
        var sunRise = $(this).data("sunRise");
        var dateJ = $(this).data("dateJour");
        var coucher = $(this).data("coucher");
        var humidite = $(this).data("humidite");
        var ressenti = $(this).data("ressenti");

        // On met à jour les données de la modale
        $('#dateJ').text(dateJ);
        $('#lever').text(sunRise);
        $('#coucher').text(coucher);
        $('#humidite').text(humidite);
        $('#ressenti').text(ressenti);

        // Propritées de la modale 
        $("#modale").removeClass('hide').dialog({
            resizable: false,
            width: '340',
            height: '400',
            modal: true,
            open: function() {
                $('#custom-close').click(function (){
                    $('#modale').dialog('close');
                });
                $('#overlay').show();
            },
            close: function() {
                $('#overlay').hide();
            }
        });
    });
}

// Permet de remplir l'input avec les données complètes de la ville
function fillInput(details) {
    if (details != null) {
        var ville = details.city || details.town ||details.municipality;
        var pays = details.country;
        var region = details.county || details.state ;
        var newVal = `${ville}, ${region}, ${pays}`;
        $('#iptVille').val(newVal);
    }
}
