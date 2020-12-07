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
            console.log(response);
            if (response.results.length) {
                var lon = response.results[0].geometry.lng;
                var lat = response.results[0].geometry.lat;
                GetMeteo(lat,lon);

                var ville = response.results[0].components.city;
                var pays = response.results[0].components.country;
                var region = response.results[0].components.county || response.results[0].components.state ;
                var newVal = `${ville}, ${region}, ${pays}`;
                $('#iptVille').val(newVal);
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
            console.log(response);
            if (response.results.length) {
                GetMeteo(lat,lon);

                var ville = response.results[0].components.city || response.results[0].components.town;
                var pays = response.results[0].components.country;
                var region = response.results[0].components.county || response.results[0].components.state ;
                var newVal = `${ville}, ${region}, ${pays}`;
                $('#iptVille').val(newVal);
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
        // geolocalisation supportée
        console.log("Geolocalisation supportée")

        navigator.geolocation.getCurrentPosition(function(position) {
            GetVille(position.coords.latitude, position.coords.longitude)
        });
    } else {
        // geolocalisation non supportée
        console.log("Geolocalisation non supportée")
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
                    temperature : parseFloat(response.daily[i].temp.night).toFixed(1),
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
        cardsContainer.append(newCard);
    }
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

