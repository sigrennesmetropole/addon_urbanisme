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

package org.georchestra.urbanisme;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.dbcp2.BasicDataSource;

/**
 * This class represent storage of Renseignement d'urbanisme.
 */
public class RenseignUrbaBackend {

    private String table;
    private String tableTheme;
    private String ordreTheme;
    private String jdbcUrl;
    private BasicDataSource basicDataSource;

    /**
     * Create a new instance of RenseignUrbaBackend and crate a BasicDataSource configured with jdbc URL
     *
     * @param table      name of table containing renseignement d'urbanisme (libelles)
     * @param tableTheme name of table containing theme description
     * @param ordreTheme theme codes order
     * @param jdbcUrl    jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data
     */
    public RenseignUrbaBackend(final String driverClassName,
            final String table, final String tableTheme, final String ordreTheme,
            final String jdbcUrl) {
        this.table = table;
        this.tableTheme = tableTheme;
        this.ordreTheme = ordreTheme;
        this.jdbcUrl = jdbcUrl;

        this.basicDataSource = new BasicDataSource();
        this.basicDataSource.setDriverClassName(driverClassName);
        this.basicDataSource.setTestOnBorrow(true);
        this.basicDataSource.setPoolPreparedStatements(true);
        this.basicDataSource.setMaxOpenPreparedStatements(-1);
        this.basicDataSource.setDefaultReadOnly(true);
        this.basicDataSource.setDefaultAutoCommit(true);
        this.basicDataSource.setUrl(this.jdbcUrl);
    }

    /**
     * Get renseignement d'urbanisme for the given parcelle.
     *
     * @param parcelle Parcelle ID
     * @return RenseignUrba instance containing the libelles
     * @throws SQLException
     */
    public RenseignUrba getParcelle(String parcelle) throws SQLException {

        Connection connection = null;
        PreparedStatement queryLibellesByParcelle = null;

        List<String> libellesVal;
        libellesVal = new ArrayList<String>();

        try {
            connection = this.basicDataSource.getConnection();
            String query = "SELECT "
                + "     libelle "
                + "FROM "
                + "(  SELECT "
                + "       ru.libelle AS libelle,"
                + "       theme.ventilation_ddc AS ventilation_ddc,"
                + "       ru.numero AS numero "
                + "   FROM "
                + this.table + " AS ru "
                + "LEFT OUTER JOIN "
                + this.tableTheme + " AS theme "
                + "ON "
                + "  ru.nom_theme = theme.nom "
                + "WHERE "
                + "  id_parc = ?) AS libelles "
                + "LEFT JOIN (VALUES " + this.ordreTheme + ") AS ordre(code, priorite) "
                + "ON libelles.ventilation_ddc = ordre.code "
                + "ORDER BY ordre.priorite ASC, numero ASC ;";

            queryLibellesByParcelle = connection.prepareStatement(query);
            queryLibellesByParcelle.setString(1, parcelle);
            ResultSet rs = queryLibellesByParcelle.executeQuery();

            while (rs.next()) {
                String libelle = rs.getString("libelle");
                libellesVal.add(libelle);
            }
            RenseignUrba renseign = new RenseignUrba(parcelle, libellesVal);
            return renseign;
        } finally {
            if ((queryLibellesByParcelle != null) && (!queryLibellesByParcelle.isClosed())) {
                queryLibellesByParcelle.close();
            }
            if ((connection != null) && (!connection.isClosed())) {
                connection.close();
            }
        }
    }
}
