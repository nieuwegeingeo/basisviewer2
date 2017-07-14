
// this saveStrategy is need when creating the layer, either create it here
// OR even earlier in viewer.js
Geogem.saveStrategy = new OpenLayers.Strategy.Save();	

Geogem.initWFST = function(wfs){

	// setting the color of the Vectors to be purple and 
	// the size of the points big enough to be ticked on a mobile device
	OpenLayers.Feature.Vector.style.default.pointRadius = 20;
	OpenLayers.Feature.Vector.style.default.fillColor = '#88179F';
	OpenLayers.Feature.Vector.style.default.strokeColor = '#88179F';
	OpenLayers.Feature.Vector.style.select.pointRadius = 20;
	OpenLayers.Feature.Vector.style.select.fillColor = '#ff0000';
	OpenLayers.Feature.Vector.style.select.strokeColor = '#ff0000';

	// hiding the head 'Informatie algemeen' as it can remove content irreversible
	$('#sidebar_content2_head').hide();	
	
	// flag to determine if layer has unsaved changed features
	wfs.hasUnsavedChanges = false;
				
	Geogem.saveStrategy.events.register('success', null, 
		function(evt){
			//console.log("saveStrategy success")
			if (evt.response.insertIds[0]=='none'){
				// ok, this was apparently a successfull update			
			}
			else{
				// a new feature inserted !
				var id = evt.response.insertIds[0].split(".")[1];
				//console.log("INSERTED ID: ", id, evt.response.insertIds[0]);
				$('#featureid').html(id);
				var PK = "ID";
				$('#form_'+PK).val(id);
				// also set the PK of the feature (as that was not known)
				if (Geogem.editAction.feature){
					Geogem.editAction.feature.attributes[PK]=id;
					Geogem.editAction.feature.justInserted = true; // flag to check if this is a fresh inserted feature
				}
			}
			wfs.hasUnsavedChanges = false;
			// refresh (wms) layers NOTE: that saving is asynchrone, so redraw AFTER successfull save
			for (var l=2;l<Geogem.map.layers.length;l++){
				Geogem.map.layers[l].redraw(true);
			}
		}
	);
    Geogem.saveStrategy.events.register('fail', null, 
		function(evt){
			//console.log('FOUT FOUT');
			var xml = $.parseXML(evt.response.priv.responseText);
			var error = $(xml).find('ExceptionText').text();
			alert("ERROR:\n"+error)
		}
	);
	Geogem.saveStrategy.events.register('start', null, 
		function(evt){
			//console.log('START saveStrategy');
			//console.log(evt);
		}
	);

	Geogem.beforeFeatureModified = function(evt){
		//console.log('before modified! Geogem.editAction.feature: ', Geogem.editAction.feature);
		//console.log('before modified! evt.feature: ', evt.feature);
		if (wfs.hasUnsavedChanges){
			if (confirm("U heeft niet opgeslagen verandering. Na OK gaan uw aanpassingen verloren.")){
				var x = Geogem.map.center.lon;
				var y = Geogem.map.center.lat;
				window.location.href=window.location.href+'?centerx='+x+'&centery='+y+'&kaartschaal='+Geogem.map.getScale();
			}
			else{
				// user cancelled... show dialog again?
				Geogem.showSidebar(true);
			}
		}
		Geogem.showFeature(evt.feature);
	}
	
	Geogem.featureModified = function(evt){
		wfs.hasUnsavedChanges = true;
		Geogem.showFeature(evt.feature);
	}
	
	// note: AFTER the definition of the functions
	wfs.events.on({
		"beforefeaturemodified": Geogem.beforeFeatureModified,
		"featuremodified": Geogem.featureModified,
		//"featureadded": Geogem.featureAdded,
		//"featureunselected": function(f){console.log("featureunselected")}
		//"afterfeaturemodified": function(f){console.log("afterfeaturemodified")},
		//"vertexmodified": function(f){console.log("vertexmodified")},
		//"sketchmodified": function(f){console.log("sketchmodified")},
		//"sketchstarted": function(f){console.log("sketchstarted")},
		//"sketchcomplete": function(f){console.log("sketchcomplete")}
	}); 	
	Geogem.report = function(evt){
		//console.log("report", evt, this)
	}
	
	Geogem.featureAdded = function(feature){
		
		// clean up the featureTypes (as they contain object (data definitions))
		var attrs = {};
		for (var key in Geogem.featureTypes){attrs[key]=undefined}
		feature.attributes = attrs;
		
		Geogem.saveStrategy.save();
		wfs.redraw();
		Geogem.drawAction.deactivate();
		// moved to the successfull save of a feature
		Geogem.editAction.activate();
		Geogem.showFeature(feature);
		Geogem.editAction.selectFeature(feature);
		//Geogem.editAction.selectControl.select(feature);
	}
	
	Geogem.showFeature = function(feature){
		//console.log('showFeature',feature);
		$('#sidebar_content').html('<div id="formulier"><form id="wfsform">'+
			'<input id="formsubmit" onclick="Geogem.verstuur();" type="button" Value="SLA OP"></input>'+
			' &nbsp; <input id="formsubmit" onclick="Geogem.annuleer();" type="button" Value="ANNULEER"></input>'+
			' &nbsp; <input id="formsubmit" onclick="Geogem.delete();" type="button" Value="VERWIJDER"></input><br/><br/>'+
			'</form></div>');
		//console.log(feature.data)
		if (typeof Geogem.featureTypes !== 'undefined'){
			// inputs based on above featureTypes
			for (var key in Geogem.featureTypes){
				
				if (Geogem.featureTypes[key].TYPE == 'RADIO'){
					var options = Geogem.featureTypes[key].OPTIONS;
					var radioName = 'form_'+key;
					$('#wfsform').append(Geogem.featureTypes[key].TITLE+'<br/>');
					for (var i=0;i<options.length;i++){
						$('#wfsform').append('<div><label><input type="radio" name="'+radioName+'" value="'+options[i].value+'"/> '+options[i].title+'</label></div>');
					}
					// now IF there is a value in the feature, set the corresponding radio to checked
					$('#wfsform input:radio[name='+radioName+']').val([ feature.attributes[key] ])  // NOTE ARRAY!!
				}
				else if (Geogem.featureTypes[key].TYPE == 'SELECT'){
					var options = Geogem.featureTypes[key].OPTIONS;
					var radioName = 'form_'+key;
					$('#wfsform').append(Geogem.featureTypes[key].TITLE+'<br/>');
					var dropdown = '<select id="form_'+key+'">';
					for (var i=0;i<options.length;i++){
						dropdown += '<option value="'+options[i].value+'">'+options[i].title+'</option><br/>';
					}
					dropdown += '</div>';
					$('#wfsform').append(dropdown);
					// now IF there is a value in the feature, set the corresponding option to checked
					//if(feature.attributes[key]){  // check if the feature has otherwise 0 is set, mmm maybe ok?
						$('select').find('option[value="'+feature.attributes[key]+'"]').attr('selected', true);
					//}
				}
				else if (Geogem.featureTypes[key].TYPE == 'PHOTO'){
					var value = '';
					
					if (typeof feature.attributes[key] !== 'undefined'){value=feature.attributes[key]}

					//console.log('photo value: ('+key+') '+value)
					
					// file input field to force a button on computer and camera on mobile
					$('#wfsform').append('<div>'+Geogem.featureTypes[key].TITLE+'<br/><input type="file" accept="image/*" id="formfile_'+key+'" value="'+value+'" /></div>');
					
					// HIDDEN input field which actually holds the data:image/.... content
					$('#wfsform').append('<div><input type="hidden" id="form_'+key+'" value="'+value+'" /></div>');
					
					if (value.indexOf('data') != 0){
						// set data to 1x1px white image
						data = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs="
					}
					else{
						data = value;
					}
					// image holding the photo or an white pixel if NO data available
					$('#wfsform').append('<br/><img id="photodata" width="100%" alt="Embedded Image" src="'+data+'"/>')
				}
				
				else { 
					// defaulting to TEXT == normal text inputs or HIDDEN text input
					var value = '';
					var type = 'text';
					var title = Geogem.featureTypes[key].TITLE+'<br/>';
					if (Geogem.featureTypes[key].TYPE == 'HIDDEN'){
						type = 'hidden';
						title = '';
					}
					if (typeof feature.attributes[key] !== 'undefined'){value=feature.attributes[key]}
					$('#wfsform').append('<div><input type="'+type+'" id="form_'+key+'" value="'+value+'" /> '+title+'</div>');
				}
			}
		}
		else{
			// text inputs defined on attributes from feature retrieved from server
			for (var key in feature.attributes){
				var value = '';
				if (typeof feature.attributes[key] !== 'undefined'){value=feature.attributes[key]}
				$('#wfsform').append('<div><input type="text" id="form_'+key+'" value="'+value+'" />'+key+'<br/></div>');
			}
		}
		Geogem.showSidebar(true);
		// register when there is either a change or a key up in the function
		$("#wfsform :input").keyup(function() {wfs.hasUnsavedChanges = true;});
		$("#wfsform :input").change(function() {wfs.hasUnsavedChanges = true;});
		
		
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
							dataURL = reader.result;
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
								$("#wfsform :input[id='form_IMGDATA']").val(dataURL)
							};

							image.onerror = function () {
								alert('There was an error processing your file!');
							};

						}
						reader.onerror = function () {
							alert('There was an error reading the file!');
						}
						reader.readAsDataURL(file);
					} else {
						alert('Not a valid image!');
					}
				}
			});
		} else {
			alert("File upload is not supported!");
		}
		
		
	}
	
	
    Geogem.map.addLayers([wfs]);
	
	Geogem.verstuur = function(){
		Geogem.saveAction.trigger();
		Geogem.showSidebar(false);
	}
	Geogem.annuleer = function(){
		// check if there is maybe a just inserted feature
		//console.log('Geogem.editAction.feature.justInserted', Geogem.editAction.feature.justInserted)
		if (Geogem.editAction.feature && Geogem.editAction.feature.justInserted){
			//console.log('removing a fresh inserted feature!!');
			Geogem.deleteFeature();
		}
		// deactivate the feature controls because keeping active is problematic
		// but reactivate the current active one again
		Geogem.reactivateEditTools()
		
		// reload features to be sure we reflect the servers status
		wfs.refresh({force: true}); 
		wfs.hasUnsavedChanges = false;
	}
	Geogem.delete = function(){
		Geogem.deleteFeature();
		// deactivate the feature controls because keeping active is problematic
		// but reactivate the current active one again
		Geogem.reactivateEditTools()
	}
	
	Geogem.reactivateEditTools = function(){
		// deactivate the feature controls because keeping active is problematic
		// but reactivate the current active one again
		Geogem.showSidebar(false);
		if (Geogem.drawAction && Geogem.drawAction.active){
			Geogem.drawAction.deactivate();
			Geogem.drawAction.activate();
		}
		if(Geogem.editAction && Geogem.editAction.active){
			Geogem.editAction.deactivate();
			Geogem.editAction.activate();
		}
		Geogem.map.infoControl.deactivate();
	}
		
	Geogem.deleteFeature = function(){ 
        var feature = Geogem.editAction.feature; 
		Geogem.deleteAction.trigger();
    }
	
	// edit and draw TOOLS
	Geogem.drawAction = new OpenLayers.Control.DrawFeature(wfs, 
		OpenLayers.Handler.Point,
        {
            title: "Draw Feature",
			displayClass: "olControlDrawFeaturePoint",
            multi: false,
			featureAdded: Geogem.featureAdded
        }
    );
	Geogem.editAction = new OpenLayers.Control.ModifyFeature(wfs, 
		{
			title: "Modify Feature",
			displayClass: "olControlMoveFeature"
		}
	);	
	
	// init and stop functions
	Geogem.drawAction.events.register('activate', Geogem.drawAction, 
		function(){
            $('#drawtool').addClass("toolactive");
			wfs.setVisibility(true);
			if ($('#sidebar').is(":visible")){
				//alert('Nog bezig??');
				Geogem.showSidebar(false);
			}
			// deactivate infotool for wms layer
			Geogem.map.infoControl.deactivate();
		}
	);
	Geogem.drawAction.events.register('deactivate', Geogem.drawAction, 
		function(){
            $('#drawtool').removeClass("toolactive");
			wfs.setVisibility(false);
			Geogem.showSidebar(false); 
			// reactivate infotool for wms layer again
			Geogem.map.infoControl.activate();
		}
	);	    
	Geogem.editAction.events.register('activate', Geogem.editAction, 
		function(){
            $('#edittool').addClass("toolactive");
			wfs.setVisibility(true);
			Geogem.showSidebar(false);
			// deactivate infotool for wms layer
			Geogem.map.infoControl.deactivate();
		}
	);
	// deactivate should close sidebar/form
	Geogem.editAction.events.register('deactivate', Geogem.editAction, 
		function(){ 
            $('#edittool').removeClass("toolactive");
			wfs.setVisibility(false);
			Geogem.showSidebar(false); 
			// reactivate infotool for wms layer again
			Geogem.map.infoControl.activate();
		}
	);
	
	
	Geogem.saveAction = new OpenLayers.Control.Button({
        title: "Save Changes",
        trigger: function() {
            if(Geogem.editAction.feature) {
				// take the values from the form and set them in the feature to be saved
				if (typeof Geogem.featureTypes !== 'undefined'){
					
					// inputs based on above featureTypes
					for (var key in Geogem.featureTypes){
						var radioName = 'form_'+key;
						if (Geogem.featureTypes[key].TYPE == 'RADIO'){
							//console.log(key, $('#wfsform input:radio[name='+radioName+']:checked').val())
							Geogem.editAction.feature.attributes[key]=$('#wfsform input:radio[name='+radioName+']:checked').val();
						}
						// defaulting to TEXT == normal text inputs
						else { 
							Geogem.editAction.feature.attributes[key]=$('#form_'+key).val() || "" ;
							//console.log(key, $('#form_'+key).val())
						}
					}
				}
				else{
					for (var key in Geogem.editAction.feature.attributes){
						Geogem.editAction.feature.attributes[key]=$('#form_'+key).val() || "" ;
					}
				}
				Geogem.editAction.feature.state = OpenLayers.State.UPDATE;
				if (Geogem.editAction.selectControl){
					Geogem.editAction.selectControl.unselectAll();
				}
				else if (Geogem.editAction.selectFeature){
					Geogem.editAction.feature.justInserted = false;
					Geogem.editAction.unselectFeature(Geogem.editAction.feature)
				}
            }
            Geogem.saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });
	
	Geogem.deleteAction = new OpenLayers.Control.Button({
        title: "Verwijder",
        trigger: function() {
            if(Geogem.editAction.feature) {
				Geogem.editAction.feature.state = OpenLayers.State.DELETE;
				if (Geogem.editAction.selectControl){
					Geogem.editAction.selectControl.unselectAll();
				}
            }
            Geogem.saveStrategy.save();
        },
        displayClass: "olControlSaveFeatures"
    });

	$('#tools').append('<span id="drawtool" class="toolbutton point_icon">Draw</span>');
	$('#tools').append('<span id="edittool" class="toolbutton edit_icon">Edit</span>');
    
    $('#drawtool').click(function(){
        if (Geogem.drawAction.active){
            Geogem.drawAction.deactivate();
        }
        else{
            // only one tool active at a time
            Geogem.editAction.deactivate();
            Geogem.drawAction.activate();
        }
    });    
    
    $('#edittool').click(function(){
        if (Geogem.editAction.active){
            Geogem.editAction.deactivate();
        }
        else{
            // only one tool active at a time
            Geogem.drawAction.deactivate();
            Geogem.editAction.activate();
        }
    }); 	
    Geogem.map.addControls([ Geogem.drawAction, Geogem.editAction ]);
}
