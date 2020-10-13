
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

Les contraintes de structuration de ces tables sont décrites {ici<http://docs.georchestra.org/addon_urbanisme/guide_administrateur/index.html#champs-requis-pour-la-table-de-la-base-de-donnees-du-service-web>`_

Affichage de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. image:: ../_images/NRU.jpg
   :scale: 80 %
   :align: center

Le module "NRU" permet d'afficher une note de renseignement d'urbanisme concernant la parcelle pointée sur la carte.
L'activation du bouton NRU charge la couche des parcelles  publiée sur geoserver et paramétrée `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/addon/urbanisme/config.json#L7-L9>`_.
Cette fonctionnalité fait appel à l'API cadastrapp, les méthodes cadastrapp utilisées sont décrites ci-dessous.



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
|                             | Récupération de la liste des mentions(Ex1)                    | GET /urbanisme/renseignUrba?parcelle={code}                                             |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?parcelle={code}&onglet=1                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?parcelle={code}&onglet=0                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires sur les RU (Ex2)           | GET /urbanisme/renseignUrbaInfos?code_commune={code}                                    |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
 
 Exemples:
 
 
**Ex1** 
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

**Ex2**
::

        >>>> https://portail.sig.rennesmetropole.fr/urbanisme/renseignUrbaInfos?code_commune=35238
        '{
            "code_commune": "35238",
            "date_pci": "01/10/2019",
            "date_ru": "21/07/2020"
        }'

Génération du pdf de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

La génération du pdf utilise le moteur mapfishprint qui est paramétré et configuré `ici<https://github.com/sigrennesmetropole/addon_urbanisme/tree/master/src/main/resources/templates/print>`_

+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Action                                                       | Appel API                                                                                          |
+=============================+===============================================================+====================================================================================================+
|                             | Génération                                                    | POST  /urbanisme/print/report.pdf                                                                  | 
|                             |                                                               |                                                                                                    |
| Génération du fichier pdf   +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Téléchargement                                                | GET  /urbanisme/urbanisme/report/{code}                                                            |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+








