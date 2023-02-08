function obtenerLocalizacionActual() {
  let latitude;
  let longitude;

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      let ciudad = getCityName(latitude, longitude);

      console.log(ciudad);
    });
  } else {
    console.error("La geolocalizacion no está disponible en su navegador");
  }

  function getCityName(lat, lng) {
    const API_URL = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        console.log(data.address.town || data.address.city);
      });
  }
}

obtenerLocalizacionActual();

// Cuando el usuario se desplaza hacia abajo 80 px desde la parte superior del documento, cambie el tamaño del relleno de la barra de navegación y el tamaño de fuente del logotipo
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
  if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
    document.getElementById("navbar").style.padding = "30px 10px";
    document.getElementById("logo").style.fontSize = "25px";
  } else {
    document.getElementById("navbar").style.padding = "80px 10px";
    document.getElementById("logo").style.fontSize = "35px";
  }
}

var map;
var infowindow;
var service = new google.maps.places.PlacesService(map);


function initMap() {
  // Creamos un mapa con las coordenadas actuales
  navigator.geolocation.getCurrentPosition(function (pos) {

    lat = pos.coords.latitude;
    lon = pos.coords.longitude;

    var myLatlng = new google.maps.LatLng(lat, lon);

    var mapOptions = {
      center: myLatlng,
      zoom: 14,
      mapTypeId: google.maps.MapTypeId.SATELLITE
    };

    map = new google.maps.Map(document.getElementById("mapa"), mapOptions);

    // Creamos el infowindow
    infowindow = new google.maps.InfoWindow();

    // Especificamos la localización, el radio y el tipo de lugares que queremos obtener
    var request = {
      location: myLatlng,
      radius: 5000,
      types: ['cafe']
    };

    // Creamos el servicio PlaceService y enviamos la petición.
    var service = new google.maps.places.PlacesService(map);

    service.nearbySearch(request, function (results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
          crearMarcador(results[i]);
        }
      }
    });
  });
}

function crearMarcador(place) {
  // Creamos un marcador
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  // Asignamos el evento click del marcador
  google.maps.event.addListener(marker, 'click', function () {
    infowindow.setContent(place.name);
    infowindow.open(map, this);
  });
}
