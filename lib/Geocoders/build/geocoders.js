/* ======================================================================
    Geodan.js
   ====================================================================== */

/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var Geodan = Geodan || {};

// maak beschikbaar als globale variabele onder IE
window.Geodan = Geodan;
/* ======================================================================
    Geodan/Format/GeocodeResponse.js
   ====================================================================== */

// $Id: GeocodeResponse.js 122 2011-06-29 14:57:44Z johnp $

Geodan.Format = Geodan.Format || {};

/**
 * Class: Geodan.Format.GeocodeRequest
 * Read/Write GeocodeRequest. 
 *
 * Inherits from:
 *  - <OpenLayers.Format.GML>
 */
Geodan.Format.GeocodeResponse = OpenLayers.Class(OpenLayers.Format.GML, {
  
/**
 * APIProperty: xlsns
 */
    xlsns: 'http://www.opengis.net/xls',

    initialize: function(options) {
        OpenLayers.Format.GML.prototype.initialize.apply(this, [options]);

        this.featureName = 'xls:GeocodedAddress';

        this.setNamespace('gml', 'http://www.opengis.net/gml');
    },

    read: function(data) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }

        var geocodedAddressNodes = this.getElementsByTagNameNS(data.documentElement,
            this.xlsns, 'GeocodedAddress');
        var geocodedAddresses = [];
        for (var i = 0; i < geocodedAddressNodes.length; i++) {
            var geocodedAddress = this.parseGeocodedAddress(geocodedAddressNodes[i]);
            if (geocodedAddress) {
                geocodedAddresses.push(geocodedAddress);
            }
        }
        return geocodedAddresses;
    },

    parseGeocodedAddress: function(node) {
        var children, geocodedAddress = {}, nodeList;

        nodeList = this.getElementsByTagNameNS(node, this.namespaces['gml'], 'Point');
        if (nodeList.length > 0) {
            var parser = this.parseGeometry['point'];
            geocodedAddress.geometry = parser.apply(this, [nodeList[0]]);
        }

        nodeList = this.getElementsByTagNameNS(node, this.xlsns, 'Address');
        if (nodeList.length > 0) {
            // street & building
            children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'StreetAddress');
            if (children.length > 0) {
                var childNode = children[0].firstChild;
                while (childNode) {
                    if (childNode.nodeType == 1) {
                        if (childNode.tagName == 'xls:Street') {
                            geocodedAddress.street = this.getChildValue(childNode);
                        }
                        else if (childNode.tagName == 'xls:Building') {
                            geocodedAddress.number = childNode.getAttribute('number');
                            geocodedAddress.subdivision = childNode.getAttribute('subdivision');
                        }
                    }
                    childNode = childNode.nextSibling;
                }
            }

            // postalCode
            children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'PostalCode');
            if (children.length > 0) {
                geocodedAddress.postalCode = this.getChildValue(children[0]);
            }

            // place(s)
            children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'Place');
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                var type = child.getAttribute('type');
                var name = type.substr(0, 1).toLowerCase() + type.substr(1);
                geocodedAddress[name] = this.getChildValue(child);
                if (name === 'countrySecondarySubdivision') {
                    // todo: check geometrie to set geocodedAddress['extent']
                    var geom = OpenLayers.Geometry.fromWKT(geocodedAddress[name]);
                    if (geom) {
                        geocodedAddress['extent'] = geom.getBounds();
                    }
                }
            }
        }

        //console && console.info('geocoded address', geocodedAddress);
        return geocodedAddress;
    },

    CLASS_NAME: 'Geodan.Format.GeocodeResponse'
});
/* ======================================================================
    Geodan/Format/ReverseGeocodeRequest.Format.js
   ====================================================================== */

// $Id$

/**
 * Class: Geodan.Format.ReverseGeocodeRequest
 * Read/Write ReverseGeocodeRequest. 
 *
 * Inherits from:
 *  - <OpenLayers.Format.GML>
 */
