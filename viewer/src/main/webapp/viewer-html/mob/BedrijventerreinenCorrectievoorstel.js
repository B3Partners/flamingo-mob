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
    vectorLayer:null,
    appLayer:null,
    currentAGM_ID:null,
    config: {
        layer:null
    },
    constructor: function (conf) {
        if (!Ext.isDefined(conf.showLabels)) {
            conf.showLabels = true;
        }
        this.currentAGM_ID = 16;
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);
        this.createStores();
        this.loadWindow();
        
        this.vectorLayer = this.config.viewerController.mapComponent.createVectorLayer({
            name: this.config.name + 'VectorLayer',
            geometrytypes:["Polygon"],
            showmeasures:true,
            viewerController : this.config.viewerController,
            allowselection:true,
            style: {
                fillcolor: "FF0000",
                fillopacity: 40,
                strokecolor: "FF0000",
                strokeopacity: 100
            }
        });
        this.config.viewerController.registerSnappingLayer(this.vectorLayer);
        this.config.viewerController.mapComponent.getMap().addLayer(this.vectorLayer);
                
        this.vectorLayer.addListener (viewer.viewercontroller.controller.Event.ON_FEATURE_ADDED,function(){this.container.show();},this);
        this.geometryEditable = true;
        this.appLayer = this.config.viewerController.getAppLayerById(this.config.layer);
        this.layerSelector = {};
        var me = this;
        this.layerSelector.getValue = function(){
            return me.appLayer;
        };
        return this;
    },
    newCorrection: function () {
       this.mode = "new";
       // this.vectorLayer.drawFeature("Polygon");
       var feat = Ext.create(viewer.viewercontroller.controller.Feature, {wktgeom : "POLYGON((223790 504638,228844 508832.16,232661.12 504585,229166 502918,223790 504638))"});
       this.vectorLayer.addFeatures([feat]);
    },
    
    changeFeatureBeforeSave: function(feat){
        feat.AGM_ID = this.currentAGM_ID;
        feat.CORRECTIE_STATUS_ID = 1; // via backend vullen: eerst correctiestatus aanmaken, en id hierin stoppen
        
        return feat;
    },

    loadWindow: function () {
        this.container = Ext.create('Ext.window.Window', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: 600,
            height: 600,
            padding: '5px',
            items: this.createForm()

        });
        this.createButtons();
    },
    createForm: function () {
        this.inputContainer = Ext.create('Ext.form.Panel', {
            flex: 1,
            title: 'Correctievoorstel',
            items: [
                {
                    xtype: 'container', layout: {type: 'hbox', pack: "end"}, items: [
                        {xtype: 'label', text: '1 juli 2018', itemId: 'peildatum'}
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, defaults: {margin: '5px', padding: '5px'}, items: [
                        {xtype: 'textfield', value: 'Almelo', editable: false, itemId: 'gemeente'},
                        {xtype: 'textfield', value: 'Turfkade', flex: 1, editable: false, itemId: 'plan'}
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, defaults: {padding: '5px'}, items: [
                        {xtype: 'combobox', flex: 2, labelAlign: 'top', value:2, name: 'CLASSIFICATIE_ID', fieldLabel: "Voorgestelde classificatie", displayField: "CLASSIFICATIE", valueField: "CLS_ID", store: this.stores.classificaties},
                        {xtype: 'filefield', flex: 1, labelAlign: 'top', fieldLabel: "Upload", buttonOnly: true, buttonText: 'Upload shp-zip, pdf, ...', itemId: 'shp'}
                    ]
                },
                {
                    xtype: "textarea", name:"TOELICHTING", value:"asdfasdf", fieldLabel: "Toelichting", padding: '5px', labelAlign: 'top', itemId: "toelichting", anchor: '100%'
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, items: [
                        {flex: 1, xtype: 'combobox', labelAlign: 'top', name: 'status', margin: '5px', padding: '5px', fieldLabel: "Status", value: "Opgeslagen", store: this.stores.status},
                        {flex: 2, xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                                {xtype: 'datefield', format : 'd-m-Y',altFormats : 'd-m-y|d-M-Y',submitFormat : 'c',name:"MUTATIEDATUM_GEMEENTE", labelAlign: 'top', fieldLabel: 'Laatste wijziging gemeente', value: new Date(), itemId: 'datumLaatstGewijzigdGemeente'},
                                {xtype: 'textfield', name:"MUT_GEMEENTE_DOOR", labelAlign: 'top', fieldLabel: "Naam", value: 'PJansen', itemId: 'naamLaatstGewijzigdGemeente'}]
                        }
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                        {xtype: 'datefield', labelAlign: 'top', format : 'd-m-Y',altFormats : 'd-m-y|d-M-Y',submitFormat : 'c', name:"MUTATIEDATUM_PROVINCIE", fieldLabel: 'Laatste wijziging provincie', value: new Date(), itemId: 'datumLaatstGewijzigdProvincie'},
                        {xtype: 'textfield', labelAlign: 'top', name:"MUT_PROVINCIE_DOOR", fieldLabel: "Naam", value: 'DvabderVeen', itemId: 'naamLaatstGewijzigdProvincie'}
                    ]
                }
            ],
            bbar: [
                {xtype: 'button', text: 'Opslaan', itemId: 'save-button', scope: this, handler: function () {
                        this.save();
                        this.vectorLayer.removeAllFeatures();
                    }
                },
                {xtype: 'button', text: 'Verwijderen', itemId: 'remove-button', scope: this, handler: function () {
                        this.remove();
                    }
                },
                {xtype: 'button', text: 'Annuleren'}
            ]
        });
        return this.inputContainer;
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
            listeners:{
                scope:this,
                click:this.newCorrection
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
        Ext.define('User', {
            extend: 'Ext.data.Model',
            fields: ['CLS_ID', 'CLASSIFICATIE']
        });

        var store = Ext.create('Ext.data.Store', {
            model: 'User',
            proxy: {
                extraParams: {
                    application: FlamingoAppLoader.get('appId'),
                    featureTypeName: "CLASSIFICATIES",
                    fs: 17
                },
                type: 'ajax',
                url: FlamingoAppLoader.get('contextPath') + '/action/mob/store',
                reader: {
                    type: 'json',
                    rootProperty: 'features'
                }
            }
        });

        this.stores.classificaties = store;
    },
    getEditFeature: function(){
        return Ext.create("viewer.EditFeature", {
            viewerController: this.config.viewerController,
            actionbeanUrl: actionBeans["mobeditfeature"]
        });
    }
});
