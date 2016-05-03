/*global
 Ext, GeoExt, OpenLayers, GEOR
 */

Ext.namespace("GEOR.Addons");

GEOR.Addons.Urbanisme = Ext.extend(GEOR.Addons.Base, {

    /**
     * {Ext.Window}
     */
    parcelleWindow: null,

    /**
     * //TODO Document
     */
    components: null,

    //TODO Document
    parcelleStore: null,

    init: function(record) {
        var action;


        if (this.target) {
            this.components = this.target.insertButton(this.position, {
                xtype: "button",
                enableToggle: true,
                tooltip: this.getTooltip(record),
                iconCls: "addon-urbanisme",
                listeners: {
                    "toggle": this.parcelleAction,
                    scope: this
                }
            });
            this.target.doLayout();
        }

        this.parcelleStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "ccopre",
                "ccosec",
                "dnupla",
                "dnvoiri",
                "cconvo",
                "dvoilib",
                "dcntpa"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "getParcelle"
            })
        });

        this.parcelleWindow = new Ext.Window({
            title: this.getText(record),
            width: 640,
            height: 540,
            closeAction: "hide",
            items: [{
                xtype: "panel",
                items: [
                    {
                        xtype: "dataview",
                        id: "parcelle-panel",
                        store: this.parcelleStore,
                        tpl: new Ext.XTemplate(
                            '<tpl for=".">',
                            '<p>ccosec: {ccosec}</p>',
                            '</tpl>'
                        )
                    }
                ]
            }],
            buttons: [
                {
                    //TODO tr
                    text: "Close",
                    handler: function() {
                        this.parcelleWindow.hide();
                    },
                    scope: this
                }
            ]
        })
    },

    parcelleAction: function() {
        this.parcelleStore.load({
            params: {
                parcelle: "350238000BX0285"
            },
            scope: this
        });
        this.parcelleWindow.show();
        this.components.toggle(false);
    },
});