/*global
 Ext, GeoExt, OpenLayers, GEOR
 */
Ext.namespace("GEOR.Addons", "GEOR.data");


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
                        //libelles is not in the list because this is a one to many relationship
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
            noteRecord.set("adresseProprio", proprioRecord.get("dlign4").trim() + " " + proprioRecord.get("dlign5").trim() + " " +
                proprioRecord.get("dlign6").trim());
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

        this.vectorLayer = new OpenLayers.Layer.Vector("__georchestra_"+record.get("id"), {
            displayInLayerSwitcher: false,
            styleMap: GEOR.util.getStyleMap({
                "default": {
                    strokeWidth: 3,
                    fillOpacity: 0
                }
            })
        });

        this.createRenseignUrbaAction = function(layer) {
            return new GeoExt.Action({
                map: this.map,
                iconCls: "urbanisme-btn-red-info",
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    layers: [layer],
                    infoFormat: "application/vnd.ogc.gml",
                    eventListeners: {
                        "getfeatureinfo": function(resp) {
                            var f = resp.features[0];
                            if (!f) {
                                return;
                            }
                            // reproject features if needed
                            var r =  /.+srsName=\"(.+?)\".+/.exec(resp.text);
                            if (r && r[1]) {
                                var srsString = r[1],
                                    srsName = srsString.replace(/.+[#:\/](\d+)$/, "EPSG:$1");
                                if (this.map.getProjection() !== srsName) {
                                    var sourceSRS = new OpenLayers.Projection(srsName),
                                        destSRS = this.map.getProjectionObject();
                                    if (f.geometry && !!f.geometry.transform) {
                                        f.geometry.transform(sourceSRS, destSRS);
                                    }
                                    if (f.bounds && !!f.bounds.transform) {
                                        f.bounds.transform(sourceSRS, destSRS);
                                    }
                                }
                            }
                            if (this.map.layers.indexOf(this.vectorLayer) == -1) {
                                this.map.addLayer(this.vectorLayer);
                            } else {
                                this.vectorLayer.destroyFeatures();
                            }
                            this.vectorLayer.addFeatures([f]);
                            this.showParcelleWindow(f.attributes.id_parc);
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
                iconCls: "urbanisme-btn-red-info",
                control: new OpenLayers.Control.WMSGetFeatureInfo({
                    layers: [layer],
                    infoFormat: "application/vnd.ogc.gml",
                    eventListeners: {
                        "getfeatureinfo": function(resp) {
                            if (resp.features.length === 0) {
                                this.zonagePluData.update(null);
                            } else {
                                // modification du format date, cf https://github.com/sigrennesmetropole/addon_urbanisme/issues/17
                                var f = resp.features[0],
                                    d = f.attributes.datvalid,
                                    year = d.substr(0,4),
                                    month = d.substr(4,2),
                                    day = d.substr(6,2);
                                f.attributes.datvalid = [day, month, year].join('/');
                                // convert vocation dominante & typezone codes
                                // to human readable label
                                // See config.json
                                f.attributes.typezoneI18n = this.options['typezonesimplifie'][f.attributes.typezone];
                                f.attributes.destdomiI18n = this.options['vocationdominante'][f.attributes.destdomi];
                                // fin modification datvalid
                                this.zonagePluData.update(f);
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
        this.noteStore.loadData([{
            "parcelle": 0
        }]);

        this.communeStore = new Ext.data.JsonStore({
            idProperty: "cgocommune",
            root: "",
            fields: [
                "cgocommune",
                "libcom_min"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "/getCommune"
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
                url: this.options.cadastrappUrl + "/getParcelle"
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
                url: this.options.cadastrappUrl + "/getFIC"
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
                url: this.options.printServerUrl + "/renseignUrba"
            })
        });

        this.zonagePluData = new(function(addon) {
            this.empty = true;
            this.feature = null;

            this.update = function(feature) {
                this.feature = feature;
                if (feature === null) {
                    this.communeInsee = null;
                    this.empty = true;
                    //TODO Remove after check
                    var zonagePluBox = Ext.getCmp("zonage-plu-box");
                    if (zonagePluBox.el) {
                        zonagePluBox.update(this);
                    }
                } else {
                    this.empty = false;
                    this.communeInsee = this.feature.attributes.id_docurba.slice(4, 9);
                    OpenLayers.Request.GET({
                        url: addon.options.cadastrappUrl + "/getCommune",
                        params: {
                            cgocommune: this.communeInsee
                        },
                        callback: function(resp) {
                            //We assume that we will get one and only one result
                            this.commune = (new OpenLayers.Format.JSON()).read(resp.responseText)[0]["libcom_min"];
                            this.url = this.getUrl();
                            Ext.getCmp("zonage-plu-box").update(this);
                        },
                        scope: this
                    });
                }
            };

            this.getUrl = function() {
                if (this.empty) {
                    return "";
                }
                return encodeURI(this.feature.attributes.urlfic);
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
                items: [{
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
                }]
            }],
            buttons: [{
                //TODO tr
                text: "Imprimer",
                iconCls: 'mf-print-action',
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
                        url: this.options.printServerUrl + "/print/report.pdf",
                        method: 'POST',
                        jsonData: (new OpenLayers.Format.JSON()).write(params),
                        headers: {
                            "Content-Type": "application/json; charset=" + this.encoding
                        },
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
                    this.map.removeLayer(this.vectorLayer);
                    this.vectorLayer.destroyFeatures();
                    this.parcelleWindow.hide();
                },
                scope: this
            }]
        });

        this.zonagePluWindow = new Ext.Window({
            title: "Information sur un zonage d'un PLU",
            width: 540,
            height: 340,
            closeAction: "hide",
            items: [{
                xtype: "panel",
                items: [{
                    xtype: "dataview",
                    //height: 300, //TODO remove
                    //width: 530, //TODO remove
                    id: "zonage-plu-box",
                    data: this.zonagePluData,
                    tpl: new Ext.XTemplate(
                        '<div class="zonage">',
                        // start of if values.empty == false
                        '<tpl if="values.empty==false" >',
                        //start of zonage-attribs
                        ' <div class="zonage-attribs">',
                        // nom de la commune
                        '    <div id="commune" class="zonage-pair">',
                        '      <div class="zonage-attrib-label"></div>',
                        '      <div class="zonage-attrib-commune">{values.commune}</div>',
                        '    </div>',
                        // date de validité
                        '    <div id="date-plu-en-vigueur" class="zonage-pair">',
                        '      <div class="zonage-attrib-label">PLU en vigueur au</div>',
                        '      <div class="zonage-attrib-value">{values.feature.attributes.datvalid}</div>',
                        '    </div>',
                        // type du zonage (libelle) + url vers le PDF + label long
                        '    <div id="type-libelle" class="zonage-pair">',
                        '      <div class="zonage-attrib-label">Type de la zone :</div>',
                        '      <div class="zonage-attrib-zonage">',
                        '        <a href="{values.url}" target="_blank" class="zonage-attrib-zonage">{values.feature.attributes.libelle}</a>',
                        '        <br />{values.feature.attributes.libelong}',
                        '      </div>',
                        '    </div>',
                        // Type simplifié
                        '    <div id="vocation-dominante" class="zonage-pair">',
                        '      <div class="zonage-attrib-label">Type simplifié :</div>',
                        '      <div class="zonage-attrib-value">{values.feature.attributes.typezone} - {values.feature.attributes.typezoneI18n}</div>',
                        '    </div>',
                        '  </div>',
                        // vocation dominante
                        '    <div id="vocation-dominante" class="zonage-pair">',
                        '      <div class="zonage-attrib-label">Vocation dominante :</div>',
                        '      <div class="zonage-attrib-value">{values.feature.attributes.destdomi} - {values.feature.attributes.destdomiI18n}</div>',
                        '    </div>',
                        '  </div>',
                        //end of zonage-attribs
                        '</tpl>', // end of if values.empty == false

                        // if no values / empty values
                        '<tpl if="values.empty==true" >',
                        ' <h1>Pas de PLU numérique disponible pour cette commune.</h1></tpl>',
                        '</div>'
                    )
                }]
            }],
            buttons: [{
                //TODO tr
                text: "Fermer",
                handler: function() {
                    this.zonagePluWindow.hide();
                },
                scope: this
            }]
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
            url: this.options.cadastrappUrl + "/getInfoBulle",
            params: {
                parcelle: parcelle
            },
            callback: function(resp) {
                this.noteStore.updateInfoBulle(resp.responseText);
            },
            scope: this
        });
        this.parcelleWindow.show();

    },


    showZonagePluWindow: function() {
        this.zonagePluWindow.show();
        Ext.getCmp("zonage-plu-box").update(this.zonagePluData);
    },


    /**
     * @function baseLayers - Encode every mapPanel layer using the print provider
     *
     * @returns {Array}
     */
    baseLayers: function() {
        var encodedLayers = [],
            wmsc2wms = this.options.wmsc2wms;
        this.mapPanel.layers.each(function(r) {
            var encodedLayer,
                l = r.getLayer();
            // loop on all visible layers
            // not the vector layers used by addons (matching "__georchestra")
            // but ... print the vector layer used by this addon (matching __georchestra_urbanisme)
            if ((l.getVisibility() && !/^__georchestra/.test(l.name)) || /^__georchestra_urbanisme/.test(l.name)) {
                // use print provider to encode
                encodedLayer = this.printProvider.encodeLayer(l, this.map.getMaxExtent());
                // substitute known WMS-C instances by WMS instances serving same layers:
                if (wmsc2wms && wmsc2wms.hasOwnProperty(encodedLayer.baseURL)) {
                    encodedLayer.baseURL = wmsc2wms[encodedLayer.baseURL];
                }
                // we get rid of scale limits, 
                // since they are already taken care of by the current layer style
                delete encodedLayer.maxScaleDenominator;
                delete encodedLayer.minScaleDenominator;
                encodedLayers.push(encodedLayer);
            }
        }, this);
        return encodedLayers.reverse();
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
                        headers: {
                            "Content-Type": "application/json; charset=" + this.encoding
                        },
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


    },

    destroy: function() {
        var layerManager = Ext.getCmp("geor-layerManager");
        layerManager.root.eachChild(function(child) {
            if (child.layer.params.LAYERS === this.options.parcellesCadastralesLayer) {
                //TODO - Check if we remove the right component
                child.component.getComponent(0).getComponent(0).destroy();
            } else if (child.layer.params.LAYERS === this.options.zonesPluLayer) {
                //TODO - Check if we remove the right component
                child.component.getComponent(0).getComponent(0).destroy();
            }

        }, this);
        
        this.map.removeLayer(this.vectorLayer);
        this.vectorLayer.destroyFeatures();

        this.parcelleWindow.destroy();
        this.zonagePluWindow.destroy();
        this.libellesStore.destroy();
        this.noteStore.destroy();
        this.parcelleStore.destroy();
        this.proprioStore.destroy();
        this.zonagePluData = null;
        GEOR.Addons.Base.prototype.destroy.call(this);
    }
});
