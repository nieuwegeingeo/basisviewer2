var printExt = {};

printExt.printLoader = function() {
    
$.get('//'+location.host+'/geoserver/pdf/info.json?', function(response) {printExt.createUrl =  response.createURL})
    
$('#tools').append('<div id="print" class="toolbutton"></div>');
    var check = 0;
    $('#print').click(function() {

    if (check === 0) {
        check = 1;
    var escCloseForm = function() {
        $(document).bind('keyup', function(e) {
            if (e.keyCode === 27 ) {
                $('.prtext-pos__container').remove();
                $(document).unbind();
                check = 0;
            }
        });
    };

    $('body').append('<div class="prtext-pos__container"><div class="prtext-form__collapse shadow"></div><div class="form-body border-ng-paars border-round border-box shadow"></div></div>');
    

    $('.form-body').append( '<div id="wfsform" class="prtext_print-form">'+
                            '<div class="prtext_form-header"><h3>Print instellingen</h3></div>'+
                            '<p>Geef een pagina titel:</p>'+
                            '<input class="prtext_page-title" type="text" placeholder="Overzichtskaart..."/>'+
                            
                            '<div>'+
                            '<p>Kaart volledig op de pagina of met kader:</p>'+                            
                            '<div class="prtext_button__container flex-container">'+
                            '<div class="basic-button prtext_button prtext_button__frame checkbox-aan">Kader</div>'+
                            '<div class="basic-button prtext_button prtext_button__frame">Volledig</div>'+
                            '</div>'+
                            '</div>'+
                            '<div>'+
                            '<p>(Optioneel) Geef een beschrijving:</p>'+
                            '<textarea class="prtext_page-description"/>'+
                            '</div>'+
                            '<div>'+
                            '<p>Kies de bestandsgrootte:</p>'+
                            '<div class="prtext_button__container flex-container">'+
                            // '<div class="basic-button prtext_button prtext_button__size">A0</div>'+
                            // '<div class="basic-button prtext_button prtext_button__size">A1</div>'+
                            // '<div class="basic-button prtext_button prtext_button__size">A2</div>'+
                            '<div class="basic-button prtext_button prtext_button__size">A3</div>'+
                            '<div class="basic-button prtext_button prtext_button__size checkbox-aan">A4</div>'+
                            '</div>'+
                            '</div>'+
                            
                            '<div>'+
                            '<p>Kies de orientatie:</p>'+                            
                            '<div class="prtext_button__container flex-container">'+
                            '<div class="basic-button prtext_button prtext_button__orientation checkbox-aan">Staand</div>'+
                            '<div class="basic-button prtext_button prtext_button__orientation">Liggend</div>'+
                            '</div>'+
                            '</div>'+
                            
                            '<div>'+
                            '<p>Kies de resolutie:</p>'+
                            '<div class="prtext_button__container flex-container">'+
                            '<div class="basic-button prtext_button prtext_button__dpi checkbox-aan">Laag</div>'+
                            '<div class="basic-button prtext_button prtext_button__dpi">Hoog</div>'+
                            '</div>'+
                            '</div>'+
                            
                            '<div>'+
                            '<p>Kies het bestandsformaat:</p>'+
                            '<div class="prtext_button__container flex-container">'+
                            '<div class="basic-button prtext_button prtext_button__file checkbox-aan">PDF</div>'+
                            '<div class="basic-button prtext_button prtext_button__file">PNG</div>'+
                            '<div class="basic-button prtext_button prtext_button__file">JPEG</div>'+
                            '</div>'+
                            '</div>'+
                            
                            '<div>'+
                            '<p>Kies het afdrukgebied:</p>'+
                            '<div class="prtext_button__container flex-container">'+
                            '<div class="basic-button prtext_button prtext_button__extent checkbox-aan">Scherm</div>'+
                            '<div class="basic-button prtext_button prtext_button__extent">Vlak tekenen</div>'+
                            '</div>'+
                            
                            '<div>'+
                            '<p>Wil je een legenda:</p>'+
                            '<div class="prtext_button__container flex-container prtext_legend__container">'+
                            '<div class="basic-button prtext_button prtext_button__legend checkbox-aan">Nee</div>'+
                            '<div class="basic-button prtext_button prtext_button__legend">Ja</div>'+
                            '</div>'+
                            
                            
                            '</div>'+
                            '<br>' +
                            '<br>' +
                            '<br>' +
                            '<br>' +
                            '<br>' +
                            '</div>'+
                            
                            '</div>'+
                            '<div class="prtext_bottom__container">'+
                            '<button class="basic-button prtext_button prtext_print-button" type="button">Print</button>'+
                            '<button class="basic-button prtext_button prtext_cancel-button" type="button">Annuleer</button>'+
                            '</div>'+
                            '</div>'
                          );
    escCloseForm();
    
    $('.prtext_button').click(function() {
        if (!$(this).hasClass('checkbox-aan')) {
            $(this).addClass('checkbox-aan').siblings().removeClass('checkbox-aan');
        }
    })
    
    
    $('.prtext_print-button').click(createPrint);
    $('.prtext_cancel-button').click(function(){$('.prtext-pos__container').remove();check = 0;});
    
    $('.prtext_button__extent').click(function() {
        if (this.textContent === "Vlak tekenen") {
            createExtentPolygon();
        } else if (checkExtentLayer()) {
            Geogem.map.getLayersByName('extent')[0].removeAllFeatures();
        }
    })
    
    if (checkExtentLayer()) {
        $('.prtext_button__extent.checkbox-aan').removeClass('checkbox-aan').siblings().addClass('checkbox-aan');
    }
    
    $('.prtext_button__legend').click(function() {
        if (this.textContent === "Ja" && $('.legend-layers').length === 0) {
            $('.prtext_legend__container').append(  '<ul class="legend-layers"></ul>');
            $.each(Geogem.map.layers, function(i, l) {
                if (!l.isBaseLayer) {
                    var layerName = l.params.LAYERS;
                    var layerTitle = l.name;
                    var visibility = l.getVisibility() === true ? 'checked' : '';
                    $('.legend-layers').append('<li><label><input type="checkbox" value='+layerName+' '+visibility+'>'+layerTitle+'</label></li>')
                }
            })
        } else if (this.textContent === "Nee" && $('.legend-layers').length > 0) {
            $('.legend-layers').remove();
        }
    })
    
    function createExtentPolygon() {           
        var extentLayer = Geogem.map.getLayersByName('extent')[0] || new OpenLayers.Layer.Vector('extent');
            Geogem.map.addLayers([extentLayer]);
            extentLayer.removeAllFeatures();
            console.log(Geogem.map.getControlsBy('displayClass','olControlDrawFeaturePolyon'))
            if(Geogem.map.getControl('draw_print_area') === null){ 
                var draw = new OpenLayers.Control.DrawFeature(extentLayer, OpenLayers.Handler.Polygon, {
                    title: "Draw Print Area",
                    id: "draw_print_area",
                    displayClass: "olControlDrawFeaturePolyon",
                    multi: false,
                    featureAdded: function(f) {
                        if (extentLayer.features.length > 1) {
                            extentLayer.removeFeatures(extentLayer.features[0]);
                            
                        }
                        draw.deactivate();
                    }
                })
                Geogem.map.addControl(draw);
                draw.activate();
                extentLayer.events.on({
                    "beforefeaturemodified": function() {
                        //console.log('before')
                    }
                });
            } else {
                Geogem.map.getControl('draw_print_area').activate();
            }
         
    }
    
    function checkExtentLayer() {
        return Geogem.map.getLayersByName('extent').length === 1 ? true : false;
    }

    var spec = {};

    function setSpec() {
        spec = {
            layout: getLayout(),
            srs: 'EPSG:28992',
            units: 'meters',
            geodetic: false,
            outputFilename: getTitle(),
            mapTitle: getTitle(),
            mapComment: $('.prtext_page-description').val(),
            outputFormat: getFormat(),
            layers: [],
            legends: [],
            pages: [
                {
                    bbox: getExtent(),
                    dpi: getDPI(),
                    geodetic: false,
                    strictEpsg4326: false,
                    rotation: 0,
                    showLegend: getLegend(),
                }
            ],
        };
    }
    
    function getTitle() {
        var title = $('.prtext_page-title').val();
        if (title === ""){
            title = 'Overzichtskaart'
        }
        return title;
    }
    
    function getFormat() {
        var format = $('.prtext_button__file.checkbox-aan')[0].innerHTML.toLowerCase();
        return format;
    }
    
    function getLayout() {
        var layout = '';
        $.each($('.prtext_button__size.checkbox-aan, .prtext_button__orientation.checkbox-aan'), function(i, l) {
            layout === '' ? layout = l.textContent : layout = layout + ' ' + l.textContent 
        })
        if ($('.prtext_button__frame.checkbox-aan')[0].textContent === 'Volledig') {
            layout = layout + ' Vol';
        }
        return layout;
    }
    
    function getLegend() {
        return $('.prtext_button__legend.checkbox-aan')[0].textContent === 'Ja' ? true : dpi = false;
    } 
    
	$('.prtext_button__size').click(function() {
		if (this.textContent === 'A0' || this.textContent === 'A1') {
			$('.prtext_button__dpi').parent().parent().hide();
			$('.prtext_button__dpi').removeClass('checkbox-aan');
			$('.prtext_button__dpi:first').addClass('checkbox-aan');
		} else {
			$('.prtext_button__dpi').parent().parent().show();
		}
	})
	
	$('.prtext_button__frame').click(function() {
		if (this.textContent === 'Volledig') {
			$('.prtext_page-description, .prtext_legend__container').parent().hide();
		} else {
			$('.prtext_page-description, .prtext_legend__container').parent().show();
		}
	})
    function getExtent() {
        var left = Geogem.map.getExtent().left;
        var bottom = Geogem.map.getExtent().bottom;
        var right = Geogem.map.getExtent().right;
        var top = Geogem.map.getExtent().top;
        if ($('.prtext_button__extent.checkbox-aan')[0].textContent === 'Vlak tekenen') {
            var fBounds = Geogem.map.getLayersByName('extent')[0].features[0].geometry.getBounds();
            left = fBounds.left;
            bottom = fBounds.bottom;
            right = fBounds.right;
            top  = fBounds.top;
        }
        console.log(left,bottom,right,top)
        return [left,bottom,right,top];
    }
    
    function getDPI() {
        var dpi = 150;
        $('.prtext_button__dpi.checkbox-aan')[0].textContent === 'Hoog' ? dpi = 300 : dpi = 150;
        return dpi;
    }
    
    function specBuilder() {
        setSpec();
        var layerAdder = function(layer) {
            var layerName = layer.params.LAYERS;
            var layerFormat = layer.params.FORMAT;
            var layerUrl = '';
            if (layer.url.includes('mapproxy')) {
                layerUrl = 'http://' +location.host+ '/mapproxy/service';
            } else if (layer.url.includes('geoserver')) {
                layerUrl = 'http://' +location.host+ '/geoserver/wms';
            }
            var layerBlock = {
                             type: 'WMS',
                             layers: [layerName],
                             baseURL: layerUrl,
                             format: layerFormat
                             }
            spec.layers.push(layerBlock);
        }
        var legendAdder = function(layer) {
            var layerName = layer.params.LAYERS;
            var layerTitle = layer.name;
            //var layerFormat = layer.params.FORMAT;
            var legendUrl = '';
            console.log()
            if (!layer.isBaseLayer &&$('[value="'+layerName+'"]').prop('checked') === true) {
                legendUrl = 'http://' + location.host + '/geoserver/wms?request=getLegendGraphic&layer=' + layerName + '&format=image/png&scale='+Geogem.map.getScale();
            
                var legendBlock = {
                     name: layerTitle,
                     classes: [{
                         name: '',
                         icons: [legendUrl]
                    }]
                }
                spec.legends.push(legendBlock);
            }             
        }
       //{"name":"Nieuwegein Kaart","classes":[{"name":"","icon":"http://geoappstore.nieuwegein.nl/app/resources/images/silk/arrow_out.png"}]}

        $.each(Geogem.map.layers, function(i, l) {
            if (l.visibility === true && l.name !== 'extent' && l.params !== undefined) {
                // console.log(l)
                layerAdder(l);
                legendAdder(l);
            }
        })
    return spec = JSON.stringify(spec);
    }

    //var url = printConfig.printURL.replace('print.pdf', 'create.json')

    function createPrint() {
        printExt.loading();
        $.post(printExt.createUrl, { spec: specBuilder()},
            function(response){
                window.location = response.getURL;
            }).fail(function(error){
                console.log(error.responseText);
                alert('Er is helaas iets niet goed gegaan, probeer het nogmaals of herlaadt de pagina.');
                $('.loading-screen').remove();
        }).done(function(){
             $('.loading-screen').remove();
             $('.prtext-pos__container').remove();
             check = 0;
             //if (checkExtentLayer()) {console.log('check');Geogem.map.getLayersByName('extent')[0].removeAllFeatures()}
        });
    }
}});

}

printExt.loading = function(){
    $(document.body).append('<div class="loading-screen no-box"> '+
                            '    <div class="loading-animation no-select">'+
                            '        <div class="animation-text">'+
                            '            <span class="animation-text__let1">L</span>'+
                            '            <span class="animation-text__let2">a</span>'+
                            '            <span class="animation-text__let3">d</span>'+
                            '            <span class="animation-text__let4">e</span>'+
                            '            <span class="animation-text__let5">n</span>'+
                            '            <span class="animation-text__let6">.</span>'+
                            '            <span class="animation-text__let7">.</span>'+
                            '            <span class="animation-text__let8">.</span>'+
                            '        </div>'+
                            '        <div class="loading-animation__animation-right">'+
                            '        </div>'+
                            '        <div class="loading-animation__animation-left">'+
                            '        </div>'+
                            '    </div>'+
                            '</div>')
    $('.loading-screen').addClass('zichtbaar-flex');
 } 
 






