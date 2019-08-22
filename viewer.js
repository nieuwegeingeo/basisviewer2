OpenLayers.Lang.nl = OpenLayers.Util.applyDefaults({
		'Overlays' : 'Informatielagen'
});
OpenLayers.Lang.setCode('nl');

var Geogem = Geogem || {};

Geogem.VERSION = '2017.10.05';

Geogem.Settings = {

 /**
  * Reverse geocoder settings:
  *   default is geoserver.nl GET
  */
  reverseGeocoder: {
	url: location.protocol + '//' + location.hostname + '/geocoder-1.0.1/revgeocoder',
    method: 'POST'
  },

 /**
  * Geocoder settings:
  * Viewer zal adresveld bovenin krijgen met tooltip die te wijzigen is door
  *   gemeente Nieuwegein (in settings.js)
  * Inzoomen op straat kent een bepaalde marge rond extent, en een minimum scale
  *   (instelbaar in settings.js); inzoomen op verblijfsobject kent ook een
  *   bepaalde marge en minimum scale
  * Autocomplete van adresveld is instelbaar; standaard na 3 tekens, 0.5 sec, en max 10 resultaten
  * 40 posities in adresveld voor straat + huisnr
  */
  geocoder: {
    //tooltip: 'Zoek op postcode of straat, met huisnummers.',
    extentMargin: 100,     // postcode en straat
    pointMargin: 20,       // coordinaat van verblijfsobject
    minimumZoomScale: 500,
    autocomplete: {
      minLength: 3,
      delay: 200
    },
    inputSize: 40,

    // nieuwegein geocoder (alleen werkend voor Nieuwegein!)
    // heeft 'autocomplete'
    //url: location.protocol + '//' + location.host + '/geocoder/geocode?',

    // pdok geocoder
    // heeft GEEN 'autocomplete' omdat de pdok geocoder geen wildcards ondersteund
    //url: location.protocol + '//geodata.nationaalgeoregister.nl/geocoder/Geocoder?',
    //type: 'pdok',
    //city: 'nieuwegein',

    // pdok locatieserver V3
    //url: location.protocol + '//geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?',
    //type: 'pdoklocatieserver',
    //city: 'nieuwegein',

    // pdok locatieserver V3
    url: location.protocol + '//geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?',
	type: 'pdoklocatieserver',
	city: 'nieuwegein'
  },



  // NL tileschema PDOK
  //maxExtent: new OpenLayers.Bounds(-65200.96, 242799.04, 375200.96, 683200.96),

  // centrum Geonovum NL tileschema
  // tileOrigin: new OpenLayers.LonLat(155000, 463000),
  // NL tileschema Geonovum
  maxExtent: new OpenLayers.Bounds(-285401.920, 22598.080, 595401.920, 903401.920),

  resolutions: new Array(
	3440.640,
	1720.320,
	860.160,
	430.080,
	215.040,
	107.520,
	53.760,
	26.880,
	13.440,
	6.720,
	3.360,
	1.680,
	0.840,
	0.420,
	0.210,
	0.105,
	0.0525
	),

  restrictedExtent: new OpenLayers.Bounds(130000,445000,140000,455000),

  nieuwegeinExtent: new OpenLayers.Bounds(128253,445498,141747,453226),

  defaultPopupSize: '400,400',

  baseLayers: [
	{
		title: 'Luchtfoto',
        url: location.protocol + '//' + location.hostname + '/mapproxy/service',
		params: {
			layers: 'basisluchtfoto',		// geowebcache layer
			format: 'image/jpeg'
		},
        options: {
            attribution: 'Luchtfoto 2018'
            //transitionEffect:'resize'
        }
    },
	{
		title: 'Kaart',
        url: location.protocol + '//' + location.hostname + '/mapproxy/service',
		params: {
			layers: 'basistopo',   // geowebcache layer
			format: 'image/jpeg'
		},
        options: {
            //transitionEffect:'resize'
        }
	}
  ],

  overLays: [
		// see template app for possibilities
  ],

  /**
   * Let op: url moet eindigen op ? of &
   */
  urlParams: {},

  /**
   * If provide a (fixed) legend, it will be shown in the map
   */
  legendUrl: null,

  /**
   * If provided a infourl, an 'i'-button will be shown, and
   * the info from the url will be shown in sidebar content
   * when clicked on the i-button
   */
  infoUrl: null,

  /**
  * If property 'geolocation'=='locate' or 'track', the geolocation control
  * will be activated and
  * try to do a one time 'find my position' (in case of 'locate')
  * try to track every x seconds (in case of 'track')
  */
  geolocation: false,  // default false, or either 'locate' or 'track'

  /**
   * position flag/icon showing after a geocoding result
   */
  usePositionFlag: true,  // defaulting to true
  keepPositionFlag: false, // to NOT let it fade away after 2 zoom/pans

  controls: [],

  infoTab: null,
  
  featureInfoScreen: false,

};

Geogem.popup = null;

var ua = navigator.userAgent.toLowerCase();
var isAndroid = ua.indexOf("android") > -1;
var isMobile = ua.indexOf("mobile") > -1;
var isIthing = (ua.match(/iphone/i)) || (ua.match(/ipod/i)) || (ua.match(/ipad/i));
if( isAndroid || isMobile || isIthing ) {
	// will only work in apps, NOT in basisviewer2 itself!!
	document.write('<link rel="stylesheet" href="../../basisviewer2/styles/mobile.css" type="text/css" />');
}

Geogem.combine_url_params = function(url, data) {
	if (! isType(data, 'object')) {
        return url;
	}
	return url + (url.indexOf('?') < 0 ? '?' : (url[url.length-1] == '&' ? '' : '&')) + $.param(data);
};

Geogem.openFormulier = function(url){
	// doorsturen
	// in mobiele apparaten in hetzelfde window, op desktop in nieuw window
	if(isMobile){
		location.href = url;
	}
	else {
		// eform openen in nieuw window
		window.open (url, "eform");
	}
};

Geogem.formatAttributes = function(attributes, title, fields) {

    // when this feature holds ONLY null/undefined values return ""
	function isEmpty(_map) {
	   for(var key in _map) {
		  if ( _map[key]) {
			 return false;
		  }
	   }
	   return true;
	}
	if (isEmpty(attributes)){
		return "";
	}

	var html = '';
    if (! fields) {
        // use attribute names if fields are missing
        fields = {};
        for (var field in attributes) {
            fields[field] = field;
        }
    }
	if (title) {
		html += '<h3>'+title+'</h3>';
	}
	if (attributes) {
		//html += '<table border=0 id="attrpopuptable">'
		var row = 0;
		var rowstyle;
        var value;
		for (var field in fields) {
			row++;
			rowstyle = row%2;
            if (field in attributes === false){
                // either wrongly configured fields, OR at this zoomlevel there are other fields?
                // Anyway: ignore
            }
			/*else if (field.substring(0, 5) == 'DATUM') {
				// reorder year, month and date
                console.log(fields[field])
				html += '<tr><td class="first">' + fields[field] + '</td><td class="second">' + attributes[field].substring(8, 10) + '-' + attributes[field].substring(5, 7) + '-' + attributes[field].substring(0, 4) + '</td></tr>';
			}*/
			else if (field.substring(0, 7) == 'snippet') {
				// for KML: NO style attribute
			}
			else if (field.substring(0, 5) == 'style') {
				// for KML: NO style attribute
			}
			else if (field.substring(0, 5) == 'label') {
				// for KML: a label attribute is NOT to be shown in popup
			}
			else if (field.substring(0, 11) == 'description' ) {
				// for KML: NO 'key' in front of information (description is html already)
				html += '<tr><td colspan="2">' + attributes[field] + '</td></tr>';
			}
			else if (field.substring(0, 4) == 'name') {
				// for KML: NO 'name' or 'description' in front of information
				html = '<tr><td colspan="2"><b>'+ attributes[field] + '</b></td></tr>' + html;
				//html += '<tr><td colspan="2"><b>'+ attributes[field] + '</b></td></tr>';
			}
			else if (field.substring(0, 10) == 'visibility') {
				// for KML: NO 'visibility'
			}
			else if (attributes[field] instanceof Object) {
				// for KML from for example qgis
				value = attributes[field]['value'];
				if (value !== undefined){
					if (value.slice(0,4)=='http') {
						// clean url: lets try to make it a link
						value = '<a href="'+value+'" target="_blank">'+value+'</a>';
					}
					html += '<tr class="inforow'+rowstyle+'"><td class="first"><b>'+ attributes[field]['displayName'] +'</b></td class="second"><td>'+ value + '</td></tr>';
				}
			}
			else if (field.substring(0, 4).toUpperCase() == 'FOTO') {
				value = attributes[field];
				// development
				//value = "http://geoserver.nieuwegein.nl/beheer2014fotos/m_reparatieplekken_reparatieplek8.jpg";
				if (value && value.length>5){
					html += '<tr><td colspan="2"><a href="'+value+'" target="basisviewer_foto"><img style="border:0;width:220px;" src="'+value+'"/></a></td></tr>';
				}
			}
			else
			{
				value = attributes[field];
				// config error
				/*if (field in attributes == false){
					//alert("Configuratie fout: '"+field+"' is niet een attribuut van deze laag");
				}
				else {*/
					// value could be null
					if (value === undefined){
						value = ' - ';
					}
					// tricky: value can be a boolean: like false; make a string from it for this test
					else if ((""+value).slice(0,4)=='http') {
						// clean url: lets try to make it a link
						value = '<a href="'+value+'" target="_blank">'+value+'</a>';
					}
					// tricky: value can be a boolean: like false; make a string from it for this test
					else if ((""+value).slice(0,10)=='data:image') {
						// clean url: lets try to make it a link
						value = '<img src="'+value+'" width="100%"/>';
					}
					html += '<tr class="inforow'+rowstyle+'"><td class="first">' + fields[field] + '</td><td class="second">' + value + '</td></tr>';
				//}
			}
		}
		html = '<table border=0 id="attrpopuptable">'+html+'</table><br/>';
	}
    return html;
};

if (location.search !== '') {
	var params = location.search.substr(1).split('&');
	for (var i = 0; i < params.length; i++) {
		var pos = params[i].indexOf('=');
		if (pos > 0) {
			var value = params[i].substr(pos + 1);
			if (value == 'true') {
				value = true;
			}
			else if (value == 'false') {
				value = false;
			}
			else if (value.match(/^[0-9]+$/)) {
				value = parseInt(value);
			}
			else if (value.match(/^\-?[0-9]*\.[0-9]*$/)) {
				value = parseFloat(value);
			}
			Geogem.Settings.urlParams[params[i].substr(0, pos)] = value;
		}
	}
}

