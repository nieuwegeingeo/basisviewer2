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
    
    var request = this.createElementNS(this.xlsns, 'xls:ReverseGeocodeRequest');
    request.setAttribute('xmlns:gml', this.gmlns);
    request.setAttribute('xmlns:xsi', "http://www.w3.org/2001/XMLSchema-instance");
    
    request.appendChild(this.createPosition());
    
    return OpenLayers.Format.XML.prototype.write.apply(this, [request]);
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
