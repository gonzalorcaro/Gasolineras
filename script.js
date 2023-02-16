//API KEY googlemaps: AIzaSyBWZJ5Yig-1yOrgN4XtEuIzGtuWhIr4Bgs

let idMunicipio;
let divGasolineras = document.getElementById("gasolineras");
let divMapa = document.getElementById("map");
let selectorCarburante = document.getElementById("tipoCarburante");
let buscador = document.getElementById("buscador");

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

  let datosGasolinerasOrdenados = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud, "ascendente");

  crearMapa(coordenadas.latitud, coordenadas.longitud);

  datosGasolinerasOrdenados.sort(function (a, b) {
    return Math.random() - 0.5;
  });

  datosGasolinerasOrdenados.forEach((gasolinera) => {
    mostrarGasolinera(gasolinera.gasolinera, gasolinera.distancia, selectorCarburante.options[selectorCarburante.selectedIndex].textContent);
    let lat = parseFloat(gasolinera.gasolinera.Latitud.replace(",", "."));
    let lon = parseFloat(gasolinera.gasolinera["Longitud (WGS84)"].replace(",", "."));
    addMarcadorMapa(lat, lon, coordenadas.latitud, coordenadas.longitud);
  });

}

// funcion que muestra las gasolineras con los filtros aplicados
async function aplicarFiltrosGasolineras() {
  let buscador = document.getElementById("buscador");
  let selectorCarburante = document.getElementById("tipoCarburante");
  let selectorDistancia = document.getElementById("distancia");
  let selectorPrecio = document.getElementById("precio");

  let idMunicipio;
  let coordenadas;

  if (buscador.value == "" || buscador.value == null) {
    let ip = await obtenerIP();
    coordenadas = await coordenadasDesdeIP(ip);
    let ciudad = await ciudadConCoordenadas(
      coordenadas.latitud,
      coordenadas.longitud
    );
    idMunicipio = await obtenerIdMunicipio(ciudad);
  } else {
    let ciudad = buscador.value;
    idMunicipio = await obtenerIdMunicipio(ciudad);
    if (idMunicipio !== undefined) {
      coordenadas = await obtenerCoordenadas(ciudad);
    }
  }

  if (idMunicipio != "" && idMunicipio != null) {
    let idCarburante = selectorCarburante.value;

    let datosGasolineras = await gasolineasPorProductoYMunicipio(idMunicipio, idCarburante);

    if (selectorDistancia.value != "relevancia" && selectorPrecio.value == "relevancia") {

      switch (selectorDistancia.value) {
        case "ascendente":
          datosGasolineras = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud, "ascendente");
          break;
        case "descendente":
          datosGasolineras = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud, "descendente");
          break;
      }

    } else if (selectorDistancia.value == "relevancia" && selectorPrecio.value != "relevancia") {

      datosGasolineras = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud, "ascendente");

      switch (selectorPrecio.value) {
        case "ascendente":
          datosGasolineras = ordenarPorPrecio(datosGasolineras, "ascendente");
          break;
        case "descendente":
          datosGasolineras = ordenarPorPrecio(datosGasolineras, "descendente");
          break;
      }
    } else if (selectorDistancia.value == "relevancia") {
      datosGasolineras = ordenarPorDistancia(datosGasolineras.ListaEESSPrecio, coordenadas.latitud, coordenadas.longitud, "ascendente");

      datosGasolineras.sort(function (a, b) {
        return Math.random() - 0.5;
      });
    }

    eliminarGasolinerasYMapa();

    if (datosGasolineras.length !== 0) {
      crearMapa(coordenadas.latitud, coordenadas.longitud);

      datosGasolineras.forEach((gasolinera) => {
        mostrarGasolinera(gasolinera.gasolinera, gasolinera.distancia, selectorCarburante.options[selectorCarburante.selectedIndex].textContent);
        let lat = parseFloat(gasolinera.gasolinera.Latitud.replace(",", "."));
        let lon = parseFloat(gasolinera.gasolinera["Longitud (WGS84)"].replace(",", "."));
        addMarcadorMapa(lat, lon, coordenadas.latitud, coordenadas.longitud);
      });

    } else {
      noHayResultados();
    }

  } else {
    noHayResultados();
  }

}

