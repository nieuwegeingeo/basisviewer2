$('body').on('click', '.checkboxLabel input', function(event)  {
    layerVal = $(this).attr('value');
    labelSpan = $(this).siblings('span').attr('value');
    if ($('[value="'+layerVal+'"]').is(':checked')) {
        Geogem.map.getLayersByName(layerVal)[0].setVisibility(true);
        $(this).parent().addClass('aan');
    } else {
        Geogem.map.getLayersByName(layerVal)[0].setVisibility(false)
        $(this).parent().removeClass('aan');
    }
}); 
