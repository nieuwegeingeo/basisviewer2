var tester = document.getElementById('test');
    image = $('#tab0').children('div').children('.tabkaart');
    window.onscroll = function() {
    if ($(tester).is(':offscreen')) {
        return;
    } else {
        $('#tab0').children('div').children('.tabkaart').attr('src', './img/klimaat2.jpg')
        }
    }

    jQuery.expr.filters.offscreen = function(el) {
        var rect = el.getBoundingClientRect();
        return (
        (rect.x + rect.width) < 0 
        || (rect.y + rect.height) < 0
        || (rect.x > window.innerWidth || rect.y > window.innerHeight)
        );
    };