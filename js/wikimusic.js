(function() {
    // variables globales
    var apiKey = "e46d175d00ea667bd3d0d7d025ab81df&format=json";
    var methodInfo = 'https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=The cure&api_key=';
    var artistName = document.getElementById('nombre-artista');
    var btnSearch = document.getElementById('search');
    var mainInfo = document.getElementById('main');
    var container = document.querySelector('.container');
    var historyArtist = [];
    var historyCounter = 0;
    var videoSearch;
    var indexOfArtist;
    var infoError = document.querySelector('.info-error');
    var loading = document.querySelector('.background-loading');


    // Buscar artistas
    btnSearch.addEventListener('click', function() {
        // verificar que el campo no este vacio
        if (artistName.value.trim().length === 0) {
            alert("escribe el nombre de un artista");
        } else {
            sendName();
        }
    });

    artistName.addEventListener('keypress', function(e) {
        // verificar que el campo no este vacio
        if (e.keyCode === 13 && artistName.value.trim().length === 0) {
            alert("escribe el nombre de un artista");
        } else if (e.keyCode === 13 && artistName.value.trim().length > 0) {
            sendName();
        }
    });

    function sendName() {
        var name = artistName.value;
        historyArtist = [];
        historyCounter = 0;
        showData(name);
    }

    // Mostrar datos 
    function showData(name) {
        videoSearch = true;
        // cada vez que show data es invocada guarda los nombres de los artistas
        historyArtist.push(name);
        // limpiar html
        cleanInfo();
        // peticiones 
        ajaxGetInfo('https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=' + name + '&api_key=', renderInfo, name);
        ajaxGetInfo('http://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=' + name + '&limit=10&api_key=', renderTracks, name);
        ajaxGetInfo('http://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=' + name + '&limit=3&api_key=', renderAlbums, name);
        delegateSimilars();
        delegateAlbums(name);
    }

    function delegateAlbums(name) {
        var albums = document.getElementById('top-albums');
        albums.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'a') {
                event.preventDefault();
                var AlbumName = elemento.id;
                ajaxGetInfo('https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=' + name + '&album=' + AlbumName + '&api_key=', renderAlbumDetails);
            }
        });
    }

    function delegateSimilars() {
        // Delegación de eventos
        var contentSimilar = document.getElementById('similar-artists');
        contentSimilar.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'a') { //(event.target.tagName.toLowerCase() === 'a') // Localname tambien valdria
                var name = elemento.title;
                event.preventDefault();
                showData(name); // history conunter solo se modifica desde la función delegate
                historyCounter++;
                createButton(); // crear boton back html
                document.querySelector('.wrapper-info').classList.add('in-similar');

            }
        });

        // Crear boton volver
        function createButton() {
            var backButton = document.createElement('button');
            backButton.textContent = "<< volver";
            backButton.setAttribute('id', 'back');
            backButton.setAttribute('class', 'back btn');
            var fatherToInsert = document.getElementById('main');
            var childReference = document.getElementById('image-artist');
            fatherToInsert.insertBefore(backButton, childReference);

            backButton.addEventListener('click', function() {
                // Al darle click al boton "volver" , pido la informacion del artista anterior guardada en el array "historyArtist"
                showData(historyArtist[historyCounter - 1]);
                // luego de pedir la informacion resto un numero a "history counter" ya ques ahora estoy en un paso anterior.
                historyCounter--;
                // y vuelvo a crear el boton y vuelve a estar disponible para retrocedes un paso mas en el historico de pasos
                createButton();
                document.querySelector('.wrapper-info').classList.add('in-similar');
                if (historyCounter === 0) {
                    // si estoy en el historial numero "0" escondo el boron volver.
                    document.getElementById('back').classList.add('hide');
                    // la ultima vez que vuelvo atras o sea al paso cero , limpio el array 
                    historyArtist = [];
                    // guardo el primer artista buscado y lo pongo como inicio del index "historyArtist"
                    indexOfArtist = document.getElementById('nombre-artista').value;
                    historyArtist.push(indexOfArtist);
                    document.querySelector('.wrapper-info').classList.remove('in-similar');
                }
            });
        }
    }

    function ajaxGetInfo(metodo, funcion, name) {
        var ajax = new XMLHttpRequest();
        loading.classList.add('show');
        artistName.disabled = true;
        btnSearch.disabled = true;
        btnSearch.textContent = 'BUSCANDO.........';

        ajax.onreadystatechange = function() {
            if (ajax.readyState === 4 && ajax.status === 200) {
                var datos = JSON.parse(ajax.responseText);
                // Erros JSON
                if (datos.error >= 0) {
                    mainInfo.classList.add('hidden');
                    infoError.classList.add('show');
                } else {
                    for (var i in datos) {
                        funcion(datos[i]); //mandar datos a las funciones para renderizar
                    }
                    if (videoSearch) {
                        //get video plugin --> busca un video basado en el nombre del artista
                        ytEmbed.init({
                            'block': 'music-video',
                            'key': 'AIzaSyA8OmKcw2DMNkJicyCJ0vqvf90xgeH52zE', //AIzaSyCCxfoBKXBxrVe4axTZ6tiPukVQ5EC7j80
                            'q': name,
                            'type': 'search',
                            'results': 1,
                            'player': 'embed',
                            'thumbnails': true,
                            'layout': 'full',
                            'width': '800',
                            'height': '488'
                        });
                        videoSearch = false;
                    }
                    if (funcion !== renderAlbumDetails) {
                        window.scrollTo(0, 920);
                    }
                    container.classList.remove('intro');
                    mainInfo.classList.remove('hidden');
                }
                //extras
                btnSearch.disabled = false;
                artistName.disabled = false;
                btnSearch.textContent = 'buscar';
                setTimeout(function() {
                    loading.classList.remove('show');
                }, 500);

            } else if (ajax.readyState === 4 && ajax.status === 404) { //ERROR 404
                var errorInfo = JSON.parse(ajax.responseText);
                console.error("ERROR! 404");
                alert("error, recurso no encontrado ");
            }
        };
        ajax.open("GET", metodo + apiKey, true);
        ajax.send();
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // RENDER DATOS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Vaciar el contenido de los divs antes de traer los nuevos datos
    function cleanInfo() {
        var contenido = '<div class="vertical-bar"></div>';
        contenido += ' <div id="image-artist" class="image"></div>';
        contenido += '<div class="wrapper-info">';
        contenido += '<section id="info" class="info"></section>';
        contenido += '<section id="wrapper-music-video" class="tracks-and-video"><div id="tracks"></div><div id="music-video"></div> </section>';
        contenido += '<section id="top-albums" class="top-albums"></section>';
        contenido += '<section id="similar-artists" class="similar-artists"></section>';
        contenido += '</div>';
        infoError.classList.remove('show');
        document.getElementById('main').innerHTML = contenido;
    }

    // Mostrar información general de artista --------------
    function renderInfo(datos) {
        var imageArtist = '';
        imageArtist += '<div class ="image-artist"><img class="" src="' + datos.image[3]['#text'] + '" /><a href="' + datos.url + '" target="_blank"> Ver en last fm</a><h4>' + datos.name + '</h4></div>';
        document.getElementById('image-artist').innerHTML += imageArtist;

        // info principal
        var contenido = '<div class="bio">';
        contenido += '<h3>' + datos.name + '</h3>';
        contenido += '<div class="stats">';
        // estadisticas
        for (var stats in datos.stats) {
            contenido += "<p>" + stats + ": <span> " + datos.stats[stats] + "</span></p>";
        }
        contenido += '</div><p>' + datos.bio.summary + '</p></div>';
        // tags
        contenido += '<div class="tags">';
        for (var i = 0; i < datos.tags.tag.length; i++) {
            contenido += "<span>" + datos.tags.tag[i].name + "</span>";
        }
        contenido += '</div>';
        // pintar elementoss en #info
        document.getElementById('info').innerHTML += contenido;

        // Artitas similares
        var similars = datos.similar.artist;
        var similarArtists = '<h3>Artistas similares</h3>';
        similarArtists += '<div class="all-similars">';
        for (var i = 0; i < similars.length - 2; i++) {
            similarArtists += '<div class="similar"><img src=" ' + similars[i].image[2]['#text'] + ' " /><h2 id="similar-name">' + similars[i].name + '</h2><a class="btn" title = "' + similars[i].name + '" href="' + similars[i].url + '" target="_blank">Descubrir artista</a></div>';
        }
        similarArtists += '</div>';
        // pintar elementos en #similar-artists
        document.getElementById('similar-artists').innerHTML += similarArtists;
    }

    // Mostrar top canciones ----------------
    function renderTracks(tracks) {
        var numberTrack = 0;
        var topTracks = '<div class="top-tracks"><h3>Top Tracks</h3> <h3 class ="title-video">Video</h3>';
        for (var i = 0; i < tracks.track.length; i++) {
            topTracks += '<p><span>' + (numberTrack += 1) + '</span><span>' + tracks.track[i].name + '</span><span>' + tracks.track[i].playcount + '</span></p>';
        }
        topTracks += '</div>';
        // pintar elems en #top-tracks
        document.getElementById('tracks').innerHTML += topTracks;
    }

    // Mostrar detalle de album ---------------
    function renderAlbumDetails(album) {
        var albumInfo = document.querySelector('.album-detail');
        albumInfo.innerHTML = "";

        var numberTrack = 0;
        var albumDetail = '<button class="close">x</button><div class="modal-album-wrapper"><div class="modal-album-image"><p class="title">' + album.name + '<span>' + album.artist + '</span></p><img src="' + album.image[3]['#text'] + '"/></div>';
        albumDetail += '<div class="modal-tracks-album">';
        for (var i = 0; i < album.tracks.track.length; i++) {
            albumDetail += '<p><span>' + (numberTrack += 1) + '</span><span>' + album.tracks.track[i].name + '</span><span>' + album.tracks.track[i].duration + '</span></p>';
        }
        albumDetail += '</div></div>';

        // pintar elems en #top-tracks
        albumInfo.innerHTML += albumDetail;
        albumInfo.classList.add('show');
        document.querySelector('.close').addEventListener('click', function() {
            albumInfo.classList.remove('show');
        });
    }

    // Mostrar top albums  -------------------
    function renderAlbums(albums) {
        var topAlbums = '';
        topAlbums += '<h3>Top Albums</h3>';
        topAlbums += '<div class="all-albums">';
        for (var i = 0; i < albums.album.length; i++) {
            topAlbums += '<div class="album">';
            topAlbums += '<img id="' + albums.album[i].name + '"src="' + albums.album[i].image[2]['#text'] + '"/>';

            topAlbums += '<p class ="album-name"><span>' + albums.album[i].name + '</span><span>' + albums.album[i].playcount + ' reproducciones</span></p>';
            topAlbums += '<a id="' + albums.album[i].name + '" class="btn" href="' + albums.album[i].url + '" target="_blank">' + 'ver album' + '</a>';
            topAlbums += '</div>';
        }
        topAlbums += '</div>';
        // pintar elems en #top-albums
        document.getElementById('top-albums').innerHTML += topAlbums;

    }
})();
