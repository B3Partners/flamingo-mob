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
/* global Ext, actionBeans, FlamingoAppLoader */

/**
 * Bedrijventerreinen component
 * @author <a href="mailto:geertplaisier@b3partners.nl">Geert Plaisier</a>
 */
Ext.define ("viewer.components.BedrijventerreinenIbisgegevens", {
    extend: "viewer.components.Component",
    agm_id: null,
    meting_id: null,
    gemeente_code: null,
    bedrijventerrein: null,
    bedrijventerreinen: null,
    disabled: false,
    stores: {},
    storesLoading: 0,
    windowLoaded: false,
    isEditing: false,
    config: {
        title: null,
        titlebarIcon: null,
        tooltip: null,
        label: "",
        layer: null,
        helpUrl: null,
        details: {
            minWidth: 700,
            minHeight: 400,
            useExtLayout: true
        }
    },
    constructor: function (conf) {
        if(!Ext.isDefined(conf.showLabels)) conf.showLabels = true; 
        this.initConfig(conf);
        viewer.components.BedrijventerreinenIbisgegevens.superclass.constructor.call(this, this.config);
        viewer.components.BedrijventerreinenBase.defineModels();
        this.loadWindow();
        this.container.setLoading("Bezig met laden...");
        viewer.components.BedrijventerreinenBase.initializeEnvironmentVariables(conf.layer, this.initialize, this);
        return this;
    },
    initialize: function() {
        this.bedrijventerreinen = this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Bedrijventerreinen', "BEDRIJVENTERREINEN", "", true);
        this.bedrijventerreinen.load({
            scope: this,
            callback: function (records, operation, success) {
                // Create stores triggers load events. When all stores are loaded, storesLoaded() will be executed
                this.createStores();
            }
        });
        var css = [
            '.bedrijventerreinen-editable::before {',
                'content: "\\f044";',
                'font-family: FontAwesome !important;',
                'font-size: 20px;',
                'line-height: 20px;',
                'position: absolute;',
                'margin-top: 7px;',
                'margin-left: 10px;',
                'color: #CCCCCC;',
            '}',
            '.is-disabled .bedrijventerreinen-editable::before { content: ""; }'
        ];
        Ext.util.CSS.createStyleSheet(css.join(" "), "bedrijventerreinen");
    },
    loadWindow: function() {
        var me = this;
        this.renderButton({
            handler: function(){
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
            items: []
        });
        this.getContentContainer().add(this.container);
    },
    storesLoaded: function() {
        if (this.storesLoading > 0 || this.windowLoaded) {
            return;
        }
        // Get selected values for 'Gemeente' and 'Peildatum'
        this.renderContent();
    },
    renderContent: function() {
        this.windowLoaded = true;
        this.container.add(this.createFilterContainer());
        this.container.add(this.createTabForm());
        this.filterBedrijventerreinen();
        this.createTooltips();
        this.container.setLoading(false);
        this.setDisabled(true);
    },
    createTabForm: function() {
        this.form = Ext.create('Ext.tab.Panel', {
            flex: 1,
            plain: true,
            items: [
                this.createAlgemeenForm(),
                this.createBereikbaarheidForm(),
                this.createOppervlakteForm()
            ],
            hideMode: 'offsets',
            defaults: {
                scrollable: true,
                padding: 10
            },
            bbar: [
                { xtype: 'container', itemId: 'edit-indicator' },
                '->',
                { xtype: 'button', text: 'Opslaan', itemId: 'save-button', disabled:this.ibisIngediend, scope: this, handler: function() { this.save(); } },
                { xtype: 'button', text: 'Annuleren', itemId:'cancel-button', disabled:this.ibisIngediend, scope: this, handler: function() { this.updateForms(); } },
                '-',
                { xtype: 'button', text: 'Help', href: this.config.helpUrl }
            ]
        });
        return this.form;
    },
    createAlgemeenForm: function() {
        this.algemeenForm = Ext.create('Ext.form.Panel', {
            title: 'Algemeen en financieel',
            itemId: 'tab-algemeen',
            defaultType: 'textfield',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                labelAlign: 'left',
                labelWidth: 175,
                maxWidth: 500,
                listeners: {
                    scope: this,
                    change: function() {
                        this.showEditing(true);
                    }
                }
            },
            items: [
                { xtype: 'container', itemId: 'algemeen-errors' },
                { fieldLabel: "Kernnaam", name: 'KERN_NAAM' },
                { xtype: 'combobox', editable: false, name: 'PLAN_FASE_CODE', fieldLabel: "Planfase",  queryMode: 'local',
                    store: this.stores.planfase, displayField: 'PLAN_FASE_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, name: 'GEM_CODE_CBS', fieldLabel: "Terreinbeheerder", queryMode: 'local',
                    store: this.stores.terreinbeheerder, displayField: 'GEMEENTE_NAAM', valueField: 'GEM_CODE_CBS' },
                this.createColumnForm(
                    { xtype: 'combobox', editable: false, name: 'WERKLOCATIE_TYPE_CODE', fieldLabel: "Werklocatietype", queryMode: 'local',
                        store: this.stores.werklocatietype, displayField: 'WERKLOCATIE_TYPE_OMSCHR', valueField: 'CODE' },
                    { xtype: 'combobox', editable: false, queryMode: 'local', name: 'IND_PARK_MANAGEMENT', fieldLabel: "Park management", store: this.stores.parkmanagement, grow: true }
                ),
                this.createColumnForm(
                    { xtype: 'combobox', editable: false, queryMode: 'local', name: 'IND_MILIEUZONERING', fieldLabel: "Milieuzonering", store: this.stores.milieuzonering, grow: true },
                    { xtype: 'combobox', editable: false, queryMode: 'local', name: 'MAX_MILEUCATEGORIE_CODE', fieldLabel: "Maximale milieucategorie", grow: true,
                        store: this.stores.maximale_milieucategorie, displayField: 'MILIECATEGORIE_NAAM', valueField: 'CODE' }
                ),
                this.createColumnForm(
                    { xtype: 'textfield', name: 'START_JAAR', fieldLabel: "Startjaar uitgifte" },
                    { xtype: 'textfield', name: 'JAAR_NIET_TERSTOND_UITG_GEM', fieldLabel: "Beoogd jaar niet terstond uitgeefbaar" }
                ),
                {
                    xtype: 'gridpanel',
                    viewConfig: {
                        markDirty: false
                    },
                    header: false,
                    store: this.stores.prijzen,
                    itemId: 'prijzen-grid',
                    listeners: {
                        scope: this,
                        beforeselect: function() {
                            return false;
                        }
                    },
                    plugins: {
                        ptype: 'cellediting',
                        clicksToEdit: 1,
                        listeners: {
                            scope: this,
                            edit: function() {
                                this.showEditing(true);
                            },
                            beforeedit: function(editor, context) {
                                return !this.disabled;
                            }
                        }
                    },
                    selModel: 'cellmodel',
                    columns: [
                        { header: 'Prijzen in euro\'s', dataIndex: 'label', flex: 1 },
                        {
                            header: 'Min',
                            dataIndex: 'min',
                            editor: 'textfield',
                            flex: .5,
                            align: 'end',
                            scope: this,
                            renderer: function (value, metaData, record) {
                                if (!this.disabled) {
                                    metaData.tdCls = "bedrijventerreinen-editable";
                                }
                                metaData.tdAttr = Ext.String.format('data-qtip="Minimum {0}"', record.data.tt );
                                return value;
                            }
                        },
                        {
                            header: 'Max',
                            dataIndex: 'max',
                            editor: 'textfield',
                            flex: .5,
                            align: 'end',
                            scope: this,
                            renderer: function (value, metaData, record) {
                                if (!this.disabled) {
                                    metaData.tdCls = "bedrijventerreinen-editable";
                                }
                                metaData.tdAttr = Ext.String.format('data-qtip="Maximum {0}"', record.data.tt );
                                return value;
                            }
                        }
                    ],
                    margin: '0 0 10 0'
                },
                {
                    xtype: 'gridpanel',
                    viewConfig: {
                        markDirty: false
                    },
                    listeners: {
                        scope: this,
                        beforeselect: function() {
                            return false;
                        }
                    },
                    header: false,
                    store: this.stores.mutaties,
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        { header: 'Datum', dataIndex: 'datum', flex: 1 },
                        { header: 'Door', dataIndex: 'bewerker', flex: 1 }
                    ]
                },
                { xtype: 'textarea', name: 'OPMERKING_TBV_IBIS', grow: true, growMax: 300, growMin: 100, fieldLabel: 'Opmerkingen', labelAlign: 'top' }
            ]
        });
        return this.algemeenForm;
    },
    createBereikbaarheidForm: function() {
        this.bereikbaarheidForm = Ext.create('Ext.form.Panel', {
            title: 'Bereikbaarheid en herstructurering',
            itemId: 'tab-bereikbaarheid',
            defaultType: 'textfield',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                labelAlign: 'left',
                labelWidth: 175,
                maxWidth: 500,
                listeners: {
                    scope: this,
                    change: function(field) {
                        this.showEditing(true);
                        if (field.getName() === "IND_VEROUDERD" && field.getValue() === "Nee") {
                            this.bereikbaarheidForm.getForm().setValues({
                                "BRUTO_OPP_VEROUDERD": "",
                                "HOOFDOORZAAK_VEROUD_CODE": ""
                            });
                        }
                        if (field.getName() === "HERSTRUCT_PLAN_TYPE_CODE" && (field.getValue() === "N" || field.getValue() === "X")) {
                            this.bereikbaarheidForm.getForm().setValues({
                                "HERSTRUCT_FASE_CODE": "",
                                "OPP_FACELIFT": "",
                                "OPP_REVITALISATIE": "",
                                "OPP_ZWARE_REVITALISATIE": "",
                                "OPP_HERPROFILERING": "",
                                "OPP_TRANSFORMATIE": ""
                            });
                        }
                    }
                }
            },
            items: [
                { xtype: 'container', itemId: 'bereikbaarheid-errors' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'SPOOR_ONTSLUITING_CODE', fieldLabel: 'Ontsluiting spoor',
                    store: this.stores.ontsluiting_spoor, displayField: 'SPOOR_ONTSLUITING_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'WATER_ONTSLUITING_CODE', fieldLabel: 'Ontsluiting water',
                    store: this.stores.ontsluiting_water, displayField: 'WATER_ONTSLUITING_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'EXT_BEREIKBAARHEID_CODE', fieldLabel: 'Externe bereikbaarheid',
                    store: this.stores.externe_bereikbaarheid, displayField: 'EXT_BEREIKBAARHEID_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'PARKEERGELEGENHED_CODE', fieldLabel: 'Parkeergelegenheid',
                    store: this.stores.parkeergelegenheid, displayField: 'PARKEERGELEGENHEID_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'IND_VEROUDERD', fieldLabel: 'Verouderd', store: this.stores.verouderd, grow: true },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'HOOFDOORZAAK_VEROUD_CODE', fieldLabel: 'Hoofdoorzaak veroudering',
                    store: this.stores.hoofdoorzaak_veroudering, displayField: 'HOOFDOORZAAK_VEROUD_NAAM', valueField: 'CODE' },
                { fieldLabel: 'Bruto ha verouderd', name: 'BRUTO_OPP_VEROUDERD', value: '', maxWidth: 275 },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'HERSTRUCT_PLAN_TYPE_CODE', fieldLabel: 'Herstructereringsplan',
                    store: this.stores.herstructereringsplan, displayField: 'HERSTRUCT_PLAN_TYPE_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'HERSTRUCT_FASE_CODE', fieldLabel: 'Herstructereringsfase',
                    store: this.stores.herstructereringsfase, displayField: 'HERSTRUCT_FASE_NAAM', valueField: 'CODE' },
                { fieldLabel: 'Facelift (ha)', name: 'OPP_FACELIFT', value: '', maxWidth: 275 },
                { fieldLabel: 'Revitalisatie (ha)', name: 'OPP_REVITALISATIE', value: '', maxWidth: 275 },
                { fieldLabel: 'Zware revitalisatie (ha)', name: 'OPP_ZWARE_REVITALISATIE', value: '', maxWidth: 275 },
                { fieldLabel: 'Herprofilering (ha)', name: 'OPP_HERPROFILERING', value: '', maxWidth: 275 },
                { fieldLabel: 'Transformatie (ha)', name: 'OPP_TRANSFORMATIE', value: '', maxWidth: 275 }
            ]
        });
        return this.bereikbaarheidForm;
    },
    createOppervlakteForm: function() {
        this.oppervlakteForm = Ext.create('Ext.form.Panel', {
            title: 'Oppervlakte',
            itemId: 'tab-oppervlakte',
            defaultType: 'textfield',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                labelAlign: 'left',
                labelWidth: 175,
                maxWidth: 500,
                listeners: {
                    scope: this,
                    change: function() {
                        this.showEditing(true);
                    }
                }
            },
            items: [
                { xtype: 'container', itemId: 'oppervlak-errors' },
                { xtype: 'combobox', editable: false, queryMode: 'local', name: 'IND_VOL', fieldLabel: 'Vol', readOnly: true, store: this.stores.indicatie_vol },
                {
                    xtype: 'gridpanel',
                    viewConfig: {
                        markDirty: false
                    },
                    itemId: 'oppervlak-grid',
                    header: false,
                    store: this.stores.oppervlak,
                    listeners: {
                        scope: this,
                        beforeselect: function() {
                            return false;
                        }
                    },
                    plugins: {
                        ptype: 'cellediting',
                        clicksToEdit: 1,
                        listeners: {
                            scope: this,
                            edit: function() {
                                this.showEditing(true);
                            },
                            beforeedit: function(editor, context) {
                                if (this.disabled) {
                                    return false;
                                }
                                return context.record.get("editable") || false;
                            }
                        }
                    },
                    selModel: 'cellmodel',
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        {
                            header: 'Oppervlak',
                            dataIndex: 'oppervlak',
                            editor: 'textfield',
                            flex: 1,
                            align: 'end',
                            scope: this,
                            renderer: function (value, metaData, record) {
                                if (!this.disabled && record.get("editable")) {
                                    metaData.tdCls = "bedrijventerreinen-editable";
                                }
                                metaData.tdAttr = Ext.String.format('data-qtip="{0}"', record.data.tt);
                                return value;
                            }
                        }
                    ],
                    margin: '0 0 10 0'
                    },
                {
                    xtype: 'gridpanel',
                    viewConfig: {
                        markDirty: false
                    },
                    listeners: {
                        scope: this,
                        beforeselect: function() {
                            return false;
                        }
                    },
                    header: false,
                    store: this.stores.uitgeefbaar,
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        { header: 'Gemeente', dataIndex: 'overheid', flex: .5, align: 'end',
                            renderer: function (value, metaData, record) {
                                metaData.tdAttr = Ext.String.format('data-qtip="{0} {1}"', record.data.tt, "gemeentelijk eigendom (in ha).");
                                return value;
                            } },
                        { header: 'Particulier', dataIndex: 'particulier', flex: .5, align: 'end',
                            renderer: function (value, metaData, record) {
                                metaData.tdAttr = Ext.String.format('data-qtip="{0} {1}"', record.data.tt, "particulier eigendom (in ha).");
                                return value;
                            } }
                    ],
                    margin: '0 0 10 0'
                },
                { xtype: 'container', html: '(Alle oppervlaktes in ha en afgeleid uit MOB)' }
            ]
        });
        return this.oppervlakteForm;
    },
    createFilterContainer: function() {
        var user = FlamingoAppLoader.get("user");
        var isProvincieUser = user.roles.hasOwnProperty("provincie");
        var container = Ext.create('Ext.panel.Panel', {
            width: 225,
            plain: true,
            border: 0,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: '0 0 10 0',
            bodyStyle: { borderWidth: '0 0 0 0' },
            defaults: {
                padding: '0 10 0 10'
            },
            items: [
                {
                    xtype: 'combobox',
                    editable: false,
                    queryMode: 'local',
                    labelAlign: 'top',
                    fieldLabel: 'Gemeente',
                    itemId: 'gemeente',
                    store: this.stores.gemeentes,
                    displayField: 'GEMEENTE_NAAM',
                    valueField: 'GEM_CODE_CBS',
                    value: this.gemeente_code,
                    readOnly: !isProvincieUser,
                    listeners: {
                        scope: this,
                        change: function(combo, value) {
                            this.filterBedrijventerreinen(value, null);
                        }
                    }
                },
                {
                    xtype: 'combobox',
                    editable: false,
                    queryMode: 'local',
                    labelAlign: 'left',
                    labelWidth: 75,
                    fieldLabel: 'Peildatum',
                    itemId: 'peildatum',
                    valueField: 'MTG_ID',
                    displayField: 'PEILDATUM_LABEL',
                    store: this.stores.peildatums,
                    value: this.meting_id,
                    readOnly: true,
                    listeners: {
                        scope: this,
                        change: function(combo, value) {
                            this.filterBedrijventerreinen(null, value);
                        }
                    }
                },
                {
                    xtype: 'gridpanel',
                    flex: 1,
                    store: this.stores.bedrijventerreinen,
                    itemId: 'bedrijventerreinen-grid',
                    columns: [
                        { text: 'Bedrijventerrein', dataIndex: 'BEDRIJVENTERREIN_LABEL', flex: 1 }
                    ],
                    header: false,
                    hideHeaders: true,
                    viewConfig: {
                        markDirty: false
                    },
                    listeners: {
                        scope: this,
                        beforeselect: function(selectionModel, record) {
                            if (this.isEditing) {
                                Ext.MessageBox.show({
                                    title: 'U heeft nog niet opgeslagen',
                                    message: Ext.String.format('U hebt gemaakte wijzigingen in {0} nog niet opgeslagen', this.bedrijventerrein.get("BEDRIJVENTERREIN_LABEL")),
                                    buttons: Ext.Msg.OK,
                                    icon: Ext.Msg.INFO
                                });
                                return false;
                            }
                            return true;
                        },
                        select: function(grid, record) {
                            this.updateSelection(record);
                        }
                    }
                }
            ],
            dockedItems: isProvincieUser || this.ibisIngediend ? [] : [{
                xtype: 'toolbar',
                dock: 'bottom',
                style: 'border-width: 1px 0 1px 1px !important;',
                items: [
                    { xtype: 'button', text: 'Indienen', tooltip:"Wijzigingen van alle bedrijventerreinen indienen.", itemId:'indien-button', flex: 1, scope: this, handler: this.submitConfirm }
                ]
            }]
        });
        return container;
    },
    createTooltips: function () {
        Ext.QuickTips.init();
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=KERN_NAAM]")[0].getEl(), text: "Naam van de woonkern volgens de woonplaatsenlijst waarin of waarbij de werklocatie gelegen is."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=PLAN_FASE_CODE]")[0].getEl(), text: "Naam van de woonkern volgens de woonplaatsenlijst waarin of waarbij de werklocatie gelegen is."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=GEM_CODE_CBS]")[0].getEl(), text: "Beheerder van het bedrijventerrein."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=WERKLOCATIE_TYPE_CODE]")[0].getEl(), text: "Terrein dat vanwege zijn bestemming bestemd en geschikt is voor gebruik door handel, nijverheid, commerciële en niet-commerciële dienstverlening en industrie."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=IND_PARK_MANAGEMENT]")[0].getEl(), text: "Aanwezigheid (score wel of niet) van een (gezamenlijke) beheerorganisatie."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=IND_MILIEUZONERING]")[0].getEl(), text: "Indien de gemeente in het kader van de vaststelling of herziening van een bestemmingsplan besluit om op een werklocatie zogenaamde grote lawaaimakers toe te laten, moet een geluidzone rond de werklocatie worden vastgesteld."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=MAX_MILEUCATEGORIE_CODE]")[0].getEl(), text: "De maximaal toegestane milieucategorie volgens de indeling in 'Bedrijven en Milieuzonering' (editie 2009)."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=START_JAAR]")[0].getEl(), text: "Het jaar waarop de eerste kavel op de werklocatie verkocht of in erfpacht uitgegeven is."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=JAAR_NIET_TERSTOND_UITG_GEM]")[0].getEl(), text: "Bij zachte plannen: wat is het beoogde jaar dat de gronden bouwrijp zijn?"});

        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=SPOOR_ONTSLUITING_CODE]")[0].getEl(), text: "Wordt de werklocatie, naast ontsluiting via de weg, ook ontsloten door spoor?"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=WATER_ONTSLUITING_CODE]")[0].getEl(), text: "Wordt de werklocatie, naast ontsluiting via de weg, ook ontsloten door water?"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=EXT_BEREIKBAARHEID_CODE]")[0].getEl(), text: "Indicatoren zijn filedruk en de afstand tot de snelweg."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=PARKEERGELEGENHED_CODE]")[0].getEl(), text: "Indicator is de infrastructuur, vanwege eenduidig en algemene onderschreven belang van deze indicator als maat voor interne bereikbaarheid. Het gaat hierbij om handvatten om zo goed mogelijk de bereikbaarheid te objectiveren."});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=IND_VEROUDERD]")[0].getEl(), text: "Is (een deel van) de werklocatie verouderd?"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=HOOFDOORZAAK_VEROUD_CODE]")[0].getEl(), text: "Wat is de hoofdoorzaak van de veroudering? (type veroudering)"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=BRUTO_OPP_VEROUDERD]")[0].getEl(), text: "Wat is het bruto oppervlak van de veroudering?"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=HERSTRUCT_PLAN_TYPE_CODE]")[0].getEl(), text: "Is er een herstructureringsplan?"});
        Ext.QuickTips.register({target: Ext.ComponentQuery.query("[name=HERSTRUCT_FASE_CODE]")[0].getEl(), text: "In welke fase bevindt het herstructureringsplan zich?"});
        
        
    },
    filterBedrijventerreinen: function(gemeente, peildatum) {
        if (gemeente) this.gemeente_code = gemeente;
        if (peildatum) this.meting_id = peildatum;
        if (this.gemeente_code !== null && this.meting_id !== null) {
            this.stores.bedrijventerreinen.getProxy().setExtraParam('GEM_CODE_CBS', this.gemeente_code);
            this.stores.bedrijventerreinen.getProxy().setExtraParam('METING_ID', this.meting_id);
            this.stores.bedrijventerreinen.load();
        }
    },
    createColumnForm: function() {
        var items = Array.prototype.slice.call(arguments);
        var itemsConf = Ext.Array.map(items, function(item, idx) {
            var conf = {
                xtype: 'fieldcontainer',
                flex: 1,
                defaults: {
                    labelAlign: 'top',
                    listeners: {
                        scope: this,
                        change: function() {
                            this.showEditing(true);
                        }
                    }
                },
                layout: { type: 'hbox', pack: 'start' },
                items: [ item ],
                padding: '0 10 0 0'
            };
            if (idx === 1 && items.length === 2) {
                // For two-col forms align the last item to the right
                return Ext.Object.merge({}, conf, { layout: { pack: 'end' }, padding: '0 0 0 10' });
            }
            return conf;
        }, this);
        var cols = {
            xtype: 'fieldcontainer',
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            width: null,
            items: itemsConf
        };
        return cols;
    },
    createLabel: function(str) {
        return { xtype: 'container', html: str };
    },
    createStores: function() {
        var gemeenteStore = this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Gemeenten', "GEMEENTEN");
        var peildatumsStore = this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Metingen', "METINGEN");
        var bedrijventerreinenMetingenStore = this.createDefaultMobAjaxStore(
            'Bedrijventerreinen.model.BedrijventerreinenMetingen',
            'metingen',
            'metingen',
            true
        );
        var sorters = bedrijventerreinenMetingenStore.getSorters();
        sorters.add("BEDRIJVENTERREIN_LABEL");
        bedrijventerreinenMetingenStore.on("load", function(store, records) {
            for(var i = 0; i < records.length; i++) {
                var terrein = this.bedrijventerreinen.findRecord("RIN_NUMMER", records[i].get("RIN_NUMMER"));
                if (terrein === null) {
                    continue;
                }
                records[i].set('BEDRIJVENTERREIN_LABEL', terrein.get("PLAN_NAAM"));
                records[i].set('BEDRIJVENTERREIN', terrein);
            }
        }, this);
        var prijzenStore = Ext.create('Ext.data.Store', {
            fields: [
                { 'name': 'id' },
                { 'name': 'label' },
                { 'name': 'min', 'type': 'number' },
                { 'name': 'max', 'type': 'number' }
            ],
            data: [
                { id: 'verkoopprijs', label: 'Verkoopprijs', min: '', max: '', tt:"verkoopprijs grond per m² (in € exclusief BTW)." },
                { id: 'erfpachtprijs', label: 'Erfpachtprijs', min: '', max: '', tt:" erfpachtprijs grond per m² (in € exclusief BTW)." }
            ]
        });
        var mutationStore = Ext.create('Ext.data.Store', {
            fields: [ 'label', 'datum', 'bewerker' ],
            data: [
                { id: 'gemeente', label: 'Gemeente', datum: '', bewerker: '' },
                { id: 'provincie', label: 'Provincie', datum: '', bewerker: '' }
            ]
        });
        var oppervlakStore = Ext.create('Ext.data.Store', {
            fields: [
                { 'name': 'id' },
                { 'name': 'label' },
                { 'name': 'oppervlak', 'type': 'number' },
                { 'name': 'editable', 'type': 'boolean', 'defaultValue': false }
            ],
            data: [
                { id: 'bruto', label: 'Bruto', oppervlak: '', tt:"Bruto oppervlakte (in ha) van de werklocatie." },
                { id: 'netto', label: 'Netto', oppervlak: '', tt:"Netto oppervlakte (in ha) van de werklocatie." },
                { id: 'uitgegeven', label: 'Uitgegeven', oppervlak: '', tt:"De uitgegeven oppervlakte (in netto ha) van de werklocatie tot een jaar voorafgaand aan de peildatum." },
                { id: 'uitgifte_huidig_jaar', label: 'Uitgifte huidig jaar', oppervlak: '', tt:"Uitgegeven oppervlak werklocatieterrein (in ha) in het afgelopen peiljaar." },
                { id: 'terugkoop', label: 'Terugkoop', oppervlak: '', editable: true, tt:"Teruggekochte oppervlakte (in ha) in gemeentelijke eigendom." }
            ]
        });
        var uitgeefbaarStore = Ext.create('Ext.data.Store', {
            fields: [ 'label', 'overheid', 'particulier' ],
            data: [
                { id: 'terstond_uitgeefbaar', label: 'Terstond uitgeefbaar', overheid: '', particulier: '', tt: 'Aanbod bouwrijpe werklocaties in ' },
                { id: 'niet_terstond_uitgeefbaar', label: 'Niet terstond uitgeefbaar', overheid: '', particulier: '', tt: 'Aanbod niet-bouwrijpe werklocaties in ' },
                { id: 'grootst_uitgeefbaar_deel', label: 'Grootst uitgeefbaar deel', overheid: '', particulier: '', tt: 'Netto oppervlakte van het grootste aaneengesloten uitgeefbaar deel in '}
            ]
        });
        this.stores = {
            gemeentes: gemeenteStore,
            peildatums: peildatumsStore,
            bedrijventerreinen: bedrijventerreinenMetingenStore,
            planfase: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.PlanFasen', "PLAN_FASEN"),
            terreinbeheerder:  this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Gemeenten', "GEMEENTEN"),
            werklocatietype: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.WerklocatieTypen', "WERKLOCATIE_TYPEN"),
            parkmanagement: ["Ja", "Nee", "Onbekend"],
            milieuzonering: ["Ja", "Nee", "Onbekend"],
            maximale_milieucategorie: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Milieucategorieen', "MILIEUCATEGORIEEN"),
            prijzen: prijzenStore,
            mutaties: mutationStore,
            ontsluiting_spoor: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.SpoorOntsluitingTypen', "SPOOR_ONTSLUITING_TYPEN"),
            ontsluiting_water: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.WaterOntsluitingTypen', "WATER_ONTSLUITING_TYPEN"),
            externe_bereikbaarheid: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.ExtBereikbaarTypen', "EXT_BEREIKBAAR_TYPEN"),
            parkeergelegenheid: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.ParkeergelegenheidTypen', "PARKEERGELEGENHEID_TYPEN"),
            verouderd: ["Ja", "Nee", "Onbekend"],
            hoofdoorzaak_veroudering: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.HoofdoorzakenVeroud', "HOOFDOORZAKEN_VEROUD"),
            herstructereringsplan: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.HerstructPlanTypen', "HERSTRUCT_PLAN_TYPEN"),
            herstructereringsfase: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.HerstructFasen', "HERSTRUCT_FASEN"),
            oppervlak: oppervlakStore,
            uitgeefbaar: uitgeefbaarStore,
            indicatie_vol: ["Ja", "Nee", "Onbekend"]
        };
    },
    createDefaultMobAjaxStore: function(model, type, event, skipAutoLoad) {
        var extraParams = {
            application: FlamingoAppLoader.get('appId'),
            featureTypeName: type,
            appLayer: this.layer
        };
        extraParams[event || 'store'] = true;
        var store = Ext.create('Ext.data.Store', {
            proxy: {
                type: 'ajax',
                url: actionBeans["mobstore"],
                reader: {
                    type: 'json',
                    rootProperty: 'features'
                },
                extraParams: extraParams
            },
            model: model
        });
        if (!skipAutoLoad) {
            this.storesLoading++;
            store.on("load", function() {
                this.storesLoading--;
                this.storesLoaded();
            }, this);
            store.load();
        }
        return store;
    },
    validate: function() {
        var formData = this.getFormData();
        var algemeen_validation = [];
        var bereikbaarheid_validation = [];
        var oppervlak_validation = [];
        if (formData.MIN_VERKOOPPRIJS < 0) { algemeen_validation.push("Minimale verkoopprijs moet 0 of hoger zijn"); }
        if (formData.MAX_VERKOOPPRIJS < 0) { algemeen_validation.push("Maximale verkoopprijs moet 0 of hoger zijn"); }
        if (formData.MIN_ERFPACHTPRIJS < 0) { algemeen_validation.push("Minimale erfpachtprijs moet 0 of hoger zijn"); }
        if (formData.MAX_ERFPACHTPRIJS < 0) { algemeen_validation.push("Maximale erfpachtprijs moet 0 of hoger zijn"); }
        if (formData.MAX_VERKOOPPRIJS < formData.MIN_VERKOOPPRIJS) {
            algemeen_validation.push("Maximale verkoopprijs moet gelijk of hoger zijn dan minimale verkoopprijs");
        }
        if (formData.MAX_ERFPACHTPRIJS < formData.MIN_ERFPACHTPRIJS) {
            algemeen_validation.push("Maximale erfpachtprijs moet gelijk of hoger zijn dan minimale erfpachtprijs");
        }
        if (formData.IND_VEROUDERD === "Ja" && (formData.HOOFDOORZAAK_VEROUD_CODE === "" || formData.BRUTO_OPP_VEROUDERD === "")) {
            bereikbaarheid_validation.push("Indien bij Verouderd voor Ja is gekozen is het verplicht om Hoofdoorzaak veroudering en Brutto ha verouderd in te vullen");
        }
        if (
            (formData.HERSTRUCT_PLAN_TYPE_CODE === "A" && formData.OPP_FACELIFT === "") ||
            (formData.HERSTRUCT_PLAN_TYPE_CODE === "B" && formData.OPP_REVITALISATIE === "") ||
            (formData.HERSTRUCT_PLAN_TYPE_CODE === "C" && formData.OPP_ZWARE_REVITALISATIE === "") ||
            (formData.HERSTRUCT_PLAN_TYPE_CODE === "D" && formData.OPP_HERPROFILERING === "") ||
            (formData.HERSTRUCT_PLAN_TYPE_CODE === "F" && formData.OPP_TRANSFORMATIE === "")
        ) {
            bereikbaarheid_validation.push("Vul de oppervlakte in, passend bij het gekozen Herstructereringsplan");
        }
        var bruto_oppervlak = +(this.bedrijventerrein.get("BRUTO_OPP"));
        if (formData.BRUTO_OPP_VEROUDERD && bruto_oppervlak < +(formData.BRUTO_OPP_VEROUDERD)) {
            bereikbaarheid_validation.push(Ext.String.format("Bruto oppervlakte veroudering moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        if (formData.OPP_FACELIFT && bruto_oppervlak < +(formData.OPP_FACELIFT)) {
            bereikbaarheid_validation.push(Ext.String.format("Oppervlakte facelift moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        if (formData.OPP_REVITALISATIE && bruto_oppervlak < +(formData.OPP_REVITALISATIE)) {
            bereikbaarheid_validation.push(Ext.String.format("Oppervlakte revitalisatie moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        if (formData.OPP_ZWARE_REVITALISATIE && bruto_oppervlak < +(formData.OPP_ZWARE_REVITALISATIE)) {
            bereikbaarheid_validation.push(Ext.String.format("Oppervlakte zware revitalisatie moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        if (formData.OPP_HERPROFILERING && bruto_oppervlak < +(formData.OPP_HERPROFILERING)) {
            bereikbaarheid_validation.push(Ext.String.format("Oppervlakte herprofilering moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        if (formData.OPP_TRANSFORMATIE && bruto_oppervlak < +(formData.OPP_TRANSFORMATIE)) {
            bereikbaarheid_validation.push(Ext.String.format("Oppervlakte transformatie moet kleiner of gelijk zijn aan bruto oppervlak ({0} ha)", bruto_oppervlak));
        }
        this.clearMessagesInContainer("#algemeen-errors");
        this.clearMessagesInContainer("#bereikbaarheid-errors");
        this.clearMessagesInContainer("#oppervlak-errors");
        this.form.getTabBar().items.get(0).setIconCls("");
        this.form.getTabBar().items.get(1).setIconCls("");
        this.form.getTabBar().items.get(2).setIconCls("");
        var tabSet = false;
        if (algemeen_validation.length !== 0 || bereikbaarheid_validation.length !== 0 || oppervlak_validation.length !== 0) {
            tabSet = this.showErrorsInTab(algemeen_validation, "#algemeen-errors", 0, tabSet);
            tabSet = this.showErrorsInTab(bereikbaarheid_validation, "#bereikbaarheid-errors", 1, tabSet);
            this.showErrorsInTab(oppervlak_validation, "#oppervlak-errors", 2, tabSet);
            return false;
        }
        return true;
    },
    showErrorsInTab: function(validation, container, tabNo, tabSet) {
        if (validation.length !== 0) {
            this.form.getTabBar().items.get(tabNo).setIconCls("x-fa fa-exclamation-triangle");
            this.addErrorMessageInContainer(container, "- " + validation.join("<br />- "));
            if (!tabSet) {
                this.form.setActiveTab(tabNo);
                tabSet = true;
            }
        }
        return tabSet;
    },
    save: function() {
        if (!this.validate()) {
            return;
        }
        var errorMessage = 'Het is helaas niet gelukt om op te slaan. Probeer het alstublieft opnieuw. Indien het probleem blijft bestaan, neem dan contact op met de beheerder van deze applicatie.';
        Ext.Ajax.request({
            url: actionBeans["mobeditfeature"],
            method: 'POST',
            params: {
                application: FlamingoAppLoader.get('appId'),
                appLayer: this.layer,
                GEM_CODE_CBS: this.gemeente_code,
                METING_ID: this.meting_id,
                meting: Ext.JSON.encode(this.getFormData()),
                saveIbis: true
            },
            scope: this,
            success: function(result) {
                var response = Ext.JSON.decode(result.responseText);
                if (response.success) {
                    this.showEditing(false);
                    var currently_selected = this.bedrijventerrein.get("RIN_NUMMER");
                    this.stores.bedrijventerreinen.load({
                        scope: this,
                        callback: function (records, operation, success) {
                            var selected = Ext.Array.findBy(records, function(record) { return record.get("RIN_NUMMER") === currently_selected });
                            if (selected) {
                                Ext.ComponentQuery.query("#bedrijventerreinen-grid")[0].getSelectionModel().select(selected);
                                this.updateSelection(selected);
                            }
                        }
                    });
                    Ext.MessageBox.show({
                        title: 'Gelukt',
                        message: "Ibisgegevens opgeslagen",
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.INFO
                    });
                    // Update bedrijventerrein record
                } else {
                    this.showErrorDialog(errorMessage);
                }
            },
            failure: function(result) {
                this.showErrorDialog(errorMessage);
            }
        });
    },
    submitConfirm: function() {
        var gemeente = this.stores.gemeentes.findRecord("GEM_CODE_CBS", this.gemeente_code);
        var gemeente_naam = "";
        if (gemeente) {
            gemeente_naam = gemeente.get("GEMEENTE_NAAM");
        }
        Ext.MessageBox.show({
            title: 'Gegevens van alle bedrijventerreinen indienen',
            message: Ext.String.format('Hiermee dient u alle bedrijventerreinen binnen de gemeente {0} in', gemeente_naam),
            buttons: Ext.Msg.YESNO,
            icon: Ext.Msg.QUESTION,
            scope: this,
            fn: function(btn) {
                if (btn === 'yes') {
                    this.submit();
                }
            }
        });
    },
    submit: function() {
        var errorMessage = 'Het is helaas niet gelukt om in te dienen. Probeer het alstublieft opnieuw. Indien het probleem blijft bestaan, neem dan contact op met de beheerder van deze applicatie.';
        Ext.Ajax.request({
            url: actionBeans["mobeditfeature"],
            scope:this,
            params: {
                application: FlamingoAppLoader.get('appId'),
                appLayer: this.layer,
                GEM_CODE_CBS: this.gemeente_code,
                AGM_ID: this.agm_id,
                submitIbis: true
            },
            success: function (result) {
                var response = Ext.JSON.decode(result.responseText);
                if (response.success) {
                    this.form.query("#save-button")[0].setDisabled(true);
                    this.form.query("#cancel-button")[0].setDisabled(true);
                    Ext.MessageBox.show({
                        title: 'Gelukt',
                        message: "Ibisgegvens ingediend.",
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.INFO
                    });
                } else {
                    this.showErrorDialog(errorMessage);
                }
            },
            failure: function (result) {
                this.showErrorDialog(errorMessage);
            }
        });
    },
    showEditing: function(edit) {
        this.isEditing = edit;
        Ext.ComponentQuery.query("#edit-indicator")[0].update(edit ? "* is aangepast" : "");
    },
    updateSelection: function(bedrijventerrein) {
        this.bedrijventerrein = bedrijventerrein;
        var feature = Ext.create('viewer.viewercontroller.controller.Feature', { wktgeom: bedrijventerrein.get("GEOMETRIE") });
        var extent = feature.getExtent();
        extent.buffer(150);
        this.config.viewerController.mapComponent.getMap().zoomToExtent(extent);
        this.updateForms();
        this.form.setActiveTab(0);
        this.setDisabled(false);
    },
    updateForms: function() {
        var bedrijventerrein = this.bedrijventerrein;
        var algemeenValues = {
            'KERN_NAAM': bedrijventerrein.get("BEDRIJVENTERREIN").get("KERN_NAAM"),
            'PLAN_FASE_CODE': bedrijventerrein.get("PLAN_FASE_CODE"),
            'GEM_CODE_CBS': bedrijventerrein.get("GEM_CODE_CBS"),
            'WERKLOCATIE_TYPE_CODE': bedrijventerrein.get("WERKLOCATIE_TYPE_CODE"),
            'IND_PARK_MANAGEMENT': bedrijventerrein.get("IND_PARK_MANAGEMENT"),
            'IND_MILIEUZONERING': bedrijventerrein.get("IND_MILIEUZONERING"),
            'MAX_MILEUCATEGORIE_CODE': bedrijventerrein.get("MAX_MILEUCATEGORIE_CODE"),
            'START_JAAR': bedrijventerrein.get("BEDRIJVENTERREIN").get("START_JAAR") || '',
            'JAAR_NIET_TERSTOND_UITG_GEM': bedrijventerrein.get("JAAR_NIET_TERSTOND_UITG_GEM") || '',
            'OPMERKING_TBV_IBIS': bedrijventerrein.get("OPMERKING_TBV_IBIS")
        };
        this.algemeenForm.getForm().setValues(algemeenValues);
        this.updateGrid(this.stores.prijzen, {
            verkoopprijs: { min: bedrijventerrein.get("MIN_VERKOOPPRIJS"), max: bedrijventerrein.get("MAX_VERKOOPPRIJS") },
            erfpachtprijs: { min: bedrijventerrein.get("MIN_ERFPACHTPRIJS"), max: bedrijventerrein.get("MAX_ERFPACHTPRIJS") }
        });
        this.updateGrid(this.stores.mutaties, {
            gemeente: { datum: bedrijventerrein.get("MUTATIEDATUM_GEMEENTE"), bewerker: bedrijventerrein.get("MUT_GEMEENTE_DOOR") },
            provincie: { datum: bedrijventerrein.get("MUTATIEDATUM_PROVINCIE"), bewerker: bedrijventerrein.get("MUT_PROVINCIE_DOOR") }
        });
        var bereikbaarheidValues = {
            'SPOOR_ONTSLUITING_CODE': bedrijventerrein.get("SPOOR_ONTSLUITING_CODE"),
            'WATER_ONTSLUITING_CODE': bedrijventerrein.get("WATER_ONTSLUITING_CODE"),
            'EXT_BEREIKBAARHEID_CODE': bedrijventerrein.get("EXT_BEREIKBAARHEID_CODE"),
            'PARKEERGELEGENHED_CODE': bedrijventerrein.get("PARKEERGELEGENHED_CODE"),
            'IND_VEROUDERD': bedrijventerrein.get("IND_VEROUDERD"),
            'BRUTO_OPP_VEROUDERD': bedrijventerrein.get("BRUTO_OPP_VEROUDERD") || '',
            'HOOFDOORZAAK_VEROUD_CODE': bedrijventerrein.get("HOOFDOORZAAK_VEROUD_CODE"),
            'HERSTRUCT_PLAN_TYPE_CODE': bedrijventerrein.get("HERSTRUCT_PLAN_TYPE_CODE"),
            'HERSTRUCT_FASE_CODE': bedrijventerrein.get("HERSTRUCT_FASE_CODE"),
            'OPP_FACELIFT': bedrijventerrein.get("OPP_FACELIFT") || '',
            'OPP_REVITALISATIE': bedrijventerrein.get("OPP_REVITALISATIE") || '',
            'OPP_ZWARE_REVITALISATIE': bedrijventerrein.get("OPP_ZWARE_REVITALISATIE") || '',
            'OPP_HERPROFILERING': bedrijventerrein.get("OPP_HERPROFILERING") || '',
            'OPP_TRANSFORMATIE': bedrijventerrein.get("OPP_TRANSFORMATIE") || ''
        };
        this.bereikbaarheidForm.getForm().setValues(bereikbaarheidValues);
        this.oppervlakteForm.getForm().setValues({
            'IND_VOL': bedrijventerrein.get("IND_VOL")
        });
        this.updateGrid(this.stores.oppervlak, {
            bruto: { oppervlak: bedrijventerrein.get("BRUTO_OPP") },
            netto: { oppervlak: bedrijventerrein.get("NETTO_OPP") },
            uitgegeven: { oppervlak: bedrijventerrein.get("UITGEGEVEN_OPP") },
            uitgifte_huidig_jaar: { oppervlak: bedrijventerrein.get("UITGIFTE_HUIDIG_PEILJAAR_OPP") },
            terugkoop: { oppervlak: bedrijventerrein.get("OPP_TERUGKOOP_GEMEENTE") }
        });
        this.updateGrid(this.stores.uitgeefbaar, {
            terstond_uitgeefbaar: { overheid: bedrijventerrein.get("UITGEEFBAAR_OVERH_OPP"),particuler: bedrijventerrein.get("UITGEEFBAAR_PART_OPP") },
            // niet_terstond_uitgeefbaar: { overheid: '', particuler: '' },
            grootst_uitgeefbaar_deel: { overheid: bedrijventerrein.get("GROOTST_UITGEEFB_DEEL_OPP"), particuler: '' }
        });
        this.showEditing(false);
    },
    getFormData: function() {
        var data = {};
        data = Ext.Object.merge({}, data, this.algemeenForm.getForm().getValues());
        data = Ext.Object.merge({}, data, this.bereikbaarheidForm.getForm().getValues());
        data = Ext.Object.merge({}, data, this.oppervlakteForm.getForm().getValues());
        data = Ext.Object.merge({}, data, this.getGridValues(this.stores.prijzen, "verkoopprijs", { "min": "MIN_VERKOOPPRIJS", "max": "MAX_VERKOOPPRIJS" }));
        data = Ext.Object.merge({}, data, this.getGridValues(this.stores.prijzen, "erfpachtprijs", { "min": "MIN_ERFPACHTPRIJS", "max": "MAX_ERFPACHTPRIJS" }));
        data = Ext.Object.merge({}, data, this.getGridValues(this.stores.oppervlak, "terugkoop", { "oppervlak": "OPP_TERUGKOOP_GEMEENTE" }));
        
        var user = FlamingoAppLoader.get("user");
        if (user.roles.hasOwnProperty("gemeente")) {
            data["MUT_GEMEENTE_DOOR"] = user.name;
            data["MUTATIEDATUM_GEMEENTE"] = new Date();
        }
        if (user.roles.hasOwnProperty("provincie")) {
            data["MUT_PROVINCIE_DOOR"] = user.name;
            data["MUTATIEDATUM_PROVINCIE"] = new Date();
        }
        data["__fid"] = this.bedrijventerrein.data.BTM_ID;
        var bedrijventerrein = {
            __fid : this.bedrijventerrein.data.RIN_NUMMER,
            START_JAAR : data.START_JAAR,
            KERN_NAAM  : data.KERN_NAAM,
            PLAN_NAAM  : this.bedrijventerrein.data.BEDRIJVENTERREIN_LABEL
        };
        data["BEDRIJVENTERREIN"] = bedrijventerrein;
        return data;
    },
    setDisabled: function(disabled) {
        disabled = !!disabled;
        this.disabled = disabled;
        this.setFormDisabled(this.algemeenForm, disabled);
        this.setFormDisabled(this.bereikbaarheidForm, disabled);
        this.setFormDisabled(this.oppervlakteForm, disabled);
        Ext.ComponentQuery.query("#prijzen-grid")[0].toggleCls("is-disabled", disabled);
        Ext.ComponentQuery.query("#oppervlak-grid")[0].toggleCls("is-disabled", disabled);
    },
    setFormDisabled: function(form, disabled) {
        var fields = form.query("textfield, combobox");
        for(var i = 0; i < fields.length; i++) {
            fields[i].setReadOnly(disabled);
        }
    },
    updateGrid: function(store, updates) {
        var updated;
        var value;
        var values;
        for(var key in updates) if (updates.hasOwnProperty(key)) {
            updated = {};
            values = updates[key];
            for (var valKey in values) if (values.hasOwnProperty(valKey)) {
                value = values[valKey];
                if (Object.prototype.toString.call(value) === "[object Date]") {
                    value = Ext.Date.format(value, 'd-m-Y');
                }
                updated[valKey] = value || '';
            }
            store.findRecord("id", key).set(updated);
        }
    },
    getGridValues: function(store, key, values) {
        var record = store.findRecord("id", key);
        var returnObject = {};
        for(var key in values) if (values.hasOwnProperty(key)) {
            returnObject[values[key]] = record.get(key) || "";
        }
        return returnObject;
    },
    clearMessagesInContainer: function(query) {
        var container = this.getContentContainer().query(query);
        if(container.length > 0) {
            container[0].removeAll();
        }
    },
    addErrorMessageInContainer: function(query, message) {
        var container = this.getContentContainer().query(query);
        if(container.length > 0) {
            container[0].add({
                xtype: 'container',
                style: {
                    color: 'red'
                },
                margin: '0 0 10 0',
                html: message
            });
        }
    },
    getExtComponents: function() {
        return [ this.container.getId() ];
    }
});
