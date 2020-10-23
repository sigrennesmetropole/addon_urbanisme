---function intersect cadastre_qgis.geo_parcelle &&  limite_admin.quartier
CREATE OR REPLACE FUNCTION limite_admin.rm_intersect_ediparc_quartier(IN idparc character varying)
  RETURNS TABLE(numnom character varying) AS
$BODY$
BEGIN
    RETURN QUERY SELECT b.numnom
        FROM  cadastre_qgis.geo_parcelle AS a , limite_admin.quartier AS b
      WHERE a.geo_parcelle = idParc AND st_intersects(a.geom, b.shape);
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

--function intersect cadastre_qgis.geo_parcellecadastre.edi_parc &&  urba_foncier.ads_secteur_instruction
CREATE OR REPLACE FUNCTION urba_foncier.rm_intersect_ediparc_adssecteurinstruction(IN idparc character varying)
  RETURNS TABLE(nom character varying, ini_instru character varying) AS
$BODY$
	 
BEGIN
    RETURN QUERY SELECT b.nom, b.ini_instru
                FROM cadastre_qgis.geo_parcelle AS a , urba_foncier.ads_secteur_instruction AS b
                WHERE a.geo_parcelle = idParc AND st_intersects(a.geom, b.shape);
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;

--function intersect cadastre_qgis.geo_parcelle &&  urba_foncier.v_ads_autorisation
CREATE OR REPLACE FUNCTION urba_foncier.rm_intersect_ediparc_vadsautorisation(IN idparc character varying)
  RETURNS TABLE(numdossier character varying) AS
$BODY$
BEGIN
    RETURN QUERY SELECT b.numdossier
FROM cadastre_qgis.geo_parcelle AS a , urba_foncier.v_ads_autorisation AS b
WHERE a.geo_parcelle = idParc AND st_intersects(a.geom, b.shape);
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100
  ROWS 1000;
