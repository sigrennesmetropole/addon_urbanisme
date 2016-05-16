# Addon urbanisme

Cet addon permet de consulter une note de renseignement d'urbanisme ou une fiche d'informations
"zonage du PLU". L'information peut également être exporté sous forme de document PDF.

## Web service setup

### Build web service

 In order to build this addon, you just need to launch :

 ```bash
mvn clean jar:jar install
 ```
 This command will create a jar file and copy it in your local maven repo (`~/.m2`).

### Add jar file to mapfishapp

 In order to link this addon to mapfishapp, you will need to add following dependency in `pom.xml` file of mapfishapp
 module :

 ```xml
<dependency>
  <groupId>org.georchestra</groupId>
  <artifactId>urbansime</artifactId>
  <version>16.06</version>
</dependency>
 ```
 Then, just follow build instruction of mapfishapp georchestra submodule.


### Web service configuration

Configuration of this addon is done in mapfishapp properties files in datadir : `mapfishapp/mapfishapp.properties`.
The following informations related to database management are required

* jdbc URL to connect to dabatase. For exemple: `jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data`
* name of the database table containing land planning information (« libelle » data) : `urbanisme.renseignUrbaTable`.
 Table name may contain database schema.


Exemple:

```
urbanisme.jdbcUrl=jdbc:postgresql://localhost:5432/rennes_urbanisme?user=www-data&password=www-data
urbanisme.renseignUrbaTable=urba.renseign_urba

```

#### Web service database table requirement

The table must contains the following columns:
* id_parc : ID of parcelle (VARCHAR)
* libelle : Land management information about the parcelle (VARCHAR)


## PDF Generator

PDF are generated through MapFish Print V3. Configuration of the server is located in
`print/print-apps`.

## Client-side interface

The lient side addon directory - `mapfishapp/src/main/webapp/app/addons/urbanisme/` -
can be copied to datadir `mapfishapp/addons/`.

