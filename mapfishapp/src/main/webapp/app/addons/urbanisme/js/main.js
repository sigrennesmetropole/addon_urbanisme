/*global
 Ext, GeoExt, OpenLayers, GEOR
 */

Ext.namespace("GEOR.Addons");

Ext.namespace("GEOR.data");


/**
 *  GEOR.data.NoteStore - JsonStore representing a « note de renseignement d'urbanisme
 *
 */
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
                    //libelles is note there because this is a one to many relationship
                ]
                //Add proxy configuration here if we want to upload Note data to server
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
            //padding idea comes from http://gugod.org/2007/09/padding-zero-in-javascript.html
            noteRecord.set("contenanceDGFiP", ("0000" + parcelleRecord.get("dcntpa")).slice(-4));
            this.add([noteRecord]);
        },
        updateInfoBulle: function(infoBulleResp) {
            var infoBulleJson = (new OpenLayers.Format.JSON()).read(infoBulleResp),
                noteRecord = this.getAt(0).copy();
            noteRecord.set("surfaceSIG", infoBulleJson.surfc.toFixed(1));
            this.add([noteRecord]);
        },
        updateProprio: function(proprioRecord) {
            if (proprioRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("codeProprio", proprioRecord.get("comptecommunal"));
            noteRecord.set("nomProprio", proprioRecord.get("ddenom"));
            noteRecord.set("adresseProprio", proprioRecord.get("dlign4") + " " + proprioRecord.get("dlign5") + " " +
                proprioRecord.get("dlign6"));
            this.add([noteRecord]);
        }
    });

    GEOR.data.NoteStore = NoteStore;

}());

/**
 * Urbanisme addon
 */
