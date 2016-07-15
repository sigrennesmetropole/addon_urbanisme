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

package org.georchestra.urbanisme;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.georchestra.commons.configuration.GeorchestraConfiguration;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;


/**
 * This class defines webservices to retrieve « libelles » from database
 */
@Controller
public class RenseignUrbaController {

    /**
     * GeorchestraConfiguration is used to retrieve database related parameters.
     * They need to be defined in the mapfishapp.properties file like :
     * urbanisme.jdbcUrl=jdbc:postgresql://localhost:5432/urbanisme?user=www-data&password=www-data
     * urbanisme.renseignUrbaTable=app_plu.renseign_urba
     */
    @Autowired
    private GeorchestraConfiguration configuration;

    /**
     * Backend managing database configuration
     */
    private RenseignUrbaBackend backend;

    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new RenseignUrbaBackend(configuration.getProperty("urbanisme.renseignUrbaTable"),
                configuration.getProperty("urbanisme.tableTheme"),
                configuration.getProperty("urbanisme.ordreTheme"),
                configuration.getProperty("urbanisme.jdbcUrl"));

    }

    /**
     * Give general information about web service.
     * Mostly present for debug purpose.
     *
     * @param response
     * @throws IOException
     */
    @RequestMapping(value = "/about", method = RequestMethod.GET)
    public void getAbout(HttpServletResponse response) throws IOException {

        JSONObject res = new JSONObject();

        res.put("msg", "Urbanisme web service");

        response.setContentType("application/json");
        response.getWriter().print(res.toString(4));

    }

    /**
     * Retrieve libelles for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/renseignUrba", method = RequestMethod.GET)
    public void getRenseignUrba(HttpServletRequest request, HttpServletResponse response) throws Exception {

        RenseignUrba renseign = this.backend.getParcelle(request.getParameter("parcelle"));

        JSONArray libs = new JSONArray();


        for (String libelle : renseign.getLibelles()) {
            JSONObject libelleRow = new JSONObject();
            libelleRow.put("libelle", libelle);
            libs.put(libelleRow);
        }


        JSONObject res = new JSONObject();


        res.put("parcelle", request.getParameter("parcelle"));
        res.put("libelles", libs);

        response.setContentType("application/json");
        response.getWriter().print(res.toString(4));
    }

}

