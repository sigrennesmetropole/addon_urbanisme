--function intersect cadastre.edi_parc &&  limite_admin.quartier
CREATE OR REPLACE FUNCTION limite_admin.intersect_ediparc_quartier(idparc VARCHAR)
    RETURNS TABLE(numnom VARCHAR)
AS $$
BEGIN
    RETURN QUERY SELECT b.numnom
        FROM  cadastre.edi_parc AS a , limite_admin.quartier AS b
        WHERE a.id_parc = idParc AND st_intersects(a.shape, b.shape);
END;
$$
LANGUAGE 'plpgsql';

--function intersect cadastre.edi_parc &&  urba_foncier.ads_secteur_instruction
CREATE OR REPLACE FUNCTION urba_foncier.intersect_ediparc_adssecteurinstruction(idparc VARCHAR)
    RETURNS TABLE(nom VARCHAR,
                  ini_instru VARCHAR)
AS $$
BEGIN
    RETURN QUERY SELECT b.nom, b.ini_instru
                 FROM  cadastre.edi_parc  AS a , urba_foncier.ads_secteur_instruction AS b
                 WHERE a.id_parc = idParc AND st_intersects(a.shape, b.shape);
END;
$$
LANGUAGE 'plpgsql';

--function intersect cadastre.edi_parc &&  urba_foncier.v_ads_autorisation
CREATE OR REPLACE FUNCTION urba_foncier.intersect_ediparc_vadsautorisation(idparc VARCHAR)
    RETURNS TABLE(numdossier VARCHAR)
AS $$
BEGIN
    RETURN QUERY SELECT b.numdossier
                 FROM cadastre.edi_parc AS a , urba_foncier.v_ads_autorisation AS b
                 WHERE a.id_parc = idParc AND st_intersects(a.shape, b.shape);
END;
$$
LANGUAGE 'plpgsql';
