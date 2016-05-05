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
        updateCommune: function(communeResp) {
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("commune", communeResp.get("libcom_min"));
            this.add([noteRecord]);
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
        },
        updateRenseignUrba: function(renseignUrbarRecord) {
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("libelle", renseignUrbarRecord.get("libelle"));
            this.add([noteRecord]);
        },
        updateProprio: function(proprioRecord) {
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("codeProprio", proprioRecord.get("comptecommunal"));
            noteRecord.set("adresseProprio", proprioRecord.get("dlign4") + " " + proprioRecord.get("dlign5") + " " +
                proprioRecord.get("dlign6"));
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

    /** api: config[encoding]
     * ``String`` The encoding to set in the headers when requesting the print
     * service. Prevent character encoding issues, especially when using IE.
     * Default is retrieved from document charset or characterSet if existing
     * or ``UTF-8`` if not.
     */
    encoding: document.charset || document.characterSet || "UTF-8",

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
                    "toggle": function() {
                        this.parcelleAction("350238000BX0285");
                    },
                    scope: this
                }
            });
            this.target.doLayout();
        }

        this.printProvider = new GeoExt.data.MapFishPrintv3Provider({
            method: "POST",
            url: this.options.printServerUrl
        }),

            //We load an empty note record, we will update it with the different requests
            this.noteStore.loadData([{"parcelle": 0}]);

        this.communeStore = new Ext.data.JsonStore({
            idProperty: "cgocommune",
            root: "",
            fields: [
                "cgocommune",
                "libcom_min"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "getCommune"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateCommune(records[0]);
                    },
                    scope: this
                }
            }
        });


        this.parcelleStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "parcelle",
                "commune",
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

        this.proprioStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "parcelle",
                "comptecommunal",
                "ddenom",
                "dlign4",
                "dlign5",
                "dlign6"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "getFIC"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateProprio(records[0]);
                    },
                    scope: this
                }
            }
        });

        this.renseignUrbaStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "parcelle",
                "libelle"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "renseignUrba"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateRenseignUrba(records[0]);
                    },
                    scope: this
                }
            }
        });

        this.printProvider.loadCapabilities();

        this.parcelleWindow = new Ext.Window({
            title: this.getText(record),
            width: 640,
            height: 380,
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
                            '<div class="parcelle">',
                            '<h1>Réglementation applicable à la parcelle Cadastrale</h1>',
                            '<h2>{parcelle}</h2>',
                            '<table class="table-parcelle">',
                            '<tr>',
                            '<td class="parcelle-table-label">code section</td>',
                            '<td>{commune} {codeSection}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">numéro parcelle</td>',
                            '<td>{numero}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">adresse du terrain</td>',
                            '<td>{adresseCadastrale}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">code Rivoli (Fantoir)</td>',
                            '<td>{contenanceDGFiP}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">Surface cadastrale (m²)</td>',
                            '<td>{surfaceSIG}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">Code propriétaire</td>',
                            '<td>{codeProprio}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">Adresse propriétaire</td>',
                            '<td>{adresseProprio}</td>',
                            '</tr>',
                            '</table>',
                            '<p>Zone {libelle}</p>',
                            '</div>',
                            '</tpl>'
                        )
                    }
                ]
            }],
            buttons: [
                {
                    //TODO tr
                    text: "Print",
                    handler: function() {
                        var params, centerLonLat;

                        centerLonLat = this.map.getCenter();

                        params = {
                            layout: "A4 portrait",
                            attributes: {
                                map: {
                                    scale: this.map.getScale(),
                                    center: [centerLonLat.lon, centerLonLat.lat],
                                    dpi: 72,
                                    layers: this.baseLayers(),
                                    projection: this.map.getProjection()
                                },
                                title: "Sample Print",
                                subtitle: "Subtitle",
                                codeSection: this.noteStore.getAt(0).get("codeSection")
                            }
                        };

                        Ext.Ajax.request({
                            url: this.options.printServerUrl + "report.pdf",
                            method: 'POST',
                            jsonData: (new OpenLayers.Format.JSON()).write(params),
                            headers: {"Content-Type": "application/json; charset=" + this.encoding},
                            success: function(response) {
                                callback(Ext.decode(response.responseText));
                            },
                            failure: function(response) {
                                this.fireEvent("printexception", this, response);
                            },
                            params: this.baseParams,
                            scope: this
                        });
                    },
                    scope: this
                }, {
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

    parcelleAction: function(parcelle) {
        //var parcelle = "350238000BX0285";
        this.communeStore.load({
            params: {
                cgocommune: parcelle.slice(0, 6)
            }
        })
        this.parcelleStore.load({
            params: {
                parcelle: parcelle
            }
        });
        this.renseignUrbaStore.load({
            params: {
                parcelle: parcelle
            }
        });
        this.proprioStore.load({
            params: {
                parcelle: parcelle,
                onglet: 1
            }
        });
        //No store because getInfoBulle don't return an array
        OpenLayers.Request.GET({
            url: this.options.cadastrappUrl + "getInfoBulle",
            params: {
                parcelle: parcelle
            },
            callback: function(resp) {
                this.noteStore.updateInfoBulle(resp.responseText);
            },
            scope: this
        });
        this.parcelleWindow.show();
        this.components.toggle(false);
    },


    /**
     * @function baseLayers - Encode every mapPanel layer using the print provider
     *
     * @returns {Array}
     */
    baseLayers: function() {

        var encodedLayer = null,
            encodedLayers = [];
        this.mapPanel.layers.each(function(layerRecord) {
            if (layerRecord.get("layer").visibility) {

                if (layerRecord.get("layer").name !== "__georchestra_print_bounds_") {
                    encodedLayer = this.printProvider.encodeLayer(layerRecord.get("layer"), this.map.getMaxExtent());
                }


                if (encodedLayer) {

                    if (encodedLayer.maxScaleDenominator) {
                        delete encodedLayer.maxScaleDenominator;
                    }
                    if (encodedLayer.minScaleDenominator) {
                        delete encodedLayer.minScaleDenominator;
                    }

                    encodedLayers.push(encodedLayer);
                }
            }
        }, this);


        return encodedLayers;
    },
});