// funcion para llenar el selector de carburante con datos de la API.
async function llenarSelectorCarburante() {
  let response;
  let API_URL = `https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/Listados/ProductosPetroliferos/`;
  response = await fetch(API_URL);

  let datosCarburantes = await response.json();

  datosCarburantes.forEach((carburante) => {
    let option = document.createElement("option");
    option.text = carburante.NombreProducto;

    if (carburante.IDProducto == 4) {
      option.selected = true;
    }

    option.value = carburante.IDProducto;
    selectorCarburante.appendChild(option);
  });
}

// funcion que resuelve conflicto entre selector de precio y distancia
function conflictoSelectores(event) {
  let selectorDistancia = document.getElementById("distancia");
  let selectorPrecio = document.getElementById("precio");

  let idSelect = event.target.id;

  switch (idSelect) {
    case "distancia":
      selectorPrecio.value = "relevancia";
      break;
    case "precio":
      selectorDistancia.value = "relevancia";
      break;
  }
}

// funcion que devuelve el nombre de la ciudad donde se encuentra el usuario
async function obtenerLocalizacionActual() {
  if ("geolocation" in navigator) {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const ciudad = await ciudadConCoordenadas(position.coords.latitude, position.coords.longitude);
    console.log(ciudad);
    buscador.value = ciudad;

    aplicarFiltrosGasolineras();
  } else {
    console.error("La geolocalización no está disponible en su navegador");
  }
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

// obtener coordenadas desde nombre del municipio
async function obtenerCoordenadas(ciudad) {
  // Hacer una petición a la API de OpenStreetMap para buscar las coordenadas de la ciudad
  return fetch(`https://nominatim.openstreetmap.org/search?q=${ciudad}, Spain&format=json`)
    .then(response => response.json())
    .then(data => {
      // Obtener las coordenadas del primer resultado
      const lat = data[0].lat;
      const lon = data[0].lon;

      return {
        latitud: lat,
        longitud: lon
      };
    });
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

  if (municipio.length != 0) {
    idMunicipio = municipio[0].IDMunicipio;
    return idMunicipio;
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

// ordenar por precio del carburante, ascendente o descendente.
function ordenarPorPrecio(gasolineras, orden) {
  gasolineras.sort(function (a, b) {
    let precioA = parseFloat(a.gasolinera.PrecioProducto.replace(",", ""));
    let precioB = parseFloat(b.gasolinera.PrecioProducto.replace(",", ""));
    if (orden === "descendente") {
      return precioB - precioA;
    } else {
      return precioA - precioB;
    }
  });
  return gasolineras;
}

// ordenar por distancia con unas coordenadas de referencia de referencia
function ordenarPorDistancia(gasolineras, latRef, lonRef, orden) {
  // Agregar distancia a cada coordenada
  const gasolinerasConDistancia = gasolineras.map((gasolinera) => {
    let lat = parseFloat(gasolinera.Latitud.replace(",", "."));
    let lon = parseFloat(gasolinera["Longitud (WGS84)"].replace(",", "."));
    const distancia = calcularDistancia(lat, lon, latRef, lonRef);
    return { gasolinera, distancia };
  });

  // Ordenar coordenadas por distancia ascendente o descendente, dependiendo del parámetro "orden"
  gasolinerasConDistancia.sort((a, b) => (orden === "ascendente" ? a.distancia - b.distancia : b.distancia - a.distancia));

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
function mostrarGasolinera(gasolinera, distanciaF, nombreCarburante) {

  let divGasolinera = document.createElement("div");
  divGasolinera.classList.add("gasolinera");

  let divFoto = document.createElement("div");
  divFoto.classList.add("divFoto");
  divGasolinera.appendChild(divFoto);

  let nombreLogo = obtenerLogoGas(gasolinera.Rótulo);

  let logo = document.createElement("img");
  logo.classList.add("logo");
  logo.src = `img/logos/${nombreLogo}.png`;

  divFoto.appendChild(logo);

  let divContenidoGas = document.createElement("div");
  divContenidoGas.classList.add("divContenidoGas");

  let pDireccion = document.createElement("p");
  pDireccion.innerHTML = "<b>" + gasolinera.Dirección + "</b>";
  divContenidoGas.appendChild(pDireccion);

  let pPrecioProducto = document.createElement("p");
  pPrecioProducto.classList.add("pPrecioProducto");
  pPrecioProducto.innerHTML = nombreCarburante + ": " + gasolinera.PrecioProducto + "€";
  divContenidoGas.appendChild(pPrecioProducto);

  let distancia = document.createElement("p");
  distancia.id = "distanciaGas";
  distancia.innerHTML = distanciaF.toFixed(2) + " km";
  divContenidoGas.appendChild(distancia);

  divGasolinera.appendChild(divContenidoGas);
  divGasolineras.appendChild(divGasolinera);
}

// funcion para saber que foto poner al mostar la gasolinera dependiendo de la empresa
function obtenerLogoGas(nombre) {
  let nombreEnMinusculas = nombre.toLowerCase();
  let nombreFoto;
  switch (nombreEnMinusculas) {
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

// funcion para eliminar todas las gasolineras pintadas
function eliminarGasolinerasYMapa() {
  divGasolineras.innerHTML = "";
  divMapa.innerHTML = "";
}

// función para cuando un filtro no obtenga resultados.
function noHayResultados() {
  eliminarGasolinerasYMapa();

  let carta = document.createElement("div");
  carta.classList.add("divError");
  let titulo = document.createElement("h2");
  titulo.innerText = "¡Oops! No existen resultados.";
  carta.appendChild(titulo);

  let contenedorIMG = document.createElement("img");

  contenedorIMG.classList.add("imgPersonalizada")
  let imgPersonalizada = "img/singasolina.jpg";

  contenedorIMG.setAttribute("src", imgPersonalizada);
  carta.appendChild(contenedorIMG);
  divGasolineras.appendChild(carta);


}

//'apikey': 'ucstkoCXcmlx8N1_6KdtT2akr6IoR7ja57jFoU0Fgro'
//Mapa

let map;
let behavior;
let mapEvents;

function crearMapa(latRef, longRef) {
  var platform = new H.service.Platform({
    'apikey': 'ucstkoCXcmlx8N1_6KdtT2akr6IoR7ja57jFoU0Fgro'
  });

  var defaultLayers = platform.createDefaultLayers();

  map = new H.Map(
    document.getElementById('map'),
    defaultLayers.vector.normal.map,
    {
      zoom: 10,
      center: { lat: latRef, lng: longRef },
      draggable: true
    });

  mapEvents = new H.mapevents.MapEvents(map);
  behavior = new H.mapevents.Behavior(mapEvents);

  var ui = H.ui.UI.createDefault(map, defaultLayers);
  var searchService = platform.getSearchService();

  console.log("crearMapa finn");
}

function addMarcadorMapa(latGas, longGas) {
  // Create a marker icon from an image URL:
  var icon = new H.map.Icon('img/icongas2.png', { size: { w: 25, h: 25 } });

  // Create a marker using the previously instantiated icon:
  var marker = new H.map.Marker({ lat: latGas, lng: longGas }, { icon: icon });

  // Add the marker to the map:
  map.addObject(marker);
}

map.addEventListener('tap', function (evt) {
  console.log(evt.type, evt.currentPointer.type);
});





// Agrega la marca al mapa






let marker = new H.map.Marker({
  lat: latGas,
  lng: longGas
});

map.addObject(marker);


// Cuando el usuario se desplaza hacia abajo 80 px desde la parte superior del documento, cambie el tamaño del relleno de la barra de navegación y el tamaño de fuente del logotipo
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {

  document.getElementById("navbar").style.padding = "10px 5px";
  document.getElementById("logo").style.fontSize = "45px";
  document.getElementById("cajaBuscador").style.padding = "0 40% 0 20%";

}


// llamada de funciones al iniciar la aplicacion
gasolinerasInicio();
llenarSelectorCarburante();
