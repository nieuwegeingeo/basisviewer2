var multiFilter = multiFilter || {};

var addFilterContainer = function() {
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
};


var filterBuilder = function() {
    var filter =  Geogem.Settings.multiFilter[0];
    var filterHtml = '';
    var filterMenu = '<div class="filter-select__container"><label><b>Kies een filter: </b>'+
                     '<select class="filter-categorie" onchange="setCategorie()">';
    var filterInput = '<div class="filter-container">';
    var setDisplay = '';
    var i = 0;
    $.each(filter, function(name, filterItem, index){
        var filterTitle = filterItem.TITLE;
        var titleLcase = filterTitle.toLowerCase();
        var type = filterItem.TYPE;
        filterMenu += '<option value="' + name + '">' + filterTitle + '</option>';
        if (type === 'TEXT') {
            filterInput += '<div class="input-' + name + '" ' + setDisplay + '>'+
                           '<label><b>Filter op ' + titleLcase + ': </b>'+
                           '<input class="text-filter feature-filter__' + name + '" onkeyup="listSearch()" type="text"/></label>'+
                           '</div><br><br>';
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
                    '<input class="filter-checkbox" type="checkbox" name="filter-checkbox__' + name + '" value="' + optionValue + '" checked="true">' + optionTitle + '</label>';
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
            console.log(sliderMin,sliderMax)
            filterInput += '<div class="input-' + name + '" ' + setDisplay + '><p id="slider-label"></p>'+
                           '<div id="slider"></div>'+
                           '</div>'
        }
        if (i === 0) {
            setDisplay = 'style="display: none;"';
        }
        i++;
    });
    filterMenu += '</select></label></div><br>';
    filterInput += '</div><br>';
    filterHtml = filterMenu + filterInput;
    $('.sidebar-filter__data').append(filterHtml);

    if (i === 1) {
        $('.filter-select__container').hide();

    }

multiFilter.filterLayer = [];

Geogem.map.layers.map(function(layer) {
        if (layer.options.filter || layer.options.multiFilter) {
            multiFilter.filterLayer.push(layer);
        }
    });
};

var filterCat = '';
var arrayValues = [];
var filterArray = [];
var filterCount = 0;
var filterStore = [];

var arrayFiller = function(type) {
    filterCount = 0;
    arrayValues = [];
    $('[name="filter-checkbox__' + type + '"]').map(function(index, item) {
        if (this.checked === true) {
            arrayValues.push("'" + item.value + "'");
            filterCount++
        }
    });
    if (filterCount === 0 ){ arrayValues = ["''"];}
    filterArray = arrayValues;
};

var format = new OpenLayers.Format.CQL();
var wfsRule = new OpenLayers.Rule({ 
    elseFilter: true, 
})

var resetFilter = function() {
        $.each(multiFilter.filterLayer, function(index, item){
            if (item.id.match(/vector/gi)) {
                var filter = ''
                wfsRule.filter = filter;                
                item.redraw();
            } else{
                item.params.CQL_FILTER = undefined;
                item.redraw();
            }
        });
        $('.text-filter').prop('value','');
        $.each($('.filter-checkbox, .checkbox-all'), function(index, item) {
            itemParent = $(item).parent();
            item.checked = true;
            if (!$(itemParent).hasClass('checkbox-aan')) {
                $(itemParent).addClass('checkbox-aan');
            }
        });
};

var setCategorie = function() {
        filterCat = $('.filter-categorie').prop('value');
        $.each(Geogem.Settings.multiFilter[0], function(name, item){
            if (name === filterCat) {
                if (item.TYPE === 'CHECKBOX') {
                    checkboxFunctions(filterCat);
                } else if (item.TYPE === 'SLIDER') {
                    sliderFunction(name, item)
                }
            }
        })

        arrayFiller(filterCat);
        resetFilter();
        $('.input-' + filterCat + '').show().siblings().hide();
};

var listSearch = function() {
        var listSearchbox = $('.feature-filter__' + filterCat + '');
        var listFilter = listSearchbox.prop('value').toLowerCase();
        var listSearchFilter = function(code) {
            multiFilter.filterLayer.map(function(layer) {                
                if (layer.id.match(/vector/gi)) {
                   var filter = format.read("" + filterCat + " LIKE '"+ code +"'",0);
                   wfsRule.filter = filter;                
                   layer.redraw();                    
                } else{
                    var filter = "strToLowerCase(" + filterCat + ") LIKE '%"+ code +"%'";
                    layer.params.CQL_FILTER = filter;
                    Geogem.map.infoControl.vendorParams.cql_filter = filter;
                    layer.redraw();
                }
            });
        };
        listSearchFilter(listFilter);
};

