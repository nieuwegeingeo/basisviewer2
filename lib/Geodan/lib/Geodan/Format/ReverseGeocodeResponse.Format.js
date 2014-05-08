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
