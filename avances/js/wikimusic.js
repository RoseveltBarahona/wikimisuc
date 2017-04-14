/*FALTA CAPTURAR ARTISTA DESCONOCIDO , OTROS ERRORES DE AJAX Y EL LOADING
    cuando ejecuto la llamada cargando: display : block
   cunado es exitosa cargando display: none;*/
//(function() {
// variables globales
var apiKey = "e46d175d00ea667bd3d0d7d025ab81df";
var methodInfo = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=The cure&api_key=';
var artistName = document.getElementById('nombre-artista');
var btnSearch = document.getElementById('search');
// recordar recorrido de artistas(clicks)
var historyArtist = [];
var historyCounter = 0;
var videoSearch = true;
var indexOfArtist;


// Funcion inicial para conseguir la zona, pais, ...
(function() {
    var ajax = new XMLHttpRequest();
    var url = 'http://ip-api.com/json';
    //mostrar cargando....
    ajax.onreadystatechange = function() {
        if (ajax.readyState === 4 && ajax.status === 200) {
            var datos = JSON.parse(ajax.responseText);
            country = datos.country;
            showTopArtists(country);
            //ocultar cargando...
        }
    };
    ajax.open("GET", url, true);
    ajax.send();
})();

// Enviar petición para traer top artistas top segun pais, 
function showTopArtists(country) {
    ajaxGetInfo('http://ws.audioscrobbler.com/2.0/?method=geo.gettopartists&country=' + country + '&limit=10&api_key=', renderTopArtist);
}

// Empezar busqueda con el boton buscar o pulsando enter en el campo de texto
btnSearch.addEventListener('click', function() {
    // verificar que el campo no este vacio
    if (artistName.value.trim().length === 0) {
        alert("escribe el nombre de un artista");
    } else {
        var value = document.getElementById('nombre-artista').value;
        historyArtist = [];
        historyCounter = 0;
        showData(value);
    }
});

artistName.addEventListener('keypress', function(e) {
    // verificar que el campo no este vacio
    if (e.keyCode === 13 && artistName.value.trim().length === 0) {
        alert("escribe el nombre de un artista");
    } else if (e.keyCode === 13 && artistName.value.trim().length > 0) {

        var value = document.getElementById('nombre-artista').value;
        historyArtist = [];
        historyCounter = 0;
        showData(value);
    }
});

// Mostrar datos 
function showData(name) {
    videoSearch = true;
    // cada vez que show data es invocada guarda los nombres de los artistas
    historyArtist.push(name);
    // limpiar html
    cleanInfo();
    //get video plugin --> busca un video basado en el nombre del artista

    document.getElementById("top-country").style.display = 'none';
    ajaxGetInfo('https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + name + '&api_key=', renderInfo, name);
    ajaxGetInfo('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=' + name + '&limit=10&api_key=', renderTracks, name);
    ajaxGetInfo('http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=' + name + '&limit=6&api_key=', renderAlbums, name);

    function delegateSimilars() {
        // Delegación de eventos
        var contentSimilar = document.getElementById('similar-artists');
        contentSimilar.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'a') { //(event.target.tagName.toLowerCase() === 'a') // Localname tambien valdria
                var name = elemento.title;
                event.preventDefault();
                showData(name);
                // history conunter solo se modifica desde la función delegate
                historyCounter++;
                // crear boton back html
                createButton();
            }
        });
        // Crear boton volver
        function createButton() {
            var backButton = document.createElement('button');
            backButton.textContent = "volver";
            backButton.setAttribute('id', 'back');
            backButton.style.display = 'block';
            var fatherToInsert = document.getElementById('main');
            var childReference = document.getElementById('image-artist'); //document.querySelector('#prueba .clase').title // Azul
            fatherToInsert.insertBefore(backButton, childReference);

            backButton.addEventListener('click', function() {
                // Al darle click al boton "volver" , pido la informacion del artista anterior guardada en el array "historyArtist"
                showData(historyArtist[historyCounter - 1]);
                // luego de pedir la informacion resto un numero a "history counter" ya ques ahora estoy en un paso anterior.
                historyCounter--;
                // y vuelvo a crear el boton y vuelve a estar disponible para retrocedes un paso mas en el historico de pasos
                createButton();
                // si estoy en el historial numero "0" escondo el boron volver.
                //alert (historyCounter);
                if (historyCounter === 0) {
                    document.getElementById('back').style.display = 'none';
                    // la ultima vez que vuelvo atras o sea al paso cero , limpio el array 
                    historyArtist = [];
                    // guardo el primer artista buscado y lo pongo como inicio del index "historyArtist"
                    indexOfArtist = document.getElementById('nombre-artista').value;
                    historyArtist.push(indexOfArtist);
                }
            });
        }
    }

    function delegateAlbums() {
        var albums = document.getElementById('top-albums');
        albums.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'img') {
                var AlbumName = elemento.id;
                ajaxGetInfo('https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=' + name + '&album=' + AlbumName + '&api_key=', renderAlbumDetails);
                //y ponerlos en un div
                //cuando hago click display block al div que los esta cargando
            }
        });
    }
    delegateSimilars();
    delegateAlbums();
}

