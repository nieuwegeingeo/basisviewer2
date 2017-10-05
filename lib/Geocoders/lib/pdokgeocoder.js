/**
 * Copyright (c) 2010 PDOK
 *
 * Published under the Open Source GPL 3.0 license.
 * http://www.gnu.org/licenses/gpl.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 */

/**
 * Class: Geozet.Format.XLSLUS
 * Read/Wite XLS Location Utility Service (geocode/reverse geocode).
 * Create a new instance with the <Geozet.Format.XLSLUS>
 * constructor.
 * 
 * Inherits from:
 *  - <OpenLayers.Format.XML>
 */
 
Geozet = Geozet || {}; 

Geozet.Format = {};
 
Geozet.Format.XLSLUS = {};
 
Geozet.Format.XLSLUS = OpenLayers.Class(OpenLayers.Format.XML, {
    
    /**
     * APIProperty: defaultVersion
     * {String} Version number to assume if none found.  Default is "1.1.0".
     */
    defaultVersion: "1.1.0",
    
    /**
     * APIProperty: version
     * {String} Specify a version string if one is known.
     */
    //version: null,
	version: "1",
    
    /**
     * Property: parser
     * {Object} Instance of the versioned parser.  Cached for multiple read and
     *     write calls of the same version.
     */
    //parser: null,
	parser: Geozet.Format.XLSLUS.v1,
    /**
     * Constructor: Geozet.Format.XLSLUS
     * Create a new parser for XLSLUS.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * APIMethod: writeGeocodeRequest
     * Write a GeocodeRequest document.
     *
     * Parameters:
     * address - {XLSAddress} An object representing the address.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An XLSLUS document string.
     */
    writeGeocodeRequest: function(address, options) {
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
             var format = Geozet.Format.XLSLUS[
                "v" + version.replace(/\./g, "_")
            ]; 
            if(!format) {
                throw "Can't find a XLSLUS parser for version " +
                      version;
            }
            this.parser = new format(options);
        }
        var root = this.parser.writeGeocodeRequest(address);
        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * APIMethod: writeReverseGeocodeRequest
     * Write a ReverseGeocodeRequest document.
     *
     * Parameters:
     * position - {OpenLayers.Geometry.Point} An object representing the location.
     *            Also more complicated positions are allowed.
     * options - {Object} Optional configuration object.
     *
     * Returns:
     * {String} An XLSLUS document string.
     */
    writeReverseGeocodeRequest: function(position, options) {
        var version = (options && options.version) ||
                      this.version || this.defaultVersion;
        if(!this.parser || this.parser.VERSION != version) {
            var format = Geozet.Format.XLSLUS[
                "v" + version.replace(/\./g, "_")
            ]; 
            if(!format) {
                throw "Can't find a XLSLUS parser for version " +
                      version;
            }
            this.parser = new format(options);
        }
        var root = this.parser.writeReverseGeocodeRequest(position);
        return OpenLayers.Format.XML.prototype.write.apply(this, [root]);
    },
    
    /**
     * APIMethod: read
     * Read and XLSLUS doc and return an object representing the XLSLUS.
     * The document could be a GeocodeResponse or a ReverseGeocodeResponse.
     *
     * Parameters:
     * data - {String | DOMElement} Data to read.
     *
     * Returns:
     * {Object} An object representing the XLSLUS.
     *          For a GeocodeResponse, an array (representing the
     *          "geocodeResponseList") of objects. Each object has a
     *          property named "features", being an array of
     *          <OpenLayers.Features.Vector>. Each feature has a geometry
     *          and in the attributes an attribute named "address", being
     *          an <Geozet.Format.XLSAddress>.
     *          For a ReverseGeocodeResponse, an array (representing the
     *          reverseGeocodedLocation) of features (each feature as above).
     */
    read: function(data, options) {
        if(typeof data == "string") {
            data = OpenLayers.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.version;
        if(!version) {
            version = root.getAttribute("version");
            if(!version) {
                version = this.defaultVersion;
            }
        }
        if(!this.parser || this.parser.VERSION != version) {
             var format = Geozet.Format.XLSLUS[
                "v" + version.replace(/\./g, "_")
            ]; 
            if(!format) {
                throw "Can't find a XLSLUS parser for version " +
                      version;
            }
            this.parser = new format(options);
        }
        var xlslus = this.parser.read(data);
        return xlslus;
    } //,

    CLASS_NAME: "Geozet.Format.XLSLUS" 
});
/**
 * Copyright (c) 2010 PDOK
 *
 * Published under the Open Source GPL 3.0 license.
 * http://www.gnu.org/licenses/gpl.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 */

/**
 * Class: Geozet.Format.XLSAddress
 * Represent an XLS (OGC Open Location Service) Address.
 * Either a freeFormAddress, or a structured address with street, building,
 * place and postalCode.
 */
Geozet.Format.XLSAddress = OpenLayers.Class({
    
    addressee: null,

    /**
     * Property: countryCode
     * {String} two-letter ISO 3166 countrycode for the address.
     */
    countryCode: null,

    /**
     * Property: freeFormAddress
     * {String} address in free format.
     */
    freeFormAddress: null,

    /**
     * Property: street
     * {Array} List of street addresses. Each is either a simple string, or an
     * object with attributes: directionalPrefix, typePrefix,
     * officialName, typeSuffix, directionalSuffix, muniOctant.
     */
    street: null,

    /**
     * Building, if not null, an object with attributes: number,
     * subdivision, and buildingName.
     */
    building: null,

    place: null,

    postalCode: null,

    /**
     * Constructor: Geozet.Format.XLSAddress.
     *
     * Parameters:
     * countryCode - 2-letter ISO 3166 countrycode for this address.
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(countryCode, options) {
        this.street = [];
        this.place = {
            CountrySubdivision: null,
            CountrySecondarySubdivision: null,
            Municipality: null,
            MunicipalitySubdivision:null
        };
        OpenLayers.Util.extend(this, options);
	this.countryCode = countryCode;
    },

    /**
     * Get the address as a single string. This method could be overridden
     * in subclasses to provide application specific formatting.
     * The <Geozet.Format.XLSLUS> class accepts the option
     * "addressClass" with the application specific XLSAddress subclass
     * to be used when reading XLS XML documents.
     */
    format: function() {
        if (this.freeFormAddress) {
            return this.freeFormAddress;
        } else {
            return this.getStreetText() + ' ' + this.getBuildingText()
                   + ' ' + this.getPostalCodeText() + ' ' + this.getPlaceText();
        }
    },

    /**
     * Get the street(s) as a single string. Useful when using the
     * OpenLayers String.format with a template. The template should
     * use this function name, and pass the address object (since
     * the format function calls the function without a this).
     * @param address The address <Geozet.Format.XLSAddress>. If not
     *                specified, works on "this".
     */
    getStreetText: function(address) {
	if (!address) { address = this; }
        var text = '';
        for (var si = 0; si < address.street.length; si++) {
            if (text != '') { text += ' '; }
            text += address.formatObject(address.street[si], Geozet.Format.XLSAddress.formattedStreetProperties);
        }
        return text;
    },

    /**
     * Get the building as a single string. Useful when using the
     * OpenLayers String.format with a template. The template should
     * use this function name, and pass the address object (since
     * the format function calls the function without a this).
     * @param address The address <Geozet.Format.XLSAddress>. If not
     *                specified, works on "this".
     */
    getBuildingText: function(address) {
	if (!address) { address = this; }
        return address.formatObject(address.building, Geozet.Format.XLSAddress.formattedBuildingProperties);
    },

    /**
     * Get the postalCode as a string, an empty string if null. Useful when using the
     * OpenLayers String.format with a template. The template should
     * use this function name, and pass the address object (since
     * the format function calls the function without a this).
     * @param address The address <Geozet.Format.XLSAddress>. If not
     *                specified, works on "this".
     */
    getPostalCodeText: function(address) {
	if (!address) { address = this; }
        return !address.postalCode ? '' : address.postalCode;
    },

    /**
     * Get the place as a single string. Useful when using the
     * OpenLayers.String.format with a template. The template should
     * use this function name, and pass the address object (since
     * the format function calls the function without a this).
     * @param address The address <Geozet.Format.XLSAddress>. If not
     *                specified, works on "this".
     */
    getPlaceText: function(address) {
	if (!address) { address = this; }
        return address.formatObject(address.place, Geozet.Format.XLSAddress.formattedPlaceProperties);
    },

    /**
     * private function to format an object as a string.
     * @param obj the object to format.
     * @param props Array of property names from obj to put in the result.
     */
    formatObject: function(obj, props) {
        if (!obj) { return '' };
        var text = '';
        if (typeof obj == 'string') {
            text = obj;
        } else if (props instanceof Array) {
            for (var pi = 0; pi < props.length; pi++) {
                if (obj[props[pi]]) {
                    if (text != '') { text += ' '; }
                    text += obj[props[pi]];
                }
            }
        }
        return text;
    },

    CLASS_NAME: "Geozet.Format.XLSAddress" 
});

/**
 * Place properties to use for formatting an address as a string,
 * defining also the order of the place properties.
 */
Geozet.Format.XLSAddress.formattedPlaceProperties = [
    'Municipality', 'MunicipalitySubdivision',
    'CountrySecondarySubdivision', 'CountrySubdivision'];

/**
 * Street properties to use for formatting an address as a string,
 * defining also the order of the street properties.
 * This applies only to streets using the structured attributes from OpenLS.
 */
Geozet.Format.XLSAddress.formattedStreetProperties = [
    'directionalPrefix', 'typePrefix', 'officialName',
    'typeSuffix', 'directionalSuffix', 'muniOctant' ];

/**
 * Building properties to use for formatting an address as a string,
 * defining also the order of the building properties.
 */
Geozet.Format.XLSAddress.formattedBuildingProperties = [
    'number', 'subdivision', 'buildingName' ];

/**
 * Copyright (c) 2010 PDOK
 *
 * Published under the Open Source GPL 3.0 license.
 * http://www.gnu.org/licenses/gpl.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 */

/**
 * Class: Geozet.Format.XLSLUS.v1
 * Superclass for XLSLUS version 1 parsers.
 *
 * Inherits from:
 *  - <OpenLayers.Format.GML>
 */
Geozet.Format.XLSLUS.v1 = OpenLayers.Class(OpenLayers.Format.GML, {
    
    /**
     * Property: namespaces
     * {Object} Mapping of namespace aliases to namespace URIs.
     */
    namespaces: {
        xls: "http://www.opengis.net/xls",
        gml: "http://www.opengis.net/gml",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },
    
    /**
     * Property: defaultPrefix
     */
    defaultPrefix: "xls",

    /**
     * Property: schemaLocation
     * {String} Schema location for a particular minor version.
     */
    schemaLocation: null,

    /**
     * Property: addressClass
     * {Class} Subclass of <Geozet.Format.XLSAddress>, allowing
     *         client to have e.g. specialized address formatting.
     */
    addressClass: Geozet.Format.XLSAddress,

    /**
     * Property: srsName
     * {String} used for reverse geocode requests to set the srs for a
     *          coordinate.
     */
    srsName: 'EPSG:28992',

    /**
     * Constructor: Geozet.Format.XLSLUS.v1
     * Instances of this class are not created directly.  Use the
     *     <Geozet.Format.XLSLUS> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        OpenLayers.Format.GML.prototype.initialize.apply(this, [options]);
    },
    
    /**
     * Method: read
     *
     * Parameters:
     * data - {DOMElement} An XLSLUS document element.
     *
     * Returns:
     * {Object} An object representing the XLSLUS.
     *          For GeocodeResponse, an array (representing the
     *          geocodeResponseList) with objects with a property
     *          features being an array of <OpenLayers.Feature.Vector>.
     *          For ReverseGeocodeResponse, an array of <OpenLayers.Feature.Vector>
     *          (representing the reverseGeocodedLocation).
     */
    read: function(data) {        
        var xlslus = [];
        this.readChildNodes(data, xlslus);
        return xlslus;
    },
    
    /**
     * Property: readers
     * Contains public functions, grouped by namespace prefix, that will
     *     be applied when a namespaced node is found matching the function
     *     name.  The function will be applied in the scope of this parser
     *     with two arguments: the node being read and a context object passed
     *     from the parent.
     */
    readers: {
        "xls": {
            "GeocodeResponse": function(node, xlslus) {
		// top node for Geocode response
                this.readChildNodes(node, xlslus);
            },
            "GeocodeResponseList": function(node, xlslus) {
		var responseList = {};
                responseList.features = [];
		responseList.numberOfGeocodedAddresses = node.getAttribute("numberOfGeocodedAddresses");
                this.readChildNodes(node, responseList);
		xlslus.push(responseList);
	    },
            "GeocodedAddress": function(node, responseList) {
                var feature = new OpenLayers.Feature.Vector();
                this.readChildNodes(node, feature);
                responseList.features.push(feature);
            },
            "GeocodeMatchCode": function(node, feature) {
		var matchCode = {};
		matchCode.accuracy = node.getAttribute("accuracy");
		matchCode.matchType = node.getAttribute("matchType");
		feature.attributes.geocodeMatchCode = matchCode;
	    },
            "ReverseGeocodeResponse": function(node, xlslus) {
		// top node for reverse Geocode response
                this.readChildNodes(node, xlslus);
            },
            "ReverseGeocodedLocation": function(node, xlslus) {
		var feature = new OpenLayers.Feature.Vector();
                this.readChildNodes(node, feature);
		xlslus.push(feature);
	    },
            "SearchCentreDistance": function(node, feature) {
		var distance = {};
		distance.value = node.getAttribute("value");
		distance.accuracy = node.getAttribute("accuracy");
		distance.uom = node.getAttribute("uom");
		if (!distance.uom) {
		    distance.uom = "M";
		}
		feature.attributes.searchCentreDistance = distance;
	    },
            "Address": function(node, feature) {
                var countryCode = node.getAttribute("countryCode");
		var address = new this.addressClass(countryCode);
                address.addressee = node.getAttribute("addressee");
                this.readChildNodes(node, address);
		feature.attributes.address = address;
            },
            "freeFormAddress": function(node, address) {
		address.freeFormAddress = this.getChildValue(node);
            },
            "StreetAddress": function(node, address) {
                this.readChildNodes(node, address);
            },
            "Building": function(node, address) {
                //optional
                var building = {};
		building.number = node.getAttribute("number");
		building.subdivision = node.getAttribute("subdivision");
		building.buildingName = node.getAttribute("buildingName");
                address.building = building;
            },
            "Street": function(node, address) {
		var street = {};
		street.name = this.getChildValue(node);
		street.directionalPrefix = node.getAttribute("directionalPrefix");
		street.typePrefix = node.getAttribute("typePrefix");
		street.officialName = node.getAttribute("officialName");
		street.typeSuffix = node.getAttribute("typeSuffix");
		street.directionalSuffix = node.getAttribute("directionalSuffix");
		street.muniOctant = node.getAttribute("muniOctant");
                if (!street.directionalPrefix && !street.typePrefix &&
                        !street.officialName && !street.typeSuffix &&
                        !street.directionalSuffix && !street.muniOctant) {
                    // Get the simple name as string.
                    street = street.name;
                }
		address.street.push(street);
            },
            "Place": function(node, address) {
                // multiple, optional 0. Assume only one place per type.
		// type one of CountrySubdivision, CountrySecondarySubdivision,
		// Municipality, or MunicipalitySubdivision
		var type = node.getAttribute("type");
		address.place[type] = this.getChildValue(node);
            },
            "PostalCode": function(node, address) {
                //optional
		address.postalCode = this.getChildValue(node);
            }
	},
	"gml": {
	    "Point": function(node, feature) {
                var parser = this.parseGeometry["point"];
                var geometry = parser.apply(this, [node]);
                if (this.internalProjection && this.externalProjection) {
                    geometry.transform(this.externalProjection,
                                       this.internalProjection);
                }
		feature.geometry = geometry;
	    }
        }
    },
    
    /**
     * Method: writeGeocodeRequest
     *
     * Parameters:
     * address - {XLSAddress} An object representing the address(es).
     *
     * Returns:
     * {DOMElement} The root of a GeocodeRequest document.
     */
    writeGeocodeRequest: function(address) {
        return this.writers.xls.GeocodeRequest.apply(this, [address]);
    },

    /**
     * Method: writeReverseGeocodeRequest
     *
     * Parameters:
     * position - An object representing the position.
     *
     * Returns:
     * {DOMElement} The root of a ReverseGeocodeRequest document.
     */
    writeReverseGeocodeRequest: function(position) {
        return this.writers.xls.ReverseGeocodeRequest.apply(this, [position]);
    },

    /**
     * Property: writers
     * This structure contains public
     *     writing functions grouped by namespace alias and named like the
     *     node names they produce.
     * The writers are intended to create XML requests (E.g. GeocodeRequest).
     */
    writers: {
        "xls": {
            "GeocodeRequest": function(address) {
                var root = this.createElementNSPlus(
                    "GeocodeRequest",
                    {attributes: {
                        "xsi:schemaLocation": this.schemaLocation
                    }}
                );
		if (!(address instanceof Array)) {
		    address = [address];
		}
		for (var i = 0; i < address.length; i++) {
                    this.writeNode(root, "Address", address[i]);
		}
                return root;
	    },
            "ReverseGeocodeRequest": function(position) {
                var root = this.createElementNSPlus(
                    "ReverseGeocodeRequest",
                    {attributes: {
                        "xsi:schemaLocation": this.schemaLocation
                    }}
                );
                this.writeNode(root, "Position", position);
                return root;
	    },
            "Address": function(address) {
		var node = this.createElementNSPlus("Address",
		    {attributes: {
			"countryCode": address.countryCode,
			"addressee": address.addressee
		    }}
		);
		if (address.freeFormAddress) {
                    this.writeNode(node, "freeFormAddess", address.freeFormAddress);
		} else {
                    this.writeNode(node, "StreetAddress", address);
		    if (address.place) {
			var classification = Geozet.Format.XLSLUS.v1.NamedPlaceClassification;
		        for (var i = 0; i < classification.length; i++) {
			    if (address.place[classification[i]]) {
				var placeNode = this.writeNode(node, "Place", address.place[classification[i]]);
				this.setAttributes(placeNode, { "type": classification[i] });
			    }
			}
		    }
		    if (address.postalCode) {
                        this.writeNode(node, "PostalCode", address.postalCode);
		    }
		}
		return node;
	    },
	    "freeFormAddress": function(freeFormAddress) {
		return this.createElementNSPlus("freeFormAddress", {value: freeFormAddress});
	    },
	    "StreetAddress": function(address) {
		var node = this.createElementNSPlus("StreetAddress", {});
		if (address.building) {
                    this.writeNode(node, "Building", address.building);
		}
		var street = address.street;
		if (!(street instanceof Array)) {
		    street = [street];
		}
		for (var i = 0; i < street.length; i++) {
		    this.writeNode(node, "Street", street[i]);
		}
		return node;
	    },
	    "Building": function(building) {
		return this.createElementNSPlus("Building", {attributes: {
			"number": building.number,
			"subdivision": building.subdivision,
			"buildingName": building.buildingName
		       }});
	    },
	    "Street": function(street) {
		if (typeof street == 'string') {
		    return this.createElementNSPlus("Street", {value: street});
		} else if (street && street.name) {
		    return this.createElementNSPlus("Street", {value: street.name});
		} else {
		    return this.createElementNSPlus("Street", {attributes: {
			"directionalPrefix": street.directionalPrefix,
			"typePrefix": street.typePrefix,
			"officialName": street.officialName,
			"typeSuffix": street.typeSuffix,
			"directionalSuffix": street.directionalSuffix,
			"muniOctant": street.muniOctant
		    }});
		}
	    },
	    "Place": function(place) {
		return this.createElementNSPlus("Place", {value: place});
	    },
	    "PostalCode": function(postalCode) {
		return this.createElementNSPlus("PostalCode", {value: postalCode});
	    },
            "Position": function(position) {
		var node = this.createElementNSPlus("Position", {attributes: {
			"levelOfConf": position.levelOfConf
		}});
		if (position.CLASS_NAME && position.CLASS_NAME == "OpenLayers.Geometry.Point") {
		    position = { point: position };
		}
		this.writeNode(node, "gml:Point", position.point);
		if (position.shape) {
		    if (position.shape.CLASS_NAME && position.shape.CLASS_NAME == "OpenLayers.Geometry.Polygon") {
			this.writeNode(node, "gml:Polygon", position.shape);
		    } else if (position.shape.CLASS_NAME && position.shape.CLASS_NAME == "OpenLayers.Geometry.MultiPolygon") {
			this.writeNode(node, "gml:MultiPolygon", position.shape);
		    }
		}
		if (position.qop) {
		}
		if (position.time) {
		}
		if (position.speed) {
		}
		if (position.direction) {
		}
		return node;
	    }
        },
        "gml": {
	    "Point": function(point) {
		// Cannot use  this.buildGeometryNode(point), because it
                // generates gml:coordinates, while OpenLS only knows gml:pos.
		var node = this.createElementNSPlus("gml:Point", {attributes: {
                        srsName: this.srsName}});
                this.writeNode(node, "gml:pos", point);
                return node;
	    },
	    "pos": function(point) {
		return this.createElementNSPlus("gml:pos", {value: point.x + ' ' + point.y});
	    },
	    "CircleByCenterPoint": function(geometry) {
	    },
	    "Polygon": function(geometry) {
		return this.buildGeometryNode(geometry);
	    },
	    "MultiPolygon": function(geometry) {
		return this.buildGeometryNode(geometry);
	    }
        }
    },
    

    /**
     * Methods below this point are of general use for versioned XML parsers.
     * These are candidates for an abstract class.
     */
    
    /**
     * Method: getNamespacePrefix
     * Get the namespace prefix for a given uri from the <namespaces> object.
     *
     * Returns:
     * {String} A namespace prefix or null if none found.
     */
    getNamespacePrefix: function(uri) {
        var prefix = null;
        if(uri == null) {
            prefix = this.namespaces[this.defaultPrefix];
        } else {
            var gotPrefix = false;
            for(prefix in this.namespaces) {
                if(this.namespaces[prefix] == uri) {
                    gotPrefix = true;
                    break;
                }
            }
            if(!gotPrefix) {
                prefix = null;
            }
        }
        return prefix;
    },


    /**
     * Method: readChildNodes
     */
    readChildNodes: function(node, obj) {
        var children = node.childNodes;
        var child, group, reader, prefix, local;
        for(var i=0; i<children.length; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                prefix = this.getNamespacePrefix(child.namespaceURI);
                local = child.nodeName.split(":").pop();
                group = this.readers[prefix];
                if(group) {
                    reader = group[local];
                    if(reader) {
                        reader.apply(this, [child, obj]);
                    }
                }
            }
        }
    },

    /**
     * Method: writeNode
     * Shorthand for applying one of the named writers and appending the
     *     results to a node.  If a qualified name is not provided for the
     *     second argument (and a local name is used instead), the namespace
     *     of the parent node will be assumed.
     *
     * Parameters:
     * parent - {DOMElement} Result will be appended to this node.
     * name - {String} The name of a node to generate.  If a qualified name
     *     (e.g. "pre:Name") is used, the namespace prefix is assumed to be
     *     in the <writers> group.  If a local name is used (e.g. "Name") then
     *     the namespace of the parent is assumed.
     * obj - {Object} Structure containing data for the writer.
     *
     * Returns:
     * {DOMElement} The child node.
     */
    writeNode: function(parent, name, obj) {
        var prefix, local;
        var split = name.indexOf(":");
        if(split > 0) {
            prefix = name.substring(0, split);
            local = name.substring(split + 1);
        } else {
            prefix = this.getNamespacePrefix(parent.namespaceURI);
            local = name;
        }
        var child = this.writers[prefix][local].apply(this, [obj]);
        parent.appendChild(child);
        return child;
    },
    
    /**
     * Method: createElementNSPlus
     * Shorthand for creating namespaced elements with optional attributes and
     *     child text nodes.
     *
     * Parameters:
     * name - {String} The qualified node name.
     * options - {Object} Optional object for node configuration.
     *
     * Returns:
     * {Element} An element node.
     */
    createElementNSPlus: function(name, options) {
        options = options || {};
        var loc = name.indexOf(":");
        // order of prefix preference
        // 1. in the uri option
        // 2. in the prefix option
        // 3. in the qualified name
        // 4. from the defaultPrefix
        var uri = options.uri || this.namespaces[options.prefix];
        if(!uri) {
            loc = name.indexOf(":");
            uri = this.namespaces[name.substring(0, loc)];
        }
        if(!uri) {
            uri = this.namespaces[this.defaultPrefix];
        }
        var node = this.createElementNS(uri, name);
        if(options.attributes) {
            this.setAttributes(node, options.attributes);
        }
        if(options.value) {
            node.appendChild(this.createTextNode(options.value));
        }
        return node;
    },
    
    /**
     * Method: setAttributes
     * Set multiple attributes given key value pairs from an object.
     *
     * Parameters:
     * node - {Element} An element node.
     * obj - {Object || Array} An object whose properties represent attribute
     *     names and values represent attribute values.  If an attribute name
     *     is a qualified name ("prefix:local"), the prefix will be looked up
     *     in the parsers {namespaces} object.  If the prefix is found,
     *     setAttributeNS will be used instead of setAttribute.
     */
    setAttributes: function(node, obj) {
        var value, loc, alias, uri;
        for(var name in obj) {
	    if (obj[name]) {
                value = obj[name].toString();
                // check for qualified attribute name ("prefix:local")
                uri = this.namespaces[name.substring(0, name.indexOf(":"))] || null;
                this.setAttributeNS(node, uri, name, value);
	    }
        }
    },

    CLASS_NAME: "Geozet.Format.XLSLUS.v1" 

});

