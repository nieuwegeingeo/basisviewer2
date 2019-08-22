

$(document).ready(function(e) {
    $('.main-page .tab-links a').on('click', function(e)  {
        var currentAttrValue = $(this).attr('href');
        // Change/remove current tab to active
        $(this).parent('li').addClass('active').siblings().removeClass('active');
        $(currentAttrValue).addClass('active').siblings().removeClass('active');
        yframe = $('#tabkaart'+'_'+currentAttrValue.slice(1,5));
        if (yframe.attr('src') ===''){
            yframe.attr('src', yframe.attr('srcc'));
        }    
        if (yframe.attr('data') ===''){
            yframe.attr('data', yframe.attr('datax'));
        }   
            
       e.preventDefault();
    });
    $('.position-switcher').on('click', function() {
        $('.tab.active').children('.tab-frame').toggleClass('left').toggleClass('right');
    });
     
});
        
var smallScreenLogic = function() {
    if(window.innerWidth <= 850) {
        // console.log('width < 850')
        $('.container').addClass('small-screen');
        
        var openMenu = function() {
            $('.tab-links').toggle();
        }
        
        var tabMenu = document.querySelector('.container.small-screen')        
        tabMenu.addEventListener('click',openMenu )
        
    } else {
        // console.log('width > 850')
        $('.container').removeClass('small-screen');
    }
};

var displayMenu = function() {
    if ($('.container').hasClass('small-screen')) {
        
        $('.tab-links').css('display','none');        
        // console.log('menu off')
        
    } else {
        $('.tab-links').css('display','flex');
         // console.log('menu on')
    }
};

$(window).on('load', function() {
    smallScreenLogic();
    displayMenu();    
});

$(window).on('resize', function() {
    smallScreenLogic();
    displayMenu();
});