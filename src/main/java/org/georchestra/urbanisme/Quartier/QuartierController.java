package org.georchestra.urbanisme.Quartier;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class QuartierController {


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
    public void getQuartier(HttpServletRequest request, HttpServletResponse response) throws Exception {

        Quartier quartier = this.backend.getNumNom(request.getParameter("parcelle"));

        JSONObject res = new JSONObject();

        res.put("numnom", quartier.getNumnom());
        res.put("parcelle", request.getParameter("parcelle"));


        response.setContentType("application/json; charset=utf-8");
        response.getWriter().print(res.toString(4));
    }

}
