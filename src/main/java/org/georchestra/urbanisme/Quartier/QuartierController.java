package org.georchestra.urbanisme.Quartier;

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
public class QuartierController {

    private static final String PARCELLE = "parcelle";
    private static final String NUM_NOM = "numnom";
    private static final String RESPONSE_TYPE_JSON = "application/json; charset=utf-8";

    /**
     * Backend managing database configuration
     */
    private QuartierBackend backend;

    @Value("${quartierFunction}")
    private String quartierFunction;
    @Value("${jdbcUrl}")
    private String jdbcUrl;
    @Value("${driverClassName}")
    private String driverClassName;

    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new QuartierBackend(driverClassName, quartierFunction, jdbcUrl);
    }

    /**
     * Retrieve numnom for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/quartier", method = RequestMethod.GET)
    public void getQuartier(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {

        Quartier quartier = this.backend.getNumNom(request.getParameter(PARCELLE));

        JSONObject res = new JSONObject();

        res.put(NUM_NOM, quartier.getNumnom());
        res.put(PARCELLE, request.getParameter(PARCELLE));

        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }

}
