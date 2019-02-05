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
/**
 * Bedrijventerreinen component
 * @author <a href="mailto:geertplaisier@b3partners.nl">Geert Plaisier</a>
 */
Ext.define ("viewer.components.BedrijventerreinenIbisgegevens", {
    extend: "viewer.components.Component",
    bedrijventerrein: null,
    bedrijventerreinen: null,
    gemeente: null,
    peildatum: null,
    stores: {},
    storesLoading: 0,
    windowLoaded: false,
    config:{
        title: null,
        titlebarIcon: null,
        tooltip: null,
        label: "",
        layer: null,
        details: {
            minWidth: 700,
            minHeight: 400,
            useExtLayout: true,
        }
    },
    constructor: function (conf) {
        if(!Ext.isDefined(conf.showLabels)) conf.showLabels = true; 
        this.initConfig(conf);
        viewer.components.BedrijventerreinenIbisgegevens.superclass.constructor.call(this, this.config);
        viewer.components.BedrijventerreinenBase.defineModels();
        this.bedrijventerreinen = this.createDefaultMobAjaxStore('Bedrijventerreinen.model.Bedrijventerreinen', "BEDRIJVENTERREINEN", "", true);
        this.getContentContainer().setLoading("Bezig met laden...");
        this.bedrijventerreinen.load({
            scope: this,
            callback: function(records, operation, success) {
                this.createStores();
            }
        });
        return this;
    },
    storesLoaded: function() {
        if (this.storesLoading > 0 || this.windowLoaded) {
            return;
        }
        this.loadWindow();
        this.getContentContainer().setLoading(false);
    },
    loadWindow: function() {
        var me = this;
        this.windowLoaded = true;
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
            items: [
                this.createFilterContainer(),
                this.createForm()
            ]
        });
        this.getContentContainer().add(this.container);
    },
    updateSelection: function(bedrijventerrein) {
        this.bedrijventerrein = bedrijventerrein;
        // this.form.setActiveTab(0);
        var algemeenValues = {
            'kernnaam': bedrijventerrein.get("BEDRIJVENTERREIN").get("KERN_NAAM"),
            'planfase': bedrijventerrein.get("PLAN_FASE_CODE"),
            'terreinbeheerder': bedrijventerrein.get("GEM_CODE_CBS"),
            'werklocatietype': bedrijventerrein.get("WERKLOCATIE_TYPE_CODE"),
            'park_management': bedrijventerrein.get("IND_PARK_MANAGEMENT"),
            'milieuzonering': bedrijventerrein.get("IND_MILIEUZONERING"),
            'maximale_milieucategorie': bedrijventerrein.get("MAX_MILIEYCATEGORIE_CODE"),
            'startjaar_uitgifte': bedrijventerrein.get("BEDRIJVENTERREIN").get("START_JAAR") || '',
            'beoogd_jaar_uitgifte': bedrijventerrein.get("JAAR_NIET_TERSTOND_UITG_GEM") || '',
            'opmerkingen': bedrijventerrein.get("OPMERKING_TBV_IBIS")
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
            'ontsluiting_spoor': bedrijventerrein.get("SPOOR_ONTSLUITING_CODE"),
            'ontsluiting_water': bedrijventerrein.get("WATER_ONTSLUITING_CODE"),
            'externe_bereikbaarheid': bedrijventerrein.get("EXT_BEREIKBAARHEID_CODE"),
            'parkeergelegenheid': bedrijventerrein.get("PARKEERGELEGENHED_CODE"),
            'verouderd': bedrijventerrein.get("IND_VEROUDERD"),
            'brute_ha_verouderd': bedrijventerrein.get("BRUTO_OPP_VEROUDERD") || '',
            'hoofdoorzaak_veroudering': bedrijventerrein.get("HOOFDOORZAAK_VEROUD_CODE"),
            'herstructereringsplan': bedrijventerrein.get("HERSTRUCT_PLAN_TYPE_CODE"),
            'herstructereringsfase': bedrijventerrein.get("HERSTRUCT_FASE_CODE"),
            'opp_facelift': bedrijventerrein.get("OPP_FACELIFT") || '',
            'opp_revitalisatie': bedrijventerrein.get("OPP_REVITALISATIE") || '',
            'opp_zware_revitalisatie': bedrijventerrein.get("OPP_ZWARE_REVITALISATIE") || '',
            'opp_herprofilering': bedrijventerrein.get("OPP_HERPROFILERING") || '',
            'opp_transformatie': bedrijventerrein.get("OPP_TRANSFORMATIE") || ''
        };
        this.bereikbaarheidForm.getForm().setValues(bereikbaarheidValues);
        this.oppervlakteForm.getForm().setValues({
            'indicatie_vol': bedrijventerrein.get("IND_VOL")
        });
        this.updateGrid(this.stores.oppervlak, {
            bruto: { oppervlak: bedrijventerrein.get("AFGESPR_AANBOD_OPP") },
            netto: { oppervlak: bedrijventerrein.get("AFGESPR_NETTO_OPP") },
            uitgegeven: { oppervlak: bedrijventerrein.get("UITGEGEVEN_OPP") },
            // uitgifte_huidig_jaar: { oppervlak: bedrijventerrein.get() },
            terugkoop: { oppervlak: bedrijventerrein.get("OPP_TERUGKOOP_GEMEENTE") }
        });
        this.updateGrid(this.stores.uitgeefbaar, {
            terstond_uitgeefbaar: { overheid: bedrijventerrein.get("UITGEEFBAAR_OVERH_OPP"), particuler: bedrijventerrein.get("UITGEEFBAAR_PART_OPP") }
            // niet_terstond_uitgeefbaar: { overheid: '', particuler: '' },
            // grootsts_uitgeefbaar_deel: { overheid: '', particuler: '' }
        });
    },
    createForm: function() {
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
                { xtype: 'button', text: 'Opslaan & Volgende', itemId: 'next-button', scope: this, handler: function() { this.saveAndNext(); } },
                { xtype: 'button', text: 'Annuleren' },
                '-',
                { xtype: 'button', text: 'Help' }
            ],
            listeners: {
                scope: this,
                tabchange: this.updateSaveButtonLabel
            }
        });
        return this.form;
    },
    getActiveTabIndex: function() {
        this.form.getActiveTab();
    },
    saveAndNext: function() {
        this.save();
        var current = this.form.getActiveTab();
        var next = current.nextSibling();
        if (next === null) {
            return;
        }
        this.form.setActiveTab(next);
        this.updateSaveButtonLabel();
    },
    updateSaveButtonLabel: function() {
        var current = this.form.getActiveTab();
        var nextButton = this.getContentContainer().query('#next-button')[0];
        if (current.nextSibling() === null) {
            nextButton.setText('Opslaan');
        } else {
            nextButton.setText('Opslaan & Volgende');
        }
    },
    save: function() {
        // @TODO: implement save
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
                maxWidth: 500
            },
            items: [
                { fieldLabel: "Kernnaam", name: 'kernnaam' },
                { xtype: 'combobox', name: 'planfase', fieldLabel: "Planfase",  queryMode: 'local',
                    store: this.stores.planfase, displayField: 'PLAN_FASE_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', name: 'terreinbeheerder', fieldLabel: "Terreinbeheerder", queryMode: 'local',
                    store: this.stores.terreinbeheerder, displayField: 'GEMEENTE_NAAM', valueField: 'GEM_CODE_CBS' },
                this.createColumnForm(
                    { xtype: 'combobox', name: 'werklocatietype', fieldLabel: "Werklocatietype", queryMode: 'local',
                        store: this.stores.werklocatietype, displayField: 'WERKLOCATIE_TYPE_OMSCHR', valueField: 'CODE' },
                    { xtype: 'combobox', queryMode: 'local', name: 'park_management', fieldLabel: "Park management", store: this.stores.parkmanagement, grow: true }
                ),
                this.createColumnForm(
                    { xtype: 'combobox', queryMode: 'local', name: 'milieuzonering', fieldLabel: "Milieuzonering", store: this.stores.milieuzonering, grow: true },
                    { xtype: 'combobox', queryMode: 'local', name: 'maximale_milieucategorie', fieldLabel: "Maximale milieucategorie", grow: true,
                        store: this.stores.maximale_milieucategorie, displayField: 'MILIECATEGORIE_NAAM', valueField: 'CODE' }
                ),
                this.createColumnForm(
                    { xtype: 'textfield', name: 'startjaar_uitgifte', fieldLabel: "Startjaar uitgifte" },
                    { xtype: 'textfield', name: 'beoogd_jaar_uitgifte', fieldLabel: "Beoogd jaar niet terstond uitgeefbaar" }
                ),
                {
                    xtype: 'gridpanel',
                    viewConfig:{
                        markDirty: false
                    },
                    header: false,
                    store: this.stores.prijzen,
                    plugins: {
                        ptype: 'cellediting',
                        clicksToEdit: 1
                    },
                    selModel: 'cellmodel',
                    columns: [
                        { header: 'Prijzen in euro\'s', dataIndex: 'label', flex: 1 },
                        { header: 'Min', dataIndex: 'min', editor: 'textfield', flex: .5, align: 'end' },
                        { header: 'Max', dataIndex: 'max', editor: 'textfield', flex: .5, align: 'end' }
                    ],
                    margin: '0 0 10 0'
                },
                {
                    xtype: 'gridpanel',
                    viewConfig:{
                        markDirty: false
                    },
                    header: false,
                    store: this.stores.mutaties,
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        { header: 'Datum', dataIndex: 'datum', flex: 1 },
                        { header: 'Door', dataIndex: 'bewerker', flex: 1 }
                    ]
                },
                { xtype: 'textarea', name: 'opmerkingen', grow: true, growMax: 300, growMin: 100, fieldLabel: 'Opmerkingen', labelAlign: 'top' }
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
                maxWidth: 500
            },
            items: [
                { xtype: 'combobox', queryMode: 'local', name: 'ontsluiting_spoor', fieldLabel: 'Ontsluiting spoor',
                    store: this.stores.ontsluiting_spoor, displayField: 'SPOOR_ONTSLUITING_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', queryMode: 'local', name: 'ontsluiting_water', fieldLabel: 'Ontsluiting water',
                    store: this.stores.ontsluiting_water, displayField: 'WATER_ONTSLUITING_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', queryMode: 'local', name: 'externe_bereikbaarheid', fieldLabel: 'Externe bereikbaarheid',
                    store: this.stores.externe_bereikbaarheid, displayField: 'EXT_BEREIKBAARHEID_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', queryMode: 'local', name: 'parkeergelegenheid', fieldLabel: 'Parkeergelegenheid',
                    store: this.stores.parkeergelegenheid, displayField: 'PARKEERGELEGENHEID_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', queryMode: 'local', name: 'verouderd', fieldLabel: 'Verouderd', store: this.stores.verouderd, grow: true },
                { xtype: 'combobox', queryMode: 'local', name: 'hoofdoorzaak_veroudering', fieldLabel: 'Hoofdoorzaak veroudering',
                    store: this.stores.hoofdoorzaak_veroudering, displayField: 'HOOFDOORZAAK_VEROUD_NAAM', valueField: 'CODE' },
                { fieldLabel: 'Bruto ha verouderd', name: 'bruto_ha_verouderd', value: '', maxWidth: 275 },
                { xtype: 'combobox', queryMode: 'local', name: 'herstructereringsplan', fieldLabel: 'Herstructereringsplan',
                    store: this.stores.herstructereringsplan, displayField: 'HERSTRUCT_PLAN_TYPE_NAAM', valueField: 'CODE' },
                { xtype: 'combobox', queryMode: 'local', name: 'herstructereringsfase', fieldLabel: 'Herstructereringsfase',
                    store: this.stores.herstructereringsfase, displayField: 'HERSTRUCT_FASE_NAAM', valueField: 'CODE' },
                { fieldLabel: 'Facelift (ha)', name: 'opp_facelift', value: '', maxWidth: 275 },
                { fieldLabel: 'Revitalisatie (ha)', name: 'opp_revitalisatie', value: '', maxWidth: 275 },
                { fieldLabel: 'Zware revitalisatie (ha)', name: 'opp_zware_revitalisatie', value: '', maxWidth: 275 },
                { fieldLabel: 'Herprofilering (ha)', name: 'opp_herprofilering', value: '', maxWidth: 275 },
                { fieldLabel: 'Transformatie (ha)', name: 'opp_transformatie', value: '', maxWidth: 275 }
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
                maxWidth: 500
            },
            items: [
                { xtype: 'combobox', queryMode: 'local', name: 'indicatie_vol', fieldLabel: 'Vol', disabled: true, store: this.stores.indicatie_vol },
                {
                    xtype: 'gridpanel',
                    viewConfig:{
                        markDirty: false
                    },
                    header: false,
                    store: this.stores.oppervlak,
                    plugins: {
                        ptype: 'cellediting',
                        clicksToEdit: 1
                    },
                    selModel: 'cellmodel',
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        { header: 'Oppervlak', dataIndex: 'oppervlak', editor: 'textfield', flex: 1, align: 'end' },
                    ],
                    margin: '0 0 10 0'
                },
                {
                    xtype: 'gridpanel',
                    viewConfig:{
                        markDirty: false
                    },
                    header: false,
                    store: this.stores.uitgeefbaar,
                    columns: [
                        { header: '', dataIndex: 'label', flex: 1 },
                        { header: 'Gemeente', dataIndex: 'overheid', flex: .5, align: 'end' },
                        { header: 'Particulier', dataIndex: 'particulier', flex: .5, align: 'end' }
                    ],
                    margin: '0 0 10 0'
                },
                { xtype: 'container', html: '(Alle oppervlaktes in ha en afgeleid uit MOB)' }
            ]
        });
        return this.oppervlakteForm;
    },
    createFilterContainer: function() {
        var container = Ext.create('Ext.container.Container', {
            width: '20%',
            minWidth: 200,
            padding: 10,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            items: [
                {
                    xtype: 'combobox',
                    queryMode: 'local',
                    labelAlign: 'top',
                    fieldLabel: 'Gemeente',
                    store: this.stores.gemeentes,
                    displayField: 'GEMEENTE_NAAM',
                    valueField: 'GEM_CODE_CBS',
                    listeners: {
                        scope: this,
                        change: function(combo, value) {
                            this.filterBedrijventerreinen(value, null);
                        }
                    }
                },
                {
                    xtype: 'combobox',
                    queryMode: 'local',
                    labelAlign: 'top',
                    fieldLabel: 'Peildatum',
                    valueField: 'MTG_ID',
                    displayField: 'PEILDATUM_LABEL',
                    store: this.stores.peildatums,
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
                    columns: [
                        { text: 'Bedrijventerrein', dataIndex: 'BEDRIJVENTERREIN_LABEL', flex: 1 }
                    ],
                    header: false,
                    hideHeaders: true,
                    viewConfig:{
                        markDirty: false
                    },
                    listeners: {
                        scope: this,
                        select: function(grid, record) {
                            this.updateSelection(record);
                        }
                    }
                }
            ]
        });
        return container;
    },
    filterBedrijventerreinen: function(gemeente, peildatum) {
        if (gemeente) this.gemeente = gemeente;
        if (peildatum) this.peildatum = peildatum;
        if (this.gemeente !== null && this.peildatum !== null) {
            this.stores.bedrijventerreinen.getProxy().setExtraParam('GEM_CODE_CBS', this.gemeente);
            this.stores.bedrijventerreinen.getProxy().setExtraParam('METING_ID', this.peildatum);
            this.stores.bedrijventerreinen.load();
        }
    },
    createColumnForm: function() {
        var items = Array.prototype.slice.call(arguments);
        var itemsConf = Ext.Array.map(items, function(item, idx) {
            var conf = { xtype: 'fieldcontainer', flex: 1, defaults: { labelAlign: 'top' }, layout: { type: 'hbox', pack: 'start' }, items: [ item ], padding: '0 10 0 0' };
            if (idx === 1 && items.length === 2) {
                // For two-col forms align the last item to the right
                return Ext.Object.merge({}, conf, { layout: { pack: 'end' }, padding: '0 0 0 10' });
            }
            return conf;
        });
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
    defineModels: function() {
        Ext.define('Classificatie', {
            extend: 'Ext.data.Model',
            fields: ['CLS_ID', 'CLASSIFICATIE']
        });
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
            fields: [ 'label', 'min', 'max' ],
            data: [
                { id: 'verkoopprijs', label: 'Verkoopprijs', min: '', max: '' },
                { id: 'erfpachtprijs', label: 'Erfpachtprijs', min: '', max: '' }
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
            fields: [ 'label', 'oppervlak', 'editable' ],
            data: [
                { id: 'bruto', label: 'Bruto', oppervlak: '' },
                { id: 'netto', label: 'Netto', oppervlak: '' },
                { id: 'uitgegeven', label: 'Uitgegeven', oppervlak: '' },
                { id: 'uitgifte_huidig_jaar', label: 'Uitgifte huidig jaar', oppervlak: '' },
                { id: 'terugkoop', label: 'Terugkoop', oppervlak: '', editable: true }
            ]
        });
        var uitgeefbaarStore = Ext.create('Ext.data.Store', {
            fields: [ 'label', 'overheid', 'particulier' ],
            data: [
                { id: 'terstond_uitgeefbaar', label: 'Terstond uitgeefbaar', overheid: '', particulier: '' },
                { id: 'niet_terstond_uitgeefbaar', label: 'Niet terstond uitgeefbaar', overheid: '', particulier: '' },
                { id: 'grootsts_uitgeefbaar_deel', label: 'Grootsts uitgeefbaar deel', overheid: '', particulier: '' }
            ]
        });
        this.stores = {
            gemeentes: gemeenteStore,
            peildatums: peildatumsStore,
            bedrijventerreinen: bedrijventerreinenMetingenStore,
            planfase: this.createDefaultMobAjaxStore('Bedrijventerreinen.model.PlanFasen', "PLAN_FASEN"),
            terreinbeheerder:  gemeenteStore,
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
    getExtComponents: function() {
        return [ this.container.getId() ];
    }
});