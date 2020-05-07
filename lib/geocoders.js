
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
                        url = Geogem.Settings.proxyUrl+'?url=';
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


/**
 * Class: Geogem.PdokReverseGeocoder
 * Request address for given coordinates from PDOK Reverse Geocoder
 * See: https://github.com/PDOK/locatieserver/wiki/API-Reverse-Geocoder
 *
 * Inherits from:
 *  - <none>
 */
Geogem.PdokReverseGeocoder = OpenLayers.Class({
  /**
   * Note: reverseGeocodeUrl moet eindigen op ? of &.
   */
  url: 'http://geodata.nationaalgeoregister.nl/locatieserver/revgeo?',
  
  method: 'GET',
  
  initialize: function(options) {
    OpenLayers.Util.extend(this, options);
  },
  
  destroy: function() {
  },
  
  processAddresses: function(addresses) {
  },

  onFail: function(msg) {
    alert('FOUT: ' + msg);
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
      alert('Not Yet Implemented');
      /* old stuff from Geodan
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
      */
    }
    else {
      var data = { X: point.x, Y: point.y, rows: 1 };
      if (proxyIsNeeded) {
        // proxy nodig
        ajax_url = Geogem.Settings.proxyUrl;
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
      //dataType: 'xml', // expected response type; should be XML, but seems to be JSON, so in Apache configuration mor.conf the response is forced to be XML, HansV, June 23, 2010
      timeout: 10000, // timeout in ms (10 sec)
      success: function(msg) {
        //console.log(msg);
        Geogem.PdokReverseGeocoder.prototype.processAddresses.apply(this, [msg]); // second arg has to be an array!!
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
          Geogeom.PdokReverseGeocoder.prototype.onFail.apply(this, [msg]);
        }
      }
    };
    /*if (ajax_method == 'POST') {
      options.contentType = 'text/xml';
    }*/
    
    var addresses = null;
    var tmp = $.ajax(options);
    return addresses;
  },
  
  CLASS_NAME: "Geogem.PdokReverseGeocoder"
});
