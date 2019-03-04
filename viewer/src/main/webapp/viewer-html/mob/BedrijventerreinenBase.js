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
 * Bedrijventerreinen base component
 * @author <a href="mailto:geertplaisier@b3partners.nl">Geert Plaisier</a>
 * @author <a href="mailto:meinetoonen@b3partners.nl">Meine Toonen</a>
 */
Ext.define ("viewer.components.BedrijventerreinenBase", {
    singleton : true,
    modelsInitialized: false,
    defineModels: function() {
        if(this.modelsInitialized){
            return;
        }
        this.modelsInitialized = true;
        Ext.define('Bedrijventerreinen.model.Classificatie', {
            extend: 'Ext.data.Model',
            fields: ['CLS_ID', 'CLASSIFICATIE']
        });
        Ext.define('Bedrijventerreinen.model.Correctie_status', {
            extend: 'Ext.data.Model',
            fields: ['CS_ID', 'CORRECTIE_STATUS']
        });
        Ext.define('Bedrijventerreinen.model.Metingen', {
            extend: 'Ext.data.Model',
            fields: [
                { name: "IND_VASTGESTELD_JN", type: 'string' },
                { name: "MTG_ID", type: 'int' },
                { name: "IND_IBIS_METING_JN", type: 'string' },
                { name: "PEILDATUM", type: 'date' },
                { name: "PEILDATUM_LABEL", type: 'string', calculate: function(data) {
                        return Ext.Date.format(data.PEILDATUM, 'j F Y');
                    }}
            ]
        });
        Ext.define('Bedrijventerreinen.model.Gemeenten', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'GEM_CODE_CBS', type: 'int' },
                { name: 'GEMEENTE_NAAM', type: 'string' },
                { name: 'BEGINDATUM', type: 'date' },
                { name: 'EINDDATUM', type: 'date' }
            ]
        });
        Ext.define('Bedrijventerreinen.model.BedrijventerreinenMetingen', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'BTM_ID', type: 'int' },
                { name: 'RIN_NUMMER', type: 'int' },
                { name: 'BEDRIJVENTERREIN' },
                { name: 'BEDRIJVENTERREIN_LABEL', type: 'string' },
                { name: 'METING_ID', type: 'int' },
                { name: 'GEOMETRIE', type: 'string' },
                { name: 'GEM_CODE_CBS', type: 'int' },
                { name: 'WERKLOCATIE_TYPE_CODE', type: 'string' },
                { name: 'AFGESPR_AANBOD_OPP', type: 'number' },
                { name: 'AFGESPR_NETTO_OPP', type: 'number' },
                { name: 'AFSPRAAK_REDEN', type: 'string' },
                { name: 'UITGEEFBAAR_PART_OPP', type: 'number' },
                { name: 'UITGEEFBAAR_OVERH_OPP', type: 'number' },
                { name: 'UITGEGEVEN_OPP', type: 'number' },
                { name: 'OPP_TERUGKOOP_GEMEENTE', type: 'number' },
                { name: 'PLAN_FASE_CODE', type: 'string' },
                { name: 'OPMERKING_TBV_IBIS', type: 'string' },
                { name: 'IND_VOL', type: 'string' },
                { name: 'JAAR_NIET_TERSTOND_UITG_GEM', type: 'string' },
                { name: 'MIN_VERKOOPPRIJS', type: 'number' },
                { name: 'MAX_VERKOOPPRIJS', type: 'number' },
                { name: 'MIN_ERFPACHTPRIJS', type: 'number' },
                { name: 'MAX_ERFPACHTPRIJS', type: 'number' },
                { name: 'IND_MILIEUZONERING', type: 'string' },
                { name: 'SPOOR_ONTSLUITING_CODE', type: 'string' },
                { name: 'WATER_ONTSLUITING_CODE', type: 'string' },
                { name: 'MAX_MILEUCATEGORIE_CODE', type: 'string' },
                { name: 'IND_VEROUDERD', type: 'string' },
                { name: 'HOOFDOORZAAK_VEROUD_CODE', type: 'string' },
                { name: 'BRUTO_OPP_VEROUDERD', type: 'number' },
                { name: 'HERSTRUCT_PLAN_TYPE_CODE', type: 'string' },
                { name: 'HERSTRUCT_FASE_CODE', type: 'string' },
                { name: 'OPP_FACELIFT', type: 'number' },
                { name: 'OPP_REVITALISATIE', type: 'number' },
                { name: 'OPP_ZWARE_REVITALISATIE', type: 'number' },
                { name: 'OPP_HERPROFILERING', type: 'number' },
                { name: 'OPP_TRANSFORMATIE', type: 'number' },
                { name: 'EXT_BEREIKBAARHEID_CODE', type: 'string' },
                { name: 'PARKEERGELEGENHED_CODE', type: 'string' },
                { name: 'IND_PARK_MANAGEMENT', type: 'string' },
                { name: 'MUTATIEDATUM_GEMEENTE', type: 'date' },
                { name: 'MUT_GEMEENTE_DOOR', type: 'string' },
                { name: 'MUTATIEDATUM_PROVINCIE', type: 'date' },
                { name: 'MUT_PROVINCIE_DOOR', type: 'string' },
                { name: 'SE_ANNO_CAD_DATA', type: 'string' }
            ]
        });
        Ext.define('Bedrijventerreinen.model.Bedrijventerreinen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'RIN_NUMMER', type: 'int'},
                {name: 'KERN_NAAM', type: 'string'},
                {name: 'PLAN_NAAM', type: 'string'},
                {name: 'START_JAAR', type: 'int'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.PlanFasen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'PLAN_FASE_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.Milieucategorieen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'MILIECATEGORIE_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.WerklocatieTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'WERKLOCATIE_TYPE_OMSCHR', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.SpoorOntsluitingTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'SPOOR_ONTSLUITING_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.WaterOntsluitingTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'WATER_ONTSLUITING_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.ExtBereikbaarTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'EXT_BEREIKBAARHEID_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.ParkeergelegenheidTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'PARKEERGELEGENHEID_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.HerstructPlanTypen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'HERSTRUCT_PLAN_TYPE_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.HoofdoorzakenVeroud', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'HOOFDOORZAAK_VEROUD_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
        Ext.define('Bedrijventerreinen.model.HerstructFasen', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'CODE', type: 'string'},
                {name: 'HERSTRUCT_FASE_NAAM', type: 'string'},
                {name: 'BEGINDATUM', type: 'date'},
                {name: 'EINDDATUM', type: 'date'}
            ]
        });
    },
    initializeEnvironmentVariables:function(layer, successFunction, scope) {
        // agm_id
        // meting id
        // gemeente
        // peildatum ibis
        // peildatum mob
        
        // of voor huidige meting al correctievoorstellen zijn ingediend
        // of voor huidige meting al uitgifte is ingediend
        Ext.Ajax.request({
            url: actionBeans["mobeditfeature"],
            method: 'POST',
            params: {
                application: FlamingoAppLoader.get('appId'),
                appLayer: layer,
                retrieveVariables: true
            },
            scope: this,
            success: function (result) {
                var response = Ext.JSON.decode(result.responseText);
                scope = scope || this;
                if (response.success) {
                    scope.agm_id = response.AGM_ID;
                    scope.ag_id = response.AG_ID;
                    scope.meting_id = response.MOB_MTG_ID;
                    scope.gemeente_code = response.GEM_CODE_CBS;
                    scope.peildatum_mob = response.MOB_PEILDATUM;
                    scope.ingediend = response.IND_CORRECTIES_INGEDIEND_JN === 'J';
                    scope.uitgifteIngevuld = response.VERWACHTE_UITGIFTE !== null && response.VERWACHTE_UITGIFTE !== undefined;
                    scope.verwachteUitgifte = response.VERWACHTE_UITGIFTE;
                    successFunction.call(scope);
                } else {
                    this.showErrorDialog("Kan benodigde gegevens voor bedrijventerreinen niet ophalen.");
                }
            },
            failure: function (result) {
                this.showErrorDialog("Kan benodigde gegevens voor bedrijventerreinen niet ophalen.");
            }
        });
    },
    showErrorDialog: function(msg, title) {
        Ext.MessageBox.show({
            title: title || 'Er is iets mis gegaan',
            message: msg,
            buttons: Ext.Msg.OK,
            icon: Ext.Msg.ERROR
        });
    }
});