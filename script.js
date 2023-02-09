let idMunicipio;

gasolinerasInicio();

// funcion que se ejecuta al iniciar la aplicación
async function gasolinerasInicio() {
  let ip = await obtenerIP();
  let coordenadas = await coordenadasDesdeIP(ip);
  let ciudad = await ciudadConCoordenadas(
    coordenadas.latitud,
    coordenadas.longitud
  );
  let idMunicipio = await obtenerIdMunicipio(ciudad);
  gasolinerasDeCiudad(idMunicipio);
}

// funcion que obtiene la ip publica del cliente
async function obtenerIP() {
  let response = await fetch("https://api.ipify.org?format=json");
  let datos = await response.json();
  return datos.ip;
}

// obtener coordenadas desde ip
async function coordenadasDesdeIP(ip) {
  let response = await fetch(`https://ipapi.co/${ip}/json/`);
  let datos = await response.json();

  return {
    latitud: datos.latitude,
    longitud: datos.longitude,
  };
}

// funcion para obtener el nombre de la ciudad más cercana a través de las coordenadas
async function ciudadConCoordenadas(lat, lng) {
  let response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
  );
  let data = await response.json();

  return (data.address.town || data.address.city);

}

// obtener el id del municipio a partir del nombre
async function obtenerIdMunicipio(nombreMunicipio) {
  let response;
  let API_URL = `municipios.json`;
  response = await fetch(API_URL);

  let datosMunicipios = await response.json();

  let municipio = datosMunicipios.filter(
    (municipio) => municipio.Municipio === nombreMunicipio
  );

  if (municipio != null) {
    idMunicipio = municipio[0].IDMunicipio;
    return idMunicipio;
  }
}

// obtener gasolineras por ciudad
async function gasolinerasDeCiudad(idMunicipio) {
  let response = await fetch(
    `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipio/${idMunicipio}`
  );

  let datos = await response.json();

  if (datos.ListaEESSPrecio.length != 0) {
    datos.ListaEESSPrecio.forEach((gasolinera) => {
      mostrarGasolinera(gasolinera);
    });
  } else {
    noResultsFilters();
  }
}

// funcion que devuelve el nombre de la ciudad donde se encuentra el usuario
function obtenerLocalizacionActual() {
  let latitude;
  let longitude;

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;

      let ciudad = getCityName(latitude, longitude);
    });
  } else {
    console.error("La geolocalizacion no está disponible en su navegador");
  }
}

// funcion para obtener las gasolineras de ese idProducto e idMunicipio.
async function gasolineasPorProductoYMunicipio(idProducto, idMunicipio) {
  let response;
  let API_URL = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipioProducto/${idProducto}/${idMunicipio}`;
  response = await fetch(API_URL);

  let datosGasolineras = await response.json();

  if (datosGasolineras.length != 0) {
    datosGasolineras.forEach((gasolinera) => {
      mostrarGasolinera(gasolinera);
    });
  } else {
    noHayResultados();
  }
}
// pintar una gasolinera
function mostrarGasolinera(gasolinera) {
  console.log(gasolinera);
}

// función para cuando un filtro no obtenga resultados.
function noHayResultados() {
  console.log("No hay resultados");
}



// Cuando el usuario se desplaza hacia abajo 80 px desde la parte superior del documento, cambie el tamaño del relleno de la barra de navegación y el tamaño de fuente del logotipo
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
    document.getElementById("navbar").style.padding = "30px 10px";
    document.getElementById("logo").style.fontSize = "25px";
  } else {
    document.getElementById("navbar").style.padding = "80px 10px";
    document.getElementById("logo").style.fontSize = "35px";
  }
}