var sliderFunction = function(filterName, filterObject) {
    var sliderMin = filterObject.MIN;
    var sliderMax = filterObject.MAX;
    var range =  filterObject.RANGE || false;
    var $slider = $( "#slider" ).slider({ range: range, min: sliderMin, max: sliderMax });
    var layer = multiFilter.filterLayer;
    $slider.slider({
    change: function( event, ui ) {
        var values = $slider.slider( "values" );
        if (range === false) { 
            console.log(range)
            $.each(layer, function(index, item) {item.mergeNewParams(	{cql_filter:"" + filterName + " = "+ values[0]}	);})
        } else {
            $.each(layer, function(index, item) {item.mergeNewParams(	{cql_filter:"" + filterName + " BETWEEN "+values[0]-- +' AND '+values[1]++ }	);})
        }
    }
    });
    $slider.slider({
        slide: function( event, ui ) {
            var values = $slider.slider( "values" );
            if (range == false) {
                 
                $('#slider-label').html(values[0]--)
            } else {
                $('#slider-label').html(values[0]-- +' - '+values[1]++);
            }
        }
    });
    $slider.slider('pips', {rest: 'label', step: 3});
    $slider.slider( { values: [ sliderMin, sliderMax ] } );
    $('#slider-label').html(sliderMin--)
}

var filterLayerFunction = function(array) {
        $.each(multiFilter.filterLayer, function(index, layer) {
            if (layer.id.match(/vector/gi)) {
                   var filter = filterCat + " IN (" + array +")";
                   wfsRule.filter = filter;                
                   layer.redraw();
                } else {
                    var filter = filterCat + " IN (" + array +")";
                    layer.params.CQL_FILTER = filter;
                    Geogem.map.infoControl.vendorParams.cql_filter = filter;
                    layer.redraw();
                }
        });
    };

var radioFunctions = function() {
    $('.filter-radio').on('click', function() {
        $(this).parent().addClass('radio-aan');
        $(this).parent().siblings().removeClass('radio-aan');
        var filterValue = this.value;
        if ($(this).hasClass('radio-all')) {filterValue = '';
            multiFilter.filterLayer.map(function(layer) {                
                if (layer.id.match(/vector/gi)) {
                       //var filter = format.read("" + filterCat + " <> '"+ filterValue +"' OR " + filterCat + " IS NULL",0);
                       wfsRule.filter = "";                
                       layer.redraw();                    
                } else {
                        var filter = "strToLowerCase(" + filterCat + ") LIKE '%"+ filterValue +"%' OR " + filterCat + " IS NULL";
                        layer.params.CQL_FILTER = filter;
                        Geogem.map.infoControl.vendorParams.cql_filter = filter;
                        layer.redraw();
                }
            });
        } else {
            multiFilter.filterLayer.map(function(layer) {                
                if (layer.id.match(/vector/gi)) {
                       var filter = format.read("" + filterCat + " LIKE '"+ filterValue +"'",0);
                       wfsRule.filter = filter;                
                       layer.redraw();                    
                } else {
                        var filter = "strToLowerCase(" + filterCat + ") LIKE '%"+ filterValue +"%'";
                        layer.params.CQL_FILTER = filter;
                        Geogem.map.infoControl.vendorParams.cql_filter = filter;
                        layer.redraw();
                }
            });
        }
    })
    
}    
    
var checkboxFunctions = function() {

$('.checkbox-all').on('click', function(e) {
    if ($(this).prop('checked') === true) {
        if (arrayValues.length === 0) {arrayFiller(filterCat)}
        arrayFiller(filterCat);
        filterArray = arrayValues;
        $('.filter-checkbox').prop('checked', true);
        filterLayerFunction(filterArray);
        $('.filterInput').addClass('checkbox-aan');
    } else {
        filterArray = ["''"];
        $('.filter-checkbox').prop('checked', false);
        filterLayerFunction(filterArray);
        $('.filterInput').removeClass('checkbox-aan');
    }
});

$('.filter-checkbox').on('click', function(e) {
    inputValue = "'"+ $(this).prop('value')+ "'";
    arrayFiller(filterCat);
    filterLayerFunction(filterArray)
    if ($(this).prop('checked') === true) {
        $(this).parent().addClass('checkbox-aan');
        if ($('[name="filter-checkbox__' + filterCat + '"]').length == filterCount){$('.checkbox-all').prop('checked', true).parent().addClass('checkbox-aan');}
    } else {
        $('.checkbox-all').prop('checked', false);
        $(this).parent().removeClass('checkbox-aan');
        $('.checkbox-all').parent().removeClass('checkbox-aan');
    }
});
};
if (filterStore.length !== 0) {
    filterArray = filterStore;
}

multiFilter.filterLoader = function() {
    addFilterContainer();
    filterBuilder();
    setCategorie();
    checkboxFunctions();
    radioFunctions();
};