Geodan.Format.ReverseGeocodeRequest = OpenLayers.Class(OpenLayers.Format.GML, {
  
  /**
   * APIProperty: xlsns
   */
  xlsns: 'http://www.opengis.net/xls',
  
  initialize: function(options, position) {
    OpenLayers.Format.GML.prototype.initialize.apply(this, [options]);
    
    this.setNamespace('xls', this.xlsns);
    
    this.position = OpenLayers.Util.extend({}, position);
  },
  
  write: function() {
    var xml = '<xls:ReverseGeocodeRequest xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xls="http://www.opengis.net/xls" xmlns:gml="http://www.opengis.net/gml"><xls:Position><gml:Point srsName="EPSG:28992"><gml:pos dimension="2">'
      + this.position.x + ' ' + this.position.y + '</gml:pos></gml:Point></xls:Position></xls:ReverseGeocodeRequest>';
    return xml;
    /*
    var request = this.createElementNS(this.xlsns, 'xls:ReverseGeocodeRequest');
    request.setAttribute('xmlns:gml', this.gmlns);
    request.setAttribute('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance");
    
    request.appendChild(this.createPosition());
    
    return OpenLayers.Format.XML.prototype.write.apply(this, [request]);*/
  },
  
  createPosition: function() {
    var node = this.createElementNS(this.xlsns, 'xls:Position');
    
    var pointNode = this.createElementNSPlus('gml:Point', {
      uri: this.gmlns,
      attributes: { srsName: 'EPSG:28992' }
    });
    pointNode.appendChild(this.createElementNSPlus('gml:pos', {
      uri: this.gmlns,
      value: this.position.x + ' ' + this.position.y,
      attributes: { dimension: 2 }
    }));
    node.appendChild(pointNode);
    
    return node;
  },
  
  CLASS_NAME: 'Geodan.Format.ReverseGeocodeRequest'
});
/* ======================================================================
    Geodan/Format/ReverseGeocodeResponse.Format.js
   ====================================================================== */

// $Id$

/**
 * Class: Geodan.Format.ReverseGeocodeResponse
 * Read/Write ReverseGeocodeResponse. 
 *
 * Inherits from:
 *  - <OpenLayers.Format.GML>
 */
Geodan.Format.ReverseGeocodeResponse = OpenLayers.Class(OpenLayers.Format.GML, {
  
  /**
   * APIProperty: xlsns
   */
  xlsns: 'http://www.opengis.net/xls',
  
  initialize: function(options) {
    OpenLayers.Format.GML.prototype.initialize.apply(this, [options]);
    
    this.featureName = 'xls:ReverseGeocodedLocation';
    
    this.setNamespace('gml', 'http://www.opengis.net/gml');
  },
  
  read: function(data) {
    if(typeof data == "string") { 
      data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
    }
    
    var geocodedAddressNodes = this.getElementsByTagNameNS(data.documentElement,
      this.xlsns, 'ReverseGeocodedLocation');
    var geocodedAddresses = [];
    for (var i = 0; i < geocodedAddressNodes.length; i++) {
      var geocodedAddress = this.parseGeocodedAddress(geocodedAddressNodes[i]);
      if (geocodedAddress) {
        geocodedAddresses.push(geocodedAddress);
      }
    }                      
    return geocodedAddresses;
  },
  
  parseGeocodedAddress: function(node) {
    var geocodedAddress = {};
    
    var nodeList = this.getElementsByTagNameNS(node, this.namespaces['gml'], 'Point');
    if (nodeList.length > 0) {
      var parser = this.parseGeometry['point'];
      geocodedAddress.geometry = parser.apply(this, [nodeList[0]]);
    }
    
    var nodeList = this.getElementsByTagNameNS(node, this.xlsns, 'Address');
    if (nodeList.length > 0) {
      // street & building
      var children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'StreetAddress');
      if (children.length > 0) {
        var childNode = children[0].firstChild;
        while (childNode) {
          if (childNode.nodeType == 1) {
            if (childNode.tagName == 'xls:Street') {
              geocodedAddress.street = this.getChildValue(childNode);
            }
            else if (childNode.tagName == 'xls:Building') {
              geocodedAddress.number = childNode.getAttribute('number');
              geocodedAddress.subdivision = childNode.getAttribute('subdivision');
            }
          }
          childNode = childNode.nextSibling;
        }
      }
      // postalCode
      var children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'PostalCode');
      if (children.length > 0) {
        geocodedAddress.postalCode = this.getChildValue(children[0]);
      }
      // place(s)
      var children = this.getElementsByTagNameNS(nodeList[0], this.xlsns, 'Place');
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        var type = child.getAttribute('type');
        var name = type.substr(0, 1).toLowerCase() + type.substr(1);
        geocodedAddress[name] = this.getChildValue(child);
      }
    }
    
    return geocodedAddress;
  },
  
  CLASS_NAME: 'Geodan.Format.ReverseGeocodeResponse'
});
/* ======================================================================
    Geodan/Geocoder.js
   ====================================================================== */

/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