/**
 * Zorg dat OpenLayers alleen voor zichtbare lagen (in-range) de feature info
 * opvraagt. Dit gebeurd door hieronder calculateInRange() te gebruiken samen met
 * getVisibility().
 */

OpenLayers.Control.WMSGetFeatureInfo.prototype.findLayers = function() {

    var candidates = this.layers || this.map.layers;
    var layers = [];
    var layer, url;
    for(var i=0, len=candidates.length; i<len; ++i) {
        layer = candidates[i];
        if(layer instanceof OpenLayers.Layer.WMS &&
           (!this.queryVisible || (layer.getVisibility() && layer.calculateInRange()))) {
            url = layer.url instanceof Array ? layer.url[0] : layer.url;
            // if the control was not configured with a url, set it
            // to the first layer url
            if (this.drillDown === false && !this.url) {
                this.url = url;
            }
            if (this.drillDown === true || this.urlMatches(url)) {
                layers.push(layer);
            }
        }
    }
    return layers;

};

/*
  We want to be able to see only ONE layer viewable at a time
  (so like the datalayers are a radio group)
  You can do that by setting singleDataLayerView to true in a layerSwitcher instance:
  Like:
    layermanager = new OpenLayers.Control.LayerSwitcher();
	layermanager.singleDataLayerView=true;
*/
OpenLayers.Control.LayerSwitcher.prototype.onButtonClick = function(evt) {
	// we remove all popups and make sure the sidebar doesn't open!
    var ls_popup = true;
	Geogem.removeAllPopups(ls_popup);
	var button = evt.buttonElement;
	if (button === this.minimizeDiv) {
		this.minimizeControl();
	} else if (button === this.maximizeDiv) {
		this.maximizeControl();
	} else if (button._layerSwitcher === this.id) {
		if (button["for"]) {
			button = document.getElementById(button["for"]);
		}
		if (!button.disabled) {
			if (button.type == "radio") {
				button.checked = true;
				this.map.setBaseLayer(this.map.getLayer(button._layer));
			} else {
				var checked = !button.checked;
				if(checked && this.singleDataLayerView) {
					for(var i=0, len=this.dataLayers.length; i<len; i++) {
						var layerEntry = this.dataLayers[i];
						if (button._layer==layerEntry.inputElem._layer){
							layerEntry.layer.setVisibility(true);
						}
						else{
							layerEntry.layer.setVisibility(false);
						}
					}
				}else if(this.singleDataLayerView){

				}
				else{
					button.checked = !button.checked;
				}
                //this.updateMap();
				this.updateMap(this.map.getLayer(button._layer));
			}
		}
	}
};

Geogem.onFeatureSelect = function(e) {

	var feature = e.feature;
	var layer = e.object;

	var content = null;
	var attributes = null;
	if (feature.cluster) {
		if (feature.attributes.count > 1) {
			content += 'Aantal features: ' + feature.attributes.count;
		}
		else {
			attributes = feature.cluster ? feature.cluster[0].attributes : feature.attributes;
		}
	}
	else {
		attributes = feature.attributes;
	}
	// layer can have a attribute 'geogem_fields', set in settings/init of the layer
	if (layer && layer.geogem_fields){
		content = Geogem.formatAttributes(attributes, '', layer.geogem_fields);
	}
	else{
		content = Geogem.formatAttributes(attributes);
        
	}

	if (content) {

		var popupSize = null;
		var tmp = '$POPUP_SIZE$';
		if (tmp === '' || tmp.indexOf('$') >= 0) {
			tmp = Geogem.Settings.defaultPopupSize;
		}
		tmp = tmp.split(',');
		if (tmp.length == 2) {
			popupSize = new OpenLayers.Size(parseInt(tmp[0]), parseInt(tmp[1]));
            
		}
		else {
			alert('Fout bij instellen popupafmeting');
		}

		// remove all (old) popups
		Geogem.removeAllPopups();

		if ($('#sidebar').length === 0) {
			// new popup
            
			Geogem.popup = null;
			Geogem.popup = new OpenLayers.Popup.FramedCloud("geoviewerpopup", // id
			feature.geometry.getBounds().getCenterLonLat(), // lonlat
                        popupSize, // contentSize
                        content, // contentHTML
			null, // anchor
			true, // closeBox
			Geogem.onPopupClose // closeBoxCallback
			);

			if (popupSize) {
				Geogem.popup.maxSize = popupSize;
			}
			feature.popup = Geogem.popup;
			Geogem.popup.feature = feature;
			this.map.addPopup(Geogem.popup);
		}
		else{
			// sidebar
			Geogem.showSidebarContent(content);

		}
	}
};

Geogem.onPopupClose = function(e) {
	//console.log(Geogem.popup.feature);
	//Geogem.removeAllPopups();
	Geogem.selectControl.unselect(Geogem.popup.feature);
};

Geogem.onFeatureUnselect = function(e) {
	var feature = e.feature;
	var popup = feature.popup;
	if (!popup) {
		//alert('feature popup is null');
		OpenLayers.Console.warn('feature popup is null');
		var popupElement = document.getElementById("geoviewerpopup");
		var map = feature.layer.map;
		if (map.popups.length == 1 && map.popups[0].div === popupElement) {
			popup = map.popups[0];
		}
	}

	if (popup !== null && popup.map !== null && feature.layer.map.popups.length > 0) {
		feature.layer.map.removePopup(popup);
		popup.destroy();
	}
	feature.popup = null;
};

Geogem.removeAllPopups = function(ls_popup) {
	if (Geogem.map.popups.length > 0) {
		for (var i = 0; i < Geogem.map.popups.length; i++) {
			Geogem.map.removePopup(Geogem.map.popups[i]);
		}
	}

	if ($('#sidebar').length>0 && $('#sidebar').hasClass('sidebarhide')){
        if (ls_popup !== true) {
            //$('#sidebar').toggleClass('sidebarhide');
        }
	}
};

Geogem.handleLoadStart = function(e) {
	Geogem.removeAllPopups();
};

/*
	config = {
		type: 'kml',
		title: 'Dit is een kml laag',
		protocolOptions: {
				url: "kunstroute.kml"
				,format: new OpenLayers.Format.KML({
					kmlns: "http://earth.google.com/kml/2.2",
					extractStyles: true,
					extractAttributes: true })
		}
	}

*/
Geogem.createKmlLayer = function(config) {
	// default kml protocol options:
	// extract styles and attributes
	// kmlns: "http://earth.google.com/kml/2.2"
	// to be overridden in settings
	var kmlProtocolOptions = {
			url: "",
			format: new OpenLayers.Format.KML({
				kmlns: "http://earth.google.com/kml/2.2",
				extractStyles:true,
				extractAttributes: true })
		};
	OpenLayers.Util.extend(kmlProtocolOptions, config.protocolOptions);

	// defining default and select styles for KML layers
	var style = {
		externalGraphic: '/basisviewer2/img/marker.png',
		cursor: 'pointer',
		graphicTitle: " ${name} ",
		graphicWidth: 24,
		graphicHeight: 32,
		graphicXOffset: -9,
		graphicYOffset: -30,
		strokeColor: '#88179F',
		strokeOpacity: 0.6,
		strokeWidth: 4,
		strokeDashstyle:'solid',   // solid | dot | dash | dashdot | longdash | longdashdot | solid
		labelOutlineWidth: 3
	};

	if (config.style){
		OpenLayers.Util.extend(style, config.style);
	}

	var styleOptions = {};

	// if there is a label config
	if (config.labels) {
		 // label - {String} The text for an optional label. For browsers that use the canvas renderer, this requires either
		 //     fillText or mozDrawText to be available.
		 // labelAlign - {String} Label alignment. This specifies the insertion point relative to the text. It is a string
		 //     composed of two characters. The first character is for the horizontal alignment, the second for the vertical
		 //     alignment. Valid values for horizontal alignment: "l"=left, "c"=center, "r"=right. Valid values for vertical
		 //     alignment: "t"=top, "m"=middle, "b"=bottom. Example values: "lt", "cm", "rb". Default is "cm".
		 // labelXOffset - {Number} Pixel offset along the positive x axis for displacing the label. Not supported by the canvas renderer.
		 // labelYOffset - {Number} Pixel offset along the positive y axis for displacing the label. Not supported by the canvas renderer.
		 // labelSelect - {Boolean} If set to true, labels will be selectable using SelectFeature or similar controls.
		 //     Default is false.
		 // labelOutlineColor - {String} The color of the label outline. Default is 'white'. Only supported by the canvas & SVG renderers.
		 // labelOutlineWidth - {Number} The width of the label outline. Default is 3, set to 0 or null to disable. Only supported by the canvas & SVG renderers.
		 // fontColor - {String} The font color for the label, to be provided like CSS.
		 // fontOpacity - {Number} Opacity (0-1) for the label
		 // fontFamily - {String} The font family for the label, to be provided like in CSS.
		 // fontSize - {String} The font size for the label, to be provided like in CSS.
		 // fontStyle - {String} The font style for the label, to be provided like in CSS.
		 // fontWeight - {String} The font weight for the label, to be provided like in CSS.
		var labelProps = {
			label: "${"+config.labels+"}",
			labelSelect: true,
			labelAlign: "lt",
			labelXOffset: "5",
			fontColor: "#000000",
			fontFamily: "Arial,Helvetica,sans-serif",
			fontWeight: "bold",
			fontSize: "11px",
			labelOutlineColor: "white",
			labelOutlineWidth: 5
		};

		if (config.labels=='name'){
			labelProps.labels = "${"+config.labels+"}";
		}
		else{
			// KML labels can also come from the extended attributes
			// we need a context plus function then:
			// http://gis-lab.info/share/DR/sandbox/kml-markers.html
			labelProps.label = "${getLabel}";
			labelProps.context = {};
			labelProps.context.getLabel = function(f){
					var lbl = '';
					if (f.attributes[config.labels]){
						lbl = f.attributes[config.labels].value;
					}
					return lbl;
				};
		}
		OpenLayers.Util.applyDefaults( style, labelProps );
		styleOptions = {context: labelProps.context};
	}

	if (config.styleOptions){
		OpenLayers.Util.extend(styleOptions, config.styleOptions);
	}

	var defaultStyle = new OpenLayers.Style(style, styleOptions);

	var selectStyle = {
		externalGraphic: '/basisviewer2/img/marker.png',
		cursor: 'pointer',
		graphicTitle: " ${name} ",
		graphicWidth: 36,
		graphicHeight: 48,
		graphicXOffset: -12,
		graphicYOffset: -46,
		strokeColor: '#88179F',
		strokeOpacity: 0.8,
		strokeWidth: 6,
		strokeDashstyle:'solid'   // solid | dot | dash | dashdot | longdash | longdashdot | solid
	};

	var styleMap = new OpenLayers.StyleMap(OpenLayers.Feature.Vector.style);
	OpenLayers.Util.extend(styleMap.styles.default, defaultStyle);
	OpenLayers.Util.extend(styleMap.styles.select, selectStyle);

	// if user has overridden one of the style props, include here
	/*
	if (Geogem.Settings.kmlLayer && Geogem.Settings.kmlLayer.defaultStyle){
		styleMap = OpenLayers.Util.applyDefaults(Geogem.Settings.kmlLayer.defaultStyle, styleMap.styles['default']);
	}
	if (Geogem.Settings.kmlLayer && Geogem.Settings.kmlLayer.selectStyle){
		OpenLayers.Util.extend(styleMap.styles['select'], Geogem.Settings.kmlLayer.selectStyle);
	}*/

	var options = {
		styleMap: styleMap,
		projection: new OpenLayers.Projection("EPSG:4326"),
		strategies: [new OpenLayers.Strategy.Fixed()],
		protocol: new OpenLayers.Protocol.HTTP( kmlProtocolOptions )
	};

	OpenLayers.Util.extend(options, config.options);
	var kml = new OpenLayers.Layer.Vector(config.title, options);
	// sld based styling
	if(config.sld){
		OpenLayers.Request.GET({
			url: config.sld,
			async: false,
			success: function(req) {
				var format = new OpenLayers.Format.SLD();
				var sld = format.read(req.responseXML || req.responseText);
				for (var l in sld.namedLayers) {
					var styles = sld.namedLayers[l].userStyles, style;
					for (var i=0,ii=styles.length; i<ii; ++i) {
						style = styles[i];
						//if (style.isDefault) {
							//kml.styleMap.styles["default"] = style;
							//OpenLayers.Util.extend(kml.styleMap.styles["default"], style);
							OpenLayers.Util.extend(style, kml.styleMap.styles["default"]);
							break;
						//}
					}
				}
			},
			failure: function(req) {
				alert("Fout bij het ophalen van het style bestand (sld): '"+config.sld+"'" );
			}
		});
	}

	// if the kml style is NOT parsed there is no tooltip,
	// so here we add tooltip when adding the features
	kml.events.on({
		"featureadded": function(evt) {
			var tt = ' '+evt.feature.attributes.name+' ';
			if(evt.feature && evt.feature.style){
				evt.feature.style.title=tt;
				evt.feature.style.graphicTitle=tt;
			}
		}});
	// always select control for KML layer?
	if (config.infopopup === undefined || config.infopopup === true) {
	//if (true) {
		Geogem.selectControl = new OpenLayers.Control.SelectFeature(
			kml,
			{
				clickout: true,
				multiple: false,
				hover: false,
				displayClass: 'olControlNavigation'
			});
			kml.events.on({
				'featureselected': Geogem.onFeatureSelect,
				'featureunselected': Geogem.onFeatureUnselect
		});
		// without this two lines, we cannot pan a map with a overlay filled with polygons:
		Geogem.selectControl.handlers.feature.stopDown = false;
		Geogem.selectControl.handlers.feature.stopUp = false;
		Geogem.map.addControl(Geogem.selectControl);
		Geogem.selectControl.activate();
	}

	return kml;
};

