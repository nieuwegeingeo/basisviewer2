var showHideTabText= function() {
    $('.tab-text').toggleClass('close')
}

var smallScreenLogic = function() {
    if(window.innerWidth <= 850) {
        try {
            if ($('.close-button').length == 0) {
                console.log('no button')
                $('.tab-text').append('<div class="close-button border-ng-paars"></div>');
                var closeButton = document.querySelector('.close-button');
                closeButton.addEventListener('click', showHideTabText);
            }
            
        } catch(err) {console.log(err);}
    }
}

var resizeElement = function(element, offset) {
    console.log(offset)
    var h = $(document).height() - offset;
    $('.'+element+'').height(h + 'px');
    //console.log($('.tab-text'))
}

$(window).on('load', function() {
    //console.log(document)
    resizeElement('tab-text', 48)
    resizeElement('tabkaart', 128)
    setTimeout(function(){smallScreenLogic();},100);
    
});

$(window).on('resize', function() {
    resizeElement('tab-text', 48)
    resizeElement('tabkaart', 128)
    //console.log('tab heigth', $('.tab-text').height());
    smallScreenLogic();
});