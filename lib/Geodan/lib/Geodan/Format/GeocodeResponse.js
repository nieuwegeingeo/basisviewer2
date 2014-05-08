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
