/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


/* global Ext */

Ext.define ("viewer.components.BedrijventerreinenCorrectievoorstel", {
    extend: "viewer.components.Component",
    bedrijventerrein: null,
    stores: {},
    config:{
        title: null,
        titlebarIcon: null,
        tooltip: null,
        label: "",
        details: {
            minWidth: 700,
            minHeight: 400,
            useExtLayout: true
        }
    },
    constructor: function (conf) {
        if(!Ext.isDefined(conf.showLabels)) conf.showLabels = true; 
        this.initConfig(conf);
        viewer.components.BedrijventerreinenCorrectievoorstel.superclass.constructor.call(this, this.config);
        
        this.loadWindow();
        return this;
    },
    loadWindow: function(){
        var me = this;
        this.renderButton({
            handler: function(){
                me.buttonClick();
            },
            text: me.config.title,
            icon: me.config.iconUrl,
            tooltip: me.config.tooltip,
            label: me.config.label
        });
    }
});