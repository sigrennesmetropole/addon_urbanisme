# Pré-requis SGBD

## Champs requis pour la table de la base de données du service web


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
