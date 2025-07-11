/**
 * 
 */
package org.georchestra.urbanisme.RenseignUrba;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

import org.apache.commons.collections4.CollectionUtils;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Classe de chargement de la configuration des règles d'affactation des
 * templates
 */
@Component
public class TemplateRuleHelper {

	private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(TemplateRuleHelper.class);

	@Value("${templates.default:A4 portrait}")
	private String defaultTemplate;

	@Value("#{${templates.rules}}")
	private Map<String, Map<String, String>> templatesRulesMap;

	private List<TemplateRule> templateRules;

	public String computeTemplate(List<String> types) {
		String result = null;
		initializeTemplateRules();

		if (CollectionUtils.isNotEmpty(templateRules)) {
			for (TemplateRule templateRule : templateRules) {
				String template = handleRule(templateRule, types);
				if (template != null) {
					result = template;
					break;
				}
			}
		}
		if (result == null) {
			LOGGER.info("No template rule matched, using default template: {}", defaultTemplate);
			result = defaultTemplate;
		}
		return result;
	}

	private String handleRule(TemplateRule templateRule, List<String> types) {
		String result = null;
		LOGGER.info("Checking template rule: {}", templateRule.getName());
		switch (templateRule.getOperator()) {
		case ANY:
			if (templateRule.anyValues(types)) {
				result = templateRule.getTemplateName();
			}
			break;
		case NONE:
			if (templateRule.noneValues(types)) {
				result = templateRule.getTemplateName();
			}
			break;
		case ONE:
			if (templateRule.oneValues(types)) {
				result = templateRule.getTemplateName();
			}
			break;
		}
		LOGGER.info("Checking template rule result: {}={}", templateRule.getName(), result);
		return result;
	}

	public void initializeTemplateRules() {
		if (templateRules == null) {
			LOGGER.info("Initializing template rules...");
			templateRules = templatesRulesMap.entrySet().stream()
					.map(entry -> convertProperties(entry.getKey(), entry.getValue()))
					.sorted(Comparator.comparingInt(TemplateRule::getOrder)).toList();
			LOGGER.info("Initializing template rules done.");
		}
	}

	protected TemplateRule convertProperties(String name, Map<String, String> properties) {
		TemplateRule result = new TemplateRule(name);
		result.setOrder(Integer.valueOf(properties.get("order")));
		result.setTemplateName(properties.get("templateName"));
		result.setOperator(TemplateRuleOperator.valueOf(properties.get("operator")));
		result.setValues(properties.get("values"));
		LOGGER.info("Initializing template rules {}", result);
		return result;
	}


	public String getDefaultTemplate() {
		return defaultTemplate;
	}

	public void setDefaultTemplate(String defaultTemplate) {
		this.defaultTemplate = defaultTemplate;
	}

	public Map<String, Map<String, String>> getTemplatesRulesMap() {
		return templatesRulesMap;
	}

	public void setTemplatesRulesMap(Map<String, Map<String, String>> templatesRulesMap) {
		this.templatesRulesMap = templatesRulesMap;
	}

}
