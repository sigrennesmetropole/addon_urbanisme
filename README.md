# Extension urbanisme

Cet extension permet de consulter une note de renseignement d'urbanisme ou une fiche d'informations
"zonage du PLU". L'information peut également être exportée sous forme de document PDF.

## Mise en place du service web

### Compilation du service web

Pour compiler cette extension, il suffit de lancer la commande :

 ```bash
mvn clean jar:jar install
 ```
Cette commande créera le fichier jar et le copiera dans votre dépôt maven local (`~/.m2`).

### Add jar file to mapfishapp

Afin d'intégrer cette extension à mapfishapp, il faudra ajouter la dépendance suivante dans le fichier `pom.xml` du module
mapfishapp.

 ```xml
<dependency>
  <groupId>org.georchestra</groupId>
  <artifactId>urbansime</artifactId>
  <version>16.06</version>
</dependency>
 ```


### Configuration du service web

La configuration du service web est réalisée dans le fichier de propriétés de mapfishapp contenu dans le `datadir` sous
`mapfishapp/mapfishapp.properties`.

Les paramètres suivants sont requis:

* URL jdbc de connexion à la base de données. Par exemple: `jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data`
* nom de la table de base de données contenant l'information urbanistique dont les libelles associés à chaque parcelle :
`urbanisme.renseignUrbaTable`. Le nom de la table peut contenir l'information sur le schéma.
* nom de la table de base de données contenant la description des thèmes : `urbanisme.tableTheme`
* ordre selon lequel les libelles doivent être affichés selon leur code de thèmes : `urbanisme.ordreTheme`

Exemple:

```
urbanisme.jdbcUrl=jdbc:postgresql://localhost:5432/rennes_urbanisme?user=www-data&password=www-data
urbanisme.renseignUrbaTable=urba.renseign_urba
urbanisme.ordreTheme=('ZON', 1), ('SUP', 2), ('SAU', 3), ('PRE', 4), ('OPE', 5), ('PAR', 6), ('LOT', 7), ('TAX', 8)

```

#### Champs requis pour la table de la base de données du service web

La table de renseignement d'urbanisme doit contenir les colonnes suivantes:
* id_parc : Identifiant unique de la parcelle (VARCHAR);
* libelle : Information urbanistique applicable à la parcelle (VARCHAR);
* param_theme: code spécifique du thème.

La table des thèmes doit contenir les colonnes suivantes :
* nom : code spécifique du thème
* ventilation_ddc : Code du thème à des fins de classification.



## Génération du PDF

Les PDF sont générés à l'aide de MapFish Print V3. La configuration du serveur est située dans le répertoire
`print/print-apps`.

## Configuration du client

Copier le répertoire de l'extension - `mapfishapp/src/main/webapp/app/addons/urbanisme/` -
dans le répertoire `mapfishapp/addons/` du `datadir`.

