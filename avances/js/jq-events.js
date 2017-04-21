//http://codepen.io/chriscoyier/pen/AdaKr

$(document).ready(function() {

    $(window).scroll(function() {
        //var sticky = $('.image-artist img'),
        var $stickyName = $('.image-artist h4'),
            $scroll = $(window).scrollTop();

        if ($scroll >= 1300) {
            $stickyName.addClass('fixed');
        } else {
            $stickyName.removeClass('fixed');
        }
    });

    //**************************

    $('main').on('click', 'a.clip', function(event) {

        var $player = $('.ytPlayer');
        var $enlace = $('<button>x</button>');
        $player.show();
        $player.prepend($enlace);
        $enlace.addClass("close-video").on('click', function() {
            $player.remove();
        });
    });

    /* $('main').on('click', '.similar a', function(event) {
         event.preventDefault();
         $('body,html').animate({
             scrollTop: 850,
         }, scroll_top_duration);

     });*/

    //**************************
    var offset = 300,
        offset_opacity = 1200, //browser window scroll (in pixels) after which the "back to top" link opacity is reduced
        scroll_top_duration = 700, //duration of the top scrolling animation (in ms)
        $back_to_top = $('.back-to-top'); //grab the "back to top" link

    $(window).scroll(function() {
        if ($(this).scrollTop() > offset) {
            $back_to_top.addClass('is-visible');
        } else {
            $back_to_top.removeClass('is-visible fade-out');
        }
        if ($(this).scrollTop() > offset_opacity) {
            $back_to_top.addClass('fade-out');
        }
    });

    //smooth scroll to top
    $back_to_top.on('click', function(event) {
        event.preventDefault();
        $('body,html').animate({
            scrollTop: 0,
        }, scroll_top_duration);
    });

});
