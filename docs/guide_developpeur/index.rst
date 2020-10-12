
Guide développeur
======================================

.. toctree::
   :maxdepth: 2

 

 
Matrice des fonctionnalités
---------------------------

* {string} = texte libre
* {code} = doit correspondre à une valeur en base ou une valeur codée
* {serv} = doit correspondre à un nom de service WMS ou WFS
* {0|1} = liste de valeurs autorisées


Configuration / préférences
^^^^^^^^^^^^^^^^^^^^^^^^^^^
Attention !!! cette application nécessite l'application cadastrapp car elle fait appel à ses services.



+-----------------------------+--------------+---------------------------------+--------+--------+--------+
|  Fonctionnalité             |  Responsive  |  Action                         |  Appel API               |
+=============================+==============+=================================+========+========+========+
|  Récupérer la configuration |              |  Récupérer la configuration     |                          |
+-----------------------------+--------------+---------------------------------+--------+--------+--------+
|  Récupérer le manifest      |              |  Récupérer le manifest          |                          |
+-----------------------------+--------------+---------------------------------+--------+--------+--------+



Affichage de la note de renseignement d'urbanisme (NRU)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.. image:: ./_images/NRU.jpg
   :scale: 50 %
   :align: center
Le module "NRU" permet d'afficher une note de renseignement d'urbanisme concernant la parcelle pointée sur la carte.
L'activation du bouton NRU charge la couche des parcelles du cadastrapp publiée sur geoserver et paramétrée `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/addon/urbanisme/config.json#L7-L9>`_.
Cette fonctionnalité fait appel à l'API cadastrapp.

+-----------------------------+--------------+--------------------------------------------+---------------------------------------------------------------------------------------------------------+
|  Fonctionnalité             |  Responsive  |  Action                                    | Appel API                                                                                               |
+=============================+==============+============================================+========+========+=======================================================================================+
|                             |              | Récupérer l'ID de la parcelle  cadastrale  depuis la carte    | GET  /geoserver/                                                                     |                                                                                    |
|                             |              +--------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                             |              | Récupérer la commune via cadastrapp       | GET /cadastrapp/services/getCommune?_dc={code}&cgocommune={code}                                         |
|    Afficher la fiche NRU    |              +--------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                             |              | Récupération des informations parcellaires| GET /cadastrapp/services/getParcelle?_dc={code}&parcelle={code}                                          |
|                             |              +--------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                             |              | Récupération de la liste des mentions      | GET /urbanisme/renseignUrba?_dc={code}&parcelle={code}                                                  |
|                             |              +--------------------------------------------+---------------------------------------------------------------------------------------------------------+
|                             |              | Récupération infos complémentaires parcelle| GET /cadastrapp/services/getFIC?_dc={code}&parcelle={code}&onglet=1                                     |
|                             |              | Récupération infos complémentaires parcelle| GET /cadastrapp/services/getFIC?_dc={code}&parcelle={code}&onglet=0                                     |

+-----------------------------+--------------+---------------------------------+--------+--------+--------+-----------------------------------------------------------------------------------------+




Autorisation de Droit des Sols (ADS)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^






Documentation de l'API
----------------------



Javadoc
-------



