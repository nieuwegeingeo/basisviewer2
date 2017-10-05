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
  url: window.location.protocol+'//geoserver.nl/geocoderrvs/NLaddressrvs.aspx?Request=revgeocode&',
  
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
    var host_match = this.url.match(/http[s]?:\/\/([^\/\:]*)(\:([0-9]{4}))?\//);
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