Geodan.Geocoder = OpenLayers.Class(OpenLayers.Control, {

    autocomplete: {
      minLength: 3,
      delay: 500
    },

    url: 'http://' + location.host + '/geocoder/geocode?',

    tooltip: ' Zoek op postcode of adres...',

    extentMargin: 1000,

    pointMargin: 1000,

    minimumZoomScale: 5000,

    /**
     * Straat of postcode die laatst geselecteerd is uit lijst.
     */
    lastSelectGroup:  null,

    inputSize: 40,

    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments)

        this.autoActivate = true;
        this.allowSelection = true;
    },
    
    draw: function(px) {
	
		if (this.div == null){
			this.div = OpenLayers.Control.prototype.draw.apply(this, arguments);
		}

        var form = document.createElement('form');
        form.setAttribute('method', 'GET');
        form.setAttribute('action', '#');
		form.setAttribute('class','geocoderform');
        form.setAttribute('onsubmit', "javascript:return false;");

        // add input to div
        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('size', this.inputSize);
        input.setAttribute('title', this.tooltip);
        input.setAttribute('class', 'form-autocomplete');
        input.setAttribute('id', this.id + '-input');
        form.appendChild(input);

        // add form to div
        this.div.appendChild(form);

        //id="address" type="text" size="40" value=""
        return this.div;
    },

    activate: function() {

        // append autocomplete
        this.attachAutocomplete();

        // give input field focus
        //$('input', this.div).focus();
		$('input', this.div).val(this.tooltip);

        // prevent passthrough of mouse events
        ////OpenLayers.Event.observe(this.div, 'click', this.ignoreEvent);
        var context = {
            geocoder: this
        };
        OpenLayers.Event.observe(this.div, 'click',
            OpenLayers.Function.bindAsEventListener(this.onInputClick, context));
        //OpenLayers.Event.observe(this.div, 'dblclick', this.ignoreEvent);
        //OpenLayers.Event.observe(this.div, 'mousedown', this.ignoreEvent);
    },

    attachAutocomplete: function() {
        var self = this;
        // attach autocomplete event
        $('input', this.div).autocomplete(
		{
            minLength: this.autocomplete.minLength,
            delay: this.autocomplete.delay,
			appendTo: this.div,
            source: function(request, response) {
                try {
                    var url, ajax_data;

                    if (OpenLayers.ProxyHost == '') {
                        // no proxy needed
                        url = self.url;
                        ajax_data = self.params(request);
                    }
                    else {
                        // proxy needed
                        url = Geogem.Settings.proxyUrl;
                        ajax_data = {};
                        ajax_data['url'] = self.url
                            + (self.url.indexOf('?') < 0 ? '?' : '&')
                            + $.param(self.params(request))
                            ;
                    }
                    $('input', self.div).addClass('throbbing');
                    $.ajax({
                        url: url,
                        dataType: 'xml',
                        data: ajax_data,
                        success: function(data) {
                            return self.success.apply(self, [data, response, request]);
                        },
                        /*error: function(xmlHttpRequest, textStatus, errorThrown) {
                            console.log(OpenLayers.i18n('Geocoding failed: ${statusText} (${statusCode})', {
                                statusText: xmlHttpRequest.statusText,
                                statusCode: xmlHttpRequest.status
                            }));
                        },*/
                        complete: function(xmlHttpRequest, textStatus) {
                            $('input', self.div).removeClass('throbbing');
                        }
                    });
                } catch (e) {
					// do nothing?
                }
            },
			// setting the lastSelectGroup also on focus to be able to 'keep typing'
			// RD dec2014: NOT setting lastSelectGroup to more then street because that will give problems later
			focus: function(event, ui) {
			    if (ui.item && ui.item.address && ui.item.address.street) {
					self.lastSelectGroup = ui.item.address.street;
				}
			},
            select: function(event, ui) {
                var extent, point, margin;
                if (ui.item) {
                    if (ui.item.address) {
						// RD dec2014: NOT setting lastSelectGroup to more then street because that will give problems later
						// self.lastSelectGroup = ui.item.value;
                        if (ui.item.address.extent) {
                            margin = self.extentMargin;
                            extent = ui.item.address.extent;
                            Geogem.addPosition((extent.right+extent.left)/2, (extent.bottom+extent.top)/2);
                            // add margin
                            extent.left -= margin;
                            extent.bottom -= margin;
                            extent.top += margin;
                            extent.right += margin;
                            self.zoomToExtent(extent);
                        }
                        else if (ui.item.address.geometry) {
                            // point
                            margin = self.pointMargin;
                            point = ui.item.address.geometry;
                            Geogem.addPosition(point.x, point.y);
                            extent = new OpenLayers.Bounds(point.x - margin
                                ,point.y - margin, point.x + margin, point.y + margin);
                            self.zoomToExtent(extent);
                        }
                    }
                    else {
                        //alert('TODO: zoom naar ' + ui.item.value);
                    }
					/*
					  // apply geocoder to ui.item.value
					  var geocoder = new Geodan.Geocoder({
						"method": 'GET',
						"url": self.geocoderUrl
					  });
					  var search = ui.item.value;
					  geocoder.geocode(search, OpenLayers.Function.bind(self.onFound, self));
					 */
                    //console && console.info("Selected: ", ui.item);
                }
                else {
                    //console && console.info("Nothing selected, input was " + this.value);
                }
            }
        });
    },

    params: function(request) {
        // mogelijke params: pc, address, town, muni (gemeente), number, prov
        var params = {
            country: 'Nederland'
        };
        // match postcode (1) of gemeente (3), straat (5)
        // match postcode (1) of straat () met huisnummer(s), gescheiden door spatie(s) en optionele komma
        var match = request.term.match(/(^[1-9][0-9]{1,3}[a-zA-Z]{0,2})|((^[^,]*)(,\s*(.*))?)/);
        //console && console.info('search match', match);
        if (match) {	
            if (match[1]) {
				// postcode (vb: '3432ZJ' of '3432ZJ 45')
				// als de huidige zoekterm precies hetzelfde is als de laatste geselecteerd (of gefocuste)
                if (this.lastSelectGroup && request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0) {
                    params.postalCode = this.lastSelectGroup;
                    var remains = request.term.substr(this.lastSelectGroup.length);
                    params.building = $.trim(remains) + '*';
                }
                else {
                    params.postalCode = match[1] + '*';
                }
                request.searchParameter = 'postalCode';
            }
            else {
                // straat
				//console.log('this.lastSelectGroup: '+this.lastSelectGroup)
				//console.log('request.term: '+request.term)
				// als de huidige zoekterm precies hetzelfde is als de laatste geselecteerd (of gefocuste)
				
				// onderstaande checkt of de huidige zoekstring deel is van lastSelectGroup deel (beginnent met)
				// bij deze test werkt het doorzoeken wel met 'herenstraat 8...' maar gaat het fout wanneer er een focus is geweest
                //if (this.lastSelectGroup && request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0) {
				
				// onderstaande checkt of de huidige zoekstring hetzelfde lastSelectGroup deel (beginnent met)
				// bij deze werkt het door-zoeken niet, maar kun je wel terug van focus naar input
				//if ( this.lastSelectGroup && $.trim(request.term.toLowerCase())==$.trim((this.lastSelectGroup.toLowerCase()) )) {
				
				// if term.length < last select group, we are probably deleting characters...
				// set the lastSelectGroup to null so we do not keep seeing the housenumbers
				if (this.lastSelectGroup && 
					($.trim(request.term.toLowerCase()).length < $.trim((this.lastSelectGroup.toLowerCase())).length)){
					this.lastSelectGroup = null;
				}
				
				// onderstaande checkt beide 
				if (this.lastSelectGroup && 
					(	request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0
						||
						this.lastSelectGroup.term.toLowerCase().indexOf(request.term.toLowerCase()) == 0)
					) {
					
					// if term.length < last select group, we are probably deleting characters...
					/*if ($.trim(request.term.toLowerCase()).length < $.trim((this.lastSelectGroup.toLowerCase()).length)){
						console.log('DELETING ....');
					}*/
					
                    params.street = this.lastSelectGroup;
                    var remains = match[2].substr(this.lastSelectGroup.length);
					// we do not want to sent a ' ' to the server, so we trim the remains,
					// but IE does not have trim: that's why jquery.trim here:
                    params.building = $.trim(remains) + '*';
                }
                else {
                    params.street = '*' + match[3] + '*';
                    if (match[5]) {
                        params.building = match[5] + ' *';
                    }
                }
                request.searchParameter = 'street';
            }
            return params;
        }
    },

    zoomToExtent: function(extent) {
        var diff;
        var resolution = OpenLayers.Util.getResolutionFromScale(this.minimumZoomScale, 'm');
        var minSize = this.map.getSize();
        minSize.w *= resolution;
        minSize.h *= resolution;
        var newSize = extent.getSize();
        if (minSize.w > newSize.w) {
            // newSize left/right vergroten
            diff = minSize.w - newSize.w;
            extent.left -= diff/2;
            extent.right += diff/2;
        }
        if (minSize.h > newSize.h) {
            // newSize top/bottom vergroten
            diff = minSize.h - newSize.h;
            extent.bottom -= diff/2;
            extent.top += diff/2;
        }
        // todo; compare size with extent
        this.map.zoomToExtent(extent, true);
    },

    success: function(data, response, request) {
        // make array of addresses (street, number, postalCode, municipality, municipalitySubdivision, geometry, countrySubdivision)
        // o Dropdownlist straatnamen gezocht op substring; inzoomen naar
        //   gekozen straat
        // o Dropdownlist huisnummers binnen gekozen straat, ditmaal niet op
        //   substring; bij selectie inzoomen naar adres (instelbaar zoomniveau)
        var format = new Geodan.Format.GeocodeResponse();
        var addresses = format.read(data);
        var numAddresses = addresses.length;
        var that = this;
		// sort function to sort the addresses
		var adsort = function(a, b){
			anum = parseInt(a.number);
			bnum = parseInt(b.number);
			if (anum>bnum){
				return 1;
			}
			else if(anum<bnum){
				return -1;
			}
			return 0;
		}
		addresses.sort(adsort);
		
		var i = 0;
        response( $.map( addresses, function(item) {
            var result = {};
			i++;
            if (item.postalCode && request.searchParameter !== 'street') {
                result.label = item.postalCode + ' (' + item.street + (item.number ? ' ' + item.number : '') + ')';
                // geen huisnummers in value
                result.value = item.postalCode;
                if (numAddresses == 1 && request.term.toLowerCase() === item.postalCode.toLowerCase()) {
                    that.lastSelectGroup = item.postalCode;
                }
            }
            else {
                result.label = item.street + (item.number ? ' ' + item.number + (item.subdivision ? ' '+item.subdivision : '') : '');
                result.value = result.label;
                if (numAddresses == 1 && request.term.toLowerCase() === item.street.toLowerCase()) {
                    that.lastSelectGroup = item.street;
                }/*
				else{
					console.log('setting last to street',item.street)
					that.lastSelectGroup = item.street;
				}*/
            }
            result.address = item;
			// we retrieve 30 addresses (defined in  application.xml of geocoder)
			// we only return 10 !!
			// this is because we want to be sure that Herenstraat 1 is in the resultset
			if(i>10){
				return {};
			}
            return result;
        }));
		
    },

    /**
     * Method: ignoreEvent
     *
     * Parameters:
     * evt - {Event}
     */
    ignoreEvent: function(evt) {
        //OpenLayers.Event.stop(evt, true);
    },

    onInputClick: function(evt) {
		if (this.geocoder.tooltip == $('input', this.geocoder.div).val() ){
			$('input', this.geocoder.div).val("");
		}
		$('input', this.geocoder.div).focus();
        //this.geocoder.ignoreEvent(evt);
    },

    CLASS_NAME: 'Geodan.Geocoder'
});
/* ======================================================================
    pdoklocatieserver.js
   ====================================================================== */