Geogem.createWfsLayer = function(config) {

	// to be overridden in settings
	var wfsProtocolOptions = {
		    version: '1.1.0',
            srsName: 'EPSG:28992',
			url: '',
			featureType: '',
			featurePrefix: '',
			featureNS: ''
			//,geometryName: 'geom'
		};
	OpenLayers.Util.extend(wfsProtocolOptions, config.protocolOptions);

	// defining default and select styles for WFS layers
	var style = {
		externalGraphic: '/basisviewer2/img/marker.png',
		cursor: 'pointer',
		graphicTitle: " ${name} ",
		graphicWidth: 24,
		graphicHeight: 32,
		graphicXOffset: -9,
		graphicYOffset: -30,
		strokeColor: '#88179F',
		strokeOpacity: 0.6,
		strokeWidth: 4,
		strokeDashstyle:'solid',   // solid | dot | dash | dashdot | longdash | longdashdot | solid
		labelOutlineWidth: 3
	};

	if (config.style){
		OpenLayers.Util.extend(style, config.style);
	}

	var styleOptions = {};

	// if there is a label config
	if (config.labels) {
		 // label - {String} The text for an optional label. For browsers that use the canvas renderer, this requires either
		 //     fillText or mozDrawText to be available.
		 // labelAlign - {String} Label alignment. This specifies the insertion point relative to the text. It is a string
		 //     composed of two characters. The first character is for the horizontal alignment, the second for the vertical
		 //     alignment. Valid values for horizontal alignment: "l"=left, "c"=center, "r"=right. Valid values for vertical
		 //     alignment: "t"=top, "m"=middle, "b"=bottom. Example values: "lt", "cm", "rb". Default is "cm".
		 // labelXOffset - {Number} Pixel offset along the positive x axis for displacing the label. Not supported by the canvas renderer.
		 // labelYOffset - {Number} Pixel offset along the positive y axis for displacing the label. Not supported by the canvas renderer.
		 // labelSelect - {Boolean} If set to true, labels will be selectable using SelectFeature or similar controls.
		 //     Default is false.
		 // labelOutlineColor - {String} The color of the label outline. Default is 'white'. Only supported by the canvas & SVG renderers.
		 // labelOutlineWidth - {Number} The width of the label outline. Default is 3, set to 0 or null to disable. Only supported by the canvas & SVG renderers.
		 // fontColor - {String} The font color for the label, to be provided like CSS.
		 // fontOpacity - {Number} Opacity (0-1) for the label
		 // fontFamily - {String} The font family for the label, to be provided like in CSS.
		 // fontSize - {String} The font size for the label, to be provided like in CSS.
		 // fontStyle - {String} The font style for the label, to be provided like in CSS.
		 // fontWeight - {String} The font weight for the label, to be provided like in CSS.
		var labelProps = {
			label: "${"+config.labels+"}",
			labelSelect: true,
			labelAlign: "lt",
			labelXOffset: "5",
			fontColor: "#000000",
			fontFamily: "Arial,Helvetica,sans-serif",
			fontWeight: "bold",
			fontSize: "11px",
			labelOutlineColor: "white",
			labelOutlineWidth: 5
		};

		if (config.labels=='name'){
			labelProps.labels = "${"+config.labels+"}";
		}
		else{
			// KML labels can also come from the extended attributes
			// we need a context plus function then:
			// http://gis-lab.info/share/DR/sandbox/kml-markers.html
			labelProps.label = "${getLabel}";
			labelProps.context = {};
			labelProps.context.getLabel = function(f){
					var lbl = '';
					if (f.attributes[config.labels]){
						lbl = f.attributes[config.labels].value;
					}
					return lbl;
				};
		}
		OpenLayers.Util.applyDefaults( style, labelProps );
		styleOptions = {context: labelProps.context};
	}

	if (config.styleOptions){
		OpenLayers.Util.extend(styleOptions, config.styleOptions);
	}

	var defaultStyle = new OpenLayers.Style(style, styleOptions);

	var selectStyle = {
		externalGraphic: '/basisviewer2/img/marker.png',
		cursor: 'pointer',
		graphicTitle: " ${name} ",
		graphicWidth: 36,
		graphicHeight: 48,
		graphicXOffset: -12,
		graphicYOffset: -46,
		strokeColor: '#88179F',
		strokeOpacity: 0.8,
		strokeWidth: 6,
		strokeDashstyle:'solid'   // solid | dot | dash | dashdot | longdash | longdashdot | solid
	};

	var styleMap = new OpenLayers.StyleMap(OpenLayers.Feature.Vector.style);
	OpenLayers.Util.extend(styleMap.styles.default, defaultStyle);
	OpenLayers.Util.extend(styleMap.styles.select, selectStyle);

	// if user has overridden one of the style props, include here
	/*
	if (Geogem.Settings.kmlLayer && Geogem.Settings.kmlLayer.defaultStyle){
		styleMap = OpenLayers.Util.applyDefaults(Geogem.Settings.kmlLayer.defaultStyle, styleMap.styles['default']);
	}
	if (Geogem.Settings.kmlLayer && Geogem.Settings.kmlLayer.selectStyle){
		OpenLayers.Util.extend(styleMap.styles['select'], Geogem.Settings.kmlLayer.selectStyle);
	}*/

	var options = {
		styleMap: styleMap,
		strategies: [new OpenLayers.Strategy.BBOX()],
		protocol: new OpenLayers.Protocol.WFS( wfsProtocolOptions )
	};

	OpenLayers.Util.extend(options, config.options);

	var wfs = new OpenLayers.Layer.Vector(config.title, options);

	// sld based styling
	if(config.sld){
		OpenLayers.Request.GET({
			url: config.sld,
			async: false,
			success: function(req) {
				var format = new OpenLayers.Format.SLD();
				var sld = format.read(req.responseXML || req.responseText);
				for (var l in sld.namedLayers) {
					var styles = sld.namedLayers[l].userStyles, style;
					for (var i=0,ii=styles.length; i<ii; ++i) {
						style = styles[i];
						//if (style.isDefault) {
							//kml.styleMap.styles["default"] = style;
							//OpenLayers.Util.extend(kml.styleMap.styles["default"], style);
							OpenLayers.Util.extend(style, wfs.styleMap.styles["default"]);
							break;
						//}
					}
				}
			},
			failure: function(req) {
				alert("Fout bij het ophalen van het style bestand (sld): '"+config.sld+"'" );
			}
		});
	}


	// if the kml style is NOT parsed there is no tooltip,
	// so here we add tooltip when adding the features
	wfs.events.on({
		"featureadded": function(evt) {
			var tt = ' '+evt.feature.attributes.name+' ';
			if(evt.feature && evt.feature.style){
				evt.feature.style.title=tt;
				evt.feature.style.graphicTitle=tt;
			}
		}});
	// always select control for KML layer
	Geogem.selectControl = new OpenLayers.Control.SelectFeature(
		wfs,
		{
			clickout: true,
			multiple: false,
			hover: false,
			displayClass: 'olControlNavigation'
		});
		wfs.events.on({
		'featureselected': Geogem.onFeatureSelect,
		'featureunselected': Geogem.onFeatureUnselect
	});
	// without this two lines, we cannot pan a map with a overlay filled with polygons:
	Geogem.selectControl.handlers.feature.stopDown = false;
    Geogem.selectControl.handlers.feature.stopUp = false;
	Geogem.map.addControl(Geogem.selectControl);
	Geogem.selectControl.activate();
	return wfs;
};


