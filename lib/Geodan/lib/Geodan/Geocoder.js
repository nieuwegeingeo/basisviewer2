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
			focus: function(event, ui) {
			    if (ui.item && ui.item.address) {
					self.lastSelectGroup = ui.item.value;
				}
			},
            select: function(event, ui) {
                var extent, point, margin;

                if (ui.item) {
                    if (ui.item.address) {
						self.lastSelectGroup = ui.item.value;
                        if (ui.item.address.extent) {
                            margin = self.extentMargin;
                            extent = ui.item.address.extent;
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
				// als de huidige zoekterm precies hetzelfde is als de laatste geselecteerd (of gefocuste)
                if (this.lastSelectGroup && request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0) {
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
        response( $.map( addresses, function(item) {
            var result = {};
            if (item.postalCode && request.searchParameter !== 'street') {
                result.label = item.postalCode + ' (' + item.street + (item.number ? ' ' + item.number : '') + ')';
                // geen huisnummers in value
                result.value = item.postalCode;
                if (numAddresses == 1 && request.term.toLowerCase() === item.postalCode.toLowerCase()) {
                    that.lastSelectGroup = item.postalCode;
                }
            }
            else {
                result.label = item.street + (item.number ? ' ' + item.number + (item.subdivision ? item.subdivision : '') : '');
                result.value = result.label;
                if (numAddresses == 1 && request.term.toLowerCase() === item.street.toLowerCase()) {
                    that.lastSelectGroup = item.street;
                }
            }
            result.address = item;
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