function ajaxGetInfo(metodo, funcion, name) {
    //na
    var ajax = new XMLHttpRequest();
    //mostrar cargando...
    artistName.disabled = true;
    btnSearch.disabled = true;
    btnSearch.textContent = 'BUSCANDO.........';

    ajax.onreadystatechange = function() {
        if (ajax.readyState === 4 && ajax.status === 200) {
            var datos = JSON.parse(ajax.responseText);

            if (datos.error >= 0) { //ERROR JSON
                //noEncontrado(datos.message);
                document.getElementById('wrapper-music-video').style.display = 'none';
                document.getElementById('info-error').style.display = 'block';
            } else {
                for (var i in datos) {
                    funcion(datos[i]); //mandar datos a las funciones para renderizar
                    //buscar video
                    if (videoSearch) {
                        console.log(datos);
                        ytEmbed.init({
                            'block': 'music-video',
                            //'key': 'your-youtube-developer-key',
                            'key': 'AIzaSyA8OmKcw2DMNkJicyCJ0vqvf90xgeH52zE',
                            //'q': name + ' ' + 'band',
                            'q': name,
                            'type': 'search',
                            'results': 1,
                            //'meta': true,
                            //'display_first': true,
                            'player': 'embed',

                            'thumbnails': true,
                            'layout': 'full',
                            //
                            //'playlist':true,
                            'width': '800',
                            'height': '488'

                        });
                        videoSearch = false;
                    }
                }
            }
            //extras
            btnSearch.disabled = false;
            artistName.disabled = false;
            btnSearch.textContent = 'buscar';
            //ocultar cargando....

        } else if (ajax.readyState === 4 && ajax.status === 404) { //ERROR 404
            var errorInfo = JSON.parse(ajax.responseText);
            console.error("ERROR! 404");
            console.info(errorInfo);
        }
    };
    ajax.open("GET", metodo + apiKey + "&format=json", true);
    ajax.send();
}

// Vaciar el contenido de los divs antes de traer los nuevos datos
function cleanInfo() {
    var contenido = '<div class="vertical-bar">aa</div>';
    contenido += ' <div id="image-artist" class="image"></div>';
    contenido += '<div class="wrapper-info">';
    contenido += '<section id="info"></section>';
    contenido += '<section id="wrapper-music-video" class="tracks-and-video"><div id="tracks"></div><div id="music-video"></div></section>';
    contenido += '<section id="top-albums" class="top-albums"></section>';
    contenido += '<section id="similar-artists" class="similar-artists"></section>';
    contenido += '</div>';


    document.getElementById('main').innerHTML = contenido;
}

// Mostrar artistas top segun zona 
function renderTopArtist(topCountry) {
    var tops = '';
    for (var i = 0; i < topCountry.artist.length; i++) {
        tops += "<div><p>" + topCountry.artist[i].name + "</p><img src=" + topCountry.artist[i].image[3]["#text"] + "/><p>" + topCountry.artist[i].listeners + "</p><a href =" + topCountry.artist[i].url + " target='blank'>link</a></div>";
    }
    document.getElementById('top-country').innerHTML += tops;
}

