/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global Ext, FlamingoAppLoader */

Ext.define("viewer.components.BedrijventerreinenCorrectievoorstel", {
    extend: "viewer.components.Component",
    container: null,
    buttonContainer: null,
    stores: {},
    config: {
        title: null,
        titlebarIcon: null,
        tooltip: null,
        label: "",
        details: {
            minWidth: 700,
            minHeight: 600,
            useExtLayout: true
        }
    },
    constructor: function (conf) {
        if (!Ext.isDefined(conf.showLabels)) {
            conf.showLabels = true;
        }
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);
        this.createStores();
        return this;
    },
    newCorrection: function () {

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
        this.form = Ext.create('Ext.form.Panel', {
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
                        {xtype: 'combobox', flex: 2, labelAlign: 'top', name: 'classificatie', fieldLabel: "Voorgestelde classificatie", displayField: "CLASSIFICATIE", valueField: "CLS_ID", store: this.stores.classificaties},
                        {xtype: 'filefield', flex: 1, labelAlign: 'top', fieldLabel: "Upload", buttonOnly: true, buttonText: 'Upload shp-zip, pdf, ...', itemId: 'shp'}
                    ]
                },
                {
                    xtype: "textarea", fieldLabel: "Toelichting", padding: '5px', labelAlign: 'top', itemId: "toelichting", anchor: '100%'
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, items: [
                        {flex: 1, xtype: 'combobox', labelAlign: 'top', name: 'status', margin: '5px', padding: '5px', fieldLabel: "Status", value: "Opgeslagen", store: this.stores.status},
                        {flex: 2, xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                                {xtype: 'textfield', labelAlign: 'top', fieldLabel: 'Laatste wijziging gemeente', value: '10-10-2018', itemId: 'datumLaatstGewijzigdGemeente'},
                                {xtype: 'textfield', labelAlign: 'top', fieldLabel: "Naam", value: 'PJansen', itemId: 'naamLaatstGewijzigdGemeente'}]
                        }
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox', pack: 'end'}, defaults: {margin: '5px', padding: '5px'}, items: [
                        {xtype: 'textfield', labelAlign: 'top', fieldLabel: 'Laatste wijziging provincie', value: '11-10-2018', itemId: 'datumLaatstGewijzigdProvincie'},
                        {xtype: 'textfield', labelAlign: 'top', fieldLabel: "Naam", value: 'DvabderVeen', itemId: 'naamLaatstGewijzigdProvincie'}
                    ]
                }
            ],
            bbar: [
                {xtype: 'button', text: 'Opslaan', itemId: 'save-button', scope: this, handler: function () {
                        this.saveAndNext();
                    }
                },
                {xtype: 'button', text: 'Verwijderen', itemId: 'remove-button', scope: this, handler: function () {
                        this.remove();
                    }
                },
                {xtype: 'button', text: 'Annuleren'}
            ]
        });
        return this.form;
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
            handler: this.newCorrection
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
        this.loadWindow();
    }
});
