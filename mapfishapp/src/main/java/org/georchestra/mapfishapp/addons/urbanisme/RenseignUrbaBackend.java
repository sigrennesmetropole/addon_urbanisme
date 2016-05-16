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

package org.georchestra.mapfishapp.addons.urbanisme;

import java.util.ArrayList;
import java.util.List;

import org.apache.commons.dbcp.BasicDataSource;

import java.sql.Connection;
import java.sql.Statement;
import java.sql.SQLException;
import java.sql.ResultSet;

/**
 * This class represent storage of Renseignement d'urbanisme.
 */
public class RenseignUrbaBackend {

    private String table;
    private String jdbcUrl;
    private BasicDataSource basicDataSource;

    /**
     * Create a new instance of RenseignUrbaBackend and crate a BasicDataSource configured with jdbc URL
     * @param table name of table containing renseignement d'urbanisme (libelles)
     * @param jdbcUrl jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data
     */
    public RenseignUrbaBackend(String table, String jdbcUrl) {
        this.table = table;
        this.jdbcUrl = jdbcUrl;

        this.basicDataSource = new BasicDataSource();
        this.basicDataSource.setDriverClassName("org.postgresql.Driver");
        this.basicDataSource.setTestOnBorrow(true);
        this.basicDataSource.setPoolPreparedStatements(true);
        this.basicDataSource.setMaxOpenPreparedStatements(-1);
        this.basicDataSource.setDefaultReadOnly(true);
        this.basicDataSource.setDefaultAutoCommit(true);
        this.basicDataSource.setUrl(jdbcUrl);
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
        Statement st = null;
        
        List<String> libellesVal;
        libellesVal = new ArrayList<String>();

        connection = this.basicDataSource.getConnection();
        String query = "SELECT libelle FROM " + this.table + " WHERE id_parc='" + parcelle + "';";
        st = connection.createStatement();
        ResultSet rs = st.executeQuery(query);

        while (rs.next()) {
            String libelle = rs.getString("libelle");
            libellesVal.add(libelle);
        }

        RenseignUrba renseign = new RenseignUrba(parcelle, libellesVal);

        return renseign;
    }
}
