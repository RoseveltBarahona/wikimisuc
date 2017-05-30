(function() {

    var apiKey = "&api_key=e46d175d00ea667bd3d0d7d025ab81df&format=json",
        urlBase = 'https://ws.audioscrobbler.com/2.0/?method=',
        artistName = document.getElementById('nombre-artista'),
        btnSearch = document.getElementById('search'),
        mainInfo = document.getElementById('main'),
        container = document.querySelector('.container'),
        infoError = document.querySelector('.info-error'),
        loading = document.querySelector('.background-loading'),
        historyCounter = 0,
        session = false,
        currentArtist,
        videoSearch,
        getNameFromUrl,
        artistInUrl;

    window.onload = function() {
        verifyUrl();
    };

    // Buscar artista
    btnSearch.addEventListener('click', function() {
        // evitar duplicar busqueda
        /* if (historyArtist[0] === artistName.value) {
             //alert("duplicado!");
             return;
         }*/

        if (artistName.value.trim().length !== 0) {
            sendName();
        }
    });

    artistName.addEventListener('keypress', function(e) {
        /* if (e.keyCode === 13 && historyArtist[0] === artistName.value) {
             alert("duplicado!");
             return;
         }*/
        if (e.keyCode === 13 && artistName.value.trim().length !== 0) {
            sendName();
        }
    });

    // verificar si en la url hay busqueda
    function verifyUrl() {
        artistInUrl = window.location.search;
        if (artistInUrl !== "") {
            // resultado del nombre del artista
            getNameFromUrl = getQueryVariable('artist');
            if (getNameFromUrl !== false) {
                composeRequest(getNameFromUrl);
            }
        }
    }

    /*  Obtener artista desde la URL:
        eliminar simbolo --> ? 
        Convertir cadena a array
        Iterar y dividir el array con el simbolo "="  --> [0]=artist , [1]=Nombre del artista
        Retornar nombre del artista o false.  */

    function getQueryVariable(variable) {
        var query = artistInUrl.substring(1);
        var vars = query.split();
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] === variable) {
                return pair[1];
            }
        }
        return (false);
    }

    // Evento "onpopstate" solo se dispara cuando doy atras o adelante en el historial del navegador.
    window.onpopstate = function(e) {
        if (window.location.search === "") {
            cleanHtml();
            mainInfo.classList.add('hidden');
        }
        verifyUrl();
    };

    // Añadir al historial
    function pushState(name) {
        history.pushState({}, " ", '?artist=' + name);
    }

    function updateInput() {
        artistInUrl = window.location.search;
        artistName.value = getQueryVariable('artist');
        artistName.value = artistName.value.split("%20");
        artistName.value = artistName.value.replace(",", " ");

    }

    function sendName() {
        var name = artistName.value;
        pushState(name);
        composeRequest(name);
    }

    // Componer peticiones y limpiar el html
    function composeRequest(name) {
        videoSearch = true;
        cleanHtml();
        // peticiones 
        ajaxGetInfo(urlBase + 'artist.getinfo&artist=' + name + apiKey, renderInfo, name);
        ajaxGetInfo(urlBase + 'artist.gettoptracks&artist=' + name + '&limit=10' + apiKey, renderTracks, name);
        ajaxGetInfo(urlBase + 'artist.gettopalbums&artist=' + name + '&limit=3' + apiKey, renderAlbums, name);
        //
        delegateSimilars();
        delegateAlbums(name);
        showBackButton();
    }

    // Delegación de eventos boton back
    function delegateBackButton() {
        mainInfo.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.id === "back") {
                history.back();
            }
        });
    }
    delegateBackButton();

    // Delegación de eventos albumes
    function delegateAlbums(name) {
        var albums = document.getElementById('top-albums');
        albums.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'a') {
                event.preventDefault();
                var AlbumName = elemento.id;
                ajaxGetInfo(urlBase + 'album.getinfo&artist=' + name + '&album=' + AlbumName + apiKey, renderAlbumDetails);
            }
        });
    }

    // Delegación de eventos artistas similares
    function delegateSimilars() {
        var contentSimilar = document.getElementById('similar-artists');
        contentSimilar.addEventListener('click', function(event) {
            var elemento = event.target;
            if (elemento.tagName.toLowerCase() === 'a') {
                var name = elemento.title;
                event.preventDefault();
                pushState(name);
                composeRequest(name);
            }
        });
    }

    function showBackButton() {
        backButton = document.getElementById('back');
        if (!history.state) {
            backButton.classList.add('hide');
        } else {
            backButton.classList.remove('hide');
        }
    }


    function ajaxGetInfo(url, callback, name) {
        startSearch();
        var ajax = new XMLHttpRequest();
        ajax.onreadystatechange = function() {
            if (ajax.readyState === 4 && ajax.status === 200) {
                var datos = JSON.parse(ajax.responseText);

                // Artista no encontrado
                if (datos.error >= 0) {
                    mainInfo.classList.add('hidden');
                    infoError.classList.add('show');
                    updateInput();

                    // si es la primera visita y da error, osea si viene desde un enlace erroneo:
                    if (!session && artistInUrl !== "") {
                        alert("url no valida");
                        session = true;
                    }
                }

                // Artista Encontrado
                else {
                    for (var i in datos) {
                        //mandar datos a las funciones para renderizar
                        callback(datos[i]);
                    }
                    if (videoSearch) {
                        searchVideo(name);
                    }
                    if (callback !== renderAlbumDetails) {
                        window.scrollTo(0, 920);
                    }
                    mainInfo.classList.remove('hidden');
                }
                // si provengo desde artista similar no hacer updateinput drod
                updateInput();
                endSearch();

                //ERROR 404
            } else if (ajax.readyState === 4 && ajax.status === 404) {
                var errorInfo = JSON.parse(ajax.responseText);
                alert("Error, recurso no encontrado ");
            }
        };

        ajax.open("GET", url, true);
        ajax.send();
    }

    function startSearch() {
        loading.classList.add('show');
        artistName.disabled = true;
        btnSearch.disabled = true;
        btnSearch.textContent = 'BUSCANDO....';
    }

    function endSearch() {
        btnSearch.disabled = false;
        artistName.disabled = false;
        btnSearch.textContent = 'buscar';
        setTimeout(function() {
            loading.classList.remove('show');
        }, 500);
    }

    //video plugin --> video basado en el nombre del artista
    function searchVideo(name) {
        ytEmbed.init({
            'block': 'music-video',
            'key': 'AIzaSyA8OmKcw2DMNkJicyCJ0vqvf90xgeH52zE',
            'q': name,
            'type': 'search',
            'results': 1,
            'player': 'embed',
            'thumbnails': true,
            'width': '800',
            'height': '488'
        });
        videoSearch = false;
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // RENDER DATOS --> PASAR A HANDLEBARS
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Vaciar el contenido de los divs antes de traer los nuevos datos
    function cleanHtml() {
        var contenido = '<div class="vertical-bar"></div>';
        contenido += ' <div id="image-artist" class="image"></div>';
        contenido += '<div class="wrapper-info">';
        contenido += '<section id="info" class="info"><button id="back" class="back btn">&lt;&lt; volver</button></section>';
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
    //

})();