// Mostrar información general de artista ----------------------------------------------------------------------
function renderInfo(datos) {

    var imageArtist = '';
    imageArtist += '<div class ="image-artist"><img class="" src="' + datos.image[3]['#text'] + '" /><p><a href="' + datos.url + '" target="_blank">' + datos.url + '</a></p></div>';
    document.getElementById('image-artist').innerHTML += imageArtist;

    // info principal
    var contenido = '<div class="bio">';
    contenido += '<p><strong>' + datos.name + '</strong></p>';
    contenido += '<div>';
    // estadisticas
    for (var stats in datos.stats) {
        contenido += "<p>" + stats + ":" + datos.stats[stats] + "</p>";
    }
    contenido += '</div><p>' + datos.bio.summary + '</p></div>';
    // tags
    contenido += '<div class="tags">';
    for (var i = 0; i < datos.tags.tag.length; i++) {
        contenido += "<p>" + datos.tags.tag[i].name + "</p>";
    }
    contenido += '</div>';
    // pintar elementoss en #info
    document.getElementById('info').innerHTML += contenido;

    // Artitas similares
    var similars = datos.similar.artist;
    var similarArtists = '<h3>Artistas similares</h3>';
    similarArtists += '<div class="all-similars">';
    for (var i = 0; i < similars.length; i++) {
        similarArtists += '<div class="similar"><h2 id="similar-name">' + similars[i].name + '</h2><div><img src=" ' + similars[i].image[3]['#text'] + ' " /></div><a title = "' + similars[i].name + '" href="' + similars[i].url + '" target="_blank">ver en last fm</a></div>';
    }
    similarArtists += '</div>';
    // pintar elementos en #similar-artists
    document.getElementById('similar-artists').innerHTML += similarArtists;
}

// Mostrar top canciones ----------------------------------------------------------------------
function renderTracks(tracks) {

    var numberTrack = 0;
    var topTracks = '<div class="top-tracks">';
    for (var i = 0; i < tracks.track.length; i++) {
        topTracks += '<p><span>' + (numberTrack += 1) + '</span>' + tracks.track[i].name + '<span>' + tracks.track[i].playcount + '</span></p>';
    }
    topTracks += '</div>';
    // pintar elems en #top-tracks
    document.getElementById('tracks').innerHTML += topTracks;
}

// Mostrar detalle de album ----------------------------------------------------------------------
function renderAlbumDetails(album) {
    document.getElementById('album-detail').innerHTML = "";
    var albumDetail = '';
    var numberTrack = 0;
    albumDetail += '<div><div><p>' + album.name + '<span>' + album.artist + '</span></p><img src="' + album.image[3]['#text'] + '"/></div>';
    // albumDetail += '<img src="' + album.image[3]['#text'] + '"/>';
    albumDetail += '<div>';
    for (var i = 0; i < album.tracks.track.length; i++) {
        albumDetail += '<p><span>' + (numberTrack += 1) + '</span>' + album.tracks.track[i].name + '<span>' + album.tracks.track[i].duration + '</span></p>';
    }
    albumDetail += '</div></div>';

    // pintar elems en #top-tracks
    document.getElementById('album-detail').innerHTML += albumDetail;
}

// Mostrar top albums  ----------------------------------------------------------------------
function renderAlbums(albums) {
    //console.log(tracks.track)
    var topAlbums = '';
    var numberTrack = 0;
    topAlbums += '<h3>Musica</h3><span>top canciones</span>';
    topAlbums += '<div class="all-albums">';
    for (var i = 0; i < albums.album.length; i++) {
        topAlbums += '<div class="album">';
        topAlbums += '<p><span>' + (numberTrack += 1) + '</span>' + albums.album[i].name + '<span>' + albums.album[i].playcount + '</span></p>';
        topAlbums += '<p><a href="' + albums.album[i].url + '" target="_blank">' + 'ver album' + '</a></p>';
        topAlbums += '<img id="' + albums.album[i].name + '"src="' + albums.album[i].image[3]['#text'] + '"></p>';
        topAlbums += '</div>';
    }
    topAlbums += '</div>';
    // pintar elems en #top-albums
    document.getElementById('top-albums').innerHTML += topAlbums;

}
//})();