var Geogem = Geogem || {};

Geogem.Format = Geogem.Format || {};
 
Geogem.Format.PdokLocatieServer = OpenLayers.Class(OpenLayers.Format.JSON, {

    initialize: function(options) {
        OpenLayers.Format.JSON.prototype.initialize.apply(this, [options]);
    },
    
    read: function(json, type, filter) {
        type = (type) ? type : "Suggest";
        var results = null;
        var obj = null;
        if (typeof json == "string") {
            obj = OpenLayers.Format.JSON.prototype.read.apply(this,
                                                              [json, filter]);
        } else { 
            obj = json;
        }    
        if(!obj) {
            OpenLayers.Console.error("Bad JSON: " + json);
        } else {        
            /*
                {
                    "response":{
                        "numFound":30,
                        "start":0,
                        "maxScore":17.201363,
                        "docs":[
                            {   
                                "type":"weg",
                                "weergavenaam":"Koolmees, Nieuwegein",
                                "id":"weg-126ab89619a3be4064403f5bdfc78984",
                                "score":17.201363
                            }
                        ]
                    }
                }
                
                {
                    "response":{
                        "numFound":1,"start":0,
                        "maxScore":15.691393,
                        "docs":[
                            {
                                "bron":"BAG",
                                "woonplaatscode":"1108",
                                "type":"adres",
                                "woonplaatsnaam":"Nieuwegein",
                                "huis_nlt":"1",
                                "openbareruimtetype":"Weg",
                                "gemeentecode":"0356",
                                "weergavenaam":"Koolmees 1, 3435RA Nieuwegein",
                                "straatnaam_verkort":"Koolmees",
                                "id":"adr-3b696bf1e518f8788cb38781df853840",
                                "gekoppeld_perceel":[
                                        "JPS00-C-484"
                                    ],
                                "gemeentenaam":"Nieuwegein",
                                "identificatie":"0356010000046625-0356200000016496",
                                "openbareruimte_id":"0356300000001489",
                                "provinciecode":"PV26",
                                "postcode":"3435RA",
                                "provincienaam":"Utrecht",
                                "centroide_ll":"POINT(5.07000962 52.0266669)",
                                "nummeraanduiding_id":"0356200000016496",
                                "adresseerbaarobject_id":"0356010000046625",
                                "huisnummer":1,
                                "provincieafkorting":"UT",
                                "centroide_rd":"POINT(133230.698 448750.088)",
                                "straatnaam":"Koolmees"
                               }
                            ]
                        }
                }

            */                
            try {
                results = obj.response.docs;
            } catch(err) {
                OpenLayers.Console.error(err);
            }
        }
        return results;
    },    

    CLASS_NAME: "Geogem.Format.PdokLocatieServer" 

});



