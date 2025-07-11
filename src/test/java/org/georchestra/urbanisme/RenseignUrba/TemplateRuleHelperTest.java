/**
 * 
 */
package org.georchestra.urbanisme.RenseignUrba;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class TemplateRuleHelperTest {

    @Mock
    private Map<String, Map<String, String>> templatesRulesMap;

    @InjectMocks
    private TemplateRuleHelper templateRuleHelper;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        templateRuleHelper = new TemplateRuleHelper();
        templateRuleHelper.setTemplatesRulesMap(templatesRulesMap);
        templateRuleHelper.setDefaultTemplate("Template Default");
    }


    @Test
    void testComputeTemplate_NoMatchingRule() {
        // Mocking the rules
        when(templatesRulesMap.entrySet()).thenReturn(Map.of(
            "rule1", Map.of("order", "1", "templateName", "Template1", "operator", "ANY", "values", "type3,type4")
        ).entrySet());

        // Initializing the rules
        templateRuleHelper.initializeTemplateRules();

        // Testing the computeTemplate method
        String result = templateRuleHelper.computeTemplate(List.of("type1"));
        assertEquals("Template Default", result); // Default template
    }
    
    @Test
    void testComputeTemplate_WithNoneOperator() {
        // Mocking the rules
        when(templatesRulesMap.entrySet()).thenReturn(Map.of(
            "rule1", Map.of("order", "1", "templateName", "Template1", "operator", "NONE", "values", "type1,type2")
        ).entrySet());

        // Initializing the rules
        templateRuleHelper.initializeTemplateRules();

        // Testing the computeTemplate method
        String result = templateRuleHelper.computeTemplate(List.of("type1"));
        assertEquals("Template Default", result); // Default template since NONE operator doesn't match
        
     // Testing the computeTemplate method
        result = templateRuleHelper.computeTemplate(List.of("type3"));
        assertEquals("Template1", result); // Default template since NONE operator doesn't match
    }
    
    @Test
    void testComputeTemplate_WithMatchingRule() {
        // Mocking the rules
        when(templatesRulesMap.entrySet()).thenReturn(Map.of(
            "rule1", Map.of("order", "1", "templateName", "Template1", "operator", "ANY", "values", "type1,type2"),
            "rule2", Map.of("order", "2", "templateName", "Template2", "operator", "ANY", "values", "type3,type4")
        ).entrySet());

        // Initializing the rules
        templateRuleHelper.initializeTemplateRules();

        // Testing the computeTemplate method
        String result = templateRuleHelper.computeTemplate(List.of("type1"));
        assertEquals("Template1", result);

        result = templateRuleHelper.computeTemplate(List.of("type3"));
        assertEquals("Template2", result);
    }
}
