package org.georchestra.urbanisme.RenseignUrba;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang.StringUtils;

/**
 * This class represents a template rule
 */
public class TemplateRule {

	private String name;

	private String templateName;

	private TemplateRuleOperator operator;

	private List<String> values;

	private int order = -1;

	public TemplateRule() {
		super();
	}

	public TemplateRule(String name) {
		super();
		this.name = name;
	}

	public TemplateRule(String name, int order, String templateName, TemplateRuleOperator operator,
			List<String> values) {
		super();
		this.name = name;
		this.order = order;
		this.operator = operator;
		this.templateName = templateName;
		this.values = values;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public int getOrder() {
		return order;
	}

	public void setOrder(int order) {
		this.order = order;
	}

	public String getTemplateName() {
		return templateName;
	}

	public void setTemplateName(String templateName) {
		this.templateName = templateName;
	}

	public TemplateRuleOperator getOperator() {
		return operator;
	}

	public void setOperator(TemplateRuleOperator operator) {
		this.operator = operator;
	}

	public List<String> getValues() {
		return values;
	}

	public boolean anyValues(List<String> inputValues) {
		if (CollectionUtils.isEmpty(values)) {
			return false;
		}
		return CollectionUtils.containsAny(values, inputValues);
	}

	public boolean noneValues(List<String> inputValues) {
		if (CollectionUtils.isEmpty(values)) {
			return true;
		}
		return !CollectionUtils.containsAny(values, inputValues);
	}

	public boolean oneValues(List<String> inputValues) {
		if (CollectionUtils.isEmpty(values)) {
			return false;
		}
		int count = 0;
		for (String inputValue : inputValues) {
			if (values.contains(inputValue)) {
				++count;
			}
		}
		return count == 1;
	}

	public void setValues(List<String> values) {
		this.values = values;
	}

	public void setValues(String valuesList) {
		if (StringUtils.isNotEmpty(valuesList)) {
			Arrays.stream(valuesList.split(",")).map(String::trim).forEach(this::addValue);
		}
	}

	public void addValue(String value) {
		if (values == null) {
			values = new ArrayList<>();
		}
		values.add(value);
	}

	@Override
	public String toString() {
		return "TemplateRule [name=" + name + ", templateName=" + templateName + ", operator=" + operator + ", values="
				+ values + ", order=" + order + "]";
	}
}