Geogem.PdokLocatieServer = OpenLayers.Class(OpenLayers.Control, {

    autocomplete: {
      minLength: 2,
      delay: 500
    },

    // zie: https://github.com/PDOK/locatieserver/wiki/API-Locatieserver
    url: 'http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=type:adres%20and%20nieuwegein%20and%20',
    // of toch ook meertraps waarbij je eerst een weg ophaalt, en dan een adres....
    // url: 'http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=type:weg%20and%20nieuwegein%20and%20',
    // suggest: http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=ko,nieuwegein%20and%20type:adres
    //          http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=3435ra%201   3425RA 1
    //          http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=type:adres%20and%20nieuwegein%20and%20koo
    //          http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=koo%20and%20nieuwegein%20and%20type:weg
    
    // lookup : http://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup?id=adr-3b696bf1e518f8788cb38781df853840
    // free   : http://geodata.nationaalgeoregister.nl/locatieserver/v3/free?q=<zoektermen>
    // mmm, alleen adressen, geen batauweg: http://geodata.nationaalgeoregister.nl/locatieserver/v3/suggest?q=batauweg,nieuwegein
    
    tooltip: ' Zoek op postcode huisnummer of adres...',

    extentMargin: 100,

    pointMargin: 100,

    minimumZoomScale: 1000,

    /**
     * Straat of postcode die laatst geselecteerd is uit lijst.
     */
    lastSelectGroup:  null,

    inputSize: 40,

    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments)

        this.autoActivate = true;
        this.allowSelection = true;
    },
    
    draw: function(px) {
	
		if (this.div == null){
			this.div = OpenLayers.Control.prototype.draw.apply(this, arguments);
		}

        var form = document.createElement('form');
        form.setAttribute('method', 'GET');
        form.setAttribute('action', '#');
		form.setAttribute('class','geocoderform');
        form.setAttribute('onsubmit', "javascript:return false;");

        // add input to div
        var input = document.createElement('input');
        input.setAttribute('type', 'text');
        input.setAttribute('size', this.inputSize);
        input.setAttribute('title', this.tooltip);
        input.setAttribute('class', 'form-autocomplete');
        input.setAttribute('id', this.id + '-input');
        form.appendChild(input);

        // add form to div
        this.div.appendChild(form);

        //id="address" type="text" size="40" value=""
        return this.div;
    },

    activate: function() {

        // append autocomplete
        this.attachAutocomplete();

        // give input field focus
        //$('input', this.div).focus();
		$('input', this.div).val(this.tooltip);

        // prevent passthrough of mouse events
        ////OpenLayers.Event.observe(this.div, 'click', this.ignoreEvent);
        var context = {
            geocoder: this
        };
        OpenLayers.Event.observe(this.div, 'click',
            OpenLayers.Function.bindAsEventListener(this.onInputClick, context));
        //OpenLayers.Event.observe(this.div, 'dblclick', this.ignoreEvent);
        //OpenLayers.Event.observe(this.div, 'mousedown', this.ignoreEvent);
    },

    attachAutocomplete: function() {
        var self = this;
        // attach autocomplete event
        $('input', this.div).autocomplete(
		{
            minLength: this.autocomplete.minLength,
            delay: this.autocomplete.delay,
			appendTo: this.div,
            source: function(request, response) {
                try {
                    var url, ajax_data;

                    if (OpenLayers.ProxyHost == '') {
                        // no proxy needed
                        url = self.url;
                        ajax_data = self.params(request);
                    }
                    else {
                        // proxy needed
                        url = Geogem.Settings.proxyUrl;
                        ajax_data = {};
                        ajax_data['url'] = self.url
                            + (self.url.indexOf('?') < 0 ? '?' : '&')
                            + $.param(self.params(request))
                            ;
                    }
                    $('input', self.div).addClass('throbbing');
					
					var request = OpenLayers.Request.GET({
						url: url,
						params: ajax_data,
						proxy: Geogem.Settings.proxyUrl,
						success: function(data) {
							$('input', self.div).removeClass('throbbing');
                            return self.success.apply(self, [data, response, request]);
                        },
                        error: function(xmlHttpRequest, textStatus, errorThrown) {
								console.log(OpenLayers.i18n('Geocoding failed: ${statusText} (${statusCode})', {
                                statusText: xmlHttpRequest.statusText,
                                statusCode: xmlHttpRequest.status
                            }));
                        }
					});					
                } catch (e) {
					// do nothing?
                }
            },
			// setting the lastSelectGroup also on focus to be able to 'keep typing'
			focus: function(event, ui) {
			    if (ui.item && ui.item.address) {
					self.lastSelectGroup = ui.item.value;
				}
			},
            select: function(event, ui) {
                
                var extent, point, margin;
                if (ui.item) {
                    
                    // use PDOK locatieserver to get the actual point 
                    var request = OpenLayers.Request.GET({
						url: 'http://geodata.nationaalgeoregister.nl/locatieserver/v3/lookup',
						params: {id:ui.item.id},
						proxy: Geogem.Settings.proxyUrl,
						success: function(data) {
							$('input', self.div).removeClass('throbbing');
                            
                            //self.lastSelectGroup = ui.item.value;  // needed for ????
                            
                            var format = new Geogem.Format.PdokLocatieServer();
                            var addresses = format.read(data.responseText, 'Lookup');
                            var adres = addresses[0];
                            
                            var pointWKT = adres.centroide_rd;
                                                        
                            var wktformat = new OpenLayers.Format.WKT()
                            var feature = wktformat.read(pointWKT);
                            var point = feature.geometry;
                            margin = self.pointMargin;
                            extent = new OpenLayers.Bounds(point.x - margin
                                ,point.y - margin, point.x + margin, point.y + margin);
                            self.zoomToExtent(extent);
                            Geogem.addPosition(point.x, point.y);
                            
                            // force a roundtrip to the location server, so in case only a street is found, there is a new 
                            // search for addresses (house numbers) in that street
                            if (adres.type == 'adres'){
                                $('input', this.div).val(adres.weergavenaam)
                                $('input', this.div).autocomplete( "search", adres.straatnaam + '' + adres.huisnummer );
                            }
                            else if (adres.type == 'weg'){
                                $('input', this.div).val(adres.straatnaam)
                                $('input', this.div).autocomplete( "search", adres.straatnaam );
                            }
                            else if (adres.type == 'postcode'){
                                $('input', this.div).val(adres.postcode)
                                $('input', this.div).autocomplete( "search", adres.postcode );
                            }                            
                            else{
                                console.log('GEEN NIEUWE SEARCH')
                            }
                            
                        },
                        error: function(xmlHttpRequest, textStatus, errorThrown) {
								console.log(OpenLayers.i18n('Geocoding failed: ${statusText} (${statusCode})', {
                                    statusText: xmlHttpRequest.statusText,
                                    statusCode: xmlHttpRequest.status
                            }));
                        }
					});	
                        
                }
                else {
                    //console && console.info("Nothing selected, input was " + this.value);
                }
            }
        });
    },
    
    

    params: function(request) {		
		// prefill nieuwegein or other city
		var city = '';
		if (Geogem.Settings.geocoder.city){
			city = ' and ' + Geogem.Settings.geocoder.city;
		}
		//return params = {'q':('type:adres and '+request.term + city)};
        return params = {'q':(request.term + city)};
    },

    zoomToExtent: function(extent) {
        this.map.zoomToExtent(extent, true);
    },

    success: function(data, response, request) {
        // make array of addresses (street, number, postalCode, municipality, municipalitySubdivision, geometry, countrySubdivision)
        // o Dropdownlist straatnamen gezocht op substring; inzoomen naar
        //   gekozen straat
        // o Dropdownlist huisnummers binnen gekozen straat, ditmaal niet op
        //   substring; bij selectie inzoomen naar adres (instelbaar zoomniveau)

		var format = new Geogem.Format.PdokLocatieServer();
        var addresses = format.read(data.responseText, 'Suggest');
        var that = this;
		if (addresses.length==0){
			return {};
		}
        response( $.map( addresses, function(item) {
            var result = {};
			address = item;
            /*
                [
                    {   
                        "type":"weg",
                        "weergavenaam":"Koolmees, Nieuwegein",
                        "id":"weg-126ab89619a3be4064403f5bdfc78984",
                        "score":17.201363
                    }
                ]  
            */               
			var label = '';
			if (address.weergavenaam){
				label+=address.weergavenaam;
			}
			/*if (address.type){
				label+=(' ('+address.type+')');
			}*/       
			result.label=label;
            result.id=address.id
            return result;
        }));
    },

    /**
     * Method: ignoreEvent
     *
     * Parameters:
     * evt - {Event}
     */
    ignoreEvent: function(evt) {
        //OpenLayers.Event.stop(evt, true);
    },

    onInputClick: function(evt) {
		if (this.geocoder.tooltip == $('input', this.geocoder.div).val() ){
			$('input', this.geocoder.div).val("");
		}
		$('input', this.geocoder.div).focus();
        //this.geocoder.ignoreEvent(evt);
    },

    CLASS_NAME: 'Geogem.PdokLocatieServer'
});
/* ======================================================================
    Geodan/ReverseGeocoder.js
   ====================================================================== */

