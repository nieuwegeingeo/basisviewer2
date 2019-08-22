$( function() {
        var checkboxArray  =  $.makeArray($('.checkboxLabel')); // Array.from($('.checkboxLabel'))
        
        $.each(checkboxArray, function() {
            var checkboxLabel = this;
            
            // var checkboxLabelParent = this.parentNode;
            var checkboxValue = $(this).children('input').attr('value');
            
            var sliderDiv = document.createElement('div');
            sliderDiv.classList.add('layer-slider');
            sliderDiv.setAttribute('name', checkboxValue);
            $(sliderDiv).insertAfter(checkboxLabel);
//            checkboxLabelParent.appendChild(sliderDiv);
            var eventLayer = Geogem.map.getLayersByName(checkboxValue)[0];

            var $slider = $('[name="'+checkboxValue+'"]');
            $slider.slider({
              min: 0,
              max: 100,
              range: "min",
              value: eventLayer.opacity * 100,
              slide: function( event, ui ) {
                var eventLayer = Geogem.map.getLayersByName(checkboxValue)[0]
                eventLayer.opacity = ui.value / 100;
                eventLayer.redraw();
              }
            })
        });
    })