Geozet.Format.XLSLUS.v1.NamedPlaceClassification = [
    "CountrySubdivision",
    "CountrySecondarySubdivision",
    "Municipality",
    "MunicipalitySubdivision"
];

/**
 * Copyright (c) 2010 PDOK
 *
 * Published under the Open Source GPL 3.0 license.
 * http://www.gnu.org/licenses/gpl.html
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 */

/**
 * @requires Geozet/Format/XLSLUS/v1.js
 */

/**
 * Class: Geozet.Format.XLSLUS.v1_1_0
 * Read/write XLS Location Utility Service version 1.1.0.
 * 
 * Inherits from:
 *  - <Geozet.Format.XLSLUS.v1>
 */
Geozet.Format.XLSLUS.v1_1_0 = OpenLayers.Class(
    Geozet.Format.XLSLUS.v1, {
    
    /**
     * Constant: VERSION
     * {String} 1.1.0
     */
    VERSION: "1.1.0",
    
    /**
     * Property: schemaLocation
     * {String} http://www.opengis.net/xls
     *   http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd
     */
    schemaLocation: "http://www.opengis.net/xls http://schemas.opengis.net/ols/1.1.0/LocationUtilityService.xsd",

    /**
     * Constructor: Geozet.Format.XLSLUS.v1_1_0
     * Instances of this class are not created directly.  Use the
     *     <Geozet.Format.XLSLUS> constructor instead.
     *
     * Parameters:
     * options - {Object} An optional object whose properties will be set on
     *     this instance.
     */
    initialize: function(options) {
        Geozet.Format.XLSLUS.v1.prototype.initialize.apply(
            this, [options]
        );
    },

    CLASS_NAME: "Geozet.Format.XLSLUS.v1_1_0" 
});


