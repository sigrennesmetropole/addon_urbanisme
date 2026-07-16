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

package org.georchestra.urbanisme.renseignurba;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.dbcp2.BasicDataSource;
import org.apache.commons.lang.StringUtils;

import lombok.RequiredArgsConstructor;

/**
 * This class represent storage of Renseignement d'urbanisme.
 */
@RequiredArgsConstructor
public class RenseignUrbaBackend {

	private final String driverClassName;
	private final String table;
	private final String tableTypeColumn;
	private final String tableTheme;
	private final String tableThemeGroupes;
	private final String ordreTheme;
	private final String parcelleAdresseRvaTable;
	private final String jdbcUrl;
	private BasicDataSource basicDataSource;

	/**
	 * Lazily create and return the BasicDataSource configured with the jdbc URL.
	 *
	 * @return the configured BasicDataSource
	 */
	private BasicDataSource getDataSource() {
		if (this.basicDataSource == null) {
			this.basicDataSource = new BasicDataSource();
			this.basicDataSource.setDriverClassName(this.driverClassName);
			this.basicDataSource.setTestOnBorrow(true);
			this.basicDataSource.setPoolPreparedStatements(true);
			this.basicDataSource.setMaxOpenPreparedStatements(-1);
			this.basicDataSource.setDefaultReadOnly(true);
			this.basicDataSource.setDefaultAutoCommit(true);
			this.basicDataSource.setUrl(this.jdbcUrl);
		}
		return this.basicDataSource;
	}

	/**
	 * Get renseignement d'urbanisme for the given parcelle.
	 *
	 * @param parcelle Parcelle ID
	 * @return RenseignUrba instance containing the libelles
	 * @throws SQLException if a database access error occurs
	 */
	public RenseignUrba getParcelle(String parcelle) throws SQLException {
		List<String> libellesVal = new ArrayList<>();
		String query = this.getNRUQuery();
		ResultSet rs = null;
		try (Connection connection = this.getDataSource().getConnection();
				PreparedStatement queryLibellesByParcelle = connection.prepareStatement(query)) {
			queryLibellesByParcelle.setString(1, parcelle);

			rs = queryLibellesByParcelle.executeQuery();
			while (rs.next()) {
				String libelle = rs.getString("libelle");
				libellesVal.add(libelle);
			}

			return new RenseignUrba(parcelle, libellesVal);
		} finally {
			if (rs != null) {
				rs.close();
			}
		}
	}

	/**
	 * Nouveau service Get renseignement d'urbanisme for the given parcelle.
	 *
	 * @param parcelle Parcelle ID
	 * @return RenseignUrba instance containing the libelles, the ordres, the
	 *         groupeRu
	 * @throws SQLException if a database access error occurs
	 */
	public RenseignUrba getParcelleNouvelleNRU(String parcelle) throws SQLException {

		List<String> libellesVal = new ArrayList<>();
		List<String> groupesRu = new ArrayList<>();
		List<String> typeDocuments = new ArrayList<>();
		List<Long> ordres = new ArrayList<>();
		ResultSet rs = null;

		String query = this.getNewNRUQuery();
		try (Connection connection = this.getDataSource().getConnection();
				PreparedStatement queryInfosByParcelle = connection.prepareStatement(query)) {
			queryInfosByParcelle.setString(1, parcelle);
			rs = queryInfosByParcelle.executeQuery();

			while (rs.next()) {
				String libelle = rs.getString("libelle");
				libellesVal.add(libelle);
				String groupeRu = rs.getString("groupe_ru");
				Long ordre = rs.getLong("ordre");
				groupesRu.add(groupeRu);
				if (StringUtils.isNotEmpty(tableTypeColumn)) {
					String typeDocument = rs.getString(tableTypeColumn);
					if (StringUtils.isNotEmpty(typeDocument) && !typeDocuments.contains(typeDocument)) {
						typeDocuments.add(typeDocument);
					}
				}
				ordres.add(ordre);
			}
			return new RenseignUrba(parcelle, libellesVal, groupesRu, typeDocuments, ordres);
		} finally {
			if (rs != null) {
				rs.close();
			}
		}
	}

	/**
	 * Requete SQL des nouveaux renseignements d'Urbanisme
	 * 
	 * @return Requete SQL à exécuter pour recuperer les Nouveaux Renseignement
	 *         d'Urbanisme
	 */
	private String getNRUQuery() {
		return "SELECT libelle  FROM  (  SELECT "
				+ " ru.libelle AS libelle, theme.ventilation_ddc AS ventilation_ddc, ru.numero AS numero FROM "
				+ this.table + " AS ru LEFT OUTER JOIN " + this.tableTheme + " AS theme " + "ON "
				+ "  ru.nom_theme = theme.nom  WHERE id_parc = ?) AS libelles " + "LEFT JOIN (VALUES " + this.ordreTheme
				+ ") AS ordre(code, priorite) ON libelles.ventilation_ddc = ordre.code "
				+ "ORDER BY ordre.priorite ASC, numero ASC ;";
	}

	/**
	 * Requete SQL des nouveaux renseignements d'Urbanisme
	 * 
	 * @return Requete SQL à exécuter pour recuperer les Nouveaux Renseignement
	 *         d'Urbanisme
	 */
	private String getNewNRUQuery() {
		return "SELECT ru.libelle AS libelle, "
				+ (StringUtils.isNotEmpty(this.tableTypeColumn) ? " ru." + this.tableTypeColumn + " as type, " : "")
				+ "theme.groupe_ru::text, theme.ordre FROM " + this.table + " AS ru LEFT OUTER JOIN "
				+ this.tableThemeGroupes
				+ " AS theme ON ru.nom_theme = theme.nom  WHERE id_parc = ? ORDER BY groupe_ru, ordre, libelle;";
	}

	/**
	 * Permet de recupérer les adresses légales d'une parcelle donnée
	 * 
	 * @param parcelle id de la parcelle
	 * @return Liste d'adresses légales
	 */
	public List<String> getAdressesPostales(String parcelle) throws SQLException {
		List<String> adressesPostales = new ArrayList<>();
		PreparedStatement queryAdressesPostalesByParcelle = null;
		ResultSet rs = null;
		try (Connection connection = this.getDataSource().getConnection()) {
			if (StringUtils.isEmpty(this.parcelleAdresseRvaTable)) {
				return adressesPostales;
			}

			String query = "SELECT adresse FROM " + this.parcelleAdresseRvaTable + " WHERE parc_ident = ?";
			queryAdressesPostalesByParcelle = connection.prepareStatement(query);
			queryAdressesPostalesByParcelle.setString(1, parcelle);
			rs = queryAdressesPostalesByParcelle.executeQuery();

			while (rs.next()) {
				String adressePostale = rs.getString("adresse");
				adressesPostales.add(adressePostale);
			}

			return adressesPostales;
		} finally {
			if (queryAdressesPostalesByParcelle != null) {
				queryAdressesPostalesByParcelle.close();
			}

			if (rs != null) {
				rs.close();
			}
		}
	}

}
