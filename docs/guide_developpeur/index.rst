
Guide développeur
======================================

.. toctree::
   :maxdepth: 2

 

 
Matrice des fonctionnalités
---------------------------

* {string} = texte libre
* {code} = doit correspondre à une valeur en base ou une valeur codée
* {0|1} = liste de valeurs autorisées


Configuration / préférences /dépendances
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. warning::
        Attention !!! L'application urbanisme est dépendante et fait appel à certains services de `cadastrapp <http://docs.georchestra.org/cadastrapp/>`_.



Les tables indispensables au bon fonctionnement de l'API sont à minima : 

 - renseign_urba
 - renseign_urba_infos
 - v_croiseplu_param_theme

Les contraintes de structuration de ces tables sont décrites `ici<http://docs.georchestra.org/addon_urbanisme/guide_administrateur/index.html#champs-requis-pour-la-table-de-la-base-de-donnees-du-service-web>`_

Affichage de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
La description côté client est basée sur `l'addon de mapfishapp<https://github.com/sigrennesmetropole/addon_urbanisme/tree/master/src/addon/urbanisme>`_.

.. image:: ../_images/NRU.jpg
   :scale: 80 %
   :align: center

Le module "NRU" permet d'afficher une note de renseignement d'urbanisme concernant la parcelle pointée sur la carte.
L'activation du bouton NRU charge la couche des parcelles  publiée sur geoserver et paramétrée `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/addon/urbanisme/config.json#L7-L9>`_.
Afin de disposer de fiches complètes, l'application cliente fait appel à des méthodes de`{l'API cadastrapp<http://docs.georchestra.org/cadastrapp/guide_developpeur/index.html>}`_. 


Côté Client
>>>>>>>>>>>>

+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Action                                                       | Appel API                                                                                          |
+=============================+===============================================================+====================================================================================================+
|                             | Récupérer l'ID de la parcelle  cadastrale  depuis la carte    | GET  /geoserver/app/ows?SERVICE=WMS&LAYERS='{ws:name}                                              |
|                             |                                                               |                                                                                                    |
|                             |                                                               | &QUERY_LAYERS={ws:name}&STYLES=&SERVICE=WMS&VERSION=1.3.0                                          |
|                             |                                                               |                                                                                                    |
|                             |                                                               | &REQUEST=GetFeatureInfo&EXCEPTIONS=XML&BBOX={code}                                                 |
|                             |                                                               |                                                                                                    |
|                             |                                                               | &FEATURE_COUNT={code}&HEIGHT={code}&WIDTH={code}                                                   |
|                             |                                                               |                                                                                                    |
|                             |                                                               | &FORMAT=image%2Fpng&INFO_FORMAT=application%2Fvnd.ogc.gml                                          |
|                             |                                                               |                                                                                                    |
|                             |                                                               | &CRS=EPSG%3A3857&I=1065&J=432                                                                      |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupérer la commune via cadastrapp                           | GET /cadastrapp/services/getCommune?cgocommune={code}                                   |
|    Afficher la fiche NRU    +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération des informations parcellaires                    | GET /cadastrapp/services/getParcelle?parcelle={code}                                    |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération de la liste des mentions                         | GET /urbanisme/renseignUrba?parcelle={code}                                             |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?parcelle={code}&onglet=1                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?parcelle={code}&onglet=0                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires sur les RU                 | GET /urbanisme/renseignUrbaInfos?code_commune={code}                                    |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
 
Coté serveur 
>>>>>>>>>>>>

 
**Exemple GET /urbanisme/renseignUrba?parcelle={code}** 
::

        >>>> https://portail.sig.rennesmetropole.fr/urbanisme/renseignUrba?parcelle=350238000AC1122
        '{
           "libelles": [
               {"libelle": "Terrain concerné par la servitude de dégagement contre les obstacles à la navigation aérienne (T7) ."},
               {"libelle": "Terrain concerné par le plan d'exposition au bruit d'infrastructure terrestre (de catégorie 3)."},
               {"libelle": "Terrain concerné par le plan d'exposition au bruit d'infrastructure terrestre (de catégorie 4)."},
               {"libelle": "Terrain concerné par une Opération Programmée d'Amélioration de l'Habitat (OPAH)."},
               {"libelle": "Terrain non grevé par un plan d'alignement"},
               {"libelle": "Terrain concerné par une Orientation d'Aménagement et de Programmation (OAP) thématique : \"santé, climat, énergie\"."},
               {"libelle": "Terrain concerné par la Taxe d'Aménagement (TA) départementale  créée par délibération du Conseil Général d'Ille et Vilaine du 10/11/2011 (taux de 1,85%)."},
               {"libelle": "Terrain concerné par la Taxe d'Aménagement (TA) sectorisée  créée par délibération du Conseil de Rennes Métropole du 24/11/2014 (taux de 6%)."},
               {"libelle": "Terrain situé dans un secteur obligatoire à l'infiltration des eaux pluviales."},
               {"libelle": "Terrain concerné par une disposition réglementaire relative au phénomène de  retrait/gonflement des sols argileux (aléa faible)."},
               {"libelle": "Terrain concerné par une zone de protection au titre de l'archéologie."},
               {"libelle": "Terrain concerné par une orientation d'aménagement et de programmation (OAP) thématique : \"Projet patrimonial, paysager, trame verte et bleue\"."},
               {"libelle": "Terrain concerné par la Redevance Archéologique Préventive (RAP), (taux de 0,40%)."},
               {"libelle": "Terrain concerné par une servitude relative à la protection des centres de réception contre les perturbations électromagnétiques - ZG Zone de Garde (assiette) (PT1)."},
               {"libelle": "Terrain concerné par une Orientation d'Aménagement et de Programmation (OAP) communale."},
               {"libelle": "Terrain concerné par une servitude relative à la protection des centres de réception contre les perturbations électromagnétiques - ZP Zone de Protection (assiette) (PT1)."},
               {"libelle": "Terrain concerné par une Orientation d'Aménagement et de Programmation (OAP) thématique : \"Les axes de développement de la ville archipel\"."},
               {"libelle": "Terrain concerné par un Site Patrimonial Remarquable (SPR) : Plan de Sauvegarde et de Mise en Valeur (PSMV) approuvé par arrêté préfectoral du 16/12/2013, dernière Mise à jour (n°2) par arrêté du Président de Rennes Métropole du 14/05/2019."},
               {"libelle": "Terrain soumis au Droit de Préemption (DP) urbain renforcé, créé par délibération du Conseil de Rennes Métropole du 19/12/2019."}
           ],
           "parcelle": "350238000AC1122"
        }'

**Exemple GET /urbanisme/renseignUrbaInfos?code_commune={code}**
::

        >>>> https://portail.sig.rennesmetropole.fr/urbanisme/renseignUrbaInfos?code_commune=35238
        '{
            "code_commune": "35238",
            "date_pci": "01/10/2019",
            "date_ru": "21/07/2020"
        }'


Génération du pdf de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

La génération du pdf utilise le moteur mapfishprintV3 qui est paramétré et configuré `ici<https://github.com/sigrennesmetropole/addon_urbanisme/tree/master/src/main/resources/templates/print>`_

Côté Client
>>>>>>>>>>>>

+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Action                                                       | Appel API                                                                                          |
+=============================+===============================================================+====================================================================================================+
|                             | Génération                                                    | POST  /urbanisme/print/report.pdf                                                                  | 
|                             |                                                               |                                                                                                    |
| Génération du fichier pdf   +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Téléchargement                                                | GET  /urbanisme/urbanisme/report/{code}                                                            |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+

**Exemple de paramètres POST**

::
	{
		"layout": "A4 portrait",
		"outputFilename": "NRU_350238000BP0240",
		"attributes": {
			"map": {
				"scale": 4265.459167699568,
				"center": [
					-185552.085178,
					6124901.674846
				],
				"dpi": 91,
				"layers": [
					{
						"type": "geojson",
						"style": {
							"1": {
								"fillColor": "#ee9900",
								"fillOpacity": 0,
								"hoverFillColor": "white",
								"hoverFillOpacity": 0.8,
								"strokeColor": "#ee9900",
								"strokeOpacity": 1,
								"strokeWidth": 3,
								"strokeLinecap": "round",
								"strokeDashstyle": "solid",
								"hoverStrokeColor": "red",
								"hoverStrokeOpacity": 1,
								"hoverStrokeWidth": 0.2,
								"pointRadius": 6,
								"hoverPointRadius": 1,
								"hoverPointUnit": "%",
								"pointerEvents": "visiblePainted",
								"cursor": "pointer",
								"fontColor": "#000000",
								"labelAlign": "cm",
								"labelOutlineColor": "white",
								"labelOutlineWidth": 3
							},
							"version": "1",
							"styleProperty": "_gx_style"
						},
						"geoJson": {
							"type": "FeatureCollection",
							"features": [
								{
									"type": "Feature",
									"properties": {
										"_gx_style": 1,
										"ogc_fid": "131446",
										"lot": "2020-06",
										"inspireid": "FR350238000BP0240",
										"id_parc": "350238000BP0240",
										"commune": "350238",
										"section": "350238000BP",
										"section_txt": "BP",
										"parcelle_txt": "240",
										"section_parcelle_txt": "BP 240",
										"supf": "11850",
										"ssurf": "11839.40",
										"ssurfb": "3858.39",
										"scos": "32.6"
									},
									"geometry": {
										"type": "Polygon",
										"coordinates": [
											[
												[
													-185637.618825,
													6124902.523521
												],
												[
													-185646.028255,
													6124945.51647
												],
												[
													-185661.825712,
													6124985.852155
												],
												[
													-185660.446584,
													6124991.283944
												],
												[
													-185655.341336,
													6124995.034454
												],
												[
													-185644.359742,
													6124994.485327
												],
												[
													-185538.753392,
													6124978.101628
												],
												[
													-185442.344644,
													6124960.496719
												],
												[
													-185451.800366,
													6124812.825688
												],
												[
													-185457.054373,
													6124808.315238
												],
												[
													-185463.314893,
													6124808.565661
												],
												[
													-185641.744477,
													6124889.008146
												],
												[
													-185637.618825,
													6124902.523521
												]
											]
										]
									},
									"id": "urbanisme_parcelle.fid-14f66340_1752cffa54a_4f94"
								}
							]
						}
					},
					{
						"type": "geojson",
						"style": {
							"version": "1",
							"styleProperty": "_gx_style"
						},
						"geoJson": {
							"type": "FeatureCollection",
							"features": []
						}
					},
					{
						"baseURL": "https://portail.sig.rennesmetropole.fr/geoserver/app/ows?SERVICE=WMS&",
						"opacity": 1,
						"type": "tiledwms",
						"layers": [
							"urbanisme_parcelle"
						],
						"imageFormat": "image/png",
						"styles": [
							""
						],
						"customParams": {
							"TRANSPARENT": "true",
							"EXCEPTIONS": "XML",
							"SLD_VERSION": "1.1.0",
							"CRS": "EPSG:3857"
						},
						"tileSize": [
							512,
							512
						]
					},
					{
						"baseURL": "https://portail.sig.rennesmetropole.fr/geoserver/wms",
						"opacity": 1,
						"type": "tiledwms",
						"layers": [
							"ref_cad:cadastre"
						],
						"imageFormat": "image/png",
						"styles": [
							""
						],
						"customParams": {
							"TRANSPARENT": "true",
							"EXCEPTIONS": "application/vnd.ogc.se_xml",
							"SLD_VERSION": "1.0.0"
						},
						"tileSize": [
							256,
							256
						]
					}
				],
				"projection": "EPSG:3857"
			},
			"parcelle": "350238000BP0240",
			"commune": "Rennes",
			"codeSection": "BP",
			"numero": "240",
			"adresseCadastrale": "     BD RENE LAENNEC",
			"contenanceDGFiP": 11850,
			"surfaceSIG": 11839,
			"codeProprio": "350238+13368",
			"nomProprio": "COMMUNE DE RENNES",
			"adresseProprio": "PL  DE LA MAIRIE  35000 RENNES",
			"dateRU": "24/09/2020",
			"datePCI": "06/2020",
			"libelles": "Plan Local d'Urbanisme intercommunal (PLUi) approuvé par délibération du Conseil de Rennes Métropole du 19/12/2019. Dernière Mise à jour (MAJ n°2) par arrêté du Président de Rennes Métropole du 27/02/2020, Modification Simplifiée (MS n°1) approuvée par délibération du Conseil de Rennes Métropole du 10/09/2020.\n\nTerrain concerné par la servitude de dégagement contre les obstacles à la navigation aérienne (T7) .\n\nZone UG1a\n\nTerrain concerné par une servitude relative au périmètre d'application du Plan de Prévention des Risques d'Inondation (PPRI) du bassin de la Vilaine en Région Rennaise Ille et Illet, approuvée par arrêté préfectoral du 10/12/2007 , dernière modification le 18/07/2017.\n\nTerrain concerné par le plan d'exposition au bruit d'infrastructure terrestre (de catégorie 3).\n\nTerrain concerné par un  Patrimoine Bâti d'Intérêt Local (PBIL) (3 étoiles).\n\nTerrain concerné par les règles de végétalisation indiquées dans le règlement littéral.\n\nTerrain concerné par une règle de hauteur indiquée dans le règlement littéral.\n\nTerrain non grevé par un plan d'alignement\n\nTerrain concerné par une Orientation d'Aménagement et de Programmation (OAP) thématique : \"santé, climat, énergie\".\n\nTerrain concerné par la Taxe d'Aménagement (TA) départementale  créée par délibération du Conseil Général d'Ille et Vilaine du 10/11/2011 (taux de 1,85%).\n\nTerrain concerné par la Taxe d'Aménagement (TA) sectorisée  créée par délibération du Conseil de Rennes Métropole du 24/11/2014 (taux de 6%).\n\nTerrain situé dans un secteur obligatoire à l'infiltration des eaux pluviales.\n\nTerrain concerné par une disposition réglementaire relative au phénomène de  retrait/gonflement des sols argileux (aléa faible).\n\nTerrain concerné par une servitude de protection des monuments historiques classés (assiette) (AC1).\n\nTerrain concerné par une zone de protection au titre de l'archéologie.\n\nTerrain concerné par une orientation d'aménagement et de programmation (OAP) thématique : \"Projet patrimonial, paysager, trame verte et bleue\".\n\nTerrain concerné par une zone inondable (hors PPRI).\n\nTerrain concerné par la Redevance Archéologique Préventive (RAP), (taux de 0,40%).\n\nTerrain concerné par une Orientation d'Aménagement et de Programmation (OAP) communale.\n\nTerrain concerné par une servitude relative à la protection des centres de réception contre les perturbations électromagnétiques - ZP Zone de Protection (assiette) (PT1).\n\nTerrain situé dans un périmètre concerné par le guide de recommandations \"restauration et adaptation du patrimoine bâti d'intérêt local\".\n\nTerrain concerné par une Orientation d'Aménagement et de Programmation (OAP) thématique : \"Les axes de développement de la ville archipel\".\n\nTerrain concerné par un espace d'intérêt paysager ou écologique.\n\nTerrain situé dans un secteur de réglementation du stationnement : secteur 1\n\nTerrain soumis au Droit de Préemption (DP) urbain renforcé, créé par délibération du Conseil de Rennes Métropole du 19/12/2019."
		}
	}


Côté Serveur
>>>>>>>>>>>>


