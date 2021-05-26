function loadAltLayerswitcher() {
    addDomElements = function () {
        $('#map').append('<div class="layer-switcher__button layer-switcher__view"></div>' +
            '<div class="layer-switcher__container zichtbaar-flex">' +
            '<div class="layer-switcher__head layer-switcher__view"></div>' +
            '<div class="layer-switcher__content"></div>')
    }

    showHideLayerSwitcher = function () {
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

    $.each(Geogem.map.layers, function () {
        if ($(this).prop('displayInLayerSwitcher') === true) {
            layerVisibility = '';
            if ($(this).prop('visibility') === true) {
                layerVisibility = 'checked=""'
            }
            layerName = $(this).prop('name');
            layerNameEncode = window.btoa($(this).prop('name'));
            // console.log(layerName)
            if (Geogem.Settings.altLayerswitcherRadio === true) {
                $('.layer-switcher__content').append('<table class="layer-switcher__list" name=' + layerNameEncode + '><tr class="layer-switcher__item no-select" ><td><label class="layer-switcher__label"><input class="layer-switcher__input" type="radio" ' + layerVisibility + ' value="' + layerName + '" name="button-group">' + layerName + '</label></td></tr></table>');
            } else {
                $('.layer-switcher__content').append('<table class="layer-switcher__list" name=' + layerNameEncode + '><tr class="layer-switcher__item no-select" ><td><label class="layer-switcher__label"><input class="layer-switcher__input" type="checkbox" ' + layerVisibility + ' value="' + layerName + '" name="button-group">' + layerName + '</label></td></tr></table>');
            }
        }
    });

    function setRadioVis() {
        if (Geogem.Settings.altLayerswitcherRadio === true) {
            $.each($('.layer-switcher__input'), function (i, e) {
                var thisLayer = Geogem.map.getLayersByName(e.value)[0];
                if (e.checked === true) {
                    thisLayer.setVisibility(true);
                } else {
                    thisLayer.setVisibility(false);
                }
            })
        }
    }

    setRadioVis();

    Geogem.map.layerInput = $('.layer-switcher__item').children().children('label').children('input');

    $(Geogem.map.layerInput).change(function () {
        var clickedInput = $(this);
        if ($(this).prop('checked') === true) {
            var mapLayer = Geogem.map.getLayersByName(clickedInput.prop('value'))[0];
            mapLayer.setVisibility(true);

            setRadioVis();

        } else {
            var mapLayer = Geogem.map.getLayersByName(clickedInput.prop('value'))[0];
            mapLayer.setVisibility(false);
        }
    })

    $('.layer-switcher__view').on('click', showHideLayerSwitcher);


    if (Geogem.Settings.layerGroups) {
        var detailObject = Geogem.Settings.layerGroups;
        // console.log(detailObject)
        function sortLayers() {
            for (var key in detailObject) {
                var open = detailObject[key].isOpen === true ? 'open' : false;
                $('.layer-switcher__content').append('<details class="layerGroup ' + detailObject[key].title + '" ' + open + '><summary>' + detailObject[key].title + '</summary></details><br>');
                $.each(Geogem.applicatieSettings.overLays, function (index, layer) {
                    // console.log(layer.options.group, key)
                    if (layer.options.group === detailObject[key].title) {
                        var title = layer.title;
                        var titleEncode = window.btoa(title);
                        var group = layer.options.group;
                        $('[name="' + titleEncode + '"]').detach().appendTo('.' + group);
                    }
                })
            }
        }
        sortLayers()
        $.each($('.layerGroup'), function (index, group) {
            if (group.childElementCount === 1) {
                $(group).remove();
            }
        })
    }
}