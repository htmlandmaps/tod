/**
Creates a combobox of features and zooms to the user selected one
*/
define(["dojo/_base/declare", "dijit/_WidgetBase", "dojo/_base/lang", "dojo/topic", "./utilities/maphandler", "dijit/layout/ContentPane"
    , "dijit/Menu", "esri/dijit/BasemapGallery", "dijit/registry", "dojo/aspect" /*, "./custommenu"*/
    , "dijit/form/ComboBox", "dojo/store/Memory", "dojo/on", "dojo/dom", "dojo/dom-construct",
        "esri/symbols/SimpleFillSymbol", "esri/urlUtils", "esri/renderers/SimpleRenderer", "esri/layers/FeatureLayer",   "esri/symbols/SimpleLineSymbol", "esri/tasks/query", "esri/tasks/QueryTask", "esri/map" ],
    function (declare, WidgetBase, lang, topic, mapHandler, ContentPane, Menu, BasemapGallery, registry, aspect /*, custommenu*/
        , ComboBox, Memory, on, dom, domConstruct, SimpleFillSymbol, urlUtils, SimpleRenderer, FeatureLayer, SimpleLineSymbol, Query, QueryTask, Map) {
        return declare([WidgetBase, ComboBox], {

            // The ESRI map object to bind to the TOC. Set in constructor
            map: null,
            //The application configuration properties (originated as configOptions from app.js then overridden by AGO if applicable)
            AppConfig: null,

            //*** creates zoom combobox and sets store
            constructor: function (args) {

                var map, queryTask, query, dataStore, tempStore;
                map = mapHandler.map;
				
				
					//URL params ****
				var params = urlUtils.urlToObject(document.location.href);  
			  if (params.query && params.query.county) {  
				var county = params.query.county;  
				console.log(county);
				
				var clabelField = "COUNTY";
				var map;
				//map = this.map;
					
					// create a renderer for the states layer to override default symbology
        //var countyColor = new Color("#666");
        var countyLine = new SimpleLineSymbol("null", "red", 0.1);
        var countySymbol = new SimpleFillSymbol("solid", countyLine, null);
        var countyRenderer = new SimpleRenderer(countySymbol);

		 // create a feature layer to show country boundaries
        var countyUrl = "http://geodata.md.gov/imap/rest/services/Boundaries/MD_PoliticalBoundaries/MapServer/1";
        var county1 = new FeatureLayer(countyUrl, {
          id: "County",
          outFields: [clabelField]
        });
        county1.setRenderer(countyRenderer);
		county1.opacity = 0.0;
		console.log(county1);
		//console.log(map);
        map.addLayer(county1);
				
				
				//var searchField = args.field;
                //querytask to get the features and create the data store
                var queryTask = new QueryTask(countyUrl);
                var query = new Query();
                query.returnGeometry = true;
				query.outSpatialReference = new esri.SpatialReference({wkid : 102100}); 
                query.outFields = [clabelField];
                query.where = "COUNTY = '" + county + "'";
				
				
						//for counties with apostrophe
						if (county.indexOf("'") > -1) {
					console.log("county has apostrophe");
				
						 query.where = "COUNTY = " + "'" + county.replace("'", "''") + "'";
			
				}	
				
                //queryTask.execute(query, processArray, errorClbk);
				queryTask.execute(query,function zoom(results) {
					var extent = results.features[0].geometry.getExtent();  
					console.log(extent);
					map.setExtent(extent.expand(1))
				} );
				
				queryTask.executeForCount(query, function(count) {
					console.log("The number of features that match the query is " + count + "."); 
				//featureExtent = query.feature.geometry.getExtent();
				
				});
				console.log(queryTask);
								
				
			  }
				//url params MIO end ***********
				
				
				
				
		
                var searchField = args.field;
                //querytask to get the features and create the data store
				//these all come from the toolmanager.js MO comment
                var queryTask = new esri.tasks.QueryTask(args.service + args.layer);
                query = new esri.tasks.Query();
                query.returnGeometry = false;
                query.outFields = [searchField];
                query.where = "1=1";
                queryTask.execute(query, processArray, errorClbk);

                var dataStore = new Memory();
                var tempStore = new Memory();
				
						
                //on querytask success add the features
                function processArray(featureSet) {

                    dojo.forEach(featureSet.features, function (feature) {
                        var results = tempStore.query({ name: feature.attributes[searchField] });
                        if (results.length < 1) {
							//console.log(results);
                            tempStore.add({ name: feature.attributes[searchField], id: feature.attributes[searchField], zoom: args.zoomFeature });
                        }
                    });
                    //sorts the temporary store
                    dataStore = tempStore.query({ zoom: args.zoomFeature },
                        { sort: [{ attribute: "name"}] });
                    //sets the data store
                    args.store.data = dataStore;   //shows 24 objects list
				
				};
                //error message if querytask errors
                function errorClbk(errorMsg) {
                    alert(errorMsg);
                };
                //sets the data store, nothing if query hasn't completed
                args.store = dataStore;
                declare.safeMixin(this, args);

                this.map = mapHandler.map;
	
	 console.log(args); 
			
		
			}

            , postCreate: function () {
                this.inherited(arguments);
            },
			
		
			

            onChange: function (feature) {   //runs after the county zoom  drop down is changed    ******This is a method, the key is "OnChange", the value is function p.101; in an object, functions become methods
			//methods represent tasks that are associated with the object
			//value of method is always a function
			//***need to know how to access method of an object****
               //console.log(feature); //just county name
                var map, findTask, findParams, featureExtent;
                map = mapHandler.map;
				
				//create find task with url to map service
                findTask = new esri.tasks.FindTask(this.params.service);
                //create find parameters and define known values
                findParams = new esri.tasks.FindParameters();
                findParams.returnGeometry = true;
                findParams.outSpatialReference = map.spatialReference;
                findParams.layerIds = [this.params.layer];
                findParams.searchFields = [this.params.field];
                findParams.searchText = feature;				
				
                findTask.execute(findParams, showResults);
				
			
				
                function showResults(results) {
				
				    if (results[0].feature.geometry.getExtent() != "") {
                        var symbol = "";
                        var map = mapHandler.map;
                        map.graphics.clear();
                        //sets the symbology depending on the feature type
                        var geoType = results[0].feature.geometry.type;
                        switch (geoType) {
                            case "polyline":
								symbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255, 0, 0]), 1);
			                    break;
                            case "polygon":  
								symbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([0, 0, 255, 0.75]), 3), new dojo.Color([125, 125, 125, 0.20]))
                               	break;
                            case "point":
                                symbol = esri.symbol.PictureMarkerSymbol({
                                    "angle": 0,
                                    "xoffset": 0,
                                    "yoffset": 10,
                                    "type": "esriPMS",
                                    "url": "assets/BluePin1LargeB.png",
                                    "contentType": "image/png",
                                    "width": 24,
                                    "height": 24
                                });
                                break;
                            default:
                        }
						
                        //creates the graphic //is this the highlight of the county graphic?
                        var graphic = results[0].feature;
						graphic.setSymbol(symbol);
						map.graphics.add(graphic);
				
						
						//clears the graphic after 3 seconds (3000)
						setTimeout(function(){map.graphics.clear(graphic);},3000);
														
										
                        //zooms to the extent
                        if (results[0].feature.geometry.type == "point") {   //only for point features
                            var pt = results[0].feature.geometry;
                            map.centerAndZoom(pt, 15);//15
						
                        } else {    //zoom for polygon features
						
                            featureExtent = results[0].feature.geometry.getExtent(); //get extent of selected county
			                map.setExtent(featureExtent).expand(1.50);				
                        }
                    }
                }
            }
        });
    });