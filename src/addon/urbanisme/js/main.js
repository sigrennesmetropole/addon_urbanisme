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
                        "adresseProprio",
                        "dateRU",
                        "datePCI",
                        "typeDocument",
                        "num_dossier",
                        "nom",
                        "ini_instru",
                        "num_nom",
                        "id_parcelle"

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
            if (parcelleRecord.get("dnvoiri") || parcelleRecord.get("cconvo")
                || parcelleRecord.get("dvoilib")) {
                noteRecord.set("adresseCadastrale", parcelleRecord.get("dnvoiri")
                    + " " + parcelleRecord.get("cconvo")
                    + " " + parcelleRecord.get("dvoilib")
                );
            } else {
                noteRecord.set("adresseCadastrale", "");
            }
            //padding idea comes from http://gugod.org/2007/09/padding-zero-in-javascript.html
            noteRecord.set("contenanceDGFiP", (parcelleRecord.get("dcntpa")));
            this.add([noteRecord]);
        },
        updateProprio: function(proprioRecord) {
            if (proprioRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("nomProprio", proprioRecord.get("app_nom_usage"));
            noteRecord.set("codeProprio", proprioRecord.get("comptecommunal"));
            noteRecord.set("adresseProprio", proprioRecord.get("dlign4").trim() + " " + proprioRecord.get("dlign5").trim() + " " +
                proprioRecord.get("dlign6").trim());
            this.add([noteRecord]);
        },
        updateProprioSurf: function(proprioSurfRecord) {
            if (proprioSurfRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("surfaceSIG", (proprioSurfRecord.get("surfc")));
            this.add([noteRecord]);
        },

        updateDate: function(dateRecord) {
            if (dateRecord === undefined) {
                return;
            }
            var date_Pci = dateRecord.get("date_pci").slice(3, 10);
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("dateRU", dateRecord.get("date_ru"));
            noteRecord.set("datePCI",date_Pci);
            this.add([noteRecord]);
        },

        updateTypeDocument: function(typeDocumentRecord) {
            if (typeDocument === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("typeDocument", typeDocumentRecord.get("type"));
            this.add([noteRecord]);
        },

        updateAdsAutorisation: function(adsAutorisationRecord) {
            if (adsAutorisationRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();

            var ads= "Aucun ADS trouvé pour la parcelle";

            var arr=adsAutorisationRecord.get("numdossier");
            var AdsArray = [];
            if(arr.length == 0){
                AdsArray.push(ads);
            }else {
                for (var i in arr) {
                    AdsArray.push(arr[i].numdossier)
                }
            }

            noteRecord.set("num_dossier",AdsArray);


            this.add([noteRecord]);
        },

        updateAdsInstruction: function(adsInstructionRecord) {
            if (adsInstructionRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("nom", adsInstructionRecord.get("nom"));
            noteRecord.set("ini_instru", adsInstructionRecord.get("ini_instru"));

            this.add([noteRecord]);
        },

        updateReferentQuartier: function(referentQuartierRecord) {
            if (referentQuartierRecord === undefined) {
                return;
            }
            var noteRecord = this.getAt(0).copy();
            noteRecord.set("num_nom", referentQuartierRecord.get("numnom"));
            noteRecord.set("id_parcelle", referentQuartierRecord.get("parcelle"));
            this.add([noteRecord]);
        },
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
     * Window containing information about « ADS » - {Ext.Window}
     */
    ficheAdsWindow: null,

    /**
     * Information retrieved from addon server about « libelles
     */
    libellesStore: null,

    /**
     * Data representing a Note de renseignement d'urbanisme - {Object}
     */
    noteStore: new GEOR.data.NoteStore(),


    /**
     * Information retrieved from cadastrapp about « parcelle cadastrale » - {Ext.data.JsonStore}
     */
    parcelleStore: null,


    /**
     * Information retrived from cadastrapp about owners - {Ext.data.JsonStore}
     */
    proprioStore: null,

    /**
     * Information retrived from cadastrapp about surfaceSIG - {Ext.data.JsonStore}
     */
    proprioStoreSurf: null,

    /**
     * Information retrieved from addon server about « date
     */
    dateStore: null,

    /**
     * Information retrieved from addon server about « typeDocument
     */
    typeDocumentStore: null,

    /**
     * Information retrieved from addon server about « adsInstruction
     */
    adsInstructionStore: null,

    /**
     * Information retrieved from addon server about « adsAutorisation
     */
    adsAutorisationStore: null,

    /**
     * Information retrieved from addon server about « referentQuartier
     */
    referentQuartierStore: null,

    /**
     * Information about PLU - {Object}
     *
     * Data is retrieved from WMS
     */
    zonagePluData: null,

    /** api: config[encoding]
     * ``String`` The encoding to set in the headers when requesting the print
     * service. Prevent character encoding issues, especially when using IE.
     * Default is retrieved from document charset or characterSet if existing
     * or ``UTF-8`` if not.
     */
    encoding: document.charset || document.characterSet || "UTF-8",

    init: function(record) {

        this.vectorLayer = new OpenLayers.Layer.Vector("__georchestra_"+record.get("id"), {
            displayInLayerSwitcher: false,
            styleMap: GEOR.util.getStyleMap({
                "default": {
                    strokeWidth: 3,
                    fillOpacity: 0
                }
            })
        });

        // reference to the get feature info control
        var renseignUrbaControl = new OpenLayers.Control.WMSGetFeatureInfo({
            // empty list of layers to be filled when layer is found or created
            layers: [],
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
        });
        var renseignUrbaAction = new GeoExt.Action({
            map: this.map,
            iconCls: "urbanisme-btn-red-info",
            control: renseignUrbaControl,
            listeners: {
                toggle: function(button, pressed) {
                    if (pressed) {
                        this._addLayer(
                            this.options.cadastre.layer,
                            this.options.cadastre.service,
                            function(layer) {
                                renseignUrbaControl.layers = [layer];
                                layer.events.register('removed', null, function() {
                                    renseignUrbaControl.deactivate();
                                });
                            }
                        );
                    } else {
                        // unset feature info
                        renseignUrbaControl.layers = [];
                    }
                },
                scope: this
            },
            width: 50,
            toggleGroup: "map",
            iconAlign: 'top',
            text: "NRU",
            tooltip: "Renseignement d'urbanisme sur la parcelle"
        });

        var zonagePluControl = new OpenLayers.Control.WMSGetFeatureInfo({
            // empty list of layers to be filled when layer is found or created
            layers: [],
            infoFormat: "application/vnd.ogc.gml",
            eventListeners: {
                "getfeatureinfo": function(resp) {
                    if (resp.features.length === 0) {
                        this.zonagePluData.update(null);
                    } else {
                        // modification du format date, cf https://github.com/sigrennesmetropole/addon_urbanisme/issues/17
                        var f = resp.features[0],
                            d = f.attributes.datvalid,
                            nomfic = f.attributes.nomfic,
                            yearValid = d.substr(0,4),
                            monthValid = d.substr(4,2),
                            dayValid = d.substr(6,2),
                            p = f.attributes.id_docurba,
                            yearAppro = p.substr(-8,4),
                            monthAppro = p.substr(-4,2),
                            dayAppro = p.substr(-2,2);
                        f.attributes.datappro = [dayAppro, monthAppro, yearAppro].join('/');
                        f.attributes.datvalid = [dayValid, monthValid, yearValid].join('/');
                        // convert vocation dominante & typezone codes
                        // to human readable label
                        // See config.json
                        f.attributes.typezoneI18n = this.options['typezonesimplifie'][f.attributes.typezone];
                        f.attributes.destdomiI18n = this.options['vocationdominante'][f.attributes.destdomi];
                        f.attributes.zipfile = nomfic.substr(0, 5) + '_PLU_' + p.substr(-8,8) + '.zip';
                        f.attributes.zipurl = this.options.zipBaseURL + '/' + nomfic.substr(0, 5) + '/envigueur/' + f.attributes.zipfile;
                        // fin modification attributs
                        this.zonagePluData.update(resp.features[0]);
                    }
                    this.showZonagePluWindow();
                },
                scope: this
            }
        });
     
     // Désactivation du bouton PLU suite au passage au PLUi #60
        /* var zonagePluAction = new GeoExt.Action({
            map: this.map,
            iconCls: "urbanisme-btn-red-info",
            control: zonagePluControl,
            listeners: {
                toggle: function(button, pressed) {
                    if (pressed) {
                        this._addLayer(
                            this.options.plu.layer,
                            this.options.plu.service,
                            function(layer) {
                                zonagePluControl.layers = [layer];
                                layer.events.register('removed', null, function() {
                                    zonagePluControl.deactivate();
                                });
                            }
                        );
                    } else {
                        // unset feature info
                        zonagePluControl.layers = [];
                    }
                },
                scope: this
            },
            width: 50,
            toggleGroup: "map",
            iconAlign: 'top',
            text: "PLU",
            tooltip: "Information sur un zonage d'un PLU"
        });
        */

        // reference to the get feature info control
        var ficheAdsControl = new OpenLayers.Control.WMSGetFeatureInfo({
            // empty list of layers to be filled when layer is found or created
            layers: [],
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
                    this.showAdsWindow(f.attributes.id_parc);
                },
                scope: this
            }
        });

        var ficheAdsAction = new GeoExt.Action({
            map: this.map,
            iconCls: "urbanisme-btn-red-info",
            control: ficheAdsControl,
            listeners: {
                toggle: function(button, pressed) {
                    if (pressed) {
                        this._addLayer(
                            this.options.cadastre.layer,
                            this.options.cadastre.service,
                            function(layer) {
                                ficheAdsControl.layers = [layer];
                                layer.events.register('removed', null, function() {
                                    ficheAdsControl.deactivate();
                                });
                            }
                        );
                    } else {
                        // unset feature info
                        ficheAdsControl.layers = [];
                    }
                },
                scope: this
            },
            width: 50,
            toggleGroup: "map",
            iconAlign: 'top',
            text: "ADS",
            tooltip: "Renseignement d'urbanisme sur la fiche ADS"
        });

        var helpAction = {
            tooltip : OpenLayers.i18n("Help"),
            iconCls : "help-button",
            iconAlign : 'top',
            helpUrl: this.options.helpURL,
            text : OpenLayers.i18n("Help"),
            handler: function() {
                if (Ext.isIE) {
                    window.open(this.helpUrl);
                } else {
                    window.open(this.helpUrl, OpenLayers.i18n("Help"), "menubar=no,status=no,scrollbars=yes");
                }
            }
        };

        var maskPdf = new Ext.LoadMask(Ext.getBody(),{
            msg: tr("Loading...")
        });

        this.window = new Ext.Window({
            title: this.getText(record),
            closable: true,
            closeAction: "hide",
            resizable: false,
            border: false,
            cls: 'measurements',
            items: [{
                xtype: 'toolbar',
                border: false,
                items: [
                    renseignUrbaAction,
                    //zonagePluAction,
                    ficheAdsAction,
                    '-',
                    helpAction
                ]
            }],
            listeners: {
                hide: function() {
                    this.item && this.item.setChecked(false);
                    this.components && this.components.toggle(false);
                    renseignUrbaAction.control.deactivate();
                    //zonagePluAction.control.deactivate();
                    ficheAdsAction.control.deactivate();
                },
                scope: this
            }
        });

        if (this.target) {
            // create a button to be inserted in toolbar:
            this.components = this.target.insertButton(this.position, {
                xtype: 'button',
                tooltip: this.getTooltip(record),
                iconCls: "addon-urbanisme",
                handler: this._onCheckchange,
                scope: this,
                listeners: {
                    "afterrender": function() {
                        if (this.options.openToolbarOnLoad) { // ???
                            this._onCheckchange(this.item, true);
                        }
                    },
                    delay: 500,
                    scope: this
                }
            });
            this.target.doLayout();
        }

        // create a menu item for the "tools" menu:
        this.item = new Ext.menu.CheckItem({
            text: this.getText(record),
            qtip: this.getQtip(record),
            iconCls: "addon-urbanisme",
            checked: false,
            listeners: {
                "checkchange": this._onCheckchange,
                scope: this
            }
        });

        this.printProvider = new GeoExt.data.MapFishPrintv3Provider({
            method: "POST",
            url: this.options.printServerUrl + "/print/"
        });

        // We load an empty note record, we will update it with the different requests
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
                        this.checkRemainingXHRs();
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
                "dcntpa",
                "surfc"
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
                        this.checkRemainingXHRs();
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
                "dlign6",
                "app_nom_usage"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "/getFIC"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record // NOPE !
                        // multiple records if several propriétaires
                        var app_nom_usage = [];
                        Ext.each(records, function(r) {
                            app_nom_usage.push(r.get("app_nom_usage"));
                        });
                        if (records.length) {
                            records[0].set("app_nom_usage", app_nom_usage.join(", "))
                            this.noteStore.updateProprio(records[0]);
                        }
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
        });

        this.proprioStoreSurf = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "surfc"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.cadastrappUrl + "/getFIC"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateProprioSurf(records[0]);
                        this.checkRemainingXHRs();
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
            }),
            listeners: {
                "load": {
                    fn: this.checkRemainingXHRs,
                    scope: this
                }
            }
        });

        this.dateStore = new Ext.data.JsonStore({
            idProperty: "code_commune",
            root: "",
            fields: [
                "date_ru",
                "date_pci"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.printServerUrl + "/renseignUrbaInfos"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateDate(records[0]);
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
        });

        this.typeDocumentStore = new Ext.data.JsonStore({
            idProperty: "document_urbanisme",
            root: "",
            fields: [
                "type_document"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.printServerUrl + "/getTypeDocument"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateTypeDocument(records[0]);
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
        });

        this.adsAutorisationStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "numdossier"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.printServerUrl + "/adsAutorisation"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateAdsAutorisation(records[0]);
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
        });

        this.adsInstructionStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "nom",
                "ini_instru"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.printServerUrl + "/adsSecteurInstruction"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateAdsInstruction(records[0]);
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
        });

        this.referentQuartierStore = new Ext.data.JsonStore({
            idProperty: "parcelle",
            root: "",
            fields: [
                "numnom",
                "parcelle"
            ],
            proxy: new Ext.data.HttpProxy({
                method: "GET",
                url: this.options.printServerUrl + "/quartier"
            }),
            listeners: {
                "load": {
                    fn: function(store, records) {
                        //We assume there is only 1 returned record
                        this.noteStore.updateReferentQuartier(records[0]);
                        this.checkRemainingXHRs();
                    },
                    scope: this
                }
            }
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
                        '<td class="parcelle-table-label">Commune</td>',
                        '<td>{commune}</td>',
                        '</tr>',
                        '<tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Section</td>',
                        '<td>{codeSection}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Numéro parcelle</td>',
                        '<td>{numero}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Adresse cadastrale</td>',
                        '<td>{adresseCadastrale}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Contenance DGFiP (m²)</td>',
                        '<td>{contenanceDGFiP}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Surface calculée (m²)</td>',
                        '<td>{surfaceSIG}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Compte propriétaire</td>',
                        '<td>{codeProprio}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Propriétaire(s)</td>',
                        '<td>{nomProprio}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Date de production des RU</td>',
                        '<td>{dateRU}</td>',
                        '</tr>',
                        '<tr>',
                        '<td class="parcelle-table-label">Millésime du cadastre</td>',
                        '<td>{datePCI}</td>',
                        '</tr>',
                        `${ !typeDocument == "Donnée vivante"  && '<tr>'}`,
                        `${ !typeDocument == "Donnée vivante"  && '<td class="parcelle-table-label">Documents d\'urbanisme</td>'}`,
                        `${ !typeDocument == "Donnée vivante"  && '<td>{typeDocument}</td>'}`,
                        `${ !typeDocument == "Donnée vivante"  && '</tr>'}`,
                        '</table>',
                        '</div>',
                        '</tpl>'
                    )
                },
                    {
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
                itemId: "print",
                iconCls: 'mf-print-action',
                //disabled: true, // only activate when all XHRs are finished
                handler: function() {
                    var params, centerLonLat, libellesArray, libellesAsString, parcelle;
                    var layerName = this.options.template.defaut;

                    centerLonLat = this.vectorLayer.getDataExtent().getCenterLonLat();
                    libellesArray = [];

                    this.libellesStore.each(function(record) {
                        libellesArray.push(record.get("libelle"));

                    });

                    libellesAsString = libellesArray.join("\n\n");

                    parcelle = this.noteStore.getAt(0).get("parcelle");

                    if (this.typeDocumentStore != null) {
                        for (var i in this.typeDocumentStore) {
                            if (this.typeDocumentStore[i] === this.options.type_template.PSMV) {
                                layerName = this.options.template.PSMV;
                                break;
                            }
                            if (this.typeDocumentStore[i] === this.options.type_template.PLUi) {
                                layerName = this.options.template.PLUi;
                            }
                        }
                    }

                    params = {
                        layout: layerName,
                        outputFilename:"NRU_"+parcelle,
                        attributes: {
                            map: {
                                scale: this.map.getScale(),
                                center: [centerLonLat.lon, centerLonLat.lat],
                                dpi: 91,
                                layers: this.baseLayers(),
                                projection: this.map.getProjection()
                            },
                            parcelle: parcelle,
                            commune: this.noteStore.getAt(0).get("commune"),
                            codeSection: this.noteStore.getAt(0).get("codeSection"),
                            numero: this.noteStore.getAt(0).get("numero"),
                            adresseCadastrale: this.noteStore.getAt(0).get("adresseCadastrale"),
                            contenanceDGFiP: this.noteStore.getAt(0).get("contenanceDGFiP"),
                            surfaceSIG: this.noteStore.getAt(0).get("surfaceSIG"),
                            codeProprio: this.noteStore.getAt(0).get("codeProprio"),
                            nomProprio: this.noteStore.getAt(0).get("nomProprio"),
                            adresseProprio: this.noteStore.getAt(0).get("adresseProprio"),
                            dateRU: this.noteStore.getAt(0).get("dateRU"),
                            datePCI: this.noteStore.getAt(0).get("datePCI"),
                            typeDocument: this.noteStore.getAt(0).get("typeDocument"),
                            libelles: libellesAsString
                        }
                    };

                    maskPdf.show();

                    Ext.Ajax.request({
                        url: this.options.printServerUrl + "/print/report.pdf",
                        method: 'POST',
                        jsonData: (new OpenLayers.Format.JSON()).write(params),
                        headers: {
                            "Content-Type": "application/json; charset=" + this.encoding
                        },
                        success: function(response) {
                            this._retrievePdf(Ext.decode(response.responseText),maskPdf);
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
                        '      <div class="zonage-attrib-value">{values.feature.attributes.datappro}</div>',
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
                        // dossier du document d'urbanisme
                        '    <div id="vocation-dominante" class="zonage-pair">',
                        '      <div class="zonage-attrib-label">Dossier du document d\'urbanisme :</div>',
                        '      <div class="zonage-attrib-value"><a href="{values.feature.attributes.zipurl}" target="_blank">{values.feature.attributes.zipfile}</a></div>',
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
                text: "Fermer",
                handler: function() {
                    this.zonagePluWindow.hide();
                },
                scope: this
            }]
        })
        this.ficheAdsWindow = new Ext.Window({
            title: this.getText(record),
            width: 640,
            height: 380,
            closeAction: "hide",
            autoScroll: true,
            items: [{
                xtype: "panel",
                items: [{
                    xtype: "dataview",
                    id: "ads-panel",
                    store: this.noteStore,
                    tpl: new Ext.XTemplate(
                        '<tpl for=".">',
                        '<div class="parcelle">',
                        '<h1>Eléments d\'informations applicables à la parcelle cadastrale</h1>',
                        '<h2>{id_parcelle}</h2>',
                        '<h2>Secteur d\'instruction :</h2> ',
                        '<tpl if=" nom == \'\' && ini_instru == \'\'">',
                        'Aucun secteur d\'instruction ne correspond à la localisation de la parcelle',
                        '</tpl>',
                        '<tpl if=" nom != \'\' && ini_instru != \'\' ">',
                        '{nom} / {ini_instru}',
                        '</tpl>',
                        '<h2>Liste des ADS :</h2>',
                        '<tpl for="num_dossier">',
                        '<ul>',
                        '<li>{.}</li>',
                        '</ul>',
                        '</tpl>',
                        '<h2>Quartier :</h2>',
                        '<tpl if=" num_nom == \'\'">',
                        'Aucun quartier ne correspond à la localisation de la parcelle',
                        '</tpl>',
                        '<tpl if=" num_nom != \'\'">',
                        '<p>{num_nom}</p>',
                        '</tpl>',
                        '</div>',
                        '</tpl>'
                    )
                }]
            }],
            buttons: [{
                //TODO tr
                text: "Imprimer",
                itemId: "print",
                iconCls: 'mf-print-action',
                //disabled: true, // only activate when all XHRs are finished
                handler: function() {
                    var params, centerLonLat, NumDossierAsString, parcelle, instruction, num_nom;
                    var layerName = this.options.template.defaut;

                    centerLonLat = this.vectorLayer.getDataExtent().getCenterLonLat();


                    NumDossierAsString= this.noteStore.getAt(0).get("num_dossier").join("\n\n");

                    parcelle=this.noteStore.getAt(0).get("id_parcelle");

                    //dans le cas ou nom et ini_instruction sont vides
                    if(this.noteStore.getAt(0).get("nom") =='' || this.noteStore.getAt(0).get("ini_instru") == ''){
                        instruction="Aucun secteur d'instruction ne correspond à la localisation de la parcelle";
                    }else{
                        instruction=this.noteStore.getAt(0).get("nom") +" / "+ this.noteStore.getAt(0).get("ini_instru");
                    }

                    //dans le cas où le num_nom est vide
                    if(this.noteStore.getAt(0).get("num_nom") ==''){
                        num_nom="Aucun quartier ne correspond à la localisation de la parcelle";
                    }else{
                        num_nom=this.noteStore.getAt(0).get("num_nom");
                    }

                    if (this.typeDocumentStore != null) {
                        for (var i in this.typeDocumentStore) {
                            if (this.typeDocumentStore[i] === this.options.type_template.PSMV) {
                                layerName = this.options.template.PSMV;
                                break;
                            }
                            if (this.typeDocumentStore[i] === this.options.type_template.PLUi) {
                                layerName = this.options.template.PLUi;
                            }
                        }
                    }

                    params = {
                        layout: layerName,
                        outputFilename:"ADS_"+parcelle,
                        attributes: {
                            map: {
                                scale: this.map.getScale(),
                                center: [centerLonLat.lon, centerLonLat.lat],
                                dpi: 91,
                                layers: this.baseLayers(),
                                projection: this.map.getProjection()
                            },
                            parcelle: parcelle,
                            instruction: instruction,
                            numNom: num_nom,
                            numDossier: NumDossierAsString
                        }
                    };

                    maskPdf.show();

                    Ext.Ajax.request({
                        url: this.options.printServerUrl + "/print/report.pdf",
                        method: 'POST',
                        jsonData: (new OpenLayers.Format.JSON()).write(params),
                        headers: {
                            "Content-Type": "application/json; charset=" + this.encoding
                        },
                        success: function(response) {
                            this._retrievePdf(Ext.decode(response.responseText),maskPdf);
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
                    this.ficheAdsWindow.hide();
                },
                scope: this
            }]
        });
    },

    checkRemainingXHRs: function() {
        this.remainingXHRs -= 1;
        if (this.remainingXHRs == 0) {
            //this.parcelleWindow.getFooterToolbar().getComponent('print').enable();
            this.mask.hide();
        }
    },

    showParcelleWindow: function(parcelle) {
        this.remainingXHRs = 4;
        //this.parcelleWindow.getFooterToolbar().getComponent('print').disable();
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
        this.proprioStoreSurf.load({
            params: {
                parcelle: parcelle,
                onglet: 0
            }
        });
        this.dateStore.load({
            params: {
                code_commune: parcelle.slice(0, 6).substr(0,2) + parcelle.slice(0, 6).substr(3,6)
            }
        });
        this.typeDocumentStore.load({
            params: {
                type_document: parcelle
            }
        });
        this.parcelleWindow.show();
        if (!this.mask) {
            this.mask = new Ext.LoadMask(this.parcelleWindow.bwrap.dom, {
                msg: tr("Loading...")
            });
        }
        this.mask.show();
    },


    showZonagePluWindow: function() {
        this.zonagePluWindow.show();
        Ext.getCmp("zonage-plu-box").update(this.zonagePluData);
    },

    showAdsWindow: function(parcelle) {
        this.remainingXHRs = 4;

        this.adsInstructionStore.load({
            params: {
                parcelle: parcelle
            }
        });

        this.adsAutorisationStore.load({
            params: {
                parcelle: parcelle
            }
        });
        this.referentQuartierStore.load({
            params: {
                parcelle: parcelle
            }
        });

        this.ficheAdsWindow.show();

    },


    /**
     * @function baseLayers - Encode every mapPanel layer using the print provider
     *
     * @returns {Array}
     */
    baseLayers: function() {
        var encodedLayers = [],
            wmsc2wms = GEOR.config.WMSC2WMS;
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

    _retrievePdf: function(resp,maskPdf) {
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
                                    maskPdf.hide();
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
        // FIXME: uncommenting below lines raises errors
        //this.map.removeLayer(this.vectorLayer);
        //this.vectorLayer.destroyFeatures();

        this.parcelleWindow.destroy();
        this.zonagePluWindow.destroy();
        this.ficheAdsWindow.destroy();
        this.libellesStore.destroy();
        this.noteStore.destroy();
        this.parcelleStore.destroy();
        this.proprioStore.destroy();
        this.proprioStoreSurf.destroy();
        this.dateStore.destroy();
        this.typeDocumentStore.destroy();
        this.adsInstructionStore.destroy();
        this.adsAutorisationStore.destroy();
        this.referentQuartierStore.destroy();
        this.zonagePluData = null;
        this.window.hide();
        GEOR.Addons.Base.prototype.destroy.call(this);
    },

    /**
     * Method: add the layer to be used to to the getFeatureInfo query
     *
     * Params:
     *  - layerName: the layer name
     *  - callback: the function to call once the layer is added
     */
    _addLayer: function(layerName, serviceURL, callback) {
        // add the layer in the layer manager if it isn't there already
        var layerManager = Ext.getCmp("geor-layerManager");
        var found = layerManager.root.findChildBy(function(child) {
            return child.layer.params.LAYERS === layerName;
        }, this, true);
        if (!found) {
            var u = GEOR.util.splitURL(serviceURL);
            GEOR.ows.WMSCapabilities({
                storeOptions: {
                    url: u.serviceURL,
                    layerOptions: {}
                },
                baseParams: u.params,
                success: function(store) {
                    // extract layer which is expected
                    var record = store.queryBy(function(r) {
                        return (r.get("name") == layerName);
                    }).first();
                    if (record) {
                        this.layerRecord = record;
                        // enforce format:
                        record.getLayer().params.FORMAT = "image/png";
                        // add to map:
                        this.mapPanel.layers.addSorted(record);
                        callback && callback.call(this, record.getLayer());
                    } else {
                        console.error("Couldn't find layer");
                    }
                    // else silently ignore it
                },
                failure: function() {
                    // silently ignore it
                },
                scope: this
            });
        } else {
            callback && callback.call(this, found.layer);
        }
    },

    /**
     * Method: _onCheckchange
     * Callback on checkbox state changed
     */
    _onCheckchange: function(item, checked) {
        if (checked) {
            this.window.show();
            this.window.alignTo(
                Ext.get(this.map.div),
                "t-t",
                [0, 5],
                true
            );
        } else {
            this.window.hide();
        }
    }
});
