/**
 * From http://delete.me.uk/2005/03/iso8601.html.
 * @param format
 *   The format the resulting string should take, ie. how many components to 
 *   include. This is an integer between 1 and 6. Default format is 5.
 *   1 Year:
 *     YYYY (eg 1997)
 *   2 Year and month:
 *     YYYY-MM (eg 1997-07)
 *   3 Complete date:
 *     YYYY-MM-DD (eg 1997-07-16)
 *   4 Complete date plus hours and minutes:
 *     YYYY-MM-DDThh:mmTZD (eg 1997-07-16T19:20+01:00)
 *   5 Complete date plus hours, minutes and seconds:
 *     YYYY-MM-DDThh:mm:ssTZD (eg 1997-07-16T19:20:30+01:00)
 *   6 Complete date plus hours, minutes, seconds and a decimal
 *     fraction of a second
 *           YYYY-MM-DDThh:mm:ss.sTZD (eg 1997-07-16T19:20:30.45+01:00)
 * @param offset
 *   Optional timezone offset. If it is not specified the timezone is set to UTC
 *   using the Z character. It takes the form +HH:MM or -HH:MM.
 */
Date.prototype.toISO8601String = function (format, offset) {
    if (!format) { var format = 5; }
    if (!offset) {
        var offset = 'Z';
        var date = this;
    } else {
        var d = offset.match(/([-+])([0-9]{2}):([0-9]{2})/);
        var offsetnum = (Number(d[2]) * 60) + Number(d[3]);
        offsetnum *= ((d[1] == '-') ? -1 : 1);
        var date = new Date(Number(Number(this) + (offsetnum * 60000)));
    }

    var zeropad = function (num) { return ((num < 10) ? '0' : '') + num; }

    var str = "";
    str += date.getUTCFullYear();
    if (format > 1) { str += "-" + zeropad(date.getUTCMonth() + 1); }
    if (format > 2) { str += "-" + zeropad(date.getUTCDate()); }
    if (format > 3) {
        str += "T" + zeropad(date.getUTCHours()) +
               ":" + zeropad(date.getUTCMinutes());
    }
    if (format > 5) {
        var secs = Number(date.getUTCSeconds() + "." +
                   ((date.getUTCMilliseconds() < 100) ? '0' : '') +
                   zeropad(date.getUTCMilliseconds()));
        str += ":" + zeropad(secs);
    } else if (format > 4) { str += ":" + zeropad(date.getUTCSeconds()); }

    if (format > 3) { str += offset; }
    return str;
}

/**
 *
 */
Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
}

function $defined(o){
  return (o != undefined && o != null);
};

/**
Function: $type
	Returns the type of Object that matches the element passed in.

Arguments:
	obj - the Object to inspect.
	
Example:
	>var myString = 'hello';
	>$type(myString); //returns "string"

Returns:                                 
	'element' - if o is a DOM element node
	'textnode' - if o is a DOM text node
	'whitespace' - if o is a DOM whitespace node
	'arguments' - if o is an arguments object
	'array' - if o is an object
	'object' - if o is an object
	'string' - if o is a string
	'number' - if o is a number
	'boolean' - if o is a boolean
	'function' - if o is a function
	'regexp' - if o is a regular expression
	'date' - if o is a Date
	'class' - if o is a Class. (created with new Class, or the extend of another class).
	'collection' - if o is a native htmlelements collection, such as childNodes, getElementsByTagName .. etc.
	null - if the object is not defined or none of the above.
*/

function $type(o){
  if (! $defined(o)) {return null;}
  if (o.htmlElement) {return 'element';}
  
  var type = typeof o;
  
  if (type == 'object' && o.nodeName) {
    switch (o.nodeType) {
            case 1: return 'element';
            case 3: return (/\S/).test(o.nodeValue) ? 'textnode' : 'whitespace';
    }
  }
  
  if (type == 'object' || type == 'function') {
    switch (o.constructor) {
      case Array: return 'array';
      case RegExp: return 'regexp';
      //case Class: return 'class'; // geeft fout in ff
      case Date: return 'date';
      // add additional Object types that you care about here
    }
    
    if (typeof o.length == 'number') {
      if (o.item) {return 'collection';}
      if (o.callee) {return 'arguments';}
    }
  }
  
  return type;
};


/**
Function: isType
	Returns true if the Object has the same type as supplied.

Arguments:
	o - the Object to inspect.
	type - the String name for type
	
Returns:
	{boolean}
*/

function isType(o, type) {
  return type == $type(o);
}

function serialize(o) {
  var type = $type(o);
  var s = '';
  switch (type) {
  case 'array':
    s += '[';
    for (var i = 0; i < o.length; i++) {
      s += (i == 0 ? '' : ', ') + serialize(o[i]);
    }
    s += ']';
    break;
  case 'object':
    s += '{';
    var ch = '';
    for (var item in o) {
      if ($type(o[item]) != 'function') {
        s += ch + '"' + item + '": ' + serialize(o[item]);
        ch = ', ';
      }
    }
    s += '}';
    break;
  case 'string':
    s += '"' + o + '"';
    break;
  case 'function':
    break;
  default:
    s += o;
    break;
  }
  return s;
};


if(typeof String.prototype.trim !== 'function') {
  String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ''); 
  }
}