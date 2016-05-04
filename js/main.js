/*global
 Ext, GeoExt, OpenLayers, GEOR
 */

Ext.namespace("GEOR.Addons");

Ext.namespace("GEOR.data");

(function() {
    var NoteStore = Ext.extend(Ext.data.JsonStore, {
        constructor: function(config) {
            config = Ext.apply({
                root: "",
                fields: ["parcelle",
                    "commune",
                    "codeSection",
                    "numero",
                    "adresseCadastrale",
                    "contenanceDGFiP",
                    "surfaceSIG",
                    "codeProprio",
                    "adresseProprio",
                    "libelle"
                ],
                proxy: new Ext.data.HttpProxy({
                    method: "POST",
                    //TODO read url from config
                    url: "http://localhost:8080/urbanisme/note"
                })
            }, config);

            NoteStore.superclass.constructor.call(this, config);

        },
        updateParcelle: function(parcelleRecord) {
            //We have trouble with record commit, we copy the record, update it, then add it
            var noteRecord = this.getAt(0).copy();

            noteRecord.set("parcelle", parcelleRecord.get("parcelle"));
            if (parcelleRecord.get("ccopre") !== "000") {
                noteRecord.set("codeSection", parcelleRecord.get("ccopre") + parcelleRecord.get("ccosec"));
            } else {
                noteRecord.set("codeSection", parcelleRecord.get("ccosec"));
            }
            noteRecord.set("numero", parcelleRecord.get("dnupla"));
            noteRecord.set("adresseCadastrale", parcelleRecord.get("dnvoiri") + " " + parcelleRecord.get("cconvo") +
                " " + parcelleRecord.get("dvoilib"));
            noteRecord.set("contenanceDGFiP", parcelleRecord.get("dcntpa"));
            this.add([noteRecord]);
        },
        updateInfoBulle: function(infoBulleResp) {
            var infoBulleJson = (new OpenLayers.Format.JSON()).read(infoBulleResp),
                noteRecord = this.getAt(0).copy();
            noteRecord.set("surfaceSIG", infoBulleJson.surfc.toFixed(1));
            this.add([noteRecord]);
        }
    });

    GEOR.data.NoteStore = NoteStore;

})();

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

    /**
     * {Object} - Data representing a Note de renseignement d'urbanisme
     */
    noteStore: new GEOR.data.NoteStore(),

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
                "parcelle",
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
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateParcelle(records[0]);
                    },
                    scope: this
                }
            }
        });

        this.noteStore.loadData([{"parcelle": 0}]);

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
                        store: this.noteStore,
                        tpl: new Ext.XTemplate(
                            '<tpl for=".">',
                            '<table>',
                            '<tr>',
                            '<td>code section</td>',
                            '<td>{codeSection}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>numéro parcelle</td>',
                            '<td>{numero}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>adresse du terrain</td>',
                            '<td>{adresseCadastrale}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>code Rivoli (Fantoir)</td>',
                            '<td>{contenanceDGFiP}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>Surface cadastrale (m²)</td>',
                            '<td>{surfaceSIG}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>Code propriétaire</td>',
                            '<td>{codeProprio}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>Adresse propriétaire</td>',
                            '<td>{adresseProprio}</td>',
                            '</tr>',
                            '</table>',
                            '<p>{libelle}</p>',
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
            }
        });
        //No store because getInfoBulle don't return an array
        OpenLayers.Request.GET({
            url: this.options.cadastrappUrl + "getInfoBulle",
            params: {
                parcelle: "350238000BX0285"
            },
            callback: function(resp) {
                this.noteStore.updateInfoBulle(resp.responseText);
            },
            scope: this
        });
        this.parcelleWindow.show();
        this.components.toggle(false);
    },
});