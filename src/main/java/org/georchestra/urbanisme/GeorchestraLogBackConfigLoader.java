package org.georchestra.urbanisme;

import java.io.File;
import java.io.IOException;

import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.joran.JoranConfigurator;
import ch.qos.logback.core.joran.spi.JoranException;
import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Simple Utility class for loading an external config file for logback
 *
 * inspired from:
 * * cadastrapp source code
 * * https://bowerstudios.com/node/896
 */
@Component
public class GeorchestraLogBackConfigLoader {

	private Logger logger = LoggerFactory.getLogger(GeorchestraLogBackConfigLoader.class);

	public GeorchestraLogBackConfigLoader() {
		// constructeur par défaut
	}

	@PostConstruct
	public void init() throws IOException, JoranException {
		LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
		String georDatadir = System.getProperty("georchestra.datadir");
		if (georDatadir == null) {
			logger.info("No georchestra datadir defined, skipping logback reconfiguration.");
			return;
		}

		File urbaLogBackFile = new File(georDatadir, "urbanisme" + File.separator + "logback.xml");
		if (!urbaLogBackFile.exists()) {
			logger.info("georchestra datadir detected, but unable to find logback.xml configuration file,"
					+ " skipping logback reconfiguration.");
			return;
		}

		if (!urbaLogBackFile.isFile()) {
			logger.error("Logback External Config File Parameter exists, but does not reference a file: {}", urbaLogBackFile);
		} else {
			if (!urbaLogBackFile.canRead()) {
				logger.error("Logback External Config File exists and is a file, but cannot be read: {}", urbaLogBackFile);
			} else {
				JoranConfigurator configurator = new JoranConfigurator();
				configurator.setContext(lc);
				lc.reset();
				configurator.doConfigure(urbaLogBackFile);
				logger.error("Configured Logback with config file from: {}", urbaLogBackFile);
			}
		}
	}
}