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

package org.georchestra.mapfishapp.addons.urbanisme;

import java.util.ArrayList;
import java.util.List;

import org.georchestra.commons.configuration.GeorchestraConfiguration;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;



@Controller
public class RenseignUrbaController {

    @Autowired
    private GeorchestraConfiguration configuration;

    @PostConstruct
    private void init(){
    }

    @RequestMapping(value = "/urbanisme/hello", method = RequestMethod.GET)
        public void sayHello(HttpServletResponse response) throws IOException {

        JSONObject res = new JSONObject();

        res.put("say","Hello!");

        response.setContentType("application/json");
        response.getWriter().print(res.toString(4));

    }

    @RequestMapping(value = "/urbanisme/renseignUrba/{parcelle}", method = RequestMethod.GET)
    public void getRenseignUrba(HttpServletResponse response, @PathVariable String parcelle) throws Exception {

        List<String> libellesVal;
        libellesVal = new ArrayList<String>();
        libellesVal.add("a");
        libellesVal.add("b");
        libellesVal.add("c");
        
        RenseignUrba renseign = new RenseignUrba("1234", libellesVal);

        JSONArray libs = new JSONArray();

        for (String libelle : renseign.getLibelles()) {
            libs.put(libelle);
        }

        
        JSONObject res = new JSONObject();
        res.put("parcelle", parcelle);
        res.put("libelles", libs);

        response.setContentType("application/json");
        response.getWriter().print(res.toString(4));
    }

}

