/*
 * Copyright (C) 2009-2016 by the geOrchestra PSC
 *
 * This file is part of geOrchestra.
 *
 * geOrchestra is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * geOrchestra is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.georchestra.urbanisme.RenseignUrba;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;


/**
 * This class defines webservices to retrieve « libelles » from database
 */
@Controller
public class RenseignUrbaController {

    private static final String PARCELLE = "parcelle";
    private static final String LIBELLES = "libelles";
    private static final String LIBELLE = "libelle";
    private static final String GROUPES_LIBELLE = "groupesLibelle";
    private static final String GROUPE_RU = "groupe_ru";
    private static final String TYPE_DOCUMENTS = "type";
    private static final String ORDRE = "ordre";
    private static final String ADRESSES_POSTALES = "adressesPostales";
    private static final String RESPONSE_TYPE_JSON = "application/json; charset=utf-8";

    /**
     * Backend managing database configuration
     */
    private RenseignUrbaBackend backend;

    @Value("${parcelleAdresseRvaTable:}")
    private String parcelleAdresseRvaTable;
    @Value("${renseignUrbaTable}")
    private String renseignUrbaTable;
    @Value("${tableTheme}")
    private String tableTheme;
    @Value("${ordreTheme}")
    private String ordreTheme;
    @Value("${tableThemeGroupes:}")
    private String tableThemeGroupes;
    @Value("${jdbcUrl}")
    private String jdbcUrl;
    @Value("${driverClassName}")
    private String driverClassName;

    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new RenseignUrbaBackend(driverClassName, renseignUrbaTable,
                tableTheme, tableThemeGroupes, ordreTheme, parcelleAdresseRvaTable, jdbcUrl);
    }

    /**
     * Give general information about web service.
     * Mostly present for debug purpose.
     *
     * @param response
     * @throws IOException
     * @throws JSONException
     */
    @RequestMapping(value = "/about", method = RequestMethod.GET)
    public void getAbout(HttpServletResponse response) throws IOException, JSONException {

        JSONObject res = new JSONObject();

        res.put("msg", "Urbanisme web service");

        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }

    /**
     * Retrieve libelles for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/renseignUrba", method = RequestMethod.GET)
    public void getRenseignUrba(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {

        RenseignUrba renseign = this.backend.getParcelle(request.getParameter(PARCELLE));

        JSONArray libs = new JSONArray();


        for (String libelle : renseign.getLibelles()) {
            JSONObject libelleRow = new JSONObject();
            libelleRow.put(LIBELLE, libelle);
            libs.put(libelleRow);
        }

        JSONObject res = new JSONObject();

        res.put(PARCELLE, request.getParameter(PARCELLE));
        res.put(LIBELLES, libs);

        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }


    /**
     * Retrieve groupements de renseignements (libelles, nom, ordre) for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/renseignUrbaGroupe", method = RequestMethod.GET)
    public void getNewRenseignUrba(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {

        // On récupère le renseignement d'urbanisme
        RenseignUrba renseign = this.backend.getParcelleNouvelleNRU(request.getParameter(PARCELLE));

        // On recupere les adresses postales
        List<String> adressesPostales = this.backend.getAdressesPostales(request.getParameter(PARCELLE));

        // Initialisation du la liste des groupes de renseignements
        JSONArray groupesRenseignements= new JSONArray();
        AtomicReference<JSONException> jsonException = null;
        // On parcourts les groupes après un filtre éliminant les doublons
        // Le but de regrouper les renseignement par groupe de renseignement
        renseign.getGroupesRu().stream().distinct().forEach(groupe -> {
            try {
                // Pour chaque groupe de renseignement
                JSONObject groupeRu = new JSONObject();
                // On ajoute le nom et l'ordre
                Long ordre = 0L;
                int index = renseign.getGroupesRu().indexOf(groupe);
                if (index != -1 && index < renseign.getOrdres().size()) {
                    ordre = renseign.getOrdres().get(index);
                }
                groupeRu.put(GROUPE_RU, groupe);
                groupeRu.put(ORDRE, ordre);

                // On ajoute ensuite tous les libelles associés à ce groupement de renseignements
                List<String> libelles = new ArrayList<>();
                for (int i = 0; i < renseign.getLibelles().size(); i++) {
                    if (i < renseign.getGroupesRu().size() && StringUtils.equals(renseign.getGroupesRu().get(i), groupe)) {
                        libelles.add(renseign.getLibelles().get(i));
                    }
                }
                groupeRu.put(LIBELLES, libelles);

                // On continue en ajoutant tous les types de documents associés
                List<String> types = new ArrayList<>();
                for (int i = 0; i < renseign.getTypeDocuments().size(); i++) {
                    if (i < renseign.getGroupesRu().size() && StringUtils.equals(renseign.getGroupesRu().get(i), groupe)) {
                        types.add(renseign.getTypeDocuments().get(i));
                    }
                }
                groupeRu.put(TYPE_DOCUMENTS, types);
                // On ajoute le groupement de personne à la liste des groupements de personnes
                groupesRenseignements.put(groupeRu);
            } catch (JSONException e) {
                jsonException.set(e);
            }
        });
        if (jsonException != null && jsonException.get() != null) {
            throw new JSONException(jsonException.get());
        }

        JSONObject res = new JSONObject();

        res.put(PARCELLE, request.getParameter(PARCELLE));
        res.put(GROUPES_LIBELLE, groupesRenseignements);
        res.put(ADRESSES_POSTALES, adressesPostales);


        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }
}

