# Extension urbanisme pour geOrchestra
======================================

Cette extension permet de consulter une Note de Renseignement d'Urbanisme (NRU) ou une fiche d'informations
( d'Autorisation de Droit des Sols (ADS). L'information peut également être exportée sous forme de document PDF.
 Elle est dépendante de l'extension [cadastrapp](https://github.com/georchestra/cadastrapp) pour geOrchestra.
 
# Documentation

Toute la documentation est ici : [doc urbanisme](https://docs.georchestra.org/mapstore2-urbanisme/fr/latest/)

# ADS, NRU et sélection des templates d'impression

L'interface propre à l'extension permet de sélectionner des parcelles pour administrer les Autorisations de Droit des Sols (ADS) ou des Notes de Renseignement d'Urbanisme (NRU).

La configuration de l'impression se fait à l'aide de la variable *mapfishPrintDir* qui permet d'indiquer le répertoire dans lequel se trouve la configuration *MapFish-Print".

Par défaut, la configuration suivante permet d'utiliser les templates présents dans le jar déployé (présents dans _[...]/src/main/resources/templates) :

```
mapfishPrintDir=classpath:///templates
```

En configurant un autre chemin d'accès il est  possible de surcharger cette configuration en fournissant un fichier _config.yaml_ décrivant les templates Jasper JRXML à utiliser. Exemple : 

```
mapfishPrintDir=file:///etc/georchestra/urbanisme/templates
```

Il exite par défaut 4 modèles :

- Modèle par défaut - A4 portrait
- Modèle ADS - A4 portrait ADS
- Modèle NRU PLUi - A4 portrait PLUi
- Modèle NRU PSMV - A4 portrait PSMV

Dans le cas de NRU, l'objet retourné lors de la sélection d'une parcelle peut contenir une liste de valeurs _typeDocuments_.
Le modèle à utiliser est déterminé par un appel au backend de la forme : 

```
[...]/templates?type=&lt;valeur1>&type=&lt;valeur2>
```

Le backend utilise les propriétés :

```
templates.default=A4 portrait
templates.rules={ \
	'PSMV': { 'order': 1, 'templateName':'A4 portrait PSMV', 'operator':'ANY',  'values': 'PSMV' }, \
	'PLUI': { 'order': 2, 'templateName':'A4 portrait PLUi', 'operator':'NONE', 'values': 'PSMV' } \
    }
```

La propriété _templates.default_ permet de définir le template à mettre en oeuvre si aucune règle n'est exécutée.

La propriété _templates.rules_ permet de définir les règles à mettre en oeuvre.

Le contenu de cette propriété est un fragment JSON contenant _N_ entrées nommées (une par règle).
Chaque règle comporte :

- *order* : un numéro d'ordre pour définir l'ordre d'exécution
- *templateName* : le nom du template dans le fichier config.yaml
- *operator* : le nom de l'opération à réaliser _ANY_, _ONE_, _NONE_
- *values* : une liste de valeurs séparées par des virgules.

L'exemple ci-dessus se lit dont :
 
- si la liste des *typeDocuments* contient n'importe quelle valeur présente dans *values* (ici PSMV) alors le type est 'A4 portrait PSMV'
- si la liste des *typeDocuments* ne contient aucune valeur présente dans *values* (ici PSMV) alors le type est 'A4 portrait PLUi'

# Configuration du certificat

Un script est lancé au déploiement de l'image docker de l'application qui ajoute un certificat donné au keystore.  
Afin d'ajouter le bon certificat au bon keystore, il est nécessaire de remplir les informations adéquates dans le fichier `properties` de l'application :

```yaml
# dossier contenant le certificat
server.trustcert.keystore.path=
# filename du certificat
server.trustcert.keystore.cert=
# nom de l'alias du certificat à insérer dans le keystore
server.trustcert.keystore.alias=
# chemin absolu du keystore dans le container docker
server.trustcert.keystore.store=
# mot de passe du keystore
server.trustcert.keystore.password=
```

Par exemple :

```
server.trustcert.keystore.path=/etc/georchestra/
server.trustcert.keystore.cert=urbanisme.crt
server.trustcert.keystore.alias=certificat-urbanisme
server.trustcert.keystore.store=/opt/java/openjdk/lib/security/cacerts
server.trustcert.keystore.password=changeit/opt/java/openjdk/lib/security/cacerts
```

Si les variables ne sont pas remplies, le certificat n'est pas ajouté au keystore et l'application démarre normalement.

