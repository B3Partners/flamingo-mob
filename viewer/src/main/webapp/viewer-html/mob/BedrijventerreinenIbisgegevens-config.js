/*
 * Copyright (C) 2012-2018 B3Partners B.V.
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
 * Custom configuration object for Contactform configuration
 * @author <a href="mailto:geertplaisier@b3partners.nl">Geert Plaisier</a>
 */
Ext.define("viewer.components.CustomConfiguration", {
    extend: "viewer.components.SelectionWindowConfig",
    constructor: function (parentId, configObject, configPage) {
        if (configObject === null) {
            configObject = {};
        }
        configObject.showLabelconfig = true;
        viewer.components.CustomConfiguration.superclass.constructor.call(this, parentId, configObject, configPage);
        this.getLayerList();
    },
    createConfigForm: function () {
        var me = this;
        this.form.add([
            {
                fieldLabel: "Ibisgegevens laag",
                labelWidth: this.labelWidth,
                name: "layer",
                id: "layer",
                xtype: "combo",
                emptyText: 'Maak uw keuze',
                store: me.layers,
                queryMode: 'local',
                displayField: 'alias',
                valueField: 'id',
                width: 700,
                value: this.configObject.layer || null
            },
            {
                fieldLabel: "URL naar help document",
                labelWidth: this.labelWidth,
                name: "helpUrl",
                id: "helpUrl",
                xtype: "textfield",
                width: 700,
                value: this.configObject.helpUrl || null
            }
        ]);
    },
    getDefaultValues: function () {
        return {
            details: {
                minWidth: 450,
                minHeight: 250
            }
        };
    },
    getLayerList: function () {
        var me = this;
        me.layers = null;
        Ext.Ajax.request({
            url: this.getContextpath() + "/action/componentConfigList",
            scope:this,
            params: {
                appId: this.getApplicationId(),
                attribute: true,
                layerlist: true
            },
            success: function (result, request) {
                var layers = Ext.JSON.decode(result.responseText);
                me.layers = Ext.create('Ext.data.Store', {fields: ['id', 'alias'], data: layers});
                me.createConfigForm();
            },
            failure: function () {
                Ext.MessageBox.alert("Foutmelding", "Er is een onbekende fout opgetreden waardoor de lijst met kaartlagen niet kan worden weergegeven");
            }
        });
    }
});