GEOR.Addons.Urbanisme = Ext.extend(GEOR.Addons.Base, {

    /**
     * Window containing the « note de renseignement d'urbanisme » - {Ext.Window}
     */
    parcelleWindow: null,

    /**
     * Window containing information about « zonage d'un plan local d'urbanisme » - {Ext.Window}
     */
    zonagePluWindow: null,

    /**
     * Informations retrieved from addon server about « libelles
     */
    libellesStore: null,

    /**
     * Data representing a Note de renseignement d'urbanisme - {Object}
     */
    noteStore: new GEOR.data.NoteStore(),

    /**
     * Informations retrieved from cadastrapp about « parcelle cadastrale » - {Ext.data.JsonStore}
     */
    parcelleStore: null,


    /**
     * Informations retrived from cadastrapp about owners - {Ext.data.JsonStore}
     */
    proprioStore: null,

    /**
     * Information about PLU - {Object}
     *
     * Data is retrieved from WMS
     */
    zonagePluData: null,

    /**
     * WMS layer of « cadastre » - {OpenLayers.Layer.WMS}
     */
    parcellesCadastralesLayer: null,

    /**
     * WMS layer of « zones d'un Plan local d'urbanisme  » - {OpenLayers.Layer.WMS}
     */
    zonesPluLayer: null,

    /** api: config[encoding]
     * ``String`` The encoding to set in the headers when requesting the print
     * service. Prevent character encoding issues, especially when using IE.
     * Default is retrieved from document charset or characterSet if existing
     * or ``UTF-8`` if not.
     */
    encoding: document.charset || document.characterSet || "UTF-8",

    init: function(record) {
        //TODO - Remove buttons from toolbar when testing is done
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
                        this.showParcelleWindow("350281000AA0001");
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
                        this.showZonagePluWindow();
                    },
                    scope: this
                }
            });

            this.target.doLayout();
        }

        Ext.each(this.map.layers, function(layer) {
            if (layer.params === undefined) {
                return;
            }
            if (layer.params.LAYERS === this.options.parcellesCadastralesLayer) {
                this.parcellesCadastralesLayer = layer;
            }
            if (layer.params.LAYERS === this.options.zonesPluLayer) {
                this.zonesPluLayer = layer;
            }
        }, this);


        this.createRenseignUrbaAction = function(layer) {
            return new GeoExt.Action({
                map: this.map,
                text: "i",
                iconCls: "addon-urbanisme-i-button",
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    layers: [layer],
                    infoFormat: "application/vnd.ogc.gml",
                    eventListeners: {
                        "getfeatureinfo": function(resp) {
                            this.showParcelleWindow(resp.features[0].attributes.id_parc);
                        },
                        scope: this
                    }
                }),
                toggleGroup: "map",
                tooltip: "Renseignement d'urbanisme sur la parcelle"
            });
        };

        this.createZonagePluAction = function(layer) {
            return new GeoExt.Action({
                map: this.map,
                text: "i",
                iconCls: "addon-urbanisme-i-button",
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    layers: [layer],
                    infoFormat: "application/vnd.ogc.gml",
                    eventListeners: {
                        "getfeatureinfo": function(resp) {
                            if (resp.features.length === 0) {
                                this.zonagePluData.empty = true;
                            } else {
                                this.zonagePluData.update(resp.features[0]);
                            }
                            this.showZonagePluWindow();
                        },
                        scope: this
                    }
                }),
                toggleGroup: "map",
                tooltip: "Zonage d'un PLU"
            });
        };

        var layerManager = Ext.getCmp("geor-layerManager");
        layerManager.root.eachChild(function(child) {
            if (child.layer.params.LAYERS === this.options.parcellesCadastralesLayer) {
                child.component.getComponent(0).insert(0, this.createRenseignUrbaAction(this.parcellesCadastralesLayer));
                child.component.doLayout();
            } else if (child.layer.params.LAYERS === this.options.zonesPluLayer) {
                child.component.getComponent(0).insert(0, this.createZonagePluAction(this.zonesPluLayer));
                child.component.doLayout();
            }

        }, this);


        this.printProvider = new GeoExt.data.MapFishPrintv3Provider({
            method: "POST",
            url: this.options.printServerUrl + "/print/"
        });

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
                url: GEOR.config.PATHNAME + "/ws/urbanisme/renseignUrba"
            })
        });

        this.zonagePluData = new (function(addon) {
            this.empty = true;
            this.feature = null;

            this.update = function(feature) {
                this.feature = feature;
                this.empty = false;
                this.communeInsee = this.feature.attributes.id_docurba.slice(4, 9);
                OpenLayers.Request.GET({
                    url: addon.options.cadastrappUrl + "getCommune",
                    params: {cgocommune: this.communeInsee},
                    callback: function(resp) {
                        //We assume that we will get one and only one result
                        this.commune = (new OpenLayers.Format.JSON()).read(resp.responseText)[0]["libcom_min"];
                        Ext.getCmp("zonage-plu-box").update(this);
                    },
                    scope: this
                });
            }

            this.getUrl = function() {
                if (this.empty) {
                    return "";
                }
                return addon.options.fileServerUrl + "?get_action=open_file&repository_id=" +
                    addon.options.fileRepositoryId +
                    "&file=" + encodeURI("/PLU : Plans locaux d'urbanisme/En vigueur/" + this.communeInsee + " " +
                        this.commune + "/04_reglement_litteral/" + this.feature.attributes.urlfic);
            };

            this.url = this.getUrl();

        })(this);

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
                        libellesArray = [];

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
                                    //TODO improve for production
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
                            url: this.options.printServerUrl + "/print/" + this.options.printServerApp + "/report.pdf",
                            method: 'POST',
                            jsonData: (new OpenLayers.Format.JSON()).write(params),
                            headers: {"Content-Type": "application/json; charset=" + this.encoding},
                            success: function(response) {
                                this._retrievePdf(Ext.decode(response.responseText));
                            },
                            failure: function(response) {
                                //TODO Manage this case
                                this.fireEvent("printexception", this, response);
                            },
                            params: this.baseParams,
                            scope: this
                        });
                    },
                    scope: this
                }, {

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
                            '<tpl if="values.empty==false" >',
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
                            '</tpl>', // end of if values.empty == false
                            '<tpl if="values.empty==true" ><p>Pas de PLU numérique disponible pour cette commune.</p></tpl>',
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

    showParcelleWindow: function(parcelle) {
        this.communeStore.load({
            params: {
                cgocommune: parcelle.slice(0, 6)
            }
        });
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


    showZonagePluWindow: function() {
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

    _retrievePdf: function(resp) {
        var addon = this,
            downloadURL = resp.downloadURL,
            statusURL = resp.statusURL,
            task = Ext.TaskMgr.start({
                run: function(resp) {
                    Ext.Ajax.request({
                        url: addon.options.printServerUrl + statusURL,
                        method: 'GET',
                        headers: {"Content-Type": "application/json; charset=" + this.encoding},
                        success: function(response) {
                            var resp = Ext.decode(response.responseText);
                            if (resp.done) {
                                if (resp.status === "finished") {
                                    window.location.href = addon.options.printServerUrl + downloadURL;
                                    Ext.TaskMgr.stop(task);
                                }
                            }
                        },
                        failure: function(response) {
                            GEOR.util.errorDialog({
                                msg: "L'impression a échoué"
                            });
                            Ext.TaskMgr.stop(task);
                        },
                        scope: this
                    });


                },
                interval: 3000
            });


    }
});
