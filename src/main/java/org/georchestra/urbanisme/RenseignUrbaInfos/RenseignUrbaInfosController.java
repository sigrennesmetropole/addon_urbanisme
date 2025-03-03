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

package org.georchestra.urbanisme.RenseignUrbaInfos;


import org.georchestra.urbanisme.RenseignUrbaInfos.RenseignUrbaInfos;
import org.georchestra.urbanisme.RenseignUrbaInfos.RenseignUrbaInfosBackend;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * This class defines webservices to retrieve « date » from database
 */
@Controller
public class RenseignUrbaInfosController {

    /**
     * Backend managing database configuration
     */
    private RenseignUrbaInfosBackend backend;

    @Value("${renseignUrbaInfosTable}")
    private String renseignUrbaInfosTable;
    @Value("${jdbcUrl}")
    private String jdbcUrl;
    @Value("${driverClassName}")
    private String driverClassName;



    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new RenseignUrbaInfosBackend(driverClassName, renseignUrbaInfosTable,jdbcUrl);
    }


    /**
     * Retrieve libelles for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/renseignUrbaInfos", method = RequestMethod.GET)
    public void getRenseignUrbaInfos(HttpServletRequest request, HttpServletResponse response) throws Exception {

        RenseignUrbaInfos renseign = this.backend.getDate(request.getParameter("code_commune"));

        JSONObject res = new JSONObject();

        res.put("code_commune", request.getParameter("code_commune"));
        res.put("date_ru", renseign.getDate_ru());
        res.put("date_pci", renseign.getDate_pci());

        response.setContentType("application/json; charset=utf-8");
        response.getWriter().print(res.toString(4));
    }

}
