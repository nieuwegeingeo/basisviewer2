
function loadAltLayerswitcher() {
    addDomElements = function() {
        $('#map').append('<div class="layer-switcher__button layer-switcher__view"></div>'+
                     '<div class="layer-switcher__container zichtbaar-flex">'+
                     '<div class="layer-switcher__head layer-switcher__view"></div>'+
                     '<div class="layer-switcher__content"></div>')
}

showHideLayerSwitcher = function() {
            if ($('.layer-switcher__container').hasClass('zichtbaar-flex')) {
                    $('.layer-switcher__container').removeClass('zichtbaar-flex');
                    $('.layer-switcher__button').addClass('zichtbaar-block');
                } else {
                    $('.layer-switcher__container').addClass('zichtbaar-flex');
                    $('.layer-switcher__button').removeClass('zichtbaar-block');
                }
        }
    $('.layer-switcher__view').on('click', showHideLayerSwitcher)
    addDomElements();
    $.each(Geogem.map.layers, function(){
        if ($(this).prop('displayInLayerSwitcher') === true) {
        layerVisibility = '';
            if ($(this).prop('visibility') === true){
                layerVisibility = 'checked=""'
            }
            layerName = $(this).prop('name');
            $('.layer-switcher__content').append('<table class="layer-switcher__list"><tr class="layer-switcher__item no-select" ><td><label class="layer-switcher__label"><input class="layer-switcher__input" type="checkbox" '+ layerVisibility +' name="'+ layerName +'">'+ layerName +'</label></td></tr></table>');
        }
    });

    Geogem.map.layerInput = $('.layer-switcher__item').children().children('label').children('input');

    $(Geogem.map.layerInput).change( function(){
        if ($(this).prop('checked') === true) {
            mapLayer = Geogem.map.getLayersByName($(this).prop('name'))[0];
            mapLayer.setVisibility(true);
        } else {
            mapLayer = Geogem.map.getLayersByName($(this).prop('name'))[0];
            mapLayer.setVisibility(false);
        }
    })

    $('.layer-switcher__view').on('click', showHideLayerSwitcher);
}


if (Geogem.Settings.layerGroups) {
    var detailObject = Geogem.Settings.layerGroups;
    console.log(detailObject)
    function sortLayers() {
        for (var key in detailObject) {
            var open = detailObject[key].isOpen === true ? 'open' : false;
            $('.layer-switcher__content').append('<details class='+detailObject[key].title+' '+open+'><summary>'+detailObject[key].title+'</summary></details><br>');
            $.each(Geogem.applicatieSettings.overLays, function(index, layer) {
                console.log(layer.options.group, key)
                if(layer.options.group  === detailObject[key].title) {
                    var title = layer.title;
                    var group = layer.options.group;
                    $('[name="'+title+'"]').parents('table').detach().appendTo('.' + group);
                }
            })
            if ($('.'+detailObject[key].title)[0].childElementCount === 1) {
                $('.'+detailObject[key].title).remove();
            }
        }
    }
    sortLayers()
}