package org.georchestra.urbanisme.AdsSecteurInstruction;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Controller
public class AdsSecteurInstructionController {

    /**
     * Backend managing database configuration
     */
    private AdsSecteurInstructionBackend backend;

    @Value("${adsSecteurInstructionFunction}")
    private String adsSecteurInstructionFunction;
    @Value("${jdbcUrl}")
    private String jdbcUrl;
    @Value("${driverClassName}")
    private String driverClassName;

    /**
     * This read configuration in datadir a create configured backend
     */
    @PostConstruct
    private void init() {
        this.backend = new AdsSecteurInstructionBackend(driverClassName, adsSecteurInstructionFunction, jdbcUrl);
    }

    /**
     * Retrieve nom && ini_instru for the parcelle given in parameter
     *
     * @param response
     * @throws Exception
     */
    @RequestMapping(value = "/adsSecteurInstruction", method = RequestMethod.GET)
    public void getAdsSecteurInstruction(HttpServletRequest request, HttpServletResponse response) throws Exception {

        AdsSecteurInstruction adsSecteurInstruction = this.backend.getadsInstruction(request.getParameter("parcelle"));

        JSONObject res = new JSONObject();

        res.put("nom", adsSecteurInstruction.getNom());
        res.put("ini_instru", adsSecteurInstruction.getIni_instru());
        res.put("parcelle", request.getParameter("parcelle"));

        response.setContentType("application/json; charset=utf-8");
        response.getWriter().print(res.toString(4));
    }

}
