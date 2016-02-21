
/**
 * A template for a Tab Module JS file for MD iMap, implmenting dojo AMD and _TemplatedMixin
 * Created by ssporik on 10/20/2014.
 */
define(["dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/dom-construct", "dojo/on"
        , "dijit/registry", "dojo/_base/lang", "dojo/dom", "dojo/_base/array"
        , "esri/dijit/Popup", "esri/dijit/PopupTemplate", "esri/layers/FeatureLayer"
        , "../../core/utilities/maphandler"],
    function(declare, WidgetBase, TemplatedMixin, domConstruct, on
        , registry, lang, dom, arrayUtils
        , Popup, PopupTemplate, FeatureLayer
        , mapHandler){
        return declare([], {
            // The template HTML fragment (as a string, created in dojo/text definition above,
            // should reference an html file saved in this module directory.)
            templateString: null
            // The CSS class to be applied to the root node in our template
            , baseClass: ""
            // The ESRI map object
            , Map: null
            , webMap: null
            , AppConfig: null
            //  Generic temp property for flexible use.
            , temp: null

            // Creates the content pane.
            , constructor: function (args) {

                // safeMixin automatically sets the properties above that are passed in from the tabmanager.js
                //declare.safeMixin(this, args);

                //singleton object that you can require above and use to get a reference to the map.
                this.Map = mapHandler.map;
                //this.map = args.Map;
            }

            /* Standard module event handlers. In the postcreate and startup handlers,
             * you can assume the module has been created.  You don't need to add a handler function
             * if you are not writing code in it.*/

            //The widget has been added to the DOM, though not visible yet. This is the recommended
            // place to do most of the module's work
            , postcreate: function () {
                this.inherited(arguments);
            }

            , startup: function () {
                this.inherited(arguments);

                //create custom popups on feature layers added to the map.

                //-----------Stations WITH Projects---------------------------------------------------------------------------------------------------------

                //create custom Popup template
                var ptStationsWithProjects = new PopupTemplate({
                    title: "Existing Transit Station: " + "{LABELS}",
                    description: "Station: {LABELS} <br> Agency: {AGENCY} <br> Line: {LINE} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{STATION}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{STATION}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{STATION}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>" +
					"<br><a href='http://mdpgis.mdp.state.md.us/tod/update/housingsales/{STATION}.pdf'>Station Area Average Housing Sales</a> (2010-2012)"+
                    "<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/{STATION}.jpg",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });
				
				        var ptStationsWithProjectsNoHs = new PopupTemplate({ //station and nohs
                    title: "Existing Transit Station: " + "{LABELS}",
                    description: "Station: {LABELS} <br> Agency: {AGENCY} <br> Line: {LINE} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{STATION}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{STATION}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{STATION}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>" +
					 "<br><a href='http://planning.maryland.gov/OurWork/TOD/nohousing-data.shtml'>Station Area Average Housing Sales</a> (2010-2012)"+
                    "<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/{STATION}.jpg",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });

                //create feature layer and set info template to the new popup template
                var flStationWithProjects = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/1",
                {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    infoTemplate: ptStationsWithProjects,
                    outFields: ["STATION", "AGENCY", "LINE", "TOD_ID", "LABELS"]    //MUST add all fields here that need to be displayed in popup
                });
				
				   var flStationWithProjectsNoHs = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/1",
                {
                    mode: FeatureLayer.MODE_ONDEMAND,
                    infoTemplate: ptStationsWithProjectsNoHs,
                    outFields: ["STATION", "AGENCY", "LINE", "TOD_ID", "LABELS", "Housingsal"]    //MUST add all fields here that need to be displayed in popup
                });
				
				
                // add a defintion query to filter projects with stations.
                flStationWithProjects.setDefinitionExpression("TOD_ID > 0 AND Housingsal = 1");  //TOD ID > 0 Means there is a station area project
				flStationWithProjectsNoHs.setDefinitionExpression("TOD_ID > 0 AND Housingsal = 0");  //TOD ID > 0 Means there is a station area project and nohs

                //-----------Stations WITHOUT Projects---------------------------------------------------------------------------------------------------------
                //create new Popup template.
                var ptStationsWithOutProjects = new PopupTemplate({         //with housing sales
                    title: "Existing Transit Station: " + "{STATION}",
                    description: "Station: {STATION} <br> Agency: {AGENCY} <br> Line: {LINE} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{STATION}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{STATION}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{STATION}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>"+
					 "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/housingsales/{STATION}.pdf'>Station Area Average Housing Sales</a> (2010-2012)"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/{STATION}.jpg",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });

				
				   //create new Popup template.               //without projects and no sales
                var ptStationsWithOutProjectsNoHs = new PopupTemplate({
                    title: "Existing Transit Station: " + "{STATION}",
                    description: "Station: {STATION} <br> Agency: {AGENCY} <br> Line: {LINE} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{STATION}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{STATION}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{STATION}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/nohousing-data.shtml'>Station Area Average Housing Sales</a> (2010-2012)"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/{STATION}.jpg",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });
				
				
                //create Feature Layer and set infoTemplate to the new popup template
                var flStationWithOutProjects = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/1",
                    {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        infoTemplate: ptStationsWithOutProjects,
                        outFields: ["STATION", "AGENCY", "LINE", "TOD_ID", "Housingsal"]    //MUST add all fields here that need to be displayed in popup
                    });
					
					     var flStationWithOutProjectsNoHs = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/1",
                    {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        infoTemplate: ptStationsWithOutProjectsNoHs,
                        outFields: ["STATION", "AGENCY", "LINE", "TOD_ID", "Housingsal"]    //MUST add all fields here that need to be displayed in popup
                    });
                // set definition expression to show stations withOUT projects.
                flStationWithOutProjects.setDefinitionExpression("TOD_ID = 0 AND Housingsal = 1"); //TOD ID = 0 Means there is no station area project and has housing sales
			 flStationWithOutProjectsNoHs.setDefinitionExpression("TOD_ID = 0 AND Housingsal = 0"); //TOD ID = 0 Means there is no station area project and no housing sales

                  //purple stations with housing sales
				      var ptPurpleStationsHs = new PopupTemplate({
                    title: "Purple Line Station: " + "{Station}",
                    description: "Station: {Station} <br> Agency: {Agency} <br> Line: {Line} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{Station}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{Station}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{Station}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>"+
					"<br><a href='http://mdpgis.mdp.state.md.us/tod/update/housingsales/{Station}.pdf'>Station Area Average Housing Sales</a> (2010-2012)"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/purple.png",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });
				
				        var flPurpleStationHs = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/2",
                    {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        infoTemplate: ptPurpleStationsHs,
                        outFields: ["Station", "Agency", "Line", "TOD_ID", "Housingsal"]    //MUST add all fields here that need to be displayed in popup
                    });
					
			       flPurpleStationHs.setDefinitionExpression("Housingsal = 1"); //purple stations with housing sales
			 
                 //purple stations with no housing sales
      var ptPurpleStationsNoHs = new PopupTemplate({
                    title: "Purple Line Station: " + "{Station}",
                    description: "Station: {Station} <br> Agency: {Agency} <br> Line: {Line} <br><br> <a href='http://mdpgis.mdp.state.md.us/tod/update/demographics/{Station}.pdf'>Station Area Demographic Report</a> (2008-2012 ACS Data)" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/employment/{Station}_emp.pdf'>Station Area Employment Report</a>" +
                    "<br><a href='http://mdpgis.mdp.state.md.us/tod/update/ridership/{Station}_zon.pdf'>Station Area Ridership, Land Use, & Zoning</a>"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/nohousing-data.shtml'>Station Area Average Housing Sales</a> (2010-2012)"+
					"<br><a href='http://planning.maryland.gov/OurWork/TOD/station.shtml?sid={TOD_ID}'>Station Area Information</a>",
					
                    mediaInfos: [
                        {
                            "title":"",
                            "caption":"",
                            "type":"image",
                            "value": {
                                "sourceURL": "http://mdpgis.mdp.state.md.us/images/tod/purple.png",
                                "linkURL":""
                            }
                        }
                    ],
                    showAttachments: false
                });
				
				        var flPurpleStationNoHs = new FeatureLayer("http://mdpgis.mdp.state.md.us/arcgis/rest/services/Transportation/Transit_Stations/MapServer/2",
                    {
                        mode: FeatureLayer.MODE_ONDEMAND,
                        infoTemplate: ptPurpleStationsNoHs,
                        outFields: ["Station", "Agency", "Line", "TOD_ID", "Housingsal"]    //MUST add all fields here that need to be displayed in popup
                    });
					
			       flPurpleStationNoHs.setDefinitionExpression("Housingsal = 0"); //purple stations with no housing sales
				 
			 
                // -----add new feature layers to the map --------------------------------------------------------------------------------------------------------
                this.Map.addLayer(flStationWithProjects);
				this.Map.addLayer(flStationWithProjectsNoHs);
                this.Map.addLayer(flStationWithOutProjects);
				this.Map.addLayer(flStationWithOutProjectsNoHs);
				
				
				//purple
				this.Map.addLayer(flPurpleStationHs);
				this.Map.addLayer(flPurpleStationNoHs);
				
            }

        })
    }
);