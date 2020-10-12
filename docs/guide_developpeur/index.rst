
Guide développeur
======================================

.. toctree::
   :maxdepth: 2

 

 
Matrice des fonctionnalités
---------------------------

* {string} = texte libre
* {code} = doit correspondre à une valeur en base ou une valeur codée
* {0|1} = liste de valeurs autorisées


Configuration / préférences
^^^^^^^^^^^^^^^^^^^^^^^^^^^
:: note::
         Attention !!! cette application nécessite l'application backend cadastrapp car elle fait appel à ses services.


Affichage de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. image:: ./_images/NRU.jpg
   :scale: 50 %
   :align: center
   ^
Le module "NRU" permet d'afficher une note de renseignement d'urbanisme concernant la parcelle pointée sur la carte.
L'activation du bouton NRU charge la couche des parcelles  publiée sur geoserver et paramétrée `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/addon/urbanisme/config.json#L7-L9>`_.
Cette fonctionnalité fait appel à l'API cadastrapp, les méthodes cadastrapp utilisées sont décrites ci-dessous.



+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Action                                                       | Appel API                                                                                          |
+=============================+===============================================================+====================================================================================================+
|                             | Récupérer l'ID de la parcelle  cadastrale  depuis la carte    | GET  /geoserver/app/ows?SERVICE=WMS&LAYERS='{ws:name}
|							  |																  |		&QUERY_LAYERS={ws:name}&STYLES=&SERVICE=WMS&VERSION=1.3.0
|							  |																  |		&REQUEST=GetFeatureInfo&EXCEPTIONS=XML&BBOX={code}
|							  |																  |		&FEATURE_COUNT={code}&HEIGHT={code}&WIDTH={code}
|							  |																  |		&FORMAT=image%2Fpng&INFO_FORMAT=application%2Fvnd.ogc.gml
|							  |																  |		&CRS=EPSG%3A3857&I=1065&J=432                                                                                  |                                                                                    |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupérer la commune via cadastrapp                           | GET /cadastrapp/services/getCommune?_dc={code}&cgocommune={code}                                   |
|    Afficher la fiche NRU    +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération des informations parcellaires                    | GET /cadastrapp/services/getParcelle?_dc={code}&parcelle={code}                                    |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération de la liste des mentions(Ex1)                    | GET /urbanisme/renseignUrba?_dc={code}&parcelle={code}                                             |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?_dc={code}&parcelle={code}&onglet=1                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires parcelle                   | GET /cadastrapp/services/getFIC?_dc={code}&parcelle={code}&onglet=0                                |
|                             +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Récupération infos complémentaires sur les RU (Ex2)           | GET /urbanisme/renseignUrbaInfos?_dc={code}&code_commune={code}                                    |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
 
 Exemples:
 
 
**Ex1** 
  
https://portail.sig.rennesmetropole.fr/urbanisme/renseignUrba?_dc=1602146201488&parcelle=350238000AC1122

```
{
    "libelles": [
        {"libelle": "Plan Local d'Urbanisme intercommunal (PLUi) approuvé par délibération du Conseil de Rennes Métropole du 19/12/2019. Mise à jour (MAJ n°2) par arrêté du Président de Rennes Métropole du 27/02/2020."},
        {"libelle": "Terrain concerné par la servitude de dégagement contre les obstacles à la navigation aérienne (T7) ."},
……../………
        {"libelle": "Zone UA2"}
    ],
    "parcelle": "350238000AD0275"
}

```
**Ex2**

https://portail.sig.rennesmetropole.fr/urbanisme/renseignUrbaInfos?_dc=1602146201491&code_commune=35238

```
{
    "code_commune": "35238",
    "date_pci": "01/10/2019",
    "date_ru": "21/07/2020"
}
```

Génération du pdf de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Action                                                       | Appel API                                                                                          |
+=============================+===============================================================+====================================================================================================+
|                             | Génération                                                    | POST  /urbanisme/print/report.pdf                                                                  | 
|                             |                                                               |                                                                                                    |
| Génération du fichier pdf   +---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+
|                             | Téléchargement                                                | GET  /urbanisme/urbanisme/report/{code}                                                            |
+-----------------------------+---------------------------------------------------------------+----------------------------------------------------------------------------------------------------+








