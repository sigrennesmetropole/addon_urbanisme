package org.georchestra.urbanisme.AdsAutorisation;

import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.sql.SQLException;

@Controller
public class AdsAutorisationController {

    private static final String PARCELLE = "parcelle";
    private static final String NUM_DOSSIER = "numdossier";
    private static final String RESPONSE_TYPE_JSON = "application/json; charset=utf-8";

    /**
     * Backend managing database configuration
     */
    private AdsAutorisationBackend backend;

    @Value("${adsAutorisationFunction}")
    private String adsAutorisationFunction;
    @Value("${jdbcUrl}")
    private String jdbcUrl;
    @Value("${driverClassName}")
    private String driverClassName;

    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new AdsAutorisationBackend(driverClassName, adsAutorisationFunction, jdbcUrl);
    }


    /**
     * Retrieve numdossier for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/adsAutorisation", method = RequestMethod.GET)
    public void getAdsAutorisation(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {

        AdsAutorisation adsAutorisation = this.backend.getNumDossier(request.getParameter(PARCELLE));

        JSONArray nums = new JSONArray();


        for (String numdossier : adsAutorisation.getNumdossier()) {
            JSONObject numDossierRow = new JSONObject();
            numDossierRow.put(NUM_DOSSIER, numdossier);
            nums.put(numDossierRow);
        }

        JSONObject res = new JSONObject();

        res.put(NUM_DOSSIER, nums);
        res.put(PARCELLE, request.getParameter(PARCELLE));


        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }
}
