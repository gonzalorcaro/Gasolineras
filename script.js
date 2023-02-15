
let idMunicipio;
let divGasolineras = document.getElementById("gasolineras");

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
  let idGasoil = 4;
  let datosGasolineras = await gasolineasPorProductoYMunicipio(idMunicipio, idGasoil);

  let datosGasolinerasOrdenados = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud);
console.log(datosGasolineras);

  datosGasolinerasOrdenados.forEach((gasolinera) => {
    mostrarGasolinera(gasolinera, "Gasóleo A");
  });
  
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
//Funcion para el buscador : muestra las gasolineras del municipio buscado
async function buscarGasolinera(){

  let url = 'municipios.json';
  let municipioElegido = document.getElementById("buscador");
  let response;

  //Para que se admita el nombre del municipio en minúsculas
  response = await fetch(`${url}${municipioElegido.value.toLowerCase()}`)

  let datosMunicipios = await response.json();

  let municipio = datosMunicipios.filter(
    (municipio) => municipio.Municipio === municipioElegido.value

  );

  if(municipio != municipioElegido.value){

        noHayResultados(); 
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

// funcion para obtener las gasolineras de un municipio.
async function gasolineasPorMunicipio(idMunicipio) {
  let response;
  let API_URL = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipio/${idMunicipio}`;
  response = await fetch(API_URL);

  let datosGasolineras = await response.json();

  return datosGasolineras;
}

// funcion para obtener las gasolineras de ese idProducto e idMunicipio.
async function gasolineasPorProductoYMunicipio(idMunicipio, idProducto) {
  let response;
  let API_URL = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestres/FiltroMunicipioProducto/${idMunicipio}/${idProducto}`;
  response = await fetch(API_URL);

  let datosGasolineras = await response.json();
  return datosGasolineras;
}

function ordenarPorDistancia(gasolineras, latRef, lonRef) {
  // Agregar distancia a cada coordenada
  const gasolinerasConDistancia = gasolineras.map((gasolinera) => {
    let lat = parseFloat(gasolinera.Latitud.replace(",", "."));
    let lon = parseFloat(gasolinera["Longitud (WGS84)"].replace(",", "."));
    const distancia = calcularDistancia(lat, lon, latRef, lonRef);
    return { gasolinera, distancia };
  });
  
  // Ordenar coordenadas por distancia ascendente
  gasolinerasConDistancia.sort((a, b) => a.distancia - b.distancia);

  return gasolinerasConDistancia;
}

// funcion que toma las coordenadas de dos puntos (latitud y longitud) y devuelve la distancia en kilómetros entre ellos
function calcularDistancia(lat1, lon1, lat2, lon2) {
  
  const radioTierra = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = radioTierra * c; // Distancia en kilómetros
  return distancia;
}

// La función toRad se utiliza para convertir grados a radianes
function toRad(grados) {
  return grados * Math.PI / 180;
}


// pintar una gasolinera
function mostrarGasolinera(gasolinera, nombreCarburante) {
  
  let divGasolinera = document.createElement("div");
  divGasolinera.classList.add("gasolinera");

  let divFoto = document.createElement("div");
  divFoto.classList.add("divFoto");
  divGasolinera.appendChild(divFoto);

  let nombreLogo = obtenerLogoGas(gasolinera.gasolinera.Rótulo);

  let logo = document.createElement("img");
  logo.classList.add("logo");
  logo.src = `img/logos/${nombreLogo}.png`;

  divFoto.appendChild(logo);

  let divContenidoGas = document.createElement("div");
  divContenidoGas.classList.add("divContenidoGas");
  
  let pDireccion = document.createElement("p");
  pDireccion.innerHTML = "<b>"+gasolinera.gasolinera.Dirección+"</b>";
  divContenidoGas.appendChild(pDireccion);

  let pPrecioProducto = document.createElement("p");
  pPrecioProducto.classList.add("pPrecioProducto");
  pPrecioProducto.innerHTML = nombreCarburante + ": " + gasolinera.gasolinera.PrecioProducto + "€";
  divContenidoGas.appendChild(pPrecioProducto);

  let distancia = document.createElement("p");
  distancia.id = "distanciaGas";
  distancia.innerHTML = gasolinera.distancia.toFixed(2) +" km";
  divContenidoGas.appendChild(distancia);

  divGasolinera.appendChild(divContenidoGas);
  divGasolineras.appendChild(divGasolinera);
}

// funcion para
function obtenerLogoGas(nombre) {
  let nombreEnMinusculas = nombre.toLowerCase();
  let nombreFoto;
  switch(nombreEnMinusculas) {
    case "cepsa":
      nombreFoto = "cepsa";
    break;
    case "repsol":
      nombreFoto = "repsol";
    break;
    case "shell":
      nombreFoto = "shell";
    break;
    default:
      nombreFoto = "defaultFoto";
    break;
  }

  return nombreFoto;
}

// función para cuando un filtro no obtenga resultados.
function noHayResultados() {
  console.log("No hay resultados");
}



//'apikey': 'ucstkoCXcmlx8N1_6KdtT2akr6IoR7ja57jFoU0Fgro'
//Mapa
// Crea una instancia del servicio de plataforma HERE Maps:
var platform = new H.service.Platform({
  'apikey': 'ucstkoCXcmlx8N1_6KdtT2akr6IoR7ja57jFoU0Fgro'
});

// Obtiene los tipos de mapa predeterminados de la plataforma:
var defaultLayers = platform.createDefaultLayers();

// Crea una instancia del mapa:
var map = new H.Map(
  document.getElementById('map'),
  defaultLayers.vector.normal.map,
  {
    zoom: 10,
    center: { lat: 38.9161100, lng: -6.3436600 }
  });

// Crea la interfaz de usuario predeterminada:
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Crea una instancia del servicio de búsqueda:
var searchService = platform.getSearchService();

// Crea una marca en el mapa en las coordenadas específicas
var marker = new H.map.Marker({
  lat: 38.9161100,
  lng: -6.3436600
});

// Agrega la marca al mapa
map.addObject(marker);









// Cuando el usuario se desplaza hacia abajo 80 px desde la parte superior del documento, cambie el tamaño del relleno de la barra de navegación y el tamaño de fuente del logotipo
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
    document.getElementById("navbar").style.padding = "30px 10px";
    document.getElementById("logo").style.fontSize = "25px";
  } else {
    document.getElementById("navbar").style.padding = "10px 5px";
    document.getElementById("logo").style.fontSize = "45px";
  }
}
