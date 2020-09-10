
Guide administrateur
======================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:


Ce guide explique comment installer et configurer l'extension. 


Configuration du service web
----------------------------

Compilation du service web
^^^^^^^^^^^^^^^^^^^^^^^^^^

Pour compiler cette extension, il suffit de lancer la commande : :code:`mvn clean package`

Ceci créera dans le sous-répertoire :code:`target/` deux fichiers :

* Un fichier ZIP contenant l'addon à installer dans mapfishapp
* Une webapp WAR contenant les webservices du print ainsi que le mapfishprint-v3


Configuration du service web
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

La configuration peut aussi bien s'effectuer avant la compilation, en modifiant le fichier :code:`src/main/resources/urbanisme.properties` ou bien en mode datadir.

**Les paramètres suivants dans le fichier properties sont requis :**

* URL jdbc de connexion à la base de données. Par exemple: :code:`jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data`
* nom de la table de base de données contenant l'information urbanistique dont les libelles associés à chaque parcelle : :code:`urbanisme.renseignUrbaTable`. Le nom de la table peut contenir l'information sur le schéma.
* nom de la table de base de données contenant la description des thèmes : :code:`urbanisme.tableTheme`
* ordre selon lequel les libelles doivent être affichés selon leur code de thèmes : :code:`urbanisme.ordreTheme`
* schéma et nom de la fonction récupérant les dossiers ADS intersectés avec la parcelle : :code:`urbanisme.adsAutorisationFunction`
* schéma et nom de la fonction récupérant le secteur d'instruction intersecté avec la parcelle : :code:`urbanisme.adsSecteurInstructionFunction`
* schéma et nom de la fonction récupérant le quartier intersecté avec la parcelle : :code:`urbanisme.quartierFunction`

Exemple :

.. code-block:: javascript

    urbanisme.jdbcUrl=jdbc:postgresql://localhost:5432/rennes_urbanisme?user=www-data&password=www-data
    urbanisme.renseignUrbaTable=urba.renseign_urba
    urbanisme.tableTheme=app_plu.param_theme
    urbanisme.ordreTheme=('ZON', 1), ('SUP', 2), ('SAU', 3), ('PRE', 4), ('OPE', 5), ('PAR', 6), ('LOT', 7), ('TAX', 8)
    urbanisme.adsAutorisationFunction=urba_foncier.intersect_EdiParc_VAdsAutorisation
    urbanisme.adsSecteurInstructionFunction=urba_foncier.intersect_EdiParc_AdsSecteurInstruction
    urbanisme.quartierFunction=limite_admin.intersect_EdiParc_Quartier


Champs requis pour la table de la base de données du service web
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

La table de renseignement d'urbanisme doit contenir les colonnes suivantes :

* id_parc : Identifiant unique de la parcelle (VARCHAR)
* libelle : Information urbanistique applicable à la parcelle (VARCHAR)
* param_theme : code spécifique du thème

La table des thèmes doit contenir les colonnes suivantes :

* nom : code spécifique du thème
* ventilation_ddc : Code du thème à des fins de classification

Les 3 fonctions d'intersection réalisent une intersection avec une table contenant les parcelles et notamment les champs suivants :

* le code de la parcelle
* la géométrie de la parcelle

La fonction de récupération des dossiers ADS intersecte la table des parcelles avec une table contenant les informations suivantes :

* un numéro de dossier ADS
* un champ de géométrie

La fonction de récupération du secteur d'instruction intersecte la table des parcelles avec une table contenant les informations suivantes :

* un nom
* les initiales de l'instructeur
* un champ de géométrie

La fonction de récupération du quartier intersecte la table des parcelles avec une table contenant les informations suivantes :

* le nom du quartier
* un champ de géométrie




Configuration du générateur de PDF
----------------------------------

Les PDF sont générés à l'aide de MapFish Print V3. La configuration du serveur est située dans le répertoire :code:`src/main/resources/templates` en mode classique, ou dans :code:`/chemin/vers/georchestra-datadir/urbanisme/templates` en mode datadir.


Configuration du client Mapfishapp
----------------------------------

Décompressez l'archive ZIP obtenue suite à la compilation dans le répertoire :code:`mapfishapp/addons/` du datadir (ou dans le app/addons de la webapp déployée, dans le cas inverse).


Configuration du client MapStore2
---------------------------------

Bientôt en 2021…

