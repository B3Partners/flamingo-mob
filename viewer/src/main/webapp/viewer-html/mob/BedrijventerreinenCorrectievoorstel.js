/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global Ext */

Ext.define("viewer.components.BedrijventerreinenCorrectievoorstel", {
    extend: "viewer.components.Component",
    bedrijventerrein: null,
    stores: {},
    config: {
        title: null,
        titlebarIcon: null,
        tooltip: null,
        label: "",
        details: {
            minWidth:700,
            minHeight: 600,
            useExtLayout: true
        }
    },
    constructor: function (conf) {
        if (!Ext.isDefined(conf.showLabels))
            conf.showLabels = true;
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);

        this.loadWindow();
        return this;
    },
    loadWindow: function () {
        var me = this;
        this.renderButton({
            handler: function () {
                me.popup.show();
            },
            text: me.config.title,
            icon: me.config.iconUrl,
            tooltip: me.config.tooltip,
            label: me.config.label
        });

        this.container = Ext.create('Ext.container.Container', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            padding: '5px',
            items: this.createForm()

        });
        this.getContentContainer().add(this.container);
    },
    createForm: function () {
        this.form = Ext.create('Ext.form.Panel', {
            flex: 1,
            title: 'Correctievoorstel',
            items: [
                {
                    xtype: 'container',layout:{type:'hbox',pack:"end"},items:[
                        {xtype:'label',text:'1 juli 2018', itemId:'peildatum'}
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, defaults: {margin: '5px',padding: '5px'}, items: [
                        {xtype: 'textfield', value: 'Almelo', editable: false, itemId: 'gemeente'},
                        {xtype: 'textfield', value: 'Turfkade', flex: 1, editable: false, itemId: 'plan'}
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'column'}, defaults: {padding: '5px'}, items:[
                        {xtype: 'combobox',labelAlign:'top', name: 'classificatie', fieldLabel: "Voorgestelde classificatie", value: "Langdurige verhuur", store: this.stores.classificaties},
                        {xtype:'filefield',labelAlign:'top', fieldLabel: "Upload", buttonOnly:true, buttonText:'Upload shp-zip, pdf, ...', itemId:'shp'}
                    ]
                },
                {
                    xtype:"textarea",fieldLabel:"Toelichting", padding: '5px',labelAlign:'top',itemId:"toelichting", anchor:'100%'
                },
                {
                    xtype: 'container', layout: {type: 'hbox'}, items:[
                        {flex: 1, xtype: 'combobox', labelAlign:'top', name: 'status', margin: '5px',padding: '5px', fieldLabel: "Status", value: "Opgeslagen", store: this.stores.status},
                        {flex: 2, xtype:'container', layout:{type: 'hbox', pack: 'end'},defaults: {margin: '5px',padding: '5px'}, items:[
                            {xtype:'textfield', labelAlign:'top', fieldLabel: 'Laatste wijziging gemeente', value:'10-10-2018', itemId:'datumLaatstGewijzigdGemeente'},
                            {xtype:'textfield', labelAlign:'top', fieldLabel: "Naam", value:'PJansen', itemId:'naamLaatstGewijzigdGemeente'}]
                        }
                    ]
                },
                {
                    xtype: 'container', layout: {type: 'hbox', pack:'end'}, defaults: {margin: '5px',padding: '5px'}, items:[
                        {xtype:'textfield', labelAlign:'top', fieldLabel: 'Laatste wijziging provincie', value:'11-10-2018', itemId:'datumLaatstGewijzigdProvincie'},
                        {xtype:'textfield', labelAlign:'top', fieldLabel: "Naam", value:'DvabderVeen', itemId:'naamLaatstGewijzigdProvincie'}
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
    }
});