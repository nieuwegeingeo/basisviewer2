var multiFilter = multiFilter || {};

var addFilterContainer = function() {
    if (Geogem.Settings.multiFilterType === 'laag') {
        var container = '<div class="floating-container">'+
        
                '</div>'
        
    } else {
        var container = '<div class="sidebar-filter__container">'+
                        '<h3>Filter</h3><div class="sidebar-filter__data">'+
                        '</div></div>';
        $(container).insertAfter('#sidebar_content2');
        $('#sidebar_content2_head').html('Informatie').show();

        var filterHeadToggle = function() {
            $('.sidebar-filter__container h3').toggleClass('folded');
            if ($('.sidebar-filter__container h3').hasClass('folded')) {
                $('.sidebar-filter__data').hide();
            } else {
                $('.sidebar-filter__data').show();
            }
        };
        $('.sidebar-filter__container h3').on('click', filterHeadToggle);
        $('#sidebar_content').on('DOMSubtreeModified', function() {
        if ($('.sidebar-filter__container h3').hasClass('folded')) {
            return true;
        }  else {
            filterHeadToggle();
        }
        });
    }
};

var setFilterLayers = function(){ 
    multiFilter.filterLayer = [];

    Geogem.map.layers.map(function(layer) {
        if (layer.options.filter || layer.options.multiFilter) {
            multiFilter.filterLayer.push(layer);            
        }
    });
}

var filterCreator = function() {
    var filter =  Geogem.Settings.multiFilter[0];
    if (Geogem.Settings.multiFilterType === 'laag') {
        $.each(multiFilter.filterLayer, function(index, layer) {            
            var name = layer.name;
            var filterContainer = $('.filter-container__data.'+name.replace(/ /g,'-'));
            var filterInput = '<div class="filter-container">';
            var setDisplay = '';
            var layerFilterArray = $.extend(true, {}, filter);
            //layerFilterArray = Object.assign(filter);
            if (typeof layer.options.filter === 'object') {
                for (var key in layerFilterArray) {
                    if (!layer.options.filter.includes(key)) {
                        delete layerFilterArray[key];
                    }
                }
            }
            
            $.each(layerFilterArray, function(name, filterItem, index){
                var filterTitle = filterItem.TITLE;
                var titleLcase = filterTitle.toLowerCase();
                var type = filterItem.TYPE;                
                if (type === 'TEXT') {
                    filterInput += '<div class="input-' + name + '" ' + setDisplay + '>'+
                                   '<div class="input-container">'+
                                   '<label><b>Filter op ' + titleLcase + ': </b>'+
                                   '<input class="text-filter feature-filter__' + name + '" onkeyup="listSearch()" type="text"/></label>'+
                                   '</div></div><br><br>';
                } else if (type === 'CHECKBOX') {
                    filterInput += '<div class="input-' + name + '" ' + setDisplay + '>'+
                                   '<div class="input-container">'+
                                   '<label class="filterInput checkbox-aan">'+
                                   '<input class="checkbox-all" type="checkbox" name="' + name + '-alles" checked="true">Alles aan</label>'+
                                   '</div><br>'+
                                   '<div class="input-container  flex-wrapper">';
                    $.each(filterItem.OPTIONS, function(key, optionItem) {
                        var optionValue = optionItem.value;
                        var optionTitle = optionItem.title;
                        filterInput += '<label class="filterInput">' +
                            '<input class="filter-checkbox" type="checkbox" name="filter-checkbox__' + name + '" value="' + optionValue + '" checked="true"><span>' + optionTitle + '</span></label>';
                    });
                    filterInput += '</div></div>';
                } else if (type === 'RADIO') {
                    filterInput += '<div class="input-' + name + '" ' + setDisplay + '>'+
                                   '<div class="input-container flex-wrapper">'+
                                   '<label class="filterInput radio-aan">'+
                                   '<input class="filter-radio radio-all" type="radio" name="filter-radio__' + name + '" value="" checked="true">Alles aan</label>'+
                                   '<div class="breakline"></div>';
                                   //'<div class="input-container flex-wrapper">';
                    $.each(filterItem.OPTIONS, function(key, optionItem) {
                        var optionValue = optionItem.value;
                        var optionTitle = optionItem.title;
                        filterInput += '<label class="filterInput">' +
                            '<input class="filter-radio" type="radio" name="filter-radio__' + name + '" value="' + optionValue + '">' + optionTitle + '</label>';
                    });
                    filterInput += '</div></div>';
                
                } else if (type === 'SLIDER') {
                    var sliderMin = filterItem.MIN;
                    var sliderMax = filterItem.MAX;
                    //console.log(sliderMin,sliderMax)
                    filterInput += '<div class="input-' + name + '" ' + setDisplay + '><p id="slider-label"></p>'+
                                   '<div id="slider"></div>'+
                                   '</div>'
                }
                
            });
            console.log(filterContainer)
                filterInput += '</div><br>';
                $(filterContainer).append(filterInput)
        }) 
    } else {
        
    }
}

var addLSFilterButton = function() {
    $.each($('.layer-switcher__label'), function(index, item) {
        $('<td class="ls-filterbutton__container"></td>').insertBefore($(item).parent())
    });
    
    $.each(multiFilter.filterLayer, function(index, layer) {        
        var name = layer.name;
        var layerSwitcherEntry = $('[name="'+name+'"]');
        var buttonContainer = layerSwitcherEntry.parent().parent().siblings('.ls-filterbutton__container');            
        console.log(buttonContainer)
        $(buttonContainer).append('<div class="ls-filterbutton"></div>')
        $('<tr class="filter-container__row"><td></td><td class="filter-container__data ' + name.replace(/ /g, '-') + '"></td></tr>').insertAfter(layerSwitcherEntry.parent().parent().parent())
    });
    
    $('.ls-filterbutton').click(function() {
        console.log($(this).hasClass('button-off'))
        console.log(filterContainer)
        if ($(this).hasClass('button-off')) {
            $(this).removeClass('button-off');
            $(filterContainer).removeClass('filter-hidden');
        } else {
            $(this).addClass('button-off');
            $(filterContainer).addClass('filter-hidden');
        }
        refillFilterlayer();
    });
};

var refillFilterlayer = function() {
    multiFilter.filterLayer = [];
    console.log(multiFilter.filterLayer)
    $.each($('.ls-filterbutton'), function(index, item) {
        var input = $(item).parent().siblings().children().children('input');   
        var layerName = $(input).attr('name');
        var layer = Geogem.map.getLayersByName(layerName)[0];        
        if (!$(item).hasClass('button-off')) {            
            multiFilter.filterLayer.push(layer);           
        } else {
            
            //delete layer.params.CQL_FILTER;
            layer.redraw();
        }
    })
   
   
    console.log(multiFilter.filterLayer)
};

multiFilter.filterLoader = function() {
    addFilterContainer();
    setFilterLayers();
    if (Geogem.Settings.multiFilterType === 'laag') {addLSFilterButton();}
    filterCreator();
};