var Geogem = Geogem || {};

Geogem.Geocoder = OpenLayers.Class(OpenLayers.Control, {

    autocomplete: {
      minLength: 5,
      delay: 500
    },

    //url: 'http://' + location.host + '/geocoder/geocode?',
	// TODO
	url: 'http://geodata.nationaalgeoregister.nl/geocoder/Geocoder?zoekterm=',

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
                    if (ui.item.address) {
						self.lastSelectGroup = ui.item.value;
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
                            Geogem.addPosition(point.x, point.y);
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
        /*var params = {
            country: 'Nederland'
        };*/
        // match postcode (1) of gemeente (3), straat (5)
        // match postcode (1) of straat () met huisnummer(s), gescheiden door spatie(s) en optionele komma

		/*
        var match = request.term.match(/(^[1-9][0-9]{1,3}[a-zA-Z]{0,2})|((^[^,]*)(,\s*(.*))?)/);
        //console && console.info('search match', match);
        if (match) {
            if (match[1]) {
				// postcode (vb: '3432ZJ' of '3432ZJ 45')
				// als de huidige zoekterm precies hetzelfde is als de laatste geselecteerd (of gefocuste)
                if (this.lastSelectGroup && request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0) {
                    params.postalCode = this.lastSelectGroup;
                    var remains = request.term.substr(this.lastSelectGroup.length);
//                    params.building = $.trim(remains) + '*';
                    params.zoekterm = $.trim(remains) + '';
                }
                else {
//                    params.postalCode = match[1] + '*';
					params.zoekterm = match[1] + '';
                }
//                request.searchParameter = 'postalCode';
				request.searchParameter = 'zoekterm';
            }
            else {
                // straat
				// als de huidige zoekterm precies hetzelfde is als de laatste geselecteerd (of gefocuste)
                if (this.lastSelectGroup && request.term.toLowerCase().indexOf(this.lastSelectGroup.toLowerCase()) == 0) {
//                    params.street = this.lastSelectGroup;
                    var remains = match[2].substr(this.lastSelectGroup.length);
					// we do not want to sent a ' ' to the server, so we trim the remains,
					// but IE does not have trim: that's why jquery.trim here:
//					params.building = $.trim(remains) + '*';
                    params.zoekterm = $.trim(remains) + '';
                }
                else {
					
//                    params.street = '*' + match[3] + '*';
						params.zoekterm = '' + match[3] + '';
                    if (match[5]) {
//                        params.building = match[5] + ' *';
						params.zoekterm = match[5] + ' ';
                    }
                }
//                request.searchParameter = 'street';
				request.searchParameter = 'zoekterm';
            }
			
            return params;
        }*/
		
		// prefill nieuwegein or other city
		var city = '';
		if (Geogem.Settings.geocoder.city){
			city = Geogem.Settings.geocoder.city+' ';
		}
		return params = {'zoekterm':(city+request.term)};
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
//        var format = new Geodan.Format.GeocodeResponse();
		var format = new Geozet.Format.XLSLUS();
        var addresses = format.read(data.responseText);
		
        var numAddresses = addresses.length;
        var that = this;
		if (addresses.length==0){
			return {};
		}
        response( $.map( addresses[0].features, function(item) {
            var result = {};
            /*if (item.postalCode && request.searchParameter !== 'street') {
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
            }*/
			address=item.attributes.address
			// address.street
			// address.building.number
			// address.building.subdivision
			// address.postalCode
			// address.place.CountrySubdivision = prov
			// address.place.Municipality
			// address.place.MunicipalitySubdivision
			// address.countryCode
			var label = '';
			if (address.street){
				label+=address.street;
			}
			if (address.building){
				label+=' '+address.building.number;
				if (address.building.subdivision){
					label+=' '+address.building.subdivision;
				}
			}
			if (address.postalCode){
				label+=' '+address.postalCode;
			}
			if (address.place){
				label+=' '+address.place.Municipality;
			}
			//console.log(label);
			result.label=label;
            result.address = item.attributes.address;
			result.address.extent = item.geometry.getBounds();
			//console.log(item.attributes.address);
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

    CLASS_NAME: 'Geogem.Geocoder'
});