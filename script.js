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