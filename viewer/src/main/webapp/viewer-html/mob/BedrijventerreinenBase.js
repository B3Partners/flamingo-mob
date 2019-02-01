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
 * Bedrijventerreinen base component
 * @author <a href="mailto:geertplaisier@b3partners.nl">Geert Plaisier</a>
 * @author <a href="mailto:meinetoonen@b3partners.nl">Meine Toonen</a>
 */
Ext.define ("viewer.components.BedrijventerreinenBase", {
    singleton : true,
    defineModels: function() {
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
    }
});