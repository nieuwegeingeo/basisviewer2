<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
    xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
    xmlns="http://www.opengis.net/sld" 
    xmlns:ogc="http://www.opengis.net/ogc" 
    xmlns:xlink="http://www.w3.org/1999/xlink" 
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>Kunstroute</Name>
    <UserStyle>
      <Title>GeoServer SLD Cook Book: Point with default label</Title>
      <FeatureTypeStyle>
        <Rule>
			  
		  <PointSymbolizer>
			   <Graphic>
				 <ExternalGraphic>
				   <OnlineResource xlink:type="simple" xlink:href="http://geoserver.nieuwegein.nl/basisviewer2/img/marker.png" />
				   <Format>image/svg+xml</Format>
				 </ExternalGraphic>
				 <Size>30</Size>
				 <!--<AnchorPoint>
				   <AnchorPointX>-20</AnchorPointX>
				   <AnchorPointY>-30</AnchorPointY>
				 </AnchorPoint>
				 <Displacement>
				   <DisplacementX>-20</DisplacementX>
				   <DisplacementY>-20</DisplacementY>
				 </Displacement>-->
			   </Graphic>
		  </PointSymbolizer>
		  
			<LineSymbolizer>
				<Stroke>
					<CssParameter name="stroke">#88179F</CssParameter>
					<CssParameter name="stroke-width">4</CssParameter>
					<CssParameter name="stroke-opacity">0.6</CssParameter>
				</Stroke>
			</LineSymbolizer>
			
		  <!-- 
			Let op: in OpenLayers werken op zich labels wel, maar halo's NIET.
					(halo's werken trouwens zoiezo niet in IE).
			Om toch een label+halo in ff en chrome te hebben, dien je dus een combi
			van labels:label setting the gebruiken. Onderstaande TextSymbolizer
			wordt dan genegeerd.
			ECHTER de hoop is dat deze wel gebruikt kan worden door Geoserver
		  -->
		  <TextSymbolizer>
            <Label>
              <ogc:PropertyName>label</ogc:PropertyName>
            </Label>
			
			<Halo>
              <Radius><ogc:Literal>3</ogc:Literal></Radius>
              <Fill>
                <CssParameter name="fill">#ff0000</CssParameter>
                <CssParameter name="fill-opacity">0.85</CssParameter>
              </Fill>
            </Halo>
		
            <Fill>
              <CssParameter name="fill">#ffffff</CssParameter>
            </Fill>
			
			<Font>
			   <CssParameter name="font-family">Arial</CssParameter>
			   <CssParameter name="font-size">11</CssParameter>
			   <CssParameter name="font-style">normal</CssParameter>
			   <CssParameter name="font-weight">bold</CssParameter>
			</Font>
			
          </TextSymbolizer>
		  
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
