package org.georchestra.urbanisme.AdsSecteurInstruction;

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
public class AdsSecteurInstructionController {

    private static final String PARCELLE = "parcelle";
    private static final String NOM = "nom";
    private static final String INI_INSTRU = "ini_instru";
    private static final String RESPONSE_TYPE_JSON = "application/json; charset=utf-8";

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
    public void getAdsSecteurInstruction(HttpServletRequest request, HttpServletResponse response) throws SQLException, IOException {

        AdsSecteurInstruction adsSecteurInstruction = this.backend.getadsInstruction(request.getParameter(PARCELLE));

        JSONObject res = new JSONObject();

        res.put(NOM, adsSecteurInstruction.getNom());
        res.put(INI_INSTRU, adsSecteurInstruction.getIni_instru());
        res.put(PARCELLE, request.getParameter(PARCELLE));

        response.setContentType(RESPONSE_TYPE_JSON);
        response.getWriter().print(res.toString(4));
    }

}