Geogem.findWMSLayer = function(layername) {
	var layers = Geogem.map.layers;
	var layer;
	for (var i=0; i<layers.length; i++)
		if (layers[i].params && layers[i].params.LAYERS){{
			// layers[i].params.LAYERS can be a list (layer1,layer2,layer3)
			var layersparam = layers[i].params.LAYERS.split(',');
			if($.inArray(layername, layersparam)>=0){
			//if (layers[i].params.LAYERS==layersParam){
				layer = layers[i];
				break;
			}
		}
	}
	if (!layer){
		//alert('Configuratie fout. Laagnaam niet gevonden. Workspace?');
	}
	return layer;
};

Geogem.createWMSLayer = function(config) {
	var params = {
		transparent: 'true',
		format: 'image/png'
	};
	OpenLayers.Util.extend(params, config.params);
	var options = {
		isBaseLayer: false,
		hover: false  // defaulting to NO hover on getfeatureinfo
	};
	OpenLayers.Util.extend(options, config.options);
	var lyr = new OpenLayers.Layer.WMS(
		config.title,
		config.url,
		params,
		options
	);
	// setting attribuut mapping fields in layer object as 'geomgemfields'
	if (config.fields){
		lyr.geogemfields = config.fields;  // fields can be fields of several layers
	}

	if (config.wmsinfoformat /*&& config.wmsinfoformat != 'none'*/) {
        //var infoformat = 'text/html';//layerConfigObj.wmsinfoformat; // text/plain, application/vnd.ogc.gml, application/vnd.ogc.gml/3.1.1, text/html
		var infoformat = config.wmsinfoformat;
        var popupContent = '';
		if(this.map.infoControl){
			this.map.infoControl.layers.push(lyr);
		}
		else {
			var info = new OpenLayers.Control.WMSGetFeatureInfo({
				url: config.url,
				infoFormat: infoformat,
				hover: options.hover,
				title: 'Info voor '+config.title,
				layers: [lyr],
				queryVisible: true,
				eventListeners: {
					beforegetfeatureinfo: function() {
						// cleanup popups OR sidebar content
						$('#sidebar_content').html('');
						while( this.map.popups.length ) {
							this.map.removePopup(this.map.popups[0]);
						}
                        var featureInfoControl = Geogem.map.getControlsBy('displayClass','olControlWMSGetFeatureInfo')[0];
                        if (Geogem.Settings.featureInfoScreen === true) {featureInfoControl.vendorParams.FEATURE_COUNT = 1000}
                        var filterString = '';
                        delete featureInfoControl.vendorParams.CQL_FILTER;
                        $.each(Geogem.map.getControlsBy('displayClass','olControlWMSGetFeatureInfo')[0].layers, function(index, layer) {
                            //console.log(layer)
                            if (filterString === '' && layer.visibility === true) {
                                if (layer.params.CQL_FILTER === undefined ) {                                  
                                    if (layer.params.LAYERS.match(',')) {
                                        layerArray = layer.params.LAYERS.split(',');
                                        filterString = 'INCLUDE';
                                        for (i=0;i<layerArray.length; i++) {
                                            filterString = filterString + ';INCLUDE'
                                        }
                                    } else {
                                        filterString = 'INCLUDE';
                                    }
                                } else {
                                    filterString = layer.params.CQL_FILTER;
                                }                            
                            } else if (filterString !== '' && layer.visibility === true){                                    
                                if (layer.params.CQL_FILTER === undefined) {
                                   if (layer.params.LAYERS.match(',')) {
                                        layerArray = layer.params.LAYERS.split(',');
                                        for (i=0;i<layer.params.LAYERS; i++) {
                                            filterString = filterString + ';INCLUDE;'
                                        }
                                    } else {
                                        filterString = filterString + ';INCLUDE';
                                    }                                   
                                } else {
                                    filterString = filterString + ';' + layer.params.CQL_FILTER;
                                }
                                
                            }
                        })
                        featureInfoControl.vendorParams.CQL_FILTER = filterString;
					},
					getfeatureinfo: function(event) {
						popupContent = '';
                        var layerName = '--';
                        var i;
						// reset cursor
						OpenLayers.Element.removeClass(Geogem.map.viewPortDiv, "olCursorWait");

						// optional application getfeatureinfo function
						if (Geogem.getfeatureinfo){
							popupContent = Geogem.getfeatureinfo(event, popupContent);
							//if(){return;}
						}
						else if (infoformat == 'text/plain'){
							popupContent = '<pre>'+event.text+'</pre>';
						}
						else if (infoformat == 'text/html'){
							//console.log(popupContent)
							var test = event.text.split(/(<body>|<\/body>)/ig)[2];
							// popupContent is already html, but can have an empty body element or a body element with some white space chars
							if (test.replace(/ /g,'').replace(/\r\n/g, '').trim().length>0){
								popupContent = event.text;
							}
						}
						else if (infoformat == 'application/vnd.ogc.gml'){ 
                            var handledFeatureTypes=[];
							for (i=0;i<event.features.length; i++){
								var featureType = event.features[i].gml.featureNSPrefix+':'+event.features[i].gml.featureType;
								var layer = Geogem.findWMSLayer(featureType);
                                if (layer === undefined){
                                    // try to search for layer WITHOUT featureNSPrefix
                                    featureType = event.features[i].gml.featureType;
                                    layer = Geogem.findWMSLayer(featureType);
                                }
								if (layer) {// some services do not have featureType etc in service response
									layerName = layer.name;
								} else {
									layerName = "--";
								}
								if ($.inArray(featureType, this.noinfolayers)>=0) {
									if($.inArray(featureType, handledFeatureTypes)<0){
										popupContent += "<h3>Geen info voor '"+layerName+"'</h3><br/>";
										handledFeatureTypes.push(featureType);
									}
								} else if (Geogem.Settings.featureInfoScreen === true) {
                                    //console.log(event.features[i].attributes,layerName,fields)
                                    var layerFields = layer.geogemfields[layer.params.LAYERS];
                                    // console.log(layer)
                                    // console.log(layerFields)
                                    var layerID = event.features[i].type;
                                    //console.log(event.features[i])
                                    var popUpRemove = function() {
                                        $('.popup__container').remove();
                                    } 
                                    
                                    if ($('.featureinfo-popup').length === 0 || typeof $('.featureinfo-popup') === undefined) {
                                        
                                        $('#map').append(
                                            '<div class="container popup__container border-box" style="z-index: 1009;">'+
                                            '<div class="featureinfo-popup border-ng-dik border-round">'+
                                            '<div class="featureinfo-close-button"><span>&#10060;</span></div>'+
                                            '<div class="tab-container"></div>' +
                                            '<div class="table-group"></div>' +
                                            '</div></div>'
                                         );
                                         
                                         $('.featureinfo-close-button').click(popUpRemove);
                                    }
                                    
                                    if ($('.table-container.'+layerID+'').length === 0 || typeof $('table-container.'+layerID+'') === undefined) {
                                        $('.table-group').append(
                                            '<div class="table-container ' + layerID + ' border-ng-dik">' + 
                                            '<table class="featureinfo-table ' + layerID + '"><tbody></tbody></table>'+
                                            '</div>'
                                        );
                                        $('.tab-container').append(
                                            '<div class="table-tab ' + layerID + '">' + 
                                            '<span>' + layerName + '</span>' +
                                            '</div>'
                                        );
                                        var tableHead = '<tr>';
                                        var tableRow = '<tr>';
                                        for (var key in layerFields) {
                                            if (layerFields !== undefined && key in event.features[i].attributes) {
                                                var fieldName = layerFields[key];
                                                tableHead = tableHead + '<th>'+fieldName+'</th>';
                                                tableRow = tableRow + '<td>' + event.features[i].attributes[key] + '</td>';
                                            } else if (layerFields !== undefined && !(key in event.features[i].attributes)) {
                                                var fieldName = layerFields[key];
                                                tableHead = tableHead + '<th>'+fieldName+'</th>';
                                                tableRow = tableRow + '<td>&nbsp;</td>';
                                            }
                                        }
                                        $('.featureinfo-table.' + layerID + ' tbody').append(tableHead+ '</tr>').append(tableRow+ '</th>')
                                        
                                        if ($('.featureinfo-table.' + layerID)[0].clientWidth > $('.featureinfo-popup').width()) {
                                            $('.featureinfo-popup').width(tableDivWidthtableDivWidth = $('.featureinfo-table.' + layerID)[0].clientWidth + 40);
                                        }
                                    } else {
                                        var tableRow = '<tr>';
                                        for (var key in layerFields) {
                                            if (layerFields !== undefined && key in event.features[i].attributes) {
                                                var fieldName = layerFields[key];
                                                tableRow = tableRow + '<td>' + event.features[i].attributes[key] + '</td>';
                                            } else if (layerFields !== undefined && !(key in event.features[i].attributes)) {
                                                var fieldName = layerFields[key];
                                                tableRow = tableRow + '<td>&nbsp;</td>';
                                            }
                                        }
                                        $('.featureinfo-table.' + layerID + ' tbody').append(tableRow+ '</th>')
                                    }

                                    
                                    
                                    $('.table-group').children(':first').removeClass('inactive').addClass('active').siblings().addClass('inactive').removeClass('active');
                                    $('.tab-container').children(':first').addClass('active').siblings();
                                    
                                    //css('width',tableDivWidth + 32)

                                    $('.table-tab').click(function() {
                                        var classSelector = $(this).attr('class').split(' ');
                                        if (!$(this).hasClass('active')) {
                                            $(this).addClass('active').siblings().removeClass('active');
                                            $('.table-container.' + classSelector[1]).removeClass('inactive').addClass('active').siblings().addClass('inactive').removeClass('active');
                                        }
                                    })
                                    
                                    $(function() {
                                        $(document).unbind('keyup');
                                        $(document).bind('keyup', function(e) {
                                            if (e.keyCode === 27 ) {
                                                popUpRemove();
                                                $(document).unbind('keyup');
                                                
                                            }
                                        });
                                    });
                                } else {
									var fields = null;
									if(layer.geogemfields && layer.geogemfields[featureType]){
										fields = layer.geogemfields[featureType];
									}                                  
									popupContent += Geogem.formatAttributes(
										event.features[i].attributes,
										layerName,
										fields
									);
								}
							}
                            
						}
						else if (infoformat == 'application/vnd.ogc.wms_xml'){
							for (i=0;i<event.features.length; i++){
								popupContent += Geogem.formatAttributes(
									event.features[i].attributes,
									layerName
								);
							}
						}
						if (popupContent.length > 0){
							$('#featurePopup').show();
							if ($('#featurePopup').length>0){
								$('#featurePopup_contentDiv').append(popupContent);
								this.map.popups[0].updateSize();
							}
							else if ($('#sidebar').length === 0) {

								var popupSize = null;

								// setting a popup size (nor maxsize) does not really work for
								// FramedCloud popups, popup is resized anyway
								if (Geogem.Settings.defaultPopupSize) {
									var tmp = Geogem.Settings.defaultPopupSize.split(',');
									if (tmp.length == 2) {
										popupSize = new OpenLayers.Size(parseInt(tmp[0]), parseInt(tmp[1]));                            
									}
									else {
										alert('Fout bij instellen popupafmeting');
									}
								}

								var popup = new OpenLayers.Popup.FramedCloud(
									"featurePopup", //title
									this.map.getLonLatFromPixel(event.xy),
									popupSize,
									popupContent,
									null,
									true
								);                              
								this.map.addPopup(popup);
							}
							else{
								Geogem.showSidebarContent(popupContent);
							}
						}
					}
				}
			});

			var buffer = 5;
			if( isAndroid || isMobile || isIthing ) { buffer = 20;} // we default to a higher buffer then OL-default (5) because of tablet use (mostly points)
			if (config.params.buffer){
				buffer = config.params.buffer;
			}
			info.vendorParams = {
				buffer:buffer,
			};

			this.map.addControl(info);
			this.map.infoControl = info;
			info.noinfolayers = [];
			info.activate();
		}
		if (infoformat=='none'){
			this.map.infoControl.noinfolayers.push(config.params.layers);
		}
	}
	return lyr;
};

