package org.georchestra.urbanisme;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.net.URL;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.json.JSONWriter;
import org.mapfish.print.MapPrinter;
import org.mapfish.print.cli.Main;
import org.mapfish.print.wrapper.json.PJsonObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.ClassPathXmlApplicationContext;
import org.springframework.stereotype.Controller;
import org.springframework.util.Assert;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;

@Controller
@RequestMapping("/print")
public class PrintController {
    private final Logger log = LoggerFactory.getLogger(this.getClass());
    ApplicationContext context;
    private MapPrinter mapPrinter = null;

    @Value("${mapfishPrintConfigFile}")
    private String configFile = "/print/config.yaml";

    @PostConstruct
    public void init() throws RuntimeException {
        context = new ClassPathXmlApplicationContext(Main.DEFAULT_SPRING_CONTEXT);
        this.mapPrinter = context.getBean(MapPrinter.class);

        try {
            URL configFileUrl = null;
            if (System.getProperty("georchestra.datadir") == null) {
                configFileUrl = this.getClass().getResource(configFile);
            } else {
                configFileUrl = new URL(configFile);
            }

            Assert.notNull(configFileUrl);

            byte[] configFileData = FileUtils.readFileToByteArray(new File(configFileUrl.toURI()));
            this.mapPrinter.setConfiguration(configFileUrl.toURI(), configFileData);

        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @RequestMapping(value = "print", method = RequestMethod.POST)
    public void toMapfishPrintPdf(HttpServletRequest request, HttpServletResponse response) {

        try {
            String mfprintJsonSpec = IOUtils.toString(request.getInputStream());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PJsonObject mfSpec = MapPrinter.parseSpec(mfprintJsonSpec);
            this.mapPrinter.print(mfSpec, baos);
            response.getOutputStream().write(baos.toByteArray());
        } catch (Exception e) {
            log.error("Error generating PDF", e);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            // TODO should return at least an empty PDF page ?
        }
    }

    @RequestMapping("info.json")
    public void printCapabilities(HttpServletRequest request, HttpServletResponse response) throws IOException {
        StringWriter strw = new StringWriter();
        try {
            JSONWriter w = new org.json.JSONWriter(strw);
            w.object();
            mapPrinter.printClientConfig(w);
            w.endObject();
            response.getOutputStream().write(strw.toString().getBytes());
        } catch (Exception e) {
            log.error("Error getting mfprint capabilities", e);
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getOutputStream().write("{}".getBytes());
        }
    }
}
