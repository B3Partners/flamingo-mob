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

/* global Ext, FlamingoAppLoader, actionBeans, i18next */

Ext.define("viewer.components.BedrijventerreinenCorrectievoorstel", {
    extend: "viewer.components.Edit",
    container: null,
    buttonContainer: null,
    stores: {},
    vectorLayer: null,
    appLayer: null,
    agm_id: null,
    ag_id: null,
    meting_id: null,
    gemeente_code: null,
    peildatum_mob: null,
    ingediend: null,
    uitgifteIngevuld: null,
    verwachteUitgifte:null,
    config: {
        layer: null
    },
    constructor: function (conf) {
        if (!Ext.isDefined(conf.showLabels)) {
            conf.showLabels = true;
        }
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);

        viewer.components.BedrijventerreinenBase.defineModels();

        this.geometryEditable = true;
        this.config.allowDelete = true;
        this.appLayer = this.config.viewerController.getAppLayerById(this.config.layer);
        this.layerSelector = {};
        var me = this;
        this.layerSelector.getValue = function () {
            return me.appLayer;
        };
        this.createStores();
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
        this.config.viewerController.mapComponent.getMap().setMarker("correctievoorstel", coords.x, coords.y);
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

        this.reset();
        this.resetForm();
        this.editCorrection(feat);
    },

    editCorrection: function (f) {
        if(!f){
            return;
        }
        this.mode = "edit";
        this.currentFID = f.CV_ID;

        if (f.GEOMETRIE) {
            var feat = Ext.create(viewer.viewercontroller.controller.Feature, {wktgeom: f.GEOMETRIE});
            this.vectorLayer.addFeatures([feat]);
        }
        this.container.show();
        
        var user = FlamingoAppLoader.get("user");
        if(f.MUTATIEDATUM_PROVINCIE){
            f.MUTATIEDATUM_PROVINCIE = Ext.Date.parse(f.MUTATIEDATUM_PROVINCIE, 'd-m-Y H:i:s');
            this.inputContainer.query("#provincie_mutatie")[0].setHtml(Ext.Date.format(f.MUTATIEDATUM_PROVINCIE, "d-m-Y") + " door " + f.MUT_PROVINCIE_DOOR);
        }

        if (f.MUTATIEDATUM_GEMEENTE) {
            f.MUTATIEDATUM_GEMEENTE = Ext.Date.parse(f.MUTATIEDATUM_GEMEENTE, 'd-m-Y H:i:s');
            this.inputContainer.query("#gemeente_mutatie")[0].setHtml(Ext.Date.format(f.MUTATIEDATUM_GEMEENTE, "d-m-Y") + " door " + f.MUT_GEMEENTE_DOOR);
        }
        
        this.inputContainer.getForm().setValues(f);
        if(user.roles.hasOwnProperty("provincie")){
            this.inputContainer.query("#uploadContainer")[0].setVisible (f.hasOwnProperty("BESTANDSNAAM"));
            if(f.hasOwnProperty("BESTANDSNAAM")){
                this.inputContainer.query("#downloadButton")[0].setText("Download " + f["BESTANDSNAAM"]);
            }
        }
        if(user.roles.hasOwnProperty("gemeente")) {
            var uploadContainer = this.inputContainer.query("#uploadContainer")[0];
            if(f.hasOwnProperty("BESTANDSNAAM")){
                uploadContainer.setFieldLabel("Upload (huidig: " + f["BESTANDSNAAM"] + ")");
                Ext.tip.QuickTipManager.unregister(uploadContainer.getId());
                Ext.tip.QuickTipManager.register({
                    target: uploadContainer.getId(),
                    text  : 'Er is al een bestand ge-upload.<br />Huidige bestand: ' + f["BESTANDSNAAM"] + '.<br />U kunt een nieuw een bestand uploaden (het oude bestand wordt overschreven).'
                });
            }else{
                uploadContainer.setFieldLabel("Upload");   
                Ext.tip.QuickTipManager.unregister(uploadContainer.getId());
            }
            this.inputContainer.query("#save-button")[0].setDisabled( f.CORRECTIE_STATUS_ID !== 1);
            this.inputContainer.query("#remove-button")[0].setDisabled( f.CORRECTIE_STATUS_ID !== 1);
        }else{
            this.inputContainer.query("#save-button")[0].setDisabled(false);
        }
    },

    newCorrection: function () {
        this.reset();
        this.resetForm();
        this.mode = "new";
        this.inputContainer.query("#save-button")[0].setDisabled(false);
        this.inputContainer.query("#remove-button")[0].setDisabled(false);
        this.vectorLayer.drawFeature("Polygon");
        this.showDrawingHint(true);
       //var feat = Ext.create(viewer.viewercontroller.controller.Feature, {wktgeom: "POLYGON((223790 504638,228844 508832.16,232661.12 504585,229166 502918,223790 504638))"});
        //this.vectorLayer.addFeatures([feat]);
    },
    reset: function () {
        this.vectorLayer.removeAllFeatures();
        this.inputContainer.reset();
        this.mode = "";
        this.config.viewerController.mapComponent.getMap().removeMarker("correctievoorstel");
        this.showDrawingHint(false);
    },
    showDrawingHint: function(showHint) {
        var hintContainer = this.buttonContainer.query("#draw-message")[0];
        if (!hintContainer) return;
        if (showHint) {
            hintContainer.setHtml("Teken grens en sluit af met dubbelklik");
            hintContainer.setHidden(false);
        } else {
            hintContainer.setHidden(true);
        }
    },
    loadWindow:function() {
        this.createButtons();
        var mask = this.buttonContainer.setLoading("Laden...");
        this.updateMaskLayout(mask);
        viewer.components.BedrijventerreinenBase.initializeEnvironmentVariables(this.layer, this.initComp, this, false);
    },

    updateMaskLayout: function(mask) {
        var maskDom = mask.el.dom;
        if (!maskDom) {
            return;
        }
        var msg = maskDom.querySelector(".x-mask-msg");
        var text = maskDom.querySelector(".x-mask-msg-text");
        if (!msg || !text) {
            return;
        }
        msg.style.height = '100%';
        msg.style.right = 'auto';
        msg.style.top = 'auto';
        text.style.backgroundPosition = "left center";
        text.style.padding = "0 0 0 25px";
        msg.style.left = ((maskDom.clientWidth - msg.clientWidth) / 2) + "px";
    },

    initComp: function () {
        this.formattedPeildatumMob = Ext.Date.format(Ext.Date.parse(this.peildatum_mob, "Y-m-d"), 'd-m-Y');
        this.container = Ext.create('Ext.window.Window', {
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: 600,
            title: 'Correctievoorstel   - Peildatum ' + this.formattedPeildatumMob,
            closeAction: "hide",
            height: 610,
            padding: '5px',
            constrain: true,
            items: this.createForm(),
            defaultAlign: 'tr-tr',
            listeners: {
                scope: this,
                hide: this.reset,
                render: function() {
                    this.poupRendered = true;
                }
            }
        });
        this.resizeListener = this.resize.bind(this);
        window.addEventListener("orientationchange", this.resizeListener);
        window.addEventListener("resize", this.resizeListener);
        Ext.on('resize', this.resizeListener);
        if(this.verwachteUitgifte){
            this.vubutton.setText("Verwachte uitgifte: " + this.verwachteUitgifte + " ha");
        }
        if(this.ingediend){
            this.cvbutton.setDisabled(true);
            this.vubutton.setDisabled(true);
            this.indienbutton.setDisabled(true);            
        }
        this.buttonContainer.setLoading(false);
        this.vectorLayer.addListener(viewer.viewercontroller.controller.Event.ON_FEATURE_ADDED, function () {
            this.container.show();
            this.showDrawingHint(false);
        }, this);
    },
    showAndFocusForm: function(){},
    resize: function() {
        if (!this.poupRendered) {
            return;
        }
        if (this.debounce) window.clearTimeout(this.debounce);
        this.debounce = window.setTimeout((function alignPopup() {
            this.container.alignTo(this.config.viewerController.getWrapperId(), 'tr-tr', [0, 0]);
        }).bind(this), 50);
    },
    createForm: function () { 
        var user = FlamingoAppLoader.get("user");
        var isGemeente = user.roles.hasOwnProperty("gemeente");
        
        var fileField;
        if(isGemeente) {
            fileField = {
                xtype: 'filefield', flex: 1, disabled: false, labelAlign: 'top',
                name: "UPLOAD", fieldLabel: "Upload",
                itemId: "uploadContainer",
                grow:true,
                listeners: {
                        change: function(fld, value) {
                            var newValue = value.replace(/C:\\fakepath\\/g, '');
                            fld.setRawValue(newValue);
                        }
                    },
                buttonText: 'Upload shp-zip, pdf, ...'};
        } else {
            fileField = {
                xtype: "container",
                itemId: "uploadContainer",
                layout:{
                    type: "vbox",
                    align: "stretch"
                },
                items: [
                    {
                        xtype: "label",
                        text: 'Upload gemeente',
                        padding: "6px"
                    },
                    {
                        xtype: "button",
                        text: "Download",
                        itemId: "downloadButton",
                        flex: 1,
                        listeners: {
                            click: function () {
                                var url = actionBeans["mobeditfeature"] + "?downloadAttachment=true&CV_ID=" + this.currentFID + "&appLayer=" + this.layer;
                                window.open(url);
                            },
                            scope:this
                        }
                    }
                ]
            };
        
        }
        
        Ext.define('message', {
            extend: 'Ext.data.Model',
            fields: ['success']
        });

        this.inputContainer = Ext.create('Ext.form.Panel', {
            flex: 1,
            scrollable: true,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'container', layout: { type: 'hbox', align: 'stretch' }, defaults: { padding: '5px' }, items: [
                        {
                            xtype: 'combobox', flex: 1, labelAlign: 'top', allowBlank: false, name: 'CLASSIFICATIE_ID',
                            fieldLabel: "Voorgestelde classificatie", displayField: "CLASSIFICATIE", valueField: "CLS_ID",
                            store: this.stores.classificaties
                        },
                        fileField
                    ]
                },
                {
                    xtype:"hiddenfield",
                    name: "AGM_ID"
                },
                {
                    xtype: "textarea",
                    name: "TOELICHTING",
                    fieldLabel: "Toelichting",
                    allowBlank: false,
                    padding: '5px',
                    margin: '0 5px',
                    labelAlign: 'top',
                    itemId: "toelichting",
                    flex: 1,
                    minHeight: 300,
                    listeners: {
                        afterrender: function(a){
                            a.focus();
                            var b = document.getElementById(a.inputId);
                            setTimeout(function(){ b.scrollTop = 99999; }, 10);
                        },
                        scope:this
                    }
                },
                {
                    xtype: 'container', layout: { type: 'hbox', align: "stretch" }, padding: '0 0 8 0', items: [
                        { width: 150, xtype: 'combobox', labelAlign: 'top', readOnly: isGemeente, name: 'CORRECTIE_STATUS_ID', margin: '0 5px', padding: '5px', fieldLabel: "Status", value: 1, displayField: "CORRECTIE_STATUS", valueField: "CS_ID", store: this.stores.statussen},
                        { flex: 1, xtype: 'container', layout: { type: 'hbox', align: "stretch" }, padding: '8 0 0 10', items: [
                            this.getMutatieLayout("gemeente"),
                            this.getMutatieLayout("provincie")
                        ]}
                    ]
                }
            ],
            bbar: [
                {xtype: 'button', text: 'Opslaan', itemId: 'save-button', scope: this, handler: function () {
                        this.save();
                    }},
                {xtype: 'button', text: 'Verwijderen', itemId: 'remove-button', scope: this, handler: function () {
                        Ext.MessageBox.show({
                            title: 'Weet u het zeker?',
                            message: 'Weet u zeker dat u wilt verwijderen?',
                            buttons: Ext.Msg.YESNO,
                            icon: Ext.Msg.QUESTION,
                            scope: this,
                            fn: function (btn) {
                                if (btn === 'yes') {
                                    this.remove();
                                }
                            }
                        });
                    }},
                {xtype: 'button', text: 'Annuleren', scope: this, handler: function () {
                    this.container.hide();
                    this.reset();
                }}
            ],
            reader: new Ext.data.reader.Xml({ rootNode:'message', model:"message", record : 'field', success: '@success' }),
            errorReader: new Ext.data.reader.Xml({
                    record : 'field',
                    success: '@success',
                    model:'message'
                }, [
                    'id', 'msg'
                ]
            )
        });
        return this.inputContainer;
    },
    getMutatieLayout: function(type) {
        var fieldProps = { datumName: 'MUTATIEDATUM_GEMEENTE', itemId: 'gemeente_mutatie', label: 'Laatste wijziging gemeente', doorName: 'MUT_GEMEENTE_DOOR' };
        if (type === "provincie") {
            fieldProps = { datumName: 'MUTATIEDATUM_PROVINCIE', itemId: 'provincie_mutatie', label: 'Laatste wijziging provincie', doorName: 'MUT_PROVINCIE_DOOR' };
        }
        return {
            xtype: 'container',
            flex: 1,
            layout: { type: 'vbox', align: 'stretch' },
            items: [
                { xtype: 'container', html: fieldProps.label },
                { xtype: 'container', itemId: fieldProps.itemId, html: '', padding: '3 0 0 0' },
                {
                    xtype: 'datefield',
                    readOnly: true,
                    hidden:true,
                    format: 'd-m-Y',
                    altFormats: 'd-m-Y|d-m-Y H:i:s',
                    submitFormat: 'c',
                    name: fieldProps.datumName
                },
                {
                    xtype: 'hidden',
                    readOnly: true,
                    name: fieldProps.doorName
                }
            ]
        };
    },
    resetForm: function(){
        var uploadContainer = this.inputContainer.query("#uploadContainer")[0];
        Ext.tip.QuickTipManager.unregister(uploadContainer.getId());
        this.inputContainer.query('#gemeente_mutatie')[0].setHtml('')
        this.inputContainer.query('#provincie_mutatie')[0].setHtml('')
        this.container.hide();
        if(uploadContainer && uploadContainer.setFieldLabel){
            uploadContainer.setFieldLabel("Upload");
        }
    },
    createButtons: function () {
        var buttons = [];
        var user = FlamingoAppLoader.get("user");
        if(user) {
            var isGemeente = user.roles.hasOwnProperty("gemeente");
            if (isGemeente) {
                this.cvbutton = Ext.create('Ext.Button', {
                    text: 'Correctievoorstel',
                    disabled: this.ingediend,
                    tooltip: "Een correctievoorstel aanmaken",
                    listeners: {
                        scope: this,
                        click: this.newCorrection
                    }
                });
                this.vubutton = Ext.create('Ext.Button', {
                    text: 'Verwachte uitgifte',
                    disabled: this.ingediend,
                    tooltip: "Verwachte uitgifte voor het volgende half jaar (vanaf peildatum meting) opgeven.",
                    listeners: {
                        scope: this,
                        click: this.showExpectedAllotmentWindow
                    }
                });

                this.indienbutton = Ext.create('Ext.Button', {
                    text: 'Indienen',
                    disabled: this.ingediend,
                    tooltip: "Alle correctievoorstellen en verwachte uitgifte indienen.",
                    listeners: {
                        click: this.confirmSubmitCorrections,
                        scope: this
                    }
                });

                buttons.push(this.cvbutton);
                buttons.push(this.vubutton);
                buttons.push(this.indienbutton);
            }
            this.buttonContainer = Ext.create('Ext.container.Container', {
                renderTo: Ext.get(this.config.viewerController.getMapId()),
                floating: true,
                shadow: false,
                style: {
                    zIndex: 1002,
                    padding: 5,
                    backgroundColor: "#FFFFFF",
                    borderColor: "#5FA2DD",
                    borderStyle: "solid",
            //        width: '501px'

                },
                border: 2,
                layout: {

                    align: 'stretch',
                 //   width: '502px'
                },
                items: [
                    {xtype: 'container', items: buttons, border: false, defaults: {margin: '5px'},
                        style: {fontWeight: 'bold'}},
                    {
                        xtype: 'container',
                        itemId: 'draw-message',
                        margin: '8 5 5 5',
                        html: '',
                        hidden: true,
                        style: {fontWeight: 'bold'}
                    }
                ]
            });
            this.alignButtons();
        }else{
            Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "U moet eerst inloggen.");
        }
    },
    alignButtons: function () {
        if (!this.buttonContainer) {
            return;
        }
        var pos = [-80, 5];
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
    save: function(){
        var f =  this.inputContainer.getValues();
        var feature = this.changeFeatureBeforeSave(f);
        
        if (this.vectorLayer.getActiveFeature()) {
            var wkt = this.vectorLayer.getActiveFeature().config.wktgeom;
            feature[this.appLayer.geometryAttribute] = wkt;
        }
        if (this.mode === "edit") {
            feature.__fid = this.currentFID;
        }
        
        this.inputContainer.submit({
            url: actionBeans["mobeditfeature"] + "?editFeature=true",
            waitMsg: 'Correctievoorstel opslaan',
            scope: this,
            params:{
                meting: Ext.JSON.encode(feature),
                application: this.config.viewerController.app.id,
                appLayer: this.config.viewerController.getLayer(this.layerSelector.getValue()).getId()
            },
            success: this.saveSucces,
            error: function(){
                alert("error saving");
            }
        });
    },
    changeFeatureBeforeSave: function (f) {
        f.AGM_ID = this.agm_id ? this.agm_id : f.AGM_ID;
        
        var user = FlamingoAppLoader.get("user");
        if (user.roles.hasOwnProperty("gemeente")) {
            f.MUT_GEMEENTE_DOOR = user.name ;

            f.MUTATIEDATUM_GEMEENTE = Ext.Date.format(new Date(), 'd-m-Y');
        }else{
            f.MUTATIEDATUM_GEMEENTE = Ext.Date.format(new Date(f.MUTATIEDATUM_GEMEENTE), 'd-m-Y');
        }

        if (user.roles.hasOwnProperty("provincie")) {
            f.MUT_PROVINCIE_DOOR = user.name;
            f.MUTATIEDATUM_PROVINCIE = Ext.Date.format(new Date(), 'd-m-Y');
        }else{
            if(f.MUTATIEDATUM_PROVINCIE){
                f.MUTATIEDATUM_PROVINCIE = Ext.Date.format(new Date(f.MUTATIEDATUM_PROVINCIE), 'd-m-Y');
            }
        }
        
        return f;
    },
    getEditFeature: function () {
        return Ext.create("viewer.EditFeature", {
            viewerController: this.config.viewerController,
            actionbeanUrl: actionBeans["mobeditfeature"] + "?editFeature=true"
        });
    },
    saveSucces: function () {
        this.reset();
        this.resetForm();
        this.config.viewerController.getLayer(this.config.viewerController.getAppLayerById(this.layer)).reload();
    },
    showExpectedAllotmentWindow: function() {
        var uitgifteWindow = Ext.create('Ext.window.Window', {
            title: 'Invoeren verwachte uitgifte',
            height: 200,
            modal: true,
            width: 700,
            items: [
                {
                    xtype: 'label',
                    text: 'Vul hier in wat de verwachte uitgifte is voor het komende half jaar gerekend vanaf ' + this.formattedPeildatumMob + '. Een kavel is uitgegeven als de koopakte is gepasseerd bij de notaris. Het gaat hierbij alleen om kavels die in de afspraken zitten.'
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: 'Verwachte uitgifte (hectare)',
                    itemId: 'uitgifte',
                    decimalSeparator: ",",
                    labelWidth: 200,
                    value: this.verwachteUitgifte || ""
                }
            ],
            bbar: [
                {
                    xtype: 'button',
                    text: 'Opslaan',
                    itemId: 'save-button',
                    listeners: {
                        scope: this,
                        click: function (btn) {
                            var allotment = ""+ uitgifteWindow.query("#uitgifte")[0].getValue();
                            if (allotment) {
                                this.verwachteUitgifte = allotment;
                                allotment = allotment.replace(".",",");
                                this.submitExpectedAllotment(allotment, uitgifteWindow);
                            } else {
                                Ext.MessageBox.alert("Fout", "Hoeveelheid hectare is niet ingevuld.");
                            }
                        }
                    }
                }
            ]
        });
        uitgifteWindow.show();
    },
    
    submitExpectedAllotment: function(allotment, uitgifteWindow) {
        Ext.Ajax.request({
            url: actionBeans["mobeditfeature"],
            scope: this,
            params: {
                submitExpectedAllotment: true,
                uitgifte: allotment,
                AGM_ID: this.agm_id,
                appLayer: this.layer
            },
            success: function (result) {
                var response = Ext.JSON.decode(result.responseText);
                if (response.success) {
                    this.vubutton.setText("Verwachte uitgifte: " + allotment + " ha");
                    this.uitgifteIngevuld = true;
                } else {
                    Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "Het indienen van de verwachte uitgifte is mislukt. " + response.message);
                }
                uitgifteWindow.hide();
            },
            failure: function (result) {
                Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "Het indienen van de verwachte uitgifte is mislukt. " + result.message);
                uitgifteWindow.hide();
            }
        });
    },
    confirmSubmitCorrections: function() {
        if(!this.uitgifteIngevuld){
            Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "Vul eerst de verwachte uitgifte in.");
        } else {
            Ext.MessageBox.show({
                title: 'Weet u het zeker?',
                message: 'weet u zeker dat u alle opgeslagen correctievoorstellen en de verwachte uitgifte wilt indienen?',
                buttons: Ext.Msg.YESNO,
                icon: Ext.Msg.QUESTION,
                scope: this,
                fn: function (btn) {
                    if (btn === 'yes') {
                        Ext.Ajax.request({
                            url: actionBeans["mobeditfeature"],
                            scope: this,
                            params: {
                                submitCorrections: true,
                                AGM_ID: this.agm_id,
                                appLayer: this.layer
                            },
                            success: function (result) {
                                var response = Ext.JSON.decode(result.responseText);
                                if (response.success) {
                                    this.ingediend = true;
                                    this.cvbutton.setDisabled(true);
                                    this.vubutton.setDisabled(true);
                                    this.indienbutton.setDisabled(true);
                                    Ext.MessageBox.alert(i18next.t('viewer_components_edit_40'), "Correctievoorstellen ingediend.");
                                } else {
                                    Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "Het indienen van de correctievoorstellen is mislukt. " + response.message);
                                }
                            },
                            failure: function (result) {
                                Ext.MessageBox.alert(i18next.t('viewer_components_edit_20'), "Het indienen van de correctievoorstellen is mislukt. " + result.message);
                            }
                        });
                    }
                }
            });
        }
    },
    getExtComponents: function () {
        if (this.container) {
            return [ this.container.getId() ];
        }
        return [];
    }
});
