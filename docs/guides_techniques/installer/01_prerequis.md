# Prérequis

## Base de données

Paramétrage sur https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/main/resources/urbanisme.properties 

Les tables indispensables au bon fonctionnement de l'API sont : 

- renseign_urba
- renseign_urba_infos
- v_croiseplu_param_theme

Les contraintes de structuration de ces tables sont décrites `ici <http://docs.georchestra.org/addon_urbanisme/guide_administrateur/index.html#champs-requis-pour-la-table-de-la-base-de-donnees-du-service-web>`_.

3 Fonctions sont nécessaires pour la génération des ADS :

- adsAutorisationFunction=urba_foncier.intersect_EdiParc_VAdsAutorisation
- adsSecteurInstructionFunction=urba_foncier.intersect_EdiParc_AdsSecteurInstruction
- quartierFunction



Elles sont récupérables `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/main/resources/data/function.sql>`_.

Ces fonctions s'appuient sur les tables et vues 

- parcelles cadastrales : cadastre_qgis.geo_parcelle

::


		'CREATE TABLE cadastre_qgis.geo_parcelle
			(	
			  geo_parcelle text NOT NULL, -- Identifiant
			  annee text NOT NULL, -- Année
			  object_rid text, -- Numéro d'objet
			  idu text, -- Identifiant
			  geo_section text NOT NULL, -- Section
			  geo_subdsect text,
			  supf numeric, -- Contenance MAJIC
			  geo_indp text, -- Figuration de la parcelle au plan
			  coar text, -- Code arpentage
			  tex text, -- Numéro parcellaire
			  tex2 text, -- tex2 - non documenté
			  codm text, -- codm - non documenté
			  creat_date date, -- Date de création
			  update_dat date, -- Date de dernière modification
			  inspireid text,
			  lot text,
			  ogc_fid serial NOT NULL,
			  geom geometry(MultiPolygon,3948),
			  ssurf numeric(38,2),
			  ssurfb numeric(38,2),
			  scos numeric(38,1),
			  geo_commune text,
			  CONSTRAINT geo_parcelle_pk PRIMARY KEY (ogc_fid)
			)

		'
		
**Exemple:**
::

	
		geo_parcelle	 				3500010000A0632
		annee							2020
		object_rid 						Objet_1445172
		idu 							0010000A0632
		geo_section 					3500010000A
		geo_subdsect 	
		supf 							14
		geo_indp 						1
		coar 		
		tex 							632
		tex2 	
		codm 	
		creat_date  					04/09/2007
		update_dat 						23/03/2015
		inspireid 						FR3500010000A0632
		lot 							2020-06
		ogc_fid 						367
		geometry						xxxxxxxxxxxxxxxxxxxxxxx
		ssurf 							16.11
		ssurfb 
		scos 
		geo_commune 					350001

	

- quartier

::
				
		
		'CREATE TABLE limite_admin.quartier
				(objectid integer NOT NULL, 
				matricule character varying(15), 
				nuquart smallint, 
				nmquart character varying(150), 
				numnom character varying(150), 
				nom character varying(150),
				st_area_shape_ numeric(38,8) NOT NULL,
				st_length_shape_ numeric(38,8) NOT NULL,
				shape geometry,
				code_insee integer,
				CONSTRAINT enforce_geotype_shape CHECK (geometrytype(shape) = 'POLYGON'::text),
				CONSTRAINT enforce_srid_shape CHECK (st_srid(shape) = 3948)
		'

**Exemple:** 

::

		
		objectid			1
		matricule			Q.11
		nuquart				11
		nmquart				LE BLOSNE
		numnom				11 - Le Blosne
		nom					Le Blosne
		st_area_shape_		2690113.89355469
		st_length_shape_	0.00000000
		shape				01030000206C0F000...
		code_insee			35238

- ads_secteur_instruction

::
		

		'
		CREATE TABLE urba_foncier.ads_secteur_instruction
			(
			  objectid integer NOT NULL,
			  nom character varying(4),
			  instruc character varying(20),
			  pcm2 smallint,
			  pcp2 smallint,
			  dtm1 smallint,
			  dtp1 smallint,
			  area numeric(38,8),
			  len numeric(38,8),
			  echelle integer,
			  rotation integer,
			  ini_instru character varying(2),
			  shape geometry,
			  CONSTRAINT pk_ads_secteur_instruction_objectid PRIMARY KEY (objectid),
			  CONSTRAINT enforce_dims_shape CHECK (st_ndims(shape) = 2),
			  CONSTRAINT enforce_geotype_shape CHECK (geometrytype(shape) = 'MULTIPOLYGON'::text OR geometrytype(shape) = 'POLYGON'::text),
			  CONSTRAINT enforce_srid_shape CHECK (st_srid(shape) = 3948)
			)
		'		

**Exemple:**

::


		objectid		1
		nom				F
		instruc			P.Nom
		pcm2			40
		pcp2			59
		dtm1			83
		dtp1			72
		area			
		len	
		echelle			15000
		rotation		0
		ini_instru		LP
		shape			xxxxxxxxxxxxxxxxxxxxxxx


- v_ads_autorisation

::
		

		'
		CREATE OR REPLACE VIEW urba_foncier.v_ads_autorisation AS 
				 SELECT row_number() OVER ()::integer AS id,
					a.type,
					a.numdossier,
					a.precis,
					a.nature,
					st_multi(a.shape)::geometry(MultiPolygon,3948) AS shape
				   FROM ( SELECT ads_pc.id_pc,
							'PC'::text AS type,
							ads_pc.numdossier,
							ads_pc.precis,
							ads_pc.nature,
							ads_pc.shape
						   FROM urba_foncier.ads_pc
						UNION ALL
						 SELECT ads_pa.id_pa,
							'PA'::text AS type,
							ads_pa.numdossier,
							ads_pa.precis,
							ads_pa.nature,
							ads_pa.shape
						   FROM urba_foncier.ads_pa
						UNION ALL
						 SELECT ads_pd.id_pd,
							'PD'::text AS type,
							ads_pd.numdossier,
							ads_pd.precis,
							NULL::character varying AS nature,
							ads_pd.shape
						   FROM urba_foncier.ads_pd
						UNION ALL
						 SELECT ads_dp.id_dp,
							'DP'::text AS type,
							ads_dp.numdossier,
							ads_dp.precis,
							ads_dp.nature,
							ads_dp.shape
						   FROM urba_foncier.ads_dp) a;
		'


**Exemple:**
::


		id				1
		type			PC
		numdossier		PC 35238 02 10049
		precis			1
		nature			C
		shape			xxxxxxxxxxxxxxxxxxxxxxx



## Services OGC

onfigurable `ici <https://github.com/sigrennesmetropole/addon_urbanisme/blob/master/src/addon/urbanisme/config.json>`_. 

- service wms  des parcelles cadastrales au format cadastre_qgis
- service wms du zonage du PLU (fonction désactivée du front depuis le tag v2.1)
- URL du zip à télécherger pourles PLU (fonction désactivée du front depuis le tag v2.1)
- URL  de l'aide en ligne

 ## Moteur d'impression

MapfishPrint V3 doit être paramétré dans https://github.com/sigrennesmetropole/addon_urbanisme/tree/master/src/main/resources/templates/print