/**
 * @requires Geodan/Format/ReverseGeocodeRequest.Format.js
 * @requires Geodan/Format/ReverseGeocodeResponse.Format.js
 */

/**
 * Class: Geodan.ReverseGeocoder
 * Request address for given coordinates.
 *
 * Inherits from:
 *  - <none>
 */
Geodan.ReverseGeocoder = OpenLayers.Class({
  /**
   * Note: reverseGeocodeUrl moet eindigen op ? of &.
   */
  url: 'http://geoserver.nl/geocoderrvs/NLaddressrvs.aspx?Request=revgeocode&',
  
  method: 'GET',
  
  initialize: function(options) {
    OpenLayers.Util.extend(this, options);
  },
  
  destroy: function() {
  },
  
  processAddresses: function(addresses) {
  },

  onFail: function(msg) {
    alert(msg);
  },
  
  /**
   *
   */
  reverseGeocode: function(point) {
    var host_match = this.url.match(/http:\/\/([^\/\:]*)(\:([0-9]{4}))?\//);
	// 1=hostname, 2=:port, 3=port
    var proxyIsNeeded = host_match.length >= 2 && host_match[1] != location.hostname;
    if (!proxyIsNeeded && host_match.length >= 3 && (host_match[3] ? host_match[3] : '') != location.port) {
      proxyIsNeeded = true;
    }
    var ajax_data = {};
    var ajax_url;
    var ajax_method = 'GET';
    if (this.method == 'POST') {
      ajax_method = 'POST';
      
      var format = new Geodan.Format.ReverseGeocodeRequest(null, point);
      if (proxyIsNeeded) {
        // proxy nodig
        ajax_url = OpenLayers.ProxyHost + escape(this.url);
      }
      else {
        ajax_url = this.url;
      }
      ajax_data = '<?xml version="1.0" encoding="UTF-8"?>' + format.write();
    }
    else {
      var data = { x: point.x, y: point.y };
      if (proxyIsNeeded) {
        // proxy nodig
        ajax_url = Geogem.Settings.proxyUrl; // todo: remove ?url=
        ajax_data.url = this.url + $.param(data);
      }
      else {
        // geen proxy nodig
        ajax_url = this.url;
        ajax_data = data;
      }
    }
    
    var options = {
      url: ajax_url,
      type: ajax_method,
      async: true,
      data: ajax_data,
      dataType: 'xml', // expected response type; should be XML, but seems to be JSON, so in Apache configuration mor.conf the response is forced to be XML, HansV, June 23, 2010
      timeout: 10000, // timeout in ms (10 sec)
      success: function(msg) {
        //alert('response = ' + msg);
        var response = new Geodan.Format.ReverseGeocodeResponse();
        addresses = response.read(msg);
        
        Geodan.ReverseGeocoder.prototype.processAddresses.apply(this, [addresses]);
        //alert('Debug-melding: Success [ReverseGeocoder.js]: ' + serialize(addresses));
      },
      error: function(xhr, textStatus, errorThrown) {
        // typically only one of textStatus or errorThrown 
        // will have info
        //this; // the options for this ajax request
        var msg;
        try {
          // try/catch omdat xhr.status niet gezet is na een timeout
          if (xhr.status != 200) {
            msg = 'Er is een fout opgetreden in [ReverseGeocoder.js]: ' + xhr.statusText + ' (' + xhr.status + ')';
          }
          else {
            msg = 'Er is een fout opgetreden in [ReverseGeocoder.js]: ' + xhr.responseText;
          }
        }
        catch (e) {
          msg = 'Er is een exceptie opgetreden in [ReverseGeocoder.js]: ' + textStatus;
        }
        finally {
          Geodan.ReverseGeocoder.prototype.onFail.apply(this, [msg]);
        }
      }
    };
    if (ajax_method == 'POST') {
      options.contentType = 'text/xml';
    }
    
    var addresses = null;
    var tmp = $.ajax(options);
    return addresses;
  },
  
  CLASS_NAME: "Geodan.ReverseGeocoder"
});
