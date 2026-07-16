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

package org.georchestra.urbanisme.renseignurbainfos;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.apache.commons.dbcp2.BasicDataSource;


public class RenseignUrbaInfosBackend {

    private final String table;
    private final BasicDataSource basicDataSource;

    /**
     * Create a new instance of RenseignUrbaInfosBackend and crate a BasicDataSource configured with jdbc URL
     *
     * @param table      name of table containing date production RU
     * @param jdbcUrl    jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data
     */
    public RenseignUrbaInfosBackend(final String driverClassName,
                               final String table, final String jdbcUrl) {
        this.table = table;

        this.basicDataSource = new BasicDataSource();
        this.basicDataSource.setDriverClassName(driverClassName);
        this.basicDataSource.setTestOnBorrow(true);
        this.basicDataSource.setPoolPreparedStatements(true);
        this.basicDataSource.setMaxOpenPreparedStatements(-1);
        this.basicDataSource.setDefaultReadOnly(true);
        this.basicDataSource.setDefaultAutoCommit(true);
        this.basicDataSource.setUrl(jdbcUrl);
    }

    /**
     * Get date de production des RU et le millésime du cadastre.
     *
     * @param codeCommune code commune used to filter the renseignement
     * @return RenseignUrba instance containing date_ru & date_pci
     * @throws SQLException if a database access error occurs
     */
    public RenseignUrbaInfos getDate(String codeCommune) throws SQLException {
        String dateRu = "";
        String datePci = "";
        String query = "SELECT " +" code_commune," +"date_ru," +" date_pci FROM " + this.table +" WHERE code_commune like ?;";
        ResultSet rs = null;
        try (
                Connection connection = this.basicDataSource.getConnection();
                PreparedStatement queryDateByCommune = connection.prepareStatement(query);
        ){
            queryDateByCommune.setString(1, codeCommune);

            rs = queryDateByCommune.executeQuery();

            if(rs.next()) {
                dateRu= rs.getString("date_ru");
                datePci= rs.getString("date_pci");
            }

            return new RenseignUrbaInfos(codeCommune, dateRu, datePci);
        } finally {
            if (rs != null) {
                rs.close();
            }
        }
    }
}
