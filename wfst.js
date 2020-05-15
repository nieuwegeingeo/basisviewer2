// this saveStrategy is need when creating the layer, either create it here
// OR even earlier in viewer.js
Geogem.saveStrategy = new OpenLayers.Strategy.Save();

Geogem.initWFST = function (wfs) {

    // setting the color of the Vectors to be purple and
    // the size of the points big enough to be ticked on a mobile device


    if (wfs.type == "point" || wfs.type === undefined) {
        OpenLayers.Feature.Vector.style.default.pointRadius = 20;
        OpenLayers.Feature.Vector.style.default.fillColor = '#88179F';
        OpenLayers.Feature.Vector.style.default.strokeColor = '#88179F';
        OpenLayers.Feature.Vector.style.select.pointRadius = 20;
        OpenLayers.Feature.Vector.style.select.fillColor = '#ff0000';
        OpenLayers.Feature.Vector.style.select.strokeColor = '#ff0000';
    } else if (wfs.type == "polygon" || wfs.type == "polyline" || wfs.type == "multi") {
        OpenLayers.Feature.Vector.style.default.pointRadius = 10;
        OpenLayers.Feature.Vector.style.default.strokeWidth = 2;
        OpenLayers.Feature.Vector.style.default.fillColor = '#88179F';
        OpenLayers.Feature.Vector.style.default.strokeColor = '#88179F';
        OpenLayers.Feature.Vector.style.default.cursor = 'pointer';
        OpenLayers.Feature.Vector.style.select.pointRadius = 10;
        OpenLayers.Feature.Vector.style.select.fillColor = '#ff0000';
        OpenLayers.Feature.Vector.style.select.strokeColor = '#ff0000';

    }

    Geogem.vertexStyle = {
        strokeColor: "#88179F",
        fillColor: "#88179F",
        strokeOpacity: 1,
        strokeWidth: 2,
        pointRadius: 10,
        graphicName: "circle",
        cursor: 'pointer'
    };

    var styleMap = new OpenLayers.StyleMap({
        "default": OpenLayers.Feature.Vector.style['default'],
        "vertex": Geogem.vertexStyle,
    }, {
        extendDefault: true
    });

    // wfs.styleMap = styleMap;

    if (wfsRule.filter !== "") {
        wfs.styleMap.styles.default.rules = [wfsRule];
        wfs.styleMap.styles.select.rules = [wfsRule];
    }


    // hiding the head 'Informatie algemeen' as it can remove content irreversible
    //$('#sidebar_content2_head').hide();

    // Unbind the events on sidebar head to make sure it doesn't remove the form and mess with the data
    $('#sidebar_content2_head').unbind();
    var sidebarContent2Toggle = function () {
        $('#sidebar_content2_head').toggleClass('folded');
        if ($(this).hasClass('folded')) {
            $('#sidebar_content2_data').addClass('sidebar_content2_hide');
        } else {
            $('#sidebar_content2_data').removeClass('sidebar_content2_hide');
        }
    };
    $('#sidebar_content2_head').click(sidebarContent2Toggle);

    // flag to determine if layer has unsaved changed features
    wfs.hasUnsavedChanges = false;

    Geogem.saveStrategy.events.register('success', null,
        function (evt) {
            //console.log("saveStrategy success")
            if (evt.response.insertIds[0] == 'none') {
                // ok, this was apparently a successfull update
            } else {
                // a new feature inserted !
                var id = evt.response.insertIds[0].split(".")[1];
                //console.log("INSERTED ID: ", id, evt.response.insertIds[0]);
                $('#featureid').html(id);

                var PK = "ID";

                for (var key in Geogem.featureTypes) {
                    if (Geogem.featureTypes[key].TYPE == 'ID') {
                        PK = key;
                    }
                }
                $('#form_' + PK).val(id);
                // also set the PK of the feature (as that was not known)
                if (Geogem.editAction.feature) {
                    Geogem.editAction.feature.attributes[PK] = id;
                    Geogem.editAction.feature.justInserted = true; // flag to check if this is a fresh inserted feature
                }
            }
            wfs.hasUnsavedChanges = false;
            // refresh (wms) layers NOTE: that saving is asynchrone, so redraw AFTER successfull save
            for (var l = 2; l < Geogem.map.layers.length; l++) {
                Geogem.map.layers[l].redraw(true);
            }
            //console.log(evt);
        }
    );
    Geogem.saveStrategy.events.register('fail', null,
        function (evt) {
            //console.log('FOUT FOUT');
            var xml = $.parseXML(evt.response.priv.responseText);
            var error = $(xml).find('ExceptionText').text();
            alert("ERROR:\n" + error);
        }
    );
    Geogem.saveStrategy.events.register('start', null,
        function (evt) {
            //console.log('start')
            //console.log('START saveStrategy');
            //console.log(evt);
            //console.log(evt);
        }
    );

    Geogem.beforeFeatureModified = function (evt) {
        wfs.styleMap.styles['default'].rules = [];
        if (wfs.hasUnsavedChanges) {
            if (confirm("U heeft niet opgeslagen verandering. Na OK gaan uw aanpassingen verloren.")) {
                var x = Geogem.map.center.lon;
                var y = Geogem.map.center.lat;
                window.location.href = window.location.href + '?centerx=' + x + '&centery=' + y + '&kaartschaal=' + Geogem.map.getScale();
            } else {
                // user cancelled... show dialog again?
                Geogem.showSidebar(true);
            }
        }
        Geogem.ft = evt.feature;
        // Get feature XY //
        var featureX = evt.feature.geometry.x;
        var featureY = evt.feature.geometry.y;
        var numberOfFeatures = $.grep(evt.object.features, function (f) {
            return f.geometry.x == featureX && f.geometry.y == featureY;
        });

        // Get feature bounds //
        var clickedBounds = evt.feature.bounds === null ? evt.feature.geometry.bounds : evt.feature.bounds;
        var nameKey = '';
        for (var key in Geogem.featureTypes) {
            if (Geogem.featureTypes[key].FS_NAAM === true) {
                nameKey = key;
            }
        }

        // Create a list of features to edit //
        if (nameKey !== '') {
            if (numberOfFeatures.length > 1) {
                Geogem.featuresList = evt.object.features;
                $('body').append('<div class="popup__container">' +
                    '<div class="feature-selector border-ng-paars border-round">' +
                    '<div class="feature-selector__head"><span>Kies een object om te wijzigen</span><button class="close-button close-popup" onclick="Geogem.popupCancel()" >&#10060;</button></div>' +
                    '</div>' +
                    '</div>');
                nameKey = '';
                for (key in Geogem.featureTypes) {
                    if (Geogem.featureTypes[key].FS_NAAM === true) {
                        nameKey = key;
                    }
                }

                // Check if filter exists on layer and set name/value if so //
                var filter = '';
                $.each(evt.feature.layer.styleMap.styles, function (index, style) {
                    if (style.rules.length > 0) {
                        console.log(style.rules);
                        filter = style.rules[0].filter;
                    }
                });
                var filterField = '';
                var filterContent = '';
                if (filter !== '') {
                    filterField = filter.property;
                    filterContent = filter.value.toLowerCase();
                }

                var itemArray = [];

                // Iterate through all stored features and compare bounds and filter //
                $.each(evt.object.features, function (index, item) {
                    // Set filter parameter on features //
                    item.isFiltered = true;
                    if (filter !== '') {
                        if (item.attributes[filterField] !== undefined) {
                            var fieldValue = item.attributes[filterField].toLowerCase();
                            if (fieldValue.indexOf(filterContent) !== -1) {
                                item.isFiltered = true;
                            } else {
                                item.isFiltered = false;
                            }
                        }
                    }
                    if (item.geometry.bounds.intersectsBounds(clickedBounds) && item.isFiltered === true) {
                        var selectName = item.attributes[nameKey];
                        itemArray.push(selectName);
                    }
                });

                // Append items to the select box //
                $.each(itemArray.sort(), function (index, item) {
                    $('.feature-selector').append('<div class="feature-selector__item" >' + item + '</div>');
                });

                $('.feature-selector__item').on('click', function () {
                    var objectName = $(this).prop('innerText');
                    var filteredFeature = Geogem.featuresList.filter(function (item) {
                        return item.attributes[nameKey] === objectName;
                    });
                    evt.feature = filteredFeature[0];
                    Geogem.editAction.unselectFeature();
                    Geogem.editAction.selectFeature(filteredFeature[0]);
                    Geogem.showFeature(evt.feature);

                    $('.popup__container').remove();
                });
                escCloseBox();
            } else {
                Geogem.showFeature(evt.feature);
            }
        } else {
            Geogem.showFeature(evt.feature);
        }
    };

    Geogem.afterFeatureModified = function (evt) {
        wfs.styleMap.styles['default'].rules = [wfsRule];
    };

    Geogem.featureModified = function (evt) {
        //console.log(evt);
        wfs.hasUnsavedChanges = true;
        Geogem.showFeature(evt.feature);
    };

    // note: AFTER the definition of the functions
    wfs.events.on({
        "beforefeaturemodified": Geogem.beforeFeatureModified,
        "featuremodified": Geogem.featureModified,
        "afterfeaturemodified": Geogem.afterFeatureModified,
        "sketchcomplete": Geogem.afterFeatureModified,
        "featureunselected": Geogem.afterFeatureModified,
        //"featureadded": Geogem.featureAdded,
        //"featureunselected": function(f){console.log("featureunselected")}

        //"vertexmodified": function(f){console.log("vertexmodified")},
        //"sketchmodified": function(f){console.log("sketchmodified")},
        //"sketchstarted": function(f){console.log("sketchstarted")},

    });
    Geogem.report = function (evt) {
        //console.log("report", evt, this)
    };

    Geogem.featureAdded = function (feature) {

        // clean up the featureTypes (as they contain object (data definitions))
        var attrs = {};
        for (var key in Geogem.featureTypes) {
            attrs[key] = undefined;
        }
        feature.attributes = attrs;

        Geogem.saveStrategy.save();
        wfs.redraw();
        Geogem.drawAction.deactivate();
        // moved to the successfull save of a feature
        Geogem.editAction.activate();
        Geogem.showFeature(feature);
        Geogem.editAction.selectFeature(feature);
        //Geogem.editAction.selectControl.select(feature);
    };

    Geogem.formClear = function () {
        $('#formulier').remove();
        if (Geogem.Settings.formContainer === true) {
            $('.form-overlay').remove();
        }
        Geogem.map.infoControl.activate();
    };

    var escCloseForm = function () {
        $(document).bind('keyup', function (e) {
            if (e.keyCode === 27) {
                Geogem.annuleer();
                $(document).unbind();
            }
        });
    };

    Geogem.addFormContainer = function () {
        $('body').append('<div class="form-overlay"><div class="form-pos__container"><div class="form-body border-ng-paars border-round border-box shadow"></div></div></div>');
        escCloseForm();
    };

    Geogem.showFeature = function (feature) {
        //console.log('showFeature',feature);
        var formLocation = $('#sidebar_content');
        if (Geogem.Settings.formContainer === true) {
            if ($('.form-overlay').length === 0) {
                Geogem.addFormContainer();
            }
            formLocation = $('.form-body');
        }
        formLocation.html('<br><div id="formulier"></div><form id="wfsform"><div class="wfsform-buttonheader">' +
            '<input id="formsubmit_top" class="basic-button" onclick="Geogem.verstuur()" type="button" Value="SLA OP"></input>' +
            '&emsp;<input id="formcancel_top" class="basic-button" onclick="Geogem.annuleer()" type="button" Value="ANNULEER"></input>' +
            '&emsp;<input id="formdelete_top" class="basic-button" onclick="Geogem.verwijderPunt()" type="button" Value="VERWIJDER"></input>' +
            '</div></form></div>');
        if (Geogem.Settings.formContainer === true) {
            if ($('.dragbar, .resize-box').length === 0) {
                $('<div class="drag-bar"></div><div class="resize-box"></div>').insertBefore('.form-body');
            }
            $('.wfsform-buttonheader').append('<input id="formsubmit" style="width:unset; max-width:20em; float:right;" class="basic-button" onclick="Geogem.wijzigGeometrie()" type="button" Value="WIJZIG GEOMETRIE"></input><br>');

        }
        //$('#wfsform').append('<div class="req-msg hidden"><span>Vul alle verplichte velden!</span>');
        if (typeof Geogem.featureTypes !== 'undefined') {
            // inputs based on above featureTypes
            var htmlAppend = '<div class="form-content"><div class="req-msg hidden"><span>Vul alle verplichte velden!</span></div>';
            for (var key in Geogem.featureTypes) {

                if (Geogem.featureTypes[key].TYPE == 'RADIO') {
                    var optionsRadio = Geogem.featureTypes[key].OPTIONS;
                    var radioName = 'form_' + key;
                    htmlAppend += '<div class="form-item"><span>' + Geogem.featureTypes[key].TITLE + '</span>\n';
                    for (var i = 0; i < optionsRadio.length; i++) {
                        htmlAppend += '<label><input type="radio" name="' + radioName + '" value="' + optionsRadio[i].value + '"/> ' + optionsRadio[i].title + '</label>\n';
                    }
                    htmlAppend += '</div>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'SELECT') {
                    var options = Geogem.featureTypes[key].OPTIONS;
                    //var radioName = 'form_'+key;
                    var req = '';
                    var disabled = '';
                    if (Geogem.featureTypes[key].DISABLED === true) {
                        disabled = 'disabled';
                    }
                    if (Geogem.featureTypes[key].REQ === true) {
                        req = 'required';
                    }
                    htmlAppend += '<div class="form-item"><span>' + Geogem.featureTypes[key].TITLE + '</span>\n';
                    var dropdown = '<select class="form-select ' + req + '" id="form_' + key + '" ' + disabled + '>\n';
                    for (var i = 0; i < options.length; i++) {
                        dropdown += '<option value="' + options[i].value + '">' + options[i].title + '</option>\n';
                    }
                    dropdown += '';
                    htmlAppend += dropdown;
                    htmlAppend += '</select></div>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'ID') {
                    var value = '';
                    if (typeof feature.attributes[key] !== 'undefined') {
                        value = feature.attributes[key];
                    }
                    htmlAppend += '<div class="form-item"><input type="hidden" id="form_' + key + '" value="' + value + '" /></div>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'PHOTO') {
                    var value = '';
                    var data = '';
                    if (typeof feature.attributes[key] !== 'undefined') {
                        value = feature.attributes[key];
                    }
                    // file input field to force a button on computer and camera on mobile
                    htmlAppend += '<div class="form-item">' + Geogem.featureTypes[key].TITLE + '<br/><input type="file" accept="image/*" id="formfile_' + key + '" value="' + value + '" /></div>\n';
                    // HIDDEN input field which actually holds the data:image/.... content
                    htmlAppend += '<div class="form-item"><input type="hidden" id="form_' + key + '" value="' + value + '" /></div>\n';
                    if (value.indexOf('data') !== 0) {
                        // set data to 1x1px white image
                        data = "data:imagew/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=";
                    } else {
                        data = value;
                    }
                    // image holding the photo or an white pixel if NO data available
                    htmlAppend += '<br/><img id="photodata" width="100%" alt="Embedded Image" src="' + data + '"/>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'TEXTAREA') {
                    var value = '';
                    var req = '';
                    var disabled = '';
                    if (Geogem.featureTypes[key].VALUE !== undefined) {
                        value = Geogem.featureTypes[key].VALUE;
                    }
                    if (Geogem.featureTypes[key].DISABLED === true) {
                        disabled = 'disabled';
                    }
                    if (Geogem.featureTypes[key].REQ === true) {
                        req = 'required';
                    }
                    var title = Geogem.featureTypes[key].TITLE + '<br/>';
                    if (typeof feature.attributes[key] !== 'undefined') {
                        value = feature.attributes[key];
                    }
                    htmlAppend += '<div class="form-item"><span> ' + title + '</span><textarea class="form-textarea ' + req + '" id="form_' + key + '" value="' + value + '" ' + disabled + '>' + value + '</textarea></div><br>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'FILTER') {
                    var value = Geogem.featureTypes[key].VALUE;
                    if (typeof feature.attributes[key] !== 'undefined') {
                        value = feature.attributes[key];
                    }
                    htmlAppend += '<div class="form-item"><input type="hidden" id="form_' + key + '" value="' + value + '" /></div>\n';
                } else if (Geogem.featureTypes[key].TYPE == 'CHECKBOX') {
                    // Checkbox input, multiple checkboxes append the value to a single field separated by ; //
                    var title = Geogem.featureTypes[key].TITLE;
                    htmlAppend += '<div class="form-item"><span>' + title + '</span>';
                    $.each(Geogem.featureTypes[key].OPTIONS, function (index, option) {
                        var label = option.title;
                        var value = option.value;
                        htmlAppend += '<label class="input-label"><input type="checkbox" class="form-checkbox" name="input_' + key + '" value="' + value + '" />' + label + '</label>';
                    });
                    // Combined input field for the selected values //
                    htmlAppend += '<input type="hidden" id="form_' + key + '" value="' + value + '" /></div>';
                } else if (Geogem.featureTypes[key].TYPE == 'CHECKBOX_TABLE') {
                    var title = Geogem.featureTypes[key].TITLE;
                    var waarde = '';
                    if (Geogem.featureTypes[key].WAARDE !== undefined) {
                        waarde = Geogem.featureTypes[key].WAARDE;
                    }
                    htmlAppend += '<div class="form-item"><table class="input-checkbox__table"><tr><th class="cb-t-left">' + title + '</th><th class="cb-t-right">' + waarde + '</th></tr>';
                    $.each(Geogem.featureTypes[key].OPTIONS, function (index, option) {
                        var label = option.title;
                        var value = option.value;
                        var joinVal = btoa('input_' + key + '_' + value.toUpperCase().replace(' ', '_'));
                        htmlAppend += '<tr><td class="cb-t-left"><label class="input-label"><input type="checkbox" class="form-checkbox table-checkbox" name="input_' + key + '" value="' + value + '" />' + label + '</label></td><td class="cb-t-right"><input type="text" class="form-checkbox_value" name="' + joinVal + '" value="" disabled/></td></tr>';
                    });
                    // Combined input field for the selected values //
                    htmlAppend += '</table><input type="hidden" id="form_' + key + '" value="' + value + '" /></div>';
                } else if (Geogem.featureTypes[key].TYPE == 'ELEMENT') {
                    var html = Geogem.featureTypes[key].CONTENT;
                    htmlAppend += html;
                } else if (Geogem.featureTypes[key].TYPE == 'DATUM') {
                    var title = Geogem.featureTypes[key].TITLE;
                    var d = new Date(Date.now());
                    var datumNu = d.toLocaleDateString();
                    console.log(datumNu);
                    var type = 'text';
                    if (Geogem.featureTypes[key].HIDDEN === true) {
                        htmlAppend += '<input class="form-text" type="hidden" id="form_' + key + '" value="' + datumNu + '" />';
                    } else {
                        htmlAppend += '<div class="form-item"><span> ' + title + '</span><div class="zichtbaar-flex"><input class="form-text" type="text" id="form_' + key + '" value="' + datumNu + '" /><button type=button class="mini-button basic-button date-button" onclick="Geogem.setDateTime(this)">o</button></div></div>';
                    }
                } else if (Geogem.featureTypes[key].TYPE == 'TIJD') {
                    var title = Geogem.featureTypes[key].TITLE;
                    var d = new Date(Date.now());
                    var tijdNu = d.toLocaleTimeString();
                    var type = 'text';
                    if (Geogem.featureTypes[key].HIDDEN === true) {
                        htmlAppend += '<input class="form-text" type="hidden" id="form_' + key + '" value="' + tijdNu + '" />';
                    } else {
                        htmlAppend += '<div class="form-item"><span> ' + title + '</span><div class="zichtbaar-flex"><input class="form-text" type="text" id="form_' + key + '" value="' + tijdNu + '" /><button type=button class="mini-button basic-button time-button" onclick="Geogem.setDateTime(this)">o</button></div></div>';
                    }
                } else {
                    // defaulting to TEXT == normal text inputs or HIDDEN text input
                    var value = '';
                    var display = '';
                    var type = 'text';
                    var title = Geogem.featureTypes[key].TITLE;
                    if (Geogem.featureTypes[key].TYPE == 'HIDDEN') {
                        type = 'hidden';
                        title = '';
                        display = 'style="display: none"';
                    }
                    var req = '';
                    var disabled = '';
                    if (Geogem.featureTypes[key].VALUE !== undefined) {
                        value = Geogem.featureTypes[key].VALUE;
                    }
                    if (typeof feature.attributes[key] !== 'undefined') {
                        value = feature.attributes[key];
                    }
                    if (Geogem.featureTypes[key].DISABLED === true) {
                        disabled = 'disabled';
                    }
                    if (Geogem.featureTypes[key].REQ === true) {
                        req = 'required';
                    }
                    htmlAppend += '<div class="form-item" ' + display + '><span> ' + title + '</span><input class="form-text ' + req + '" type="' + type + '" id="form_' + key + '" value="' + value + '" ' + disabled + '/></div>';
                }
            }
            htmlAppend += '</div>';
            $('#wfsform').append(htmlAppend);


            for (var key in Geogem.featureTypes) {
                //console.log(Geogem.featureTypes[key])
                if (Geogem.featureTypes[key].TYPE == 'RADIO') {
                    // If there is a value in the feature, set the corresponding radio to checked
                    var radioName = 'form_' + key;
                    // console.log(Geogem.featureTypes[key])
                    $('#wfsform input:radio[name=' + radioName + ']').val([feature.attributes[key]]); // NOTE ARRAY!!
                } else if (Geogem.featureTypes[key].TYPE == 'DATUM' || Geogem.featureTypes[key].TYPE == 'TIJD') {
                    if (feature.attributes[key] !== '' && feature.attributes[key] !== undefined) {
                        console.log(Geogem.featureTypes[key], feature.attributes[key]);
                        $('#form_' + key + '').val(feature.attributes[key]);
                    }
                } else if (Geogem.featureTypes[key].TYPE == 'SELECT') {
                    // If there is a value in the feature, set the corresponding option to selected //
                    $('#form_' + key + '').find('option[value="' + feature.attributes[key] + '"]').attr('selected', true);
                } else if (Geogem.featureTypes[key].TYPE == 'CHECKBOX') {
                    // If there is a value in the feature, checkes the correct boxes and adds value to hidden input //
                    $('#form_' + key + '').val([feature.attributes[key]]);
                    if (feature.attributes[key]) {
                        if (feature.attributes[key].match(';')) {
                            var splitString = feature.attributes[key].split(';');
                            $.each(splitString, function (index, item) {
                                $('[value="' + item + '"]').prop('checked', true);
                            });

                        } else {
                            var val = feature.attributes[key];
                            $('[value="' + val + '"]').prop('checked', true);
                        }
                    }

                    $('.form-checkbox').click(function () {
                        var name = $(this).prop('name');
                        var formKey = $(this).parent().siblings('[type="hidden"]');
                        var value = '';
                        $.each($('[name="' + name + '"]'), function (index, item) {
                            if (item.checked === true) {
                                value += item.value + ';';
                            }
                        });
                        value = value.slice(0, -1);
                        // console.log(value);
                        formKey.prop('value', value);
                    });
                } else if (Geogem.featureTypes[key].TYPE == 'CHECKBOX_TABLE') {
                    // Same with the Checkbox table type but also fill the extra inputs //
                    checkboxTableShowVal();
                    $('#form_' + key + '').val([feature.attributes[key]]);
                    if (feature.attributes[key]) {
                        if (feature.attributes[key].match(';')) {
                            var splitString = feature.attributes[key].split(';');
                            $.each(splitString, function (index, item) {
                                var strLeft = item.split('|')[0];
                                var strRight = item.split('|')[1];
                                var checkboxItem = $('[value="' + strLeft + '"]')[0];
                                var valueName = btoa(checkboxItem.name + '_' + strLeft.toUpperCase().replace(' ', '_'));
                                var valueItem = $('[name="' + valueName + '"]');
                                $(checkboxItem).prop('checked', true);
                                valueItem.prop('disabled', false);
                                valueItem.prop('value', strRight);
                            });

                        } else {
                            var val = feature.attributes[key];
                            // console.log(val)
                            // $('[value="' + val + '"]').prop('checked', true);
                            var strLeft = val.split('|')[0];
                            var strRight = val.split('|')[1];
                            var checkboxItem = $('[value="' + strLeft + '"]')[0];
                            var valueName = btoa(checkboxItem.name + '_' + strLeft.toUpperCase().replace(' ', '_'));
                            var valueItem = $('[name="' + valueName + '"]');
                            $(checkboxItem).prop('checked', true);
                            valueItem.prop('disabled', false);
                            valueItem.prop('value', strRight);
                        }
                    }
                }
            }
        } else {
            // text inputs defined on attributes from feature retrieved from server
            for (var key in feature.attributes) {
                var value = '';
                if (typeof feature.attributes[key] !== 'undefined') {
                    value = feature.attributes[key];
                }
                $('#wfsform').append('<div><input type="text" id="form_' + key + '" value="' + value + '" />' + key + '<br></div><br>');
            }
        }
        if (Geogem.Settings.formContainer !== true) {
            Geogem.showSidebar(true);
            // register when there is either a change or a key up in the function
            $("#wfsform :input").keyup(function () {
                wfs.hasUnsavedChanges = true;
            });
            $("#wfsform :input").change(function () {
                wfs.hasUnsavedChanges = true;
            });
        }

        if (window.File && window.FileReader && window.FormData) {
            var $inputField = $('#formfile_IMGDATA');
            $inputField.on('change', function (e) {
                var file = e.target.files[0];
                if (file) {
                    if (/^image\//i.test(file.type)) {
                        //alert('reading file... (TODO)');
                        var reader = new FileReader();
                        reader.onloadend = function () {
                            //alert('starting processing file (TODO)')
                            //processFile(reader.result, file.type);

                            //function processFile(dataURL, fileType)
                            var dataURL = reader.result;
                            var fileType = file.type;
                            var maxWidth = 800;
                            var maxHeight = 800;

                            var image = new Image();
                            image.src = dataURL;

                            image.onload = function () {
                                var width = image.width;
                                var height = image.height;
                                var shouldResize = (width > maxWidth) || (height > maxHeight);

                                if (shouldResize) {
                                    var newWidth;
                                    var newHeight;

                                    if (width > height) {
                                        newHeight = height * (maxWidth / width);
                                        newWidth = maxWidth;
                                    } else {
                                        newWidth = width * (maxHeight / height);
                                        newHeight = maxHeight;
                                    }

                                    var canvas = document.createElement('canvas');

                                    canvas.width = newWidth;
                                    canvas.height = newHeight;

                                    var context = canvas.getContext('2d');

                                    context.drawImage(this, 0, 0, newWidth, newHeight);

                                    dataURL = canvas.toDataURL(fileType);
                                    //alert('Data-url: '+ dataURL)
                                }

                                $('#photodata').attr('src', dataURL);
                                //$("#wfsform :input[type='file']").data(dataURL)
                                $("#wfsform :input[id='form_IMGDATA']").val(dataURL);
                            };

                            image.onerror = function () {
                                alert('There was an error processing your file!');
                            };

                        };
                        reader.onerror = function () {
                            alert('There was an error reading the file!');
                        };
                        reader.readAsDataURL(file);
                    } else {
                        alert('Not a valid image!');
                    }
                }
            });
        } else {
            alert("File upload is not supported!");
        }
        if (Geogem.Settings.formContainer === true) {
            $('.form-content').append('<div><input id="formsubmit_bottom" class="basic-button" onclick="Geogem.verstuur();" type="button" Value="SLA OP"></input>' +
                ' &nbsp; <input id="formcancel_bottom" class="basic-button" onclick="Geogem.annuleer()" type="button" Value="ANNULEER"></input>' +
                ' &nbsp; <input id="formdelete_bottom" class="basic-button" onclick="Geogem.verwijderPunt()" type="button" Value="VERWIJDER"></input></div>');
        }


        // Show or clear the value boxes for the checkbox table type //
        function checkboxTableShowVal() {
            $.each($('.table-checkbox'), function () {
                var clickItem = this;
                var keyName = this.name.replace('input', 'form');
                var keyInput = $('#' + keyName + '');
                var chkbxName = this.name;
                var inputName = btoa(this.name + '_' + this.value.toUpperCase().replace(' ', '_'));
                var inputItem = $('[name="' + inputName + '"]')[0];

                $(this).on('click', function () {
                    if ($(inputItem).is(':disabled')) {
                        // $(inputItem).show();
                        $(inputItem).prop('disabled', false);
                    } else if ($(inputItem).is(':enabled')) {
                        // $(inputItem).hide();
                        $(inputItem).prop('disabled', true);
                    }
                    inputValueFill(chkbxName, keyInput);
                });
                $(inputItem).on('change', function () {
                    inputValueFill(chkbxName, keyInput);
                });
            });

            function inputValueFill(chkbxName, keyInput) {
                var value = '';
                $.each($('[name="' + chkbxName + '"]'), function (index, item) {
                    var inputName = btoa(item.name + '_' + item.value.toUpperCase().replace(' ', '_'));
                    var inputItem = $('[name="' + inputName + '"]')[0];

                    if (item.checked === true) {
                        value += item.value + '|' + inputItem.value + ';';
                    }
                });
                value = value.slice(0, -1);
                keyInput.prop('value', value);
            }
        }

        if (Geogem.Settings.formContainer === true) {
            dragbarLogic();
            resizeLogic();
        }
        lockButtonBar();
    };

    Geogem.map.addLayers([wfs]);

    Geogem.setDateTime = function (location) {
        if ($(location).hasClass('date-button')) {
            var d = new Date(Date.now());
            var datumNu = d.toLocaleDateString();
            $(location).siblings('input')[0].value = datumNu;
        } else if ($(location).hasClass('time-button')) {
            var t = new Date(Date.now());
            var timeNu = t.toLocaleTimeString();
            $(location).siblings('input')[0].value = timeNu;
        }
    };

    Geogem.wijzigGeometrie = function () {
        $('.form-overlay').css('left', '-100%');
        if ($('.save_icon').length === 0) {
            $('#tools').append('<span id="savetool" class="toolbutton save_icon" title="Sla wijzigingen op">Save</span>');
            $('#tools').append('<span id="redotool" class="toolbutton redo_icon" title="Annuleer de huidige wijzigingen">Redo</span>');
        }
        $('.drawtools_container').hide();
        $('#edittool').hide();
        $('#savetool').on('click', function () {
            $('#savetool').remove();
            $('#redotool').remove();
            $('.drawtools_container').show();
            $('#edittool').show();
            $('.form-overlay').css('left', '0');
            escCloseBox();
            $.each($('.required'), function () {
                $(this).parent().removeClass('mark');
                $('.req-msg').hide();
            });
        });
        $('#redotool').on('click', function () {
            $('#savetool').remove();
            $('#redotool').remove();
            $('.drawtools_container').show();
            $('#edittool').show();
            $('.form-overlay').css('left', '0');
            Geogem.annuleer();
        });
    };

    Geogem.verstuur = function () {
        var fillCounter = 0;
        $.each($('.required'), function () {
            if (this.value === '') {
                if ($('.req-msg').hasClass('hidden')) {
                    $('.req-msg').removeClass('hidden');
                    $('.form-content').scrollTop(0);
                }
                $(this).parent().addClass('mark');
                $('.req-msg').show();

                fillCounter++;
            } else {
                $(this).parent().removeClass('mark');
            }
        });
        if (fillCounter === 0) {
            Geogem.saveAction.trigger();
            Geogem.showSidebar(false);
            // $('#edittool').click();
            Geogem.editAction.deactivate();
            Geogem.formClear();
        }
    };

    Geogem.verwijderPunt = function (feature) {

        // if (Geogem.editAction.feature.justInserted === true) {
        // Geogem.deleteFeature();
        // Geogem.formClear();
        // Geogem.editAction.deactivate();
        // } else {
        customConfirm(Geogem.deleteFeature);
        // }
    };

    Geogem.popupCancel = function () {
        $('.popup__container').remove();
    };

    var customConfirm = function (testFunction) {
        $('body').append('<div class="container popup__container"> ' +
            '<div class="confirm-popup__body border-ng-paars border-round"> ' +
            '<h2>Punt verwijderen</h2>' +
            '<p>Weet je zeker dat je het punt wil verwijderen? Dit kan niet ongedaan worden!</p>' +
            '<div class="zichtbaar-flex">' +
            '<div class="basic-button no-select" style="left: 1em; bottom: 1em; position: absolute;" onclick="Geogem.popupCancel()" ><span>Annuleer</span></div>' +
            '<div class="basic-button no-select" style="right: 1em; bottom: 1em; position: absolute;" onclick="Geogem.popupConfirm()" ><span>Bevestig</span></div>' +
            '</div></div></div>'
        );


        Geogem.popupConfirm = function () {
            $('.popup__container').remove();
            testFunction();
            Geogem.formClear();
            Geogem.editAction.deactivate();
        };
        escCloseBox();
    };

    var escCloseBox = function () {
        $(document).unbind('keyup');
        $(document).bind('keyup', function (e) {
            if (e.keyCode === 27) {
                Geogem.popupCancel();
                $(document).unbind('keyup');
                escCloseForm();
            }
        });
    };

    Geogem.annuleer = function () {
        wfs.styleMap.styles['default'].rules = [wfsRule];
        // check if there is maybe a just inserted feature
        //console.log('Geogem.editAction.feature.justInserted', Geogem.editAction.feature.justInserted)
        if (Geogem.editAction.feature && Geogem.editAction.feature.justInserted) {
            //console.log('removing a fresh inserted feature!!');
            Geogem.deleteFeature();
            $('#edittool').click();
        }
        // deactivate the feature controls because keeping active is problematic
        // but reactivate the current active one again
        Geogem.reactivateEditTools();
        // reload features to be sure we reflect the servers status
        wfs.refresh({
            force: true
        });
        wfs.hasUnsavedChanges = false;
        Geogem.formClear();

    };
    Geogem.delete = function () {
        Geogem.deleteFeature();
        // deactivate the feature controls because keeping active is problematic
        // but reactivate the current active one again
        Geogem.reactivateEditTools();
        Geogem.formClear();
    };

    Geogem.reactivateEditTools = function () {
        // deactivate the feature controls because keeping active is problematic
        // but reactivate the current active one again
        Geogem.showSidebar(false);
        if (wfs.type == "point") {
            if (Geogem.drawActionPoint && Geogem.drawActionPoint.active) {
                Geogem.drawActionPoint.deactivate();
                Geogem.drawActionPoint.activate();
            }
            if (Geogem.editAction && Geogem.editAction.active) {
                Geogem.editAction.deactivate();
                Geogem.editAction.activate();
            }
            Geogem.map.infoControl.deactivate();
        } else if (wfs.type == "polyline") {
            if (Geogem.drawActionPolyline && Geogem.drawActionPolyline.active) {
                Geogem.drawActionPolyline.deactivate();
                Geogem.drawActionPolyline.activate();
            }
            if (Geogem.editAction && Geogem.editAction.active) {
                Geogem.editAction.deactivate();
                Geogem.editAction.activate();
            }
            Geogem.map.infoControl.deactivate();
        } else if (wfs.type == "polygon") {
            if (Geogem.drawActionPolygon && Geogem.drawActionPolygon.active) {
                Geogem.drawActionPolygon.deactivate();
                Geogem.drawActionPolygon.activate();
            }
            if (Geogem.editAction && Geogem.editAction.active) {
                Geogem.editAction.deactivate();
                Geogem.editAction.activate();
            }
            Geogem.map.infoControl.deactivate();
        } else if (wfs.type == "multi") {
            if (Geogem.drawActionPoint && Geogem.drawActionPoint.active) {
                Geogem.drawActionPoint.deactivate();
                Geogem.drawActionPoint.activate();
            }
            if (Geogem.drawActionPolyline && Geogem.drawActionPolyline.active) {
                Geogem.drawActionPolyline.deactivate();
                Geogem.drawActionPolyline.activate();
            }
            if (Geogem.drawActionPolygon && Geogem.drawActionPolygon.active) {
                Geogem.drawActionPolygon.deactivate();
                Geogem.drawActionPolygon.activate();
            }
            if (Geogem.editAction && Geogem.editAction.active) {
                Geogem.editAction.deactivate();
                Geogem.editAction.activate();
            }
            Geogem.map.infoControl.deactivate();
        }
    };

    Geogem.deleteFeature = function () {
        var feature = Geogem.editAction.feature;
        Geogem.deleteAction.trigger();
    };

    // edit and draw TOOLS
    Geogem.drawActionPoint = new OpenLayers.Control.DrawFeature(wfs,
        OpenLayers.Handler.Point, {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePoint",
            multi: false,
            featureAdded: Geogem.featureAdded
        }
    );

    Geogem.drawActionPolyline = new OpenLayers.Control.DrawFeature(wfs,
        OpenLayers.Handler.Path, {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolyline",
            multi: false,
            featureAdded: Geogem.featureAdded
        }
    );

    Geogem.drawActionPolygon = new OpenLayers.Control.DrawFeature(wfs,
        OpenLayers.Handler.Polygon, {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolyon",
            multi: false,
            featureAdded: Geogem.featureAdded
        }
    );

    Geogem.drawActionCircle = new OpenLayers.Control.DrawFeature(wfs,
        OpenLayers.Handler.RegularPolygon, {
            title: "Draw Feature",
            displayClass: "olControlDrawFeaturePolygon",
            multi: false,
            featureAdded: Geogem.featureAdded,
            handlerOptions: {
                sides: 100
            }

        }
    );


    Geogem.removeDrawEvents = function () {
        Geogem.drawAction.events.remove('activate');
        Geogem.drawAction.events.remove('deactivate');
        var drawControl = Geogem.map.getControlsBy('title', 'Draw Feature')[0];
        Geogem.map.removeControl(drawControl);
    };

    Geogem.setDrawAction = function (type) {
        if (type == 'point_icon') {
            Geogem.drawAction = Geogem.drawActionPoint;
        } else if (type == 'polyline_icon') {
            Geogem.drawAction = Geogem.drawActionPolyline;
        } else if (type == 'polygon_icon') {
            Geogem.drawAction = Geogem.drawActionPolygon;
        } else if (type == 'circle_icon') {
            Geogem.drawAction = Geogem.drawActionCircle;
        }
        Geogem.drawAction.events.register('activate', Geogem.drawType,
            function () {
                $('.multidrawtool.' + type + '').addClass("toolactive");
                wfs.setVisibility(true);
                if ($('#sidebar').is(":visible")) {
                    //alert('Nog bezig??');
                    Geogem.showSidebar(false);
                }
                // deactivate infotool for wms layer
                Geogem.map.infoControl.deactivate();
            }
        );
        Geogem.drawAction.events.register('deactivate', Geogem.drawType,
            function () {
                $('.multidrawtool.' + type + '').removeClass("toolactive");
                wfs.setVisibility(false);
                Geogem.showSidebar(false);
                // reactivate infotool for wms layer again
                Geogem.map.infoControl.activate();
            }
        );
        Geogem.map.addControls([Geogem.drawAction]);
    };


    if (wfs.type == "point" || wfs.type === undefined) {
        Geogem.drawAction = Geogem.drawActionPoint;
    } else if (wfs.type == "polyline") {
        Geogem.drawAction = Geogem.drawActionPolyline;
    } else if (wfs.type == "polygon") {
        Geogem.drawAction = Geogem.drawActionPolygon;
    } else if (wfs.type == "multi") {
        Geogem.drawAction = Geogem.drawActionPoint;
    }


    Geogem.editAction = new OpenLayers.Control.ModifyFeature(wfs, {
        title: "Modify Feature",
        displayClass: "olControlMoveFeature",
    });


    // init and stop functions
    if (wfs.type != 'multi') {
        Geogem.drawAction.events.register('activate', Geogem.drawAction,
            function () {
                $('#drawtool').addClass("toolactive");
                wfs.setVisibility(true);
                if ($('#sidebar').is(":visible")) {
                    //alert('Nog bezig??');
                    Geogem.showSidebar(false);
                }
                // deactivate infotool for wms layer
                Geogem.map.infoControl.deactivate();
            }
        );
        Geogem.drawAction.events.register('deactivate', Geogem.drawAction,
            function () {
                $('#drawtool').removeClass("toolactive");
                wfs.setVisibility(false);
                Geogem.showSidebar(false);
                // reactivate infotool for wms layer again
                Geogem.map.infoControl.activate();
            }
        );
    }
    Geogem.editAction.events.register('activate', Geogem.editAction,
        function () {
            $('#edittool').addClass("toolactive");
            wfs.setVisibility(true);
            Geogem.showSidebar(false);
            // deactivate infotool for wms layer
            Geogem.map.infoControl.deactivate();
        }
    );
    // deactivate should close sidebar/form
    Geogem.editAction.events.register('deactivate', Geogem.editAction,
        function () {
            $('#edittool').removeClass("toolactive");
            wfs.setVisibility(false);
            Geogem.showSidebar(false);
            // if (Geogem.editAction.feature.justInserted === true) {
            // console.log('DELETED!')
            // Geogem.deleteAction.trigger();
            // }
            // reactivate infotool for wms layer again
            Geogem.map.infoControl.activate();
        }
    );

    Geogem.saveAction = new OpenLayers.Control.Button({
        title: "Save Changes",
        trigger: function () {
            if (Geogem.editAction.feature) {
                // take the values from the form and set them in the feature to be saved
                if (typeof Geogem.featureTypes !== 'undefined') {

                    // inputs based on above featureTypes
                    for (var key in Geogem.featureTypes) {
                        var radioName = 'form_' + key;
                        if (Geogem.featureTypes[key].TYPE == 'RADIO') {
                            //console.log(key, $('#wfsform input:radio[name='+radioName+']:checked').val())
                            Geogem.editAction.feature.attributes[key] = $('#wfsform input:radio[name=' + radioName + ']:checked').val();
                        }
                        // defaulting to TEXT == normal text inputs
                        else {
                            if (Geogem.featureTypes[key].TYPE === 'ELEMENT') {

                            } else {
                                Geogem.editAction.feature.attributes[key] = $('#form_' + key).val() || "";
                                //console.log(key, $('#form_'+key).val())
                            }

                        }
                    }
                } else {
                    for (var key in Geogem.editAction.feature.attributes) {
                        Geogem.editAction.feature.attributes[key] = $('#form_' + key).val() || "";
                    }
                }
                Geogem.editAction.feature.state = OpenLayers.State.UPDATE;
                if (Geogem.editAction.selectControl) {
                    Geogem.editAction.selectControl.unselectAll();
                } else if (Geogem.editAction.selectFeature) {
                    Geogem.editAction.feature.justInserted = false;
                    Geogem.editAction.unselectFeature(Geogem.editAction.feature);
                }
            }
            Geogem.saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });

    Geogem.deleteAction = new OpenLayers.Control.Button({
        title: "Verwijder",
        trigger: function () {
            if (Geogem.editAction.feature) {
                Geogem.editAction.feature.state = OpenLayers.State.DELETE;
                if (Geogem.editAction.selectControl) {
                    Geogem.editAction.selectControl.unselectAll();
                }
            }
            Geogem.saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });

    var drawIcon = '';

    if (wfs.type == 'point' || wfs.type === undefined) {
        drawIcon = 'point_icon';
    } else if (wfs.type == 'polyline') {
        drawIcon = 'polyline_icon';
    } else if (wfs.type == 'polygon') {
        drawIcon = 'polygon_icon';
    }

    if (wfs.type == 'multi') {
        $('#tools').append('<div class="drawtools_container"></div>');
        $('.drawtools_container').append('<span class="multidrawtool toolbutton point_icon" title="Zet een punt">Draw</span>');
        $('.drawtools_container').append('<span class="multidrawtool toolbutton polyline_icon" title="Teken een lijn">Draw</span>');
        $('.drawtools_container').append('<span class="multidrawtool toolbutton polygon_icon" title="Teken een vlak">Draw</span>');
        $('.drawtools_container').append('<span class="multidrawtool toolbutton circle_icon" title="Teken een cirkel">Draw</span>');
    } else {
        $('#tools').append('<span id="drawtool" class="toolbutton ' + drawIcon + '">Draw</span>');
    }
    $('#tools').append('<span id="edittool" class="toolbutton edit_icon" title="Wijzig een object">Edit</span>');

    var drawToolActivate = function () {
        if (Geogem.drawAction.active) {
            Geogem.drawAction.deactivate();
        } else {
            // only one tool active at a time
            Geogem.editAction.deactivate();
            Geogem.drawAction.activate();
        }
    };

    $('#drawtool').click(function () {
        drawToolActivate();
    });

    $('.multidrawtool').click(function () {
        var toolClass = '';
        if ($(this).siblings('').hasClass('toolactive')) {
            $(this).siblings().removeClass('toolactive');
            drawToolActivate();
        }
        if ($(this).hasClass('point_icon')) {

            toolClass = 'point_icon';
        }
        if ($(this).hasClass('polyline_icon')) {
            toolClass = 'polyline_icon';
        }
        if ($(this).hasClass('polygon_icon')) {
            toolClass = 'polygon_icon';
        }
        if ($(this).hasClass('circle_icon')) {
            toolClass = 'circle_icon';
        }
        if (!$(this).hasClass('toolactive')) {
            Geogem.removeDrawEvents();
            Geogem.setDrawAction(toolClass);
        }
        drawToolActivate();
    });


    $('#edittool').click(function () {
        if (Geogem.editAction.active) {
            Geogem.editAction.deactivate();
            if ($('#savetool')) {
                $('#savetool').remove();
                $('#redotool').remove();
                Geogem.annuleer();
            }
        } else {
            // only one tool active at a time
            Geogem.drawAction.deactivate();
            Geogem.editAction.activate();
        }
    });
    Geogem.map.addControls([Geogem.drawAction, Geogem.editAction]);

    var snappingTarget = wfs;

    if (Geogem.Settings.snappingTarget) {
        snappingTarget = Geogem.map.getLayersByName(Geogem.Settings.snappingTarget)[0];
    }

    Geogem.snapping = new OpenLayers.Control.Snapping({
        layer: wfs,
        targets: [{
            layer: wfs,
            tolerance: 15,
            edgeTolerance: 10,
        }],
        greedy: false
    });



    if (wfs.snapping === true) {
        $('#tools').append('<span id="snappingtool" class="toolbutton snapping_icon" onclick="Geogem.snappingToggle()" title="Zet verspring naar punt aan">Edit</span>');

        Geogem.snapping.activate();
    }

    Geogem.snappingToggle = function () {
        if ($('#snappingtool').hasClass('toolactive')) {
            $('#snappingtool').removeClass('toolactive');
            Geogem.snapping.deactivate();
        } else {
            $('#snappingtool').addClass('toolactive');
            Geogem.snapping.activate();
        }
    };

    window.onbeforeunload = function () {
        Geogem.annuleer();
    };

    // Makes the feature edit window draggable //
    function dragbarLogic() {
        var originalPosX = $('.form-pos__container').offset().left;
        var originalPosY = $('.form-pos__container').offset().top;
        $('.drag-bar').on('mousedown', function (e) {
            e = e || window.event;
            pauseEvent(e);
            var initialX = e.screenX;
            var initialY = e.screenY;
            var popupX = $('.form-pos__container').offset().left;
            var popupY = $('.form-pos__container').offset().top;
            $(document).bind('mousemove', function (e) {
                var offsetX = initialX - e.screenX;
                var offsetY = initialY - e.screenY;
                var moveX = popupX - offsetX;
                var moveY = popupY - offsetY;
                $('.form-pos__container').offset({
                    top: moveY,
                    left: moveX
                });
            });
            $('.drag-bar').addClass('drag-active');
            $(document).on('mouseup', function () {
                popupX = $('.form-pos__container').offset().left;
                popupY = $('.form-pos__container').offset().top;
                var docX = $(document).width();
                var docY = $(document).height();
                var popupW = $('.form-pos__container').width();
                checkPos(popupW, popupX, popupY, docX, docY);
                $(document).unbind('mousemove');
                $(document).unbind('mouseup');
                $('.drag-bar').removeClass('drag-active');
            });
            $('.drag-bar').on("dblclick", function () {
                $('.form-pos__container').offset({
                    top: originalPosY,
                    left: originalPosX
                });

            });
        });
    }

    function checkPos(pW, pX, pY, dX, dY) {
        if (pX + 50 > dX && pY + 50 > dY) {
            $('.form-pos__container').offset({
                top: dY - 50,
                left: dX - 50
            });
        } else if (pX + 50 > dX) {
            $('.form-pos__container').offset({
                top: pY,
                left: dX - 50
            });
        } else if (pY + 50 > dY) {
            $('.form-pos__container').offset({
                top: dY - 50,
                left: pX
            });
        } else if (pX + pW - 50 < 0) {
            $('.form-pos__container').offset({
                top: pY,
                left: 0 - pW + 50
            });
        } else if (pY < 0) {
            $('.form-pos__container').offset({
                top: 0,
                left: pX
            });
        }
    }

    // Creates a resize button for the feature edit pop-up //
    function resizeLogic() {
        var originalWidth = $('.form-pos__container').width();
        var originalHeight = $('.form-pos__container').height();
        $('.resize-box').on('mousedown', function (e) {
            e = e || window.event;
            pauseEvent(e);
            var initialX = e.screenX;
            var initialY = e.screenY;
            var popupWidth = $('.form-pos__container').width();
            var popupHeight = $('.form-pos__container').height();
            $(document).bind('mousemove', function (e) {
                var offsetX = initialX - e.screenX;
                var offsetY = e.screenY - initialY;
                var moveX = popupWidth + offsetX;
                var moveY = popupHeight + offsetY;
                $('.form-pos__container').width(moveX);
                $('.form-pos__container').height(moveY);
                if ($('.form-pos__container').width() < 400) {
                    $('.form-pos__container').width(400);
                }

                if ($('.form-pos__container').height() < 400) {
                    $('.form-pos__container').height(400);
                }
            });
            $('.drag-bar').addClass('drag-active');
            $(document).on('mouseup', function () {
                $(document).unbind('mousemove');
                $(document).unbind('mouseup');
                $('.drag-bar').removeClass('drag-active');
            });
            $('.resize-box').on("dblclick", function () {
                $('.form-pos__container').width(originalWidth);
                $('.form-pos__container').height(originalHeight);
                var popupX = $('.form-pos__container').offset().left;
                var popupY = $('.form-pos__container').offset().top;
                var docX = $(document).width();
                var docY = $(document).height();
                var popupW = $('.form-pos__container').width();
                checkPos(popupW, popupX, popupY, docX, docY);
            });
        });
    }

    function pauseEvent(e) {
        if (e.stopPropagation) e.stopPropagation();
        if (e.preventDefault) e.preventDefault();
        e.cancelBubble = true;
        e.returnValue = false;
        return false;
    }

    function lockButtonBar() {
        $('.form-content').scroll(function () {
            var scrollPosition = $('.form-content').scrollTop();
            if (scrollPosition > 0) {
                if (!$('.wfsform-buttonheader').hasClass('bar-offscreen')) {
                    $('.wfsform-buttonheader').addClass('bar-offscreen');
                }
            } else if (scrollPosition <= 0) {
                if ($('.wfsform-buttonheader').hasClass('bar-offscreen')) {
                    $('.wfsform-buttonheader').removeClass('bar-offscreen');
                }
            }
        });
    }
};