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
                    "nomProprio",
                    "adresseProprio"
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
            var parcelle, noteRecord = this.getAt(0).copy();

            parcelle = parcelleRecord.get("parcelle");
            noteRecord.set("parcelle", parcelle);
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
        updateProprio: function(proprioRecord) {
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("codeProprio", proprioRecord.get("comptecommunal"));
            noteRecord.set("nomProprio", proprioRecord.get("ddenom"));
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
                        //TEST : "350238000BX0285"
                        //TEST : "350281000AA0001"
                        this.parcelleAction("350281000AA0001");
                    },
                    scope: this
                }
            });
            this.components2 = this.target.insertButton(this.position, {
                xtype: "button",
                enableToggle: true,
                tooltip: "Zonage d'un PLU",
                iconCls: "addon-urbanisme",
                listeners: {
                    "toggle": function() {
                        this.zonagePluAction("Z1000");
                    },
                    scope: this
                }
            });

            this.target.doLayout();
        }

        var layerManager = Ext.getCmp("geor-layerManager");
        layerManager.root.eachChild(function(child) {
            if (child.layer.params.LAYERS !== this.options.parcellesCadastralesLayer) {
                return;
            }
            var noteAction = new GeoExt.Action({
                map: this.map,
                iconCls: "addon-urbanisme",
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    layers: this.parcellesCadastralesLayer,
                    infoFormat: 'application/vnd.ogc.gml',
                    eventListeners: {
                        "getfeatureinfo": function(resp) {
                            var parcelle;
                            //TODO retrieve the id using the feature
                            //matricule = resp.features.attributes.idParcelle
                            parcelle = "350238000BX0285"
                            this.parcelleAction(parcelle);
                        },
                        scope: this
                    }
                }),
                toggleGroup: "map",
                tooltip: "Renseignement d'urbanisme sur la parcelle",
            });
            child.component.getComponent(0).insert(0, new Ext.Button(noteAction));
            child.component.doLayout();
        }, this);


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

        this.libellesStore = new Ext.data.JsonStore({
            root: "libelles",
            //TODO add better id
            fields: [
                "libelle"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "renseignUrba"
            })
        });

        this.zonagePluData = new (function(addonOptions) {
            this.addonOptions = addonOptions;
            this.feature = new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.fromWKT("SRID=3948;POLYGON((1348381.125 7216119.5,1348382.875 7216124,1348386.625 7216144.5,1348385.125 7216145,1348389.375 7216166,1348400.25 7216220.5,1348401 7216224.5,1348421.375 7216213.5,1348450.25 7216189,1348467.5 7216173.5,1348470.75 7216175.5,1348498.75 7216191.5,1348527.125 7216207.5,1348562.5 7216228,1348599.375 7216249.5,1348603.75 7216241.5,1348608.75 7216233,1348526.75 7216177,1348510.375 7216139.5,1348506.75 7216136.5,1348534.375 7216110,1348540.25 7216106.5,1348557 7216096.5,1348595.375 7216090.5,1348591.875 7216087,1348591 7216083.5,1348589.625 7216077.5,1348589.125 7216065.5,1348589 7216061,1348588.25 7216043,1348586.75 7216021,1348536.625 7216026.5,1348538 7216039,1348538.5 7216053.5,1348538.5 7216066,1348537.875 7216078.5,1348537.625 7216088.5,1348535.375 7216092,1348530.75 7216091,1348501.5 7216091,1348445.875 7216098.5,1348387.125 7216108,1348382.25 7216109,1348382.625 7216112.5,1348381.125 7216119.5))"),
                {
                    id_docurba: "00003506620140602",
                    idzone: "Z1000",
                    libelle: "1AUD2o",
                    libelong: "A Urbaniser alternatif",
                    urlfic: "s. o.",
                    destdomi: "Activité agricole",
                    datvalid: "20160506"
                }
            );

            this.communeInsee = this.feature.attributes.id_docurba.slice(4, 9);
            OpenLayers.Request.GET({
                url: addonOptions.cadastrappUrl + "getCommune",
                params: {cgocommune: this.communeInsee},
                callback: function(resp) {
                    //We assume that we will get one and only one result
                    this.commune = (new OpenLayers.Format.JSON()).read(resp.responseText)[0]["libcom_min"]
                },
                scope: this
            });

            this.getUrl = function() {
                return addonOptions.fileServerUrl + "?get_action=open_file&repository_id=" +
                    addonOptions.fileRepositoryId +
                    "&file=" + encodeURI("/PLU : Plans locaux d'urbanisme/En vigueur/" + this.communeInsee + " " +
                        this.commune + "/04_reglement_litteral/" + this.feature.attributes.urlfic);
            };
            this.url = this.getUrl();
        })(this.options);

        this.printProvider.loadCapabilities();

        this.parcelleWindow = new Ext.Window({
            title: this.getText(record),
            width: 640,
            height: 380,
            closeAction: "hide",
            autoScroll: true,
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
                            '<h1>Réglementation applicable à la parcelle cadastrale</h1>',
                            '<h2>{parcelle}</h2>',
                            '<table class="table-parcelle">',
                            '<tr>',
                            '<td class="parcelle-table-label">commune</td>',
                            '<td>{commune}</td>',
                            '</tr>',
                            '<tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">code section</td>',
                            '<td>{codeSection}</td>',
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
                            '<td class="parcelle-table-label">surface cadastrale (m²)</td>',
                            '<td>{surfaceSIG}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">code propriétaire</td>',
                            '<td>{codeProprio}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">nom propriétaire</td>',
                            '<td>{nomProprio}</td>',
                            '</tr>',
                            '<tr>',
                            '<td class="parcelle-table-label">adresse propriétaire</td>',
                            '<td>{adresseProprio}</td>',
                            '</tr>',
                            '</table>',
                            '</div>',
                            '</tpl>'
                        )
                    }, {
                        xtype: "dataview",
                        id: "parcelle-libelles",
                        store: this.libellesStore,
                        tpl: new Ext.XTemplate(
                            '<div class="parcelle">',
                            '<tpl for=".">',
                            '<p class="libelle">{libelle}</p>',
                            '</tpl>',
                            '</div>'
                        )
                    }
                ]
            }],
            buttons: [
                {
                    //TODO tr
                    text: "Imprimer",
                    handler: function() {
                        var params, centerLonLat, libellesArray, libellesAsString;

                        centerLonLat = this.map.getCenter();
                        libellesArray = []

                        this.libellesStore.each(function(record) {
                            libellesArray.push(record.get("libelle"));

                        });

                        libellesAsString = libellesArray.join("\n\n");

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
                                parcelle: this.noteStore.getAt(0).get("parcelle"),
                                commune: this.noteStore.getAt(0).get("commune"),
                                codeSection: this.noteStore.getAt(0).get("codeSection"),
                                numero: this.noteStore.getAt(0).get("numero"),
                                adresseCadastrale: this.noteStore.getAt(0).get("adresseCadastrale"),
                                contenanceDGFiP: this.noteStore.getAt(0).get("contenanceDGFiP"),
                                surfaceSIG: this.noteStore.getAt(0).get("surfaceSIG"),
                                codeProprio: this.noteStore.getAt(0).get("codeProprio"),
                                nomProprio: this.noteStore.getAt(0).get("nomProprio"),
                                adresseProprio: this.noteStore.getAt(0).get("adresseProprio"),
                                libelles: libellesAsString

                            }
                        };

                        Ext.Ajax.request({
                            url: this.options.printServerUrl + "report.pdf",
                            method: 'POST',
                            jsonData: (new OpenLayers.Format.JSON()).write(params),
                            headers: {"Content-Type": "application/json; charset=" + this.encoding},
                            success: function(response) {
                                this._retreivePdf(Ext.decode(response.responseText));
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
                    text: "Fermer",
                    handler: function() {
                        this.parcelleWindow.hide();
                    },
                    scope: this
                }
            ]
        });

        this.zonagePluWindow = new Ext.Window({
            title: "Information sur un zonage d'un PLU",
            width: 540,
            height: 340,
            closeAction: "hide",
            items: [{
                xtype: "panel",
                items: [
                    {
                        xtype: "dataview",
                        height: 300, //TODO remove
                        width: 530, //TODO remove
                        id: "zonage-plu-box",
                        data: this.zonagePluData,
                        tpl: new Ext.XTemplate(
                            '<div class="zonage">',
                            '<h1>Information sur un zonage d\'un PLU</h1>',
                            '<div class="zonage-attribs">',
                            '<div id="commune" class="zonage-pair">',
                            '<div class="zonage-attrib-label">Commune : </div>',
                            '<div class="zonage-attrib-value">{values.commune}</div>',
                            '</div>', // end of commune
                            '<div id="type-libelle" class="zonage-pair">',
                            '<div class="zonage-attrib-label">Type : </div>',
                            '<div class="zonage-attrib-value"><a href="{values.url}">{values.feature.attributes.libelle}</a></div>',
                            '</div>', // end of type-libelle
                            '<div id="type-description" class="zonage-pair">',
                            '<div class="zonage-attrib-label"></div>',
                            '<div class="zonage-attrib-value"><a href="{values.url}">{values.feature.attributes.libelong}</a></div>',
                            '</div>', // end of type-description
                            '<div id="vocation-dominante" class="zonage-pair">',
                            '<div class="zonage-attrib-label">Vocation dominante : </div>',
                            '<div class="zonage-attrib-value">{values.feature.attributes.destdomi}</div>',
                            '</div>', // end of vocation-dominante
                            '<div id="date-plu-en-vigueur" class="zonage-pair">',
                            '<div class="zonage-attrib-label">PLU en vigueur au : </div>',
                            '<div class="zonage-attrib-value">{values.feature.attributes.datvalid}</div>',
                            '</div>', // end of vocation-dominante
                            '</div>', //end of zonage-attribs
                            '</div>'
                        )
                    }
                ]
            }],
            buttons: [
                {
                    //TODO tr
                    text: "Fermer",
                    handler: function() {
                        this.zonagePluWindow.hide();
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
        this.libellesStore.load({
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


    zonagePluAction: function(idzone) {
        this.zonagePluWindow.show();
        this.components2.toggle(false);
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

    _retreivePdf: function(resp) {

    }
});
