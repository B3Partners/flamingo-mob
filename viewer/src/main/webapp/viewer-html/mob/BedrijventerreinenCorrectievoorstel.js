/* 
 * Copyright (C) 2018 B3Partners B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global Ext, FlamingoAppLoader, actionBeans */

Ext.define("viewer.components.BedrijventerreinenCorrectievoorstel", {
    extend: "viewer.components.Edit",
    container: null,
    buttonContainer: null,
    stores: {},
    vectorLayer: null,
    appLayer: null,
    currentAGM_ID: null,
    config: {
        layer: null
    },
    constructor: function (conf) {
        if (!Ext.isDefined(conf.showLabels)) {
            conf.showLabels = true;
        }
        this.currentAGM_ID = 16;
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);

        viewer.components.BedrijventerreinenBase.defineModels();
        this.vectorLayer = this.config.viewerController.mapComponent.createVectorLayer({
            name: this.config.name + 'VectorLayer',
            geometrytypes: ["Polygon"],
            showmeasures: true,
            viewerController: this.config.viewerController,
            allowselection: true,
            style: {
                fillcolor: "FF0000",
                fillopacity: 40,
                strokecolor: "FF0000",
                strokeopacity: 100
            }
        });
        this.config.viewerController.registerSnappingLayer(this.vectorLayer);
        this.config.viewerController.mapComponent.getMap().addLayer(this.vectorLayer);

        this.vectorLayer.addListener(viewer.viewercontroller.controller.Event.ON_FEATURE_ADDED, function () {
            this.container.show();
        }, this);
        this.geometryEditable = true;
        this.appLayer = this.config.viewerController.getAppLayerById(this.config.layer);
        this.layerSelector = {};
        var me = this;
        this.layerSelector.getValue = function () {
            return me.appLayer;
        };
        this.createStores();
        this.peildatum = "1-1-2018";
        // this.loadWindoww();

        this.toolMapClick.activateTool();
        return this;
    },
    mapClicked: function (toolMapClick, comp) {
        if (this.container.isVisible()) {
            return;
        }
        // this.showMobilePopup();
        //  Ext.get(this.getContentDiv()).mask("Haalt features op...");
        var coords = comp.coord;
        this.config.viewerController.mapComponent.getMap().setMarker("edit", coords.x, coords.y);
        this.getFeaturesForCoords(coords);
    },
    getFeaturesForCoords: function (coords) {
        var layer = this.layerSelector.getValue();
        var featureInfo = Ext.create("viewer.FeatureInfo", {
            viewerController: this.config.viewerController
        });
        var me = this;
        //layersFeatureInfo: function(x, y, distance, appLayers, extraParams, successFunction, failureFunction,scope) {
        featureInfo.layersFeatureInfo(coords.x, coords.y, this.config.viewerController.mapComponent.getMap().getResolution() * 4, [layer], {}, function (response) {
            for (var i = 0; i < response.length; i++) {
                var resp = response[i];
                var features = resp.features;
                me.featuresReceived(features);
            }
        }, function (msg) {
            me.failed(msg);
        });
    },
    featuresReceived: function (features) {
        var feat = features[0];
        this.editCorrection(feat);
    },

    editCorrection: function (f) {
        if(!f){
            return;
        }
        this.mode = "edit";
        this.currentFID = f.CV_ID;

        var feat = Ext.create(viewer.viewercontroller.controller.Feature, {wktgeom: f.GEOMETRIE});
        this.vectorLayer.addFeatures([feat]);
        this.container.show();
        
        var user = FlamingoAppLoader.get("user");
        if (user.roles.hasOwnProperty("gemeente")) {
            f.MUT_GEMEENTE_DOOR = user.name ;
            f.MUTATIEDATUM_GEMEENTE = new Date();
        }

        if (user.roles.hasOwnProperty("provincie")) {
            f.MUT_PROVINCIE_DOOR = user.name;
            f.MUTATIEDATUM_PROVINCIE = new Date();
        }
        
        f.MUTATIEDATUM_PROVINCIE = Ext.Date.format(new Date(f.MUTATIEDATUM_PROVINCIE), 'd-m-Y');
        f.MUTATIEDATUM_GEMEENTE = Ext.Date.format(new Date(f.MUTATIEDATUM_GEMEENTE), 'd-m-Y');
        this.inputContainer.getForm().setValues(f);
    },

    newCorrection: function () {
        this.mode = "new";
        this.vectorLayer.drawFeature("Polygon");
       // var feat = Ext.create(viewer.viewercontroller.controller.Feature, {wktgeom: "POLYGON((223790 504638,228844 508832.16,232661.12 504585,229166 502918,223790 504638))"});
        //this.vectorLayer.addFeatures([feat]);
    },
    reset: function () {
        this.vectorLayer.removeAllFeatures();
        this.inputContainer.reset();
        this.mode = "";
    },

    loadWindow: function () {
        this.container = Ext.create('Ext.window.Window', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: 600,
            title: 'Correctievoorstel   - Peildatum ' + this.peildatum,
            closeAction: "hide",
            height: 600,
            padding: '5px',
            items: this.createForm(),
            listeners: {
                scope: this,
                hide: this.reset
            }

        });
        this.createButtons();
    },
    createForm: function () { 
        var user = FlamingoAppLoader.get("user");
        var isGemeente = user.roles.hasOwnProperty("gemeente");
        this.inputContainer = Ext.create('Ext.form.Panel', {
            flex: 1,
            items: [
                {
                    xtype: 'container', layout: {type: 'hbox'}, defaults: {padding: '5px'}, items: [
                        {xtype: 'combobox', flex: 2, labelAlign: 'top', name: 'CLASSIFICATIE_ID', fieldLabel: "Voorgestelde classificatie", displayField: "CLASSIFICATIE", valueField: "CLS_ID", store: this.stores.classificaties},
                        {xtype: 'filefield', flex: 1, disabled: true, labelAlign: 'top', fieldLabel: "Upload", buttonOnly: true, buttonText: 'Upload shp-zip, pdf, ...', itemId: 'shp'}
                    ]
                },
                {
                    xtype: "textarea", name: "TOELICHTING", fieldLabel: "Toelichting", padding: '5px', labelAlign: 'top', itemId: "toelichting", anchor: '100%', height: "200px",
                    listeners: { afterrender: function(a,b,c){
                            a.focus();
                            var d = document.getElementById(a.inputId);
                            setTimeout(function(){
                                d.scrollTop = 99999;
                            }, 10);
                    },scope:this}
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, items: [
                        {flex: 1, xtype: 'combobox', labelAlign: 'top', disabled: isGemeente, disabledCls:"", name: 'CORRECTIE_STATUS_ID', margin: '5px', padding: '5px', fieldLabel: "Status", displayField: "CORRECTIE_STATUS", valueField: "CS_ID", store: this.stores.statussen},
                        {flex: 2, xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                                {xtype: 'textfield', editable:false, format: 'd-m-Y', altFormats: 'd-m-y|d-M-Y|d-M-Y|d-m-Y H:i:s', submitFormat: 'c', name: "MUTATIEDATUM_GEMEENTE", labelAlign: 'top', fieldLabel: 'Laatste wijziging gemeente', value: new Date(), itemId: 'datumLaatstGewijzigdGemeente'},
                                {xtype: 'textfield', editable:false, name: "MUT_GEMEENTE_DOOR", labelAlign: 'top', fieldLabel: "Naam", itemId: 'naamLaatstGewijzigdGemeente'}]
                        }
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                        {xtype: 'textfield', editable:false, labelAlign: 'top', format: 'd-m-Y', altFormats: 'd-m-y|d-m-Y H:i:s', submitFormat: 'c', name: "MUTATIEDATUM_PROVINCIE", fieldLabel: 'Laatste wijziging provincie', value: new Date(), itemId: 'datumLaatstGewijzigdProvincie'},
                        {xtype: 'textfield', editable:false, labelAlign: 'top', name: "MUT_PROVINCIE_DOOR", fieldLabel: "Naam", itemId: 'naamLaatstGewijzigdProvincie'}
                    ]
                }
            ],
            bbar: [
                {xtype: 'button', text: 'Opslaan', itemId: 'save-button', scope: this, handler: function () {
                        this.save();
                    }},
                {xtype: 'button', text: 'Verwijderen', itemId: 'remove-button', scope: this, handler: function () {
                        this.remove();
                    }},
                {xtype: 'button', text: 'Annuleren', scope: this, handler: function () {
                        this.reset();
                    }}
            ]
        });
        return this.inputContainer;
    },
    resetForm: function(){
        this.container.hide();
    },
    createButtons: function () {
        if (this.buttonContainer === null) {
            this.buttonContainer = Ext.create('Ext.container.Container', {
                renderTo: Ext.get(this.config.viewerController.getMapId()),
                floating: true,
                border: false,
                shadow: false,
                defaults: {
                    margin: '5px'
                },
                style: {
                    'zIndex': 1002
                }
            });
        }
        if (this.cvbutton) {
            this.cvbutton.destroy();
            this.vubutton.destroy();
            this.indienbutton.destroy();
        }
        this.cvbutton = Ext.create('Ext.Button', {
            text: 'Correctievoorstel',
            listeners: {
                scope: this,
                click: this.newCorrection
            }
        });

        this.vubutton = Ext.create('Ext.Button', {
            text: 'Verwachte uitgifte',
            handler: function () {
                alert('You clicked the verwachte uitgifte button!');
            }
        });

        this.indienbutton = Ext.create('Ext.Button', {
            text: 'Indienen',
            handler: function () {
                alert('You clicked the indienen button!');
            }
        });
        this.buttonContainer.add(this.cvbutton);
        this.buttonContainer.add(this.vubutton);
        this.buttonContainer.add(this.indienbutton);
        this.alignButtons();
    },
    alignButtons: function () {
        if (!this.buttonContainer) {
            return;
        }
        var pos = [Number(-20), Number(5)];
        var align = 'tr';
        var mapContainer = Ext.get(this.config.viewerController.getMapId());
        this.buttonContainer.alignTo(mapContainer, [align, align].join('-'), pos);
        this.config.viewerController.anchorTo(this.buttonContainer, mapContainer, [align, align].join('-'), pos);
    },

    createStores: function () {
        var classStore = Ext.create('Ext.data.Store', {
            model: 'Bedrijventerreinen.model.Classificatie',
            proxy: {
                extraParams: {
                    application: FlamingoAppLoader.get('appId'),
                    featureTypeName: "CLASSIFICATIES",
                    appLayer: this.layer,
                    sort:"VOLGORDENR"
                },
                type: 'ajax',
                url: FlamingoAppLoader.get('contextPath') + '/action/mob/store',
                reader: {
                    type: 'json',
                    rootProperty: 'features'
                }
            }
        });

        var statusStore = Ext.create('Ext.data.Store', {
            model: 'Bedrijventerreinen.model.Correctie_status',
            proxy: {
                extraParams: {
                    application: FlamingoAppLoader.get('appId'),
                    featureTypeName: "CORRECTIE_STATUSSEN",
                    appLayer: this.layer
                },
                type: 'ajax',
                url: FlamingoAppLoader.get('contextPath') + '/action/mob/store',
                reader: {
                    type: 'json',
                    rootProperty: 'features'
                }
            }
        });

        this.stores.classificaties = classStore;
        this.stores.statussen = statusStore;

        for (var key in this.stores) {
            if (this.stores.hasOwnProperty(key)) {
                this.stores[key].load();
            }
        }
    },

    changeFeatureBeforeSave: function (feat) {
        feat.AGM_ID = this.currentAGM_ID;
        return feat;
    },
    getEditFeature: function () {
        return Ext.create("viewer.EditFeature", {
            viewerController: this.config.viewerController,
            actionbeanUrl: actionBeans["mobeditfeature"] + "?editFeature=true"
        });
    },
    saveSucces: function () {
        this.reset();
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.saveSucces.call(this, this.config);
    }
});