Geogem.showSidebarContent = function(content) {
	$('#sidebar_content').html(content);
	// showing getfeatureinfo, then hide the General Info
	$('#sidebar_content2_head').addClass('folded');
	$('#sidebar_content2_data').addClass('sidebar_content2_hide');
	$('#sidebar_content').show();
	$('#sidebar').show();
	if ($('#sidebar').hasClass('sidebarhide')){
		$('#sidebarShowHide').click();
	}
};

Geogem.showSidebarContent2 = function(content) {
	$('#sidebar_content2_data').html(content);
    	$('#sidebar_content').hide();
	$('#sidebar').show();
	if ($('#sidebar').hasClass('sidebarhide')){
		$('#sidebarShowHide').click();
	}
};

Geogem.showSidebar = function(show) {
	if (show === undefined || show){
        $('#sidebar').show();
		if ($('#sidebar').hasClass('sidebarhide')){
			$('#sidebarShowHide').click();
		}
		// else: already visible
	}
	else { // show = false
		if(!$('#sidebar').hasClass('sidebarhide')){
			$('#sidebarShowHide').click();
		}
	}
};

Geogem.createLegendDownloadBar = function() {
	if ($('#legend').length>0){
		return; // there is already a legend or download
	}
	$('#map').append('<div id="legend">'+
	'<div id="legendhead"><h3>Legenda</h3>'+
	'  <div id="legendShowHide" class="legendMinimize"></div>'+
	'</div></div>');
	// attach show hide click
	$('#legendhead').click(function(){
		$('#legendImage').toggle();
		$('#downloadbar').toggle();
		// below is needed for firefox (we set a big margin to make the closebutton better clickable on touch devices)
		if ($('#legendImage').is(":visible") || $('#downloadbar').is(":visible")){
			$('#legend').css('overflow-y', 'auto');
		}
		else{
			$('#legend').css('overflow-y', 'hidden');
		}
		$('#legendShowHide').toggleClass('legendMinimize').toggleClass('legendMaximize');
	});
};

Geogem.addDownloadButton = function(url, icon, tooltipOrTitle, onePerLine){
	// check/create a legend/downloadbar if needed
	Geogem.createLegendDownloadBar();
	// check create download part if needed
	if ($('#downloadbar').length === 0) {
		var title = "Downloads";
		if ($('#legendImage').length === 0) {
			$('#legendhead h3').html(title);
			title = "";  // we already set title in legendhead
		}
		else{
			$('#legendhead h3').html($('#legendhead h3').html()+' / '+title);
		}
		$('#legend').append('<div id="downloadbar"><h3>'+title+'</h3></div>');
	}
	// append actual image plus link
	if (onePerLine){
		// smaller icon + title, one line per download
	    $('#downloadbar').append('<a href="'+url+'" target="_blank"><img style="height:30px;" src="'+icon+'" title="'+tooltipOrTitle+'" /></a>');
		$('#downloadbar').append('<span style="font-size:80%">&nbsp;'+tooltipOrTitle+'</span><br/>');
	}
	else{
		// big icon only
		$('#downloadbar').append('<a href="'+url+'" target="_blank"><img src="'+icon+'" title="'+tooltipOrTitle+'" /></a>');
	}
};

Geogem.createWMTSLayer = function(layerConfigObj) {

	// From WMTS openlayers example:
	// If tile matrix identifiers differ from zoom levels (0, 1, 2, ...)
	// then they must be explicitly provided.
    var matrixIds = new Array(26);
	for (var i=0; i<26; ++i) {
		matrixIds[i] = layerConfigObj.matrixSet+':' + i;
	}
	// default WMTS layer object to set defaults:
	// missing values in config object will be replaced by sensible defaults:
	var defaults = {
		name: 'wmts layer',
		url: '',
		layer: '',
		style: 'default',
		matrixSet: '',
		matrixIds: matrixIds,
		visibility: true,
		isBaseLayer: false,
		format: 'image/png8',
		attribution:''
	};
	layerConfigObj = OpenLayers.Util.applyDefaults(layerConfigObj, defaults);

	var layer = new OpenLayers.Layer.WMTS(
	{
		name: layerConfigObj.title,
		url:layerConfigObj.url,
		layer: layerConfigObj.layer,
		style: layerConfigObj.style,
		matrixSet: layerConfigObj.matrixSet,
		matrixIds: layerConfigObj.matrixIds,
		format: layerConfigObj.format,
		visibility: layerConfigObj.visibility,
		isBaseLayer: layerConfigObj.isBaseLayer,
		attribution: layerConfigObj.attribution
	});
	return layer;
};

// kaartschalen: 50000, 25000, 10000, 5000, 2500, dpi=96
// achtergrond: top10nl, gbkn, luchtfoto's, etc'
// parameters aan pagina (location.search == '?etc') doorgeven bij request richting service
// wfs filter op: hoofdcategorie EN subcategorie
// wms kaartlaag: alles laten zien?

Geogem.geoserverAutorisatie = function(layername) {
    var checkUsername = function() {
        $.ajax({
            url: '//' + location.host + '/geoserver/web/',
            success: function(result) {
                var lines = result.split('\n');
               $.each(lines, function(index, line){
                    if (line.match('class="username"')) {
                      var spanElement = $.parseHTML(line);
                      $('.user-container').empty();
                      $('.user-container').append(spanElement);
                    }
                });
            }
        })
    }
    $(function(){
        
        $.ajax({
            url: '//' + location.host + '/geoserver/wms?request=getMap&LAYERS=nieuwegein:' + layername + '&BBOX=134249.8,448949.6,134275.1,448968.5&WIDTH=10&HEIGHT=10&format=image/png',
            statusCode: {

                401: function() {

                    alert( "Wegens de AVG is voor deze laag authorisatie nodig. Wil je toegang stuur dan een mail naar geoinformatie@nieuwegein.nl. Hartelijk bedankt voor je begrip." );
                    localStorage.clear();
                    $.each(Geogem.map.layers, function(index, layer) {
                        layer.redraw();
                    });
                    //window.location.href = location.host + '/apps'
                    Geogem.geoserverAutorisatie(layername);
                    
                },
                
                403: function() {
                    alert( "De opgegeven gebruiksnaam en/of wachtwoord zijn niet correct." );
                    //window.location.href = location.host + '/apps'
                    Geogem.geoserverAutorisatie(layername);
                }
                

            },
            success: function(result) {
                checkUsername();
            }
            }).done(function(data) {
                //console.log(data)
                checkUsername();
        });
        
    });
    checkUsername();
    
    var checkExist = setInterval(function() {
        if ($('#topbar').length) {
            clearInterval(checkExist);
            $('#topbar-element__container').append('<div class="user-container"></div>')
        }
    }, 100);
};

Geogem.init = function() {

    // create topbar and bottombar
	$('#map').append('<div id="topbar"><div id="topbar-element__container"></div></div><div id="bottombar"></div>');

	// child app SHOULD give application settings:
	if (Geogem.applicatieSettings) {
		Geogem.Settings = OpenLayers.Util.extend( Geogem.Settings, Geogem.applicatieSettings ) ;
	}

	OpenLayers.DOTS_PER_INCH = 96; // zelfde als http://gisserver1.agro.nl/arcgis/rest/services/topografie/MapServer
	OpenLayers.Lang.setCode('nl');

	Proj4js.defs["EPSG:28992"] = "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.999908 +x_0=155000 +y_0=463000 +ellps=bessel +units=m +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +no_defs no_defs";
	Proj4js.defs["EPSG:3857"] = "+proj=merc +lon_0=0 +k=1 +x_0=0 +y_0=0 +a=6378137 +b=6378137 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

	var boundsNL = new OpenLayers.Bounds(-90000, 205000, 380000, 719000);
	//var boundsNG = new OpenLayers.Bounds(132000, 445000, 137000, 453000);
	var map_options = {
		projection: new OpenLayers.Projection('EPSG:28992'),
		restrictedExtent: Geogem.Settings.restrictedExtent,
		maxExtent: Geogem.Settings.maxExtent,
		resolutions: Geogem.Settings.resolutions,
		// resolution = meters/pixel = schaalfactor/(pixels/inch // inch/meter)
		// resolutie = 50000 /(96 // 1/0.0254)
		// schaalfactor = resolutie // 96 / 0.0254
		tileOrigin: Geogem.Settings.tileOrigin,
		tileSize: new OpenLayers.Size(256, 256),
		units: 'm',
		controls: [
			new OpenLayers.Control.Navigation({zoomBoxEnabled:true}),
			new OpenLayers.Control.ScaleLine({bottomOutUnits: ''}),
			new OpenLayers.Control.ArgParser()
		],
		theme: null
	};
	if (Geogem.Settings.urlParams.debug) {
		map_options.controls.push(new OpenLayers.Control.MousePosition());
		map_options.controls.push(new OpenLayers.Control.Scale());
	}

	var map = new OpenLayers.Map('map', map_options);
	Geogem.map = map;
	var layers = [];
    var layer;
    var i;
	// base layers

    $('<div id="barContainer"/>').appendTo($('#map'));

	var baselayerButtons = '<div id="baselayerbuttons">';

	for (i = 0; i < Geogem.Settings.baseLayers.length; i++) {
		var options = {};
        layer = Geogem.Settings.baseLayers[i];
		var olLayer;
		// RD 24 jan 2012: also handle TMS (for PDOK services)
		if ( !layer.disabled && layer.type == 'tms' ) {
			options = { isBaseLayer: true, displayInLayerSwitcher: false };
			OpenLayers.Util.extend(options, layer.options);
			olLayer = new OpenLayers.Layer.TMS(
				layer.title,
				layer.url,
				options
				);
			layers.push(olLayer);
		}
		// RD nov 20313: handle wmts
		else if ( !layer.disabled && layer.type == 'wmts' ) {
			options = {
				isBaseLayer: true
			};
			OpenLayers.Util.extend(options, layer);
			olLayer = Geogem.createWMTSLayer(options);
			olLayer.displayInLayerSwitcher = false;
			layers.push(olLayer);
		}
		// RD nov 20313: handle blank or colored backgrounds
		else if ( !layer.disabled && layer.type == 'color' ) {
			olLayer = new OpenLayers.Layer.XYZ(layer.title , layer.tileImage, {isBaseLayer: true, displayInLayerSwitcher: false});
			/*olLayer = new OpenLayers.Layer(layer.title, {isBaseLayer: true, displayInLayerSwitcher: false});
			if(layer.color){
				$('.olMap').css('background-color', layer.color);
			}*/
			layers.push(olLayer);
		}
		else if (!layer.disabled) {
			var params = {
				transparent: 'false',
				format: 'image/jpeg'
			};
			OpenLayers.Util.extend(params, layer.params);
			// default options
			options = {
				isBaseLayer: true,
				format: 'image/jpeg',
				displayInLayerSwitcher: false
			};
			OpenLayers.Util.extend(options, layer.options);
			olLayer = new OpenLayers.Layer.WMS(
				layer.title,
				layer.url,
				params,
				options
			);
			layers.push(olLayer);
		}
		// create baselayer button(s)
		if (!layer.disabled) {
			var id = "baselayerbutton"+i;
			// we use layer.title/name as span-id to be able to retrieve the layer later
			baselayerButtons += '<span class="baselayerbutton" id="'+layer.title+'" title="Klik hier voor '+layer.title+' ondergrond">'+layer.title+'</span>';
		}
	}
	baselayerButtons += '</div>';
	// create the div with baselayer buttons
	$('#barContainer').append(baselayerButtons);
	// our own zoom in and zoom out buttons


    if (Geogem.Settings.zoomTools === false){

    } else {

    $('#map').append(
		'<div id="zoomtools">'+
		'<span id="zoomin" class="zoomtool"><img src="/basisviewer2/styles/img/zoomIn.svg"/></span>'+
		'<span id="zoomout" class="zoomtool"><img src="/basisviewer2/styles/img/zoomOut.svg"/></span>'+
		'</div>');

	// attach click events to all zoomtool 'buttons'
	$('#zoomtools').delegate('span', 'click',
		function(event){
			event.stopPropagation();
			if(this.id=="zoomin"){
				Geogem.map.zoomIn();
			}
			else if (this.id=="zoomout") {
				Geogem.map.zoomOut();
			}
			else {
				// first make all buttons inactive
				$('.baselayerbutton').css("background-color", "#fff");
				$(this).css("background-color", "#F1C02A");
				Geogem.map.setBaseLayer(Geogem.map.getLayersByName(this.id)[0]);
			}
			return false;
		});
	}
	map.addLayers(layers);

	// attach click events to all baselayer 'buttons'
	$('#baselayerbuttons').delegate('span', 'click',
		function(event){
			event.stopPropagation();
			// first make all buttons inactive
			$('#baselayerbuttons .baselayerbutton').removeClass('baselayer-active');//css("background-color", "#fff");
			$(this).addClass('baselayer-active');//.css("background-color", "#F1C02A");
			Geogem.map.setBaseLayer(Geogem.map.getLayersByName(this.id)[0]);
			return false;
		});
	// make current baselayer button active
	$('#'+Geogem.map.baseLayer.name).addClass('baselayer-active');//css("background-color", "#F1C02A");

    var contextMenu = function(event, name, baselayer, clickedBaselayer) {
        var baselayerArray = [{title: 'OpenTopo',layer: 'opentopo'},{title: 'Kaart',layer:'basistopo'},{title: 'Luchtfoto',layer:'basisluchtfoto'},{title: 'BGT',layer:'basiskaart_nieuwegein'},{title: 'BGT_Zwart',layer:'basiskaart_zwart_nieuwegein'}];
        var buttonName = name;
        var windowWidth = $(window).innerWidth();

        if ($('.context-menu__container')) {$('.context-menu__container').remove();}
        $('body').append('<div class="context-menu__container border-box " ><div class="context-menu shadow border-box  border-ng-paars"></div></div>');
        $.each(baselayerArray, function(index, item) {
            var selected = '';
            if (name === item.title) {selected = 'active-baselayer';}
            $('.context-menu').append('<div class="context-menu__button border-box ' + selected + '" data-value="' + item.layer + '"><span>' + item.title + '</span></div>');
        });

        var menuContainer = $('.context-menu__container')[0];
        var menu = $('.context-menu')[0];
        var menuWidth = menu.offsetWidth;
        var posX = event.clientX;
        var posY = event.clientY;
        if (posX + menuWidth > windowWidth) {posX = posX - menuWidth;}
        var menuPosition = {
            left: posX,
            top: posY,
        };
        $('.context-menu__container').css(menuPosition);
        if (menu.offsetLeft + 100 > windowWidth){console.log('outside window');}
        $('.context-menu').mouseleave(function() {$('.context-menu__container').remove();});

        $('.context-menu__button:not(.active-baselayer)').click(function() {
            var newLayer = $(this).attr('data-value');
            var newName = $(this)[0].firstChild.innerHTML;
            var oldName = clickedBaselayer.name;
            var l = Geogem.map.getLayersByName(oldName)[0];
            //var switchLayer = Geogem.map.getLayersByName(name)[0];
            if (newName === 'OpenTopo') {
                l.attribution = '<a target="_blank" href="//www.opentopo.nl">Bron: J.W. van Aalst, www.opentopo.nl </a>';
            } else if (clickedBaselayer.options.attribution) {
                $('.olControlAttribution').children().remove();
                l.attribution = '';
            }
            clickedBaselayer.params.LAYERS = newLayer;
            clickedBaselayer.name = newName;
            $('.context-menu__container').remove();
            baselayer.id = $(this)[0].firstChild.innerHTML;
            if (baselayer.style['background-color'] = "rgb(255, 255, 255)") {baselayer.click();}      
            clickedBaselayer.redraw();
        });
        $('.context-menu__button').contextmenu( function(e){
            $('.context-menu__container').remove();
            return false;
        });

        $('.context-menu').append('<br><div class="transparency-container"><span><b>Transparantie:<b></span><br><br><div id="slider" class="border-box" data-value=""></div></div>');
        var layerTransparency = clickedBaselayer.opacity * 100;

        var $slider = $( "#slider" ).slider({ range: false, min: 1, max: 100 });
        $slider.slider({
        change: function( event, ui ) {
            var values = $slider.slider( "values" );
            clickedBaselayer.setOpacity(values[0]/100);
        }
        });
        $slider.slider('pips', {rest: 'label', step: 50});
        $slider.slider( { values: [ layerTransparency ] } );

        $(document).one('click', function(e) {
            e.stopPropagation();
            $('.context-menu__container').remove();
        });

    };

    $('.baselayerbutton').contextmenu( function(e){
        var baselayerName = this.id;
        var baselayer = this;
        var clickedBaselayer = Geogem.map.getLayersByName(baselayerName)[0];
        contextMenu(e, baselayerName, baselayer, clickedBaselayer);
        return false;
    });

	// Overlays
	layers = [];
	for (i = 0; i < Geogem.Settings.overLays.length; i++) {

		var layerConfig = Geogem.Settings.overLays[i];

		if (layerConfig.type == 'wms') {
			layer = Geogem.createWMSLayer(layerConfig);
		}
		else if (layerConfig.type == 'wmts') {
			layer = Geogem.createWMTSLayer(layerConfig);
		}
		else if (layerConfig.type == 'kml') {
			layer = Geogem.createKmlLayer(layerConfig);
		}
		else if (layerConfig.type == 'wfs') {
			layer = Geogem.createWfsLayer(layerConfig);
		}
		else if (layerConfig.type =='group'){
			layer = new OpenLayers.WM.Group(layerConfig);
			if (layerConfig.visibility || (layerConfig.options && layerConfig.options.visibility) ){
				// making group visible == making all groupmembers visible!
			}else{
				layer.setVisibility(false);
			}
		}
		else{
			alert('configuratie fout: layer.type:' + layerConfig.type);
		}

		// we add a 'tags' property to ALL of our layers, to be able to search in it
		if (layerConfig.tags) {
			layer.tags = layerConfig.tags;
		}

		if (layerConfig.title !== undefined) {
            layer.name=layerConfig.title;
        } else {
            layer.name='GEEN name GEDEFINIEERD';
        }

		if(layerConfig.group){
			var group = Geogem.map.getLayersByName(layerConfig.group);
			if(group[0]){
				group[0].addLayer(layer);
			}
		}
		else{
			map.addLayer(layer);
		}

	}

	if (Geogem.Settings.kmlLayer) {
		// backwards compatibility
		var config = {};
		config.title = 'kml';
		config.protocolOptions = Geogem.Settings.kmlLayer.protocolOptions;
		map.addLayer(Geogem.createKmlLayer(config));
	}

	// Geocoder
	if (Geogem.Settings.geocoder) {
        var geocoderControl;
		var geocoderSettings = Geogem.Settings.geocoder;

		geocoderSettings.div = document.getElementById('topbar');

		if (geocoderSettings.type=='pdok'){
			geocoderControl = new Geogem.Geocoder(geocoderSettings);
		}
		else if (geocoderSettings.type=='pdoklocatieserver'){
			geocoderControl = new Geogem.PdokLocatieServer(geocoderSettings);
		}
		else //defaulting to closed geocoder of Nieuwegein
		{
			geocoderControl = new Geodan.Geocoder(geocoderSettings);
		}

		map.addControl(geocoderControl);
	}
	// Attribution control
	map.addControl(new OpenLayers.Control.Attribution());

	// mobile stuff
	// if( isAndroid || isMobile || isIthing ) {
		// $('#zoomin img').attr('src', '/basisviewer2/lib/img/zoom-plus-mini-mobile.png');
		// $('#zoomout img').attr('src', '/basisviewer2/lib/img/zoom-minus-mini-mobile.png')
	// }

	// bottombar
    if( isAndroid || isMobile || isIthing ) {
        $('#bottombar').append('<span>Team Geo-informatie - <a target="_blank" href="mailto:geoinformatie@nieuwegein.nl">geoinformatie@nieuwegein.nl</a></span>');
    } else {
        $('#bottombar').html('<span>Team Geo-informatie - <a href="mailto:geoinformatie@nieuwegein.nl">geoinformatie@nieuwegein.nl</a></span>');
    }

	// legend
	if (Geogem.Settings.legendUrl || Geogem.Settings.legend) {
		Geogem.createLegendDownloadBar();
		var legendSetting = Geogem.Settings.legendUrl?Geogem.Settings.legendUrl:Geogem.Settings.legend;
		if (legendSetting instanceof Array){
			// legend is an array of {title:'title',url:'url'} objects
			$('#legend').append('<div id="legendImage" src="'+legendSetting+'"/>');
			for (i=0;i<legendSetting.length;i++){
				var l = legendSetting[i];
				$('#legendImage').append('<h3 class="folded">'+l.title+'</h3><img class="legendImage" style="display:none;" src="'+l.url+'" />');
			}
			// show first one so we can just toggle others
			$($('.legendImage')[0]).css('display', 'block');
			$($('#legendImage h3')[0]).removeClass('folded');
			// harmonica behaviour
			$("#legendImage h3").click(function(){
				if($(this).next().is(':visible')){
					// clicking on an already visible one: hide it
					$(this).next().hide();
					$(this).addClass('folded');
				}
				else{
					$('.legendImage').hide(); // hide ALL legend images
					$('#legendImage h3').addClass('folded'); // restore the + for all h3's
					$(this).next().show();
					$(this).removeClass('folded'); // now show the - for this h3
				}
			});
		}
		else if (typeof legendSetting == 'string'){
			// legend is string: should be an image url
			$('#legend').append('<img id="legendImage" src="'+legendSetting+'" />');
		}
		else alert("Configuratie fout: legend of legendUrl heeft foute waarde: "+legendSetting);
	}

	if (Geogem.Settings.sidebar || Geogem.infoUrl) {
		var sidebarhtml = '<div class="border-ng-dik" id="sidebar">'+
                        '   <div class="sidebarMinimize" id="sidebarShowHide"></div>'+
                        '   <div id="sidebar_main_head">'+
                        // '       <h3>Informatie</h3>'+
                        '   </div>'+
                        '   <div id="sidebar_main_body">'+
                        '       <div id="sidebar_content2">'+
                        '           <h3 id="sidebar_content2_head">Informatie algemeen</h3>'+
                        '           <div id="sidebar_content2_data"></div>'+
                        '       </div> '+
                        '       <div id="sidebar_content"></div>'+
                        '   </div>'+
                        '  </div>';
		$('#map').append($(sidebarhtml));
		$('#sidebarShowHide').click(function(){
			$('#sidebar').toggleClass('sidebarhide');
			$('#sidebarShowHide').toggleClass('sidebarMinimize').toggleClass('sidebarMaximize');
			return true;
		});
		$('#sidebar_content2_head').click(function(){
			$('#sidebar_content2_data').toggleClass('sidebar_content2_hide');
			$('.sidebar-filter__container').toggleClass('sidebar_content2_hide');
			$('#sidebar_content2_head').toggleClass('folded');

			// if Informatie Algemeen is showing, hide the getfeatureinfo
			if (!$('#sidebar_content2_head').hasClass('folded')){
				//$('#sidebar_content').html('');
				$('#sidebar_content').css('display', 'none');
			}
			return true;
		});
	}
	if (Geogem.Settings.infoUrl){
		$('#sidebar_content2_data').load(Geogem.Settings.infoUrl);
		$('#sidebar').show();
	} else {
         if ($('#sidebar_content2_data').height() === 0) {$('#sidebar_content2').hide();}
    }

    if (Geogem.Settings.sidebarHide === true || (Geogem.Settings.sidebarHide === 'mobile' && (isAndroid || isMobile || isIthing) )) {
        $('#sidebar').addClass('sidebarhide');
        $('#sidebarShowHide').removeClass('sidebarMinimize');
        $('#sidebarShowHide').addClass('sidebarMaximize');
    }

	// check for 'downloadformat' setting
	var downloadToolActive = false;
    var downloadTool = false;
	for (i = 0; i < Geogem.map.layers.length; i++) {
		if (Geogem.map.layers[i].downloadformat){
			downloadTool = true;
			break;
		}
	}


    $('<div id="tools"/>').appendTo($('#barContainer'));

	if (downloadTool){
		$('#sidebar').delegate('input', 'change',
		function(event){
            event.stopPropagation();
			Geogem.downloadControl.layer.removeAllFeatures(); // remove polygon if there is
			var layer = Geogem.map.getLayer(this.id);
			Geogem.downloadControl.featureAdded = function(feature){
				// mogelijk formats: http://docs.geoserver.org/latest/en/user/services/wfs/outputformats.html
				// csv, excel, excel2007 of shape-zip
				var format=layer.downloadformat;
				var typename=layer.params.LAYERS;
				var propertyname='';
				var cql ='';
				if(feature.geometry.getArea() === 0 || feature.geometry.getVertices().length < 3){
					alert("Geen geldige gekozen gebied (te klein of te weinig hoekpunten).\nTeken een nieuw vlak.");
					Geogem.downloadControl.layer.removeAllFeatures();
					return;
				}
				if (layer.geogemfields){                    
					for (var field in layer.geogemfields[typename]){
						// field can be undefined
						if(field){propertyname+=(field+',');}
					}
				}
                if (layer.params.CQL_FILTER !== undefined) {
                    cql = "INTERSECTS(GEOM, "+new OpenLayers.Format.WKT().write(feature)+") AND (" + layer.params.CQL_FILTER.replace(/%/g,'%25') + ")";
                } else {
                    cql = "INTERSECTS(GEOM, "+new OpenLayers.Format.WKT().write(feature)+")";
                }
				// mogelijke geografisch functies:
				// EQUALS, DISJOINT, INTERSECTS, TOUCHES, CROSSES, WITHIN, CONTAINS, OVERLAPS, RELATE, DWITHIN, BEYOND
				var wfsuri = 'http://' + location.host + '/geoserver/wfs?typeNames='+typename+'&SERVICE=WFS&OUTPUTFORMAT='+format+'&VERSION=2.0.0&REQUEST=GetFeature&propertyname='+propertyname+'&CQL_FILTER=' + cql + '';
				window.open(wfsuri);
			};
			return true;
		});

		$('#tools').append('<span id="downloadcontrol" class="toolbutton download_icon" title="Download gegevens">Download kaartobjecten</span>');

        
        
		$('#downloadcontrol').click(function(){
            var toolBecomesActive = !$('#downloadcontrol').hasClass("toolactive");
            $('.toolbutton').removeClass("toolactive");
			if (toolBecomesActive){
                $('#downloadcontrol').addClass("toolactive");
				var content = '';
				for (var i = 0; i < Geogem.map.layers.length; i++) {
					// check for 'downloadformat' setting
					if (Geogem.map.layers[i].downloadformat){
						var id = Geogem.map.layers[i].id;
						content += '<label><input type="radio" id="'+id+'" class="downloadlayer" name="downloadlayer" value="'+id+'"/><b>'+Geogem.map.layers[i].name+'</b></label><br/>';
					}
				}

				if (content.length === 0){
					// no layer had the 'download'-format option !
					alert('Geen downloadbare lagen geconfigureerd');
				}else{
					content = "<p>U kunt informatie opvragen per object door de 'Download kaartobjecten' te deactiveren.</p>"+
						"<p>Kies hieronder een laag en teken een vlak</br>(dubbelklik om het tekenen te stoppen).</p>"+
						"<p>De volgende lagen zijn beschikbaar om te downloaden:</p>"+
						content;
					//Geogem.showSidebarContent(content);
					$('#sidebar_content2_data').html(content);
					$('#sidebar').show();
					$('#sidebar_content2').show();
					// activate first layer
					$('.downloadlayer')[0].click();
				}
				Geogem.downloadControl.activate();
                escCancel();
			}
			else{
				Geogem.downloadControl.deactivate();
				Geogem.downloadControl.layer.removeAllFeatures(); // remove polygon
				Geogem.removeAllPopups(); // closes sidebar
			}
		});
        
        var escCancel = function() {
                $(document).unbind('keyup');
                $(document).bind('keyup', function(e) {
                    if (e.keyCode === 27 ) {
                        Geogem.downloadControl.deactivate();
                        Geogem.downloadControl.layer.removeAllFeatures(); // remove polygon
                        Geogem.removeAllPopups();
                        $('#downloadcontrol').click();
                        $(document).unbind('keyup');
                    }
                });
            };

		// download control
		var polygonLayerStyle = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
				{fillColor: '#88179F', fillOpacity: 0.25, strokeColor: '#88179F'},
				OpenLayers.Feature.Vector.style["default"])  );
		var polygonLayer = new OpenLayers.Layer.Vector("Polygon Layer", {styleMap:polygonLayerStyle, displayInLayerSwitcher:false});
		Geogem.map.addLayers([polygonLayer]);
		Geogem.downloadControl = new OpenLayers.Control.DrawFeature(polygonLayer,
				OpenLayers.Handler.Polygon);
		Geogem.map.addControl(Geogem.downloadControl);
		// to remove already available polygons if starting a new one
		Geogem.downloadControl.handler.callbacks.point = function(data) {
			if (polygonLayer.features.length > 0){
				polygonLayer.removeAllFeatures();
			}
		};
	}  // end download tool code

	// child apps can implement a function applicationInit which will be called here:
	if (Geogem.applicatieInit) {
		Geogem.applicatieInit();
		//alert(OpenLayers.VERSION_NUMBER)
	}
	// proxyUrl often set in applicatieInit
	OpenLayers.ProxyHost = (Geogem.Settings.proxyUrl) ? Geogem.Settings.proxyUrl + '?url=' : '';

	// hack because the layerswitcher is created in applicatieInit
	if (downloadTool){
		// change position of layerswitcher if available
		if ($('.olControlLayerSwitcher').length>0){
			$($('.olControlLayerSwitcher')[0]).css('top', '97px');
		}
	}

	Geogem.map.addControl(new OpenLayers.Control.LoadingPanel());

	if (! map.getCenter()) {
		// uit urlParams: bbox of centerx/centery/kaartschaal
		var initialExtent;
		if (Geogem.Settings.urlParams.bbox) {
			map.zoomToExtent(OpenLayers.Bounds.fromString(Geogem.Settings.urlParams.bbox));
		}
		else if (Geogem.Settings.urlParams.centerx && Geogem.Settings.urlParams.centery && Geogem.Settings.urlParams.kaartschaal) {
			// resolutie bij kaartschaal
			var res = OpenLayers.Util.getResolutionFromScale(Geogem.Settings.urlParams.kaartschaal, 'm');
			var zoom = map.getZoomForResolution(res, true);
			map.setCenter(new OpenLayers.LonLat(Geogem.Settings.urlParams.centerx, Geogem.Settings.urlParams.centery), zoom);
		}
		else if (Geogem.Settings.initialExtent) {
			map.zoomToExtent(Geogem.Settings.initialExtent);
			//console.log('zooming to initialExtent', Geogem.Settings.initialExtent);
		}
		else if (Geogem.Settings.initialZoom) {
			map.zoomTo(Geogem.Settings.initialZoom);
			//console.log('zooming to initialZoom', Geogem.Settings.initialZoom);
		}
		else {
			map.zoomToExtent(Geogem.Settings.nieuwegeinExtent, true);
			//console.log('zooming to nieuwegeinExtent', Geogem.Settings.nieuwegeinExtent);
		}
	}

    // position flag/icon showing after a geocoder result
    // use
    // Geogem.Settings.usePositionFlag = true;
    // to use it and
    // Geogem.Settings.keepPositionFlag = true;
    // to NOT let it fade away after 2 zoom/pans
    Geogem.positionFlagCounter = 0;
    Geogem.addPosition = function(x, y, name){

        // first time: create layer and register on movestart to clean flag
        if (Geogem.positionLayer === undefined){
            // creating a geoposition layer to be used to show a point (mostly for geocoding purposes)
            Geogem.positionLayer = new OpenLayers.Layer.Vector('geoposition', {displayInLayerSwitcher: false});
            map.addLayer(Geogem.positionLayer);
            // register a movestart event to be able to remove a flag after some moves
            Geogem.map.events.register("movestart", Geogem.map, function() {
                Geogem.positionFlagCounter++;
                // after 2 moves, remove the positionFlagCounter
                if (Geogem.positionFlagCounter>2 && !Geogem.Settings.keepPositionFlag){
                    Geogem.positionLayer.removeAllFeatures();
                }
            });
        }
        // when adding a position, always remove the old flag
        Geogem.positionLayer.removeAllFeatures();
        // reset counter
        Geogem.positionFlagCounter = 0;
        // only when Geogem.Settings.usePositionFlag is true
        if (Geogem.Settings.usePositionFlag){
            Geogem.positionLayer.addFeatures([
                new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(x, y),
                    {},
                    {
                        externalGraphic: '/basisviewer2/styles/img/geo_point.svg',
                        graphicWidth: 40,    graphicHeight: 40,
                        graphicXOffset: -20, graphicYOffset: -37,
                    }
                ),
                // check
                /*
                new OpenLayers.Feature.Vector(
                    new OpenLayers.Geometry.Point(x, y),
                    {},
                    {
                        graphicName: 'circle',
                        strokeColor: '#88179F',
                        strokeWidth: 2,
                        fillOpacity: 0,
                        pointRadius: 5
                    }
                )
                */
            ]);
        }

    }; // end position flag code

    Geogem.startGeolocation = function(){

        if (Geogem.geolocateLayer === undefined){
            Geogem.geolocateLayer = new OpenLayers.Layer.Vector('geolocation', {displayInLayerSwitcher: false});
            map.addLayer(Geogem.geolocateLayer);
            Geogem.geolocate = new OpenLayers.Control.Geolocate({
                bind: false,
                geolocationOptions: {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 70000
                }
            });

            Geogem.geolocate.firstGeolocation = true;

            map.addControl(Geogem.geolocate);

            Geogem.geolocate.events.register("locationupdated", Geogem.geolocate, function(e) {
                Geogem.geolocateLayer.removeAllFeatures();
                //console.log(e)
                var circle = new OpenLayers.Feature.Vector(
                    OpenLayers.Geometry.Polygon.createRegularPolygon(
                        new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                        e.position.coords.accuracy/2,
                        40,
                        0
                    ),
                    {},
                    {
                        fillColor: '#fff',
                        fillOpacity: 0.1,
                        strokeWidth: 0
                    }
                );
                Geogem.geolocateLayer.addFeatures([
                    new OpenLayers.Feature.Vector(
                        e.point,
                        {},
                        {
                            graphicName: 'circle',
                            strokeColor: '#88179F',
                            strokeWidth: 2,
                            fillOpacity: 0,
                            pointRadius: 5
                        }
                    ),
                    circle
                ]);
                if (Geogem.geolocate.firstGeolocation) {
                    //alert(e.point.x +" - "+ e.point.y);
                    Geogem.map.setCenter(new OpenLayers.LonLat(e.point.x, e.point.y), 12);
                    //pulsate(circle);
                    Geogem.geolocate.firstGeolocation = false;
                    this.bind = true;
                }
                else{
                    //alert(e.point.x +" + "+ e.point.y +" + "+ Geogem.geolocate.watchId );
                    Geogem.map.setCenter(new OpenLayers.LonLat(e.point.x, e.point.y), 12);
                }
            });
            Geogem.geolocate.events.register("locationfailed",this,function() {
                alert('We probeerden uw lokatie op te vragen. Maar dit ging fout, herlaad de application om opnieuw te proberen.');
            });
            Geogem.geolocate.events.register("locationuncapable",this,function() {
                alert('We probeerden uw lokatie op te vragen. Maar uw browser ondersteunt dit niet.');
            });

        }

		if (Geogem.Settings.geolocation=='locate'){
			Geogem.geolocateLayer.removeAllFeatures();
			Geogem.geolocate.deactivate();
			Geogem.geolocate.watch = false;
			Geogem.geolocate.firstGeolocation = true;
			Geogem.geolocate.activate();
		}
		else if (Geogem.Settings.geolocation=='track'){
			Geogem.geolocateLayer.removeAllFeatures();
			Geogem.geolocate.deactivate();
			Geogem.geolocate.watch = true;
			Geogem.geolocate.firstGeolocation = true;
			Geogem.geolocate.activate();
		}
		else{
			alert('Geogem.Settings.geolocation heeft waarde: "'+Geogem.Settings.geolocation+
				'"\nmaar alleen "locate" en "track" zijn toegestaan.');
		}
	};

    if (Geogem.Settings.infoTab !== null) {
        var infoTab = Geogem.Settings.infoTab;

            $('<div class="info-tab border-ng-paars border-round">'+
                             '<div class="info-tab__body">'+
                             '</div>'+
                             '<div class="info-tab__button border-ng-paars" ><span>Sluit</span></div>'+
                             '</div>'
                            ).insertBefore('#topbar');
            $('.info-tab__body').append('<p>' + infoTab + '</p>');
            if (document.cookie.indexOf('infotab=1') >= 0) {
                $('.info-tab').addClass('info-tab__close');
                $('.info-tab__button').children('span')[0].innerHTML = 'Open';
            }

        var openCloseInfoTab = function() {
            $('.info-tab').toggleClass('info-tab__close');
            if($('.info-tab').hasClass('info-tab__close')) {
               $('.info-tab__button').children('span')[0].innerHTML = 'Open';
                document.cookie = 'infotab=1';
            } else {
                $('.info-tab__button').children('span')[0].innerHTML = 'Sluit';
                document.cookie= 'infotab=0';
            }
        };
        var tabHeight = $('.info-tab').height() - 30 +'px';

        $('.info-tab__button').click(openCloseInfoTab);

        $("head").append('<style type="text/css"></style>');
        var new_stylesheet = $("head").children(':last');
        new_stylesheet.html('.info-tab__close {transform: translate(-50%, -' + tabHeight + ');}');
        setTimeout(function() {new_stylesheet.append('.info-tab {transition: transform 0.5s ease-out;}');},100);
    }

    if (Geogem.Settings.styleSwitcher === true) {
        var styleNr = 0;
        var styleTot = 0;
        $('#tools').append('<span class="toolbutton style_switch_icon" id="style-switch" title="Wissel van stijl">Style</span>');
        $('#topbar-element__container').append('<div class="style-name__display" style=""><span>Huidige stijl: </span></div>')
            $.each(Geogem.map.layers, function(index, layer) {
                if (layer.options.styles) {
                $('.style-name__display span')[0].innerHTML = 'Huidige stijl: ' + layer.options.styles[0].name;
            }
        })

        $('#style-switch').click(function(event) {
            styleNr++;
            if (styleNr === styleTot) {styleNr = 0;}
            $.each(Geogem.map.layers, function(index, layer) {
                if (layer.options.styles) {
                    styleTot = layer.options.styles.length;
                    var nextStyle = layer.options.styles[styleNr].style;
                    var nextName = layer.options.styles[styleNr].name;
                    $('.style-name__display span')[0].innerHTML = 'Huidige stijl: ' + nextName;
                    layer.params.STYLES = nextStyle;
                    layer.redraw();
                }
            });
        });
    }
    
    if (Geogem.Settings.altLayerswitcher === true) {
        loadAltLayerswitcher();
    }
    
    if (Geogem.Settings.multiFilter) {
        if ($('.sidebar-filter__container').length === 0) {
            multiFilter.filterLoader();
        }
    }
};