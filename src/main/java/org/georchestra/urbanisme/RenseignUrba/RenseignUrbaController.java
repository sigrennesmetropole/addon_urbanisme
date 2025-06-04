/*
 * Copyright (C) 2009-2016 by the geOrchestra PSC
 *
 * This file is part of geOrchestra.
 *
 * geOrchestra is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option)
 * any later version.
 *
 * geOrchestra is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * geOrchestra.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.georchestra.urbanisme.RenseignUrba;

import java.io.IOException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import javax.annotation.PostConstruct;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.lang.StringUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * This class defines webservices to retrieve « libelles » from database
 */
@Controller
public class RenseignUrbaController {

	private static final String PARCELLE = "parcelle";
	private static final String LIBELLES = "libelles";
	private static final String LIBELLE = "libelle";
	private static final String GROUPES_LIBELLE = "groupesLibelle";
	private static final String GROUPE_RU = "groupe_ru";
	private static final String TYPE_DOCUMENTS = "type";
	private static final String ORDRE = "ordre";
	private static final String ADRESSES_POSTALES = "adressesPostales";
	private static final String RESPONSE_TYPE_JSON = "application/json; charset=utf-8";

	/**
	 * Backend managing database configuration
	 */
	private RenseignUrbaBackend backend;

	@Value("${parcelleAdresseRvaTable:}")
	private String parcelleAdresseRvaTable;
	@Value("${renseignUrbaTable}")
	private String renseignUrbaTable;
	@Value("${tableTheme}")
	private String tableTheme;
	@Value("${ordreTheme}")
	private String ordreTheme;
	@Value("${tableThemeGroupes:}")
	private String tableThemeGroupes;
	@Value("${excludeTypes:Donnée vivante}")
	private List<String> excludeDocumentTypes;
	@Value("${renseignUrbaTable.column.type:}")
	private String renseignUrbaTableTypeColumn;
	@Value("${jdbcUrl}")
	private String jdbcUrl;
	@Value("${driverClassName}")
	private String driverClassName;

	@Autowired
	private TemplateRuleHelper templateRuleHelper;

	/**
	 * This read configuration in datadir a create configured backend
	 */
	@PostConstruct
	private void init() {
		this.backend = new RenseignUrbaBackend(driverClassName, renseignUrbaTable, renseignUrbaTableTypeColumn,
				tableTheme, tableThemeGroupes, ordreTheme, parcelleAdresseRvaTable, jdbcUrl);
	}

	/**
	 * Give general information about web service. Mostly present for debug purpose.
	 *
	 * @param response
	 * @throws IOException
	 * @throws JSONException
	 */
	@GetMapping(value = "/about")
	public void getAbout(HttpServletResponse response) throws IOException, JSONException {

		JSONObject res = new JSONObject();

		res.put("msg", "Urbanisme web service");

		response.setContentType(RESPONSE_TYPE_JSON);
		response.getWriter().print(res.toString(4));
	}

	/**
	 * Retrieve libelles for the parcelle given in parameter
	 *
	 * @param response
	 * @throws Exception
	 */
	@GetMapping(value = "/renseignUrba")
	public void getRenseignUrba(HttpServletRequest request, HttpServletResponse response)
			throws SQLException, IOException {

		RenseignUrba renseign = this.backend.getParcelle(request.getParameter(PARCELLE));

		JSONArray libs = new JSONArray();

		for (String libelle : renseign.getLibelles()) {
			JSONObject libelleRow = new JSONObject();
			libelleRow.put(LIBELLE, libelle);
			libs.put(libelleRow);
		}

		JSONObject res = new JSONObject();

		res.put(PARCELLE, request.getParameter(PARCELLE));
		res.put(LIBELLES, libs);

		response.setContentType(RESPONSE_TYPE_JSON);
		response.getWriter().print(res.toString(4));
	}

	/**
	 * Retrieve groupements de renseignements (libelles, nom, ordre) for the
	 * parcelle given in parameter
	 *
	 * @param response
	 * @throws Exception
	 */
	@GetMapping(value = "/renseignUrbaGroupe")
	public void getNewRenseignUrba(HttpServletRequest request, HttpServletResponse response)
			throws SQLException, IOException {

		// On récupère le renseignement d'urbanisme
		RenseignUrba renseign = this.backend.getParcelleNouvelleNRU(request.getParameter(PARCELLE));

		// On recupere les adresses postales
		List<String> adressesPostales = this.backend.getAdressesPostales(request.getParameter(PARCELLE));

		// Initialisation de la liste des groupes de renseignements
		JSONArray groupesRenseignements = new JSONArray();
		AtomicReference<JSONException> jsonException = new AtomicReference<>(null);
		// On parcourt les groupes après un filtre éliminant les doublons
		// Le but de regrouper les renseignements par groupe de renseignement
		renseign.getGroupesRu().stream().distinct()
				.forEach(groupe -> handleGroupe(groupe, renseign, groupesRenseignements, jsonException));
		if (jsonException.get() != null) {
			throw new JSONException(jsonException.get());
		}

		JSONObject res = new JSONObject();

		res.put(PARCELLE, request.getParameter(PARCELLE));
		res.put(GROUPES_LIBELLE, groupesRenseignements);
		res.put(ADRESSES_POSTALES, adressesPostales);

		response.setContentType(RESPONSE_TYPE_JSON);
		response.getWriter().print(res.toString(4));
	}

	private void handleGroupe(String groupe, RenseignUrba renseign, JSONArray groupesRenseignements,
			AtomicReference<JSONException> jsonException) {
		try {
			// Pour chaque groupe de renseignement
			JSONObject groupeRu = new JSONObject();
			// On ajoute le nom et l'ordre
			Long ordre = 0L;
			int index = renseign.getGroupesRu().indexOf(groupe);
			if (index != -1 && index < renseign.getOrdres().size()) {
				ordre = renseign.getOrdres().get(index);
			}
			groupeRu.put(GROUPE_RU, groupe);
			groupeRu.put(ORDRE, ordre);

			// On ajoute ensuite tous les libelles associés à ce groupement de
			// renseignements
			List<String> libelles = new ArrayList<>();
			for (int i = 0; i < renseign.getLibelles().size(); i++) {
				if (i < renseign.getGroupesRu().size() && StringUtils.equals(renseign.getGroupesRu().get(i), groupe)) {
					libelles.add(renseign.getLibelles().get(i));
				}
			}
			groupeRu.put(LIBELLES, libelles);

			// On continue en ajoutant tous les types de documents associés
			List<String> types = new ArrayList<>();
			for (int i = 0; i < renseign.getTypeDocuments().size(); i++) {
				String type = renseign.getTypeDocuments().get(i);
				if (i < renseign.getGroupesRu().size() && StringUtils.equals(renseign.getGroupesRu().get(i), groupe)
						&& !excludeDocumentTypes.contains(type)) {
					types.add(type);
				}
			}
			groupeRu.put(TYPE_DOCUMENTS, types);
			// On ajoute le groupement de personne à la liste des groupements de personnes
			groupesRenseignements.put(groupeRu);
		} catch (JSONException e) {
			jsonException.set(e);
		}
	}

	@GetMapping(value = "/templates")
	public void getTemplateName(HttpServletRequest request, HttpServletResponse response) throws IOException {
		String templateName = templateRuleHelper.computeTemplate(getParameterTypes(request));

		response.setContentType(RESPONSE_TYPE_JSON);
		response.getWriter().print(templateName != null ? '"' + templateName + '"' : null);
	}

	protected List<String> getParameterTypes(HttpServletRequest request) {
		List<String> types = new ArrayList<>();
		String[] typeValues = request.getParameterValues("type");
		if (typeValues != null) {
			// On filtre les types pour ne garder que ceux qui sont non vides
			for (String type : typeValues) {
				if (StringUtils.isNotEmpty(type)) {
					types.add(type);
				}
			}
		}
		return types;
	}
}
