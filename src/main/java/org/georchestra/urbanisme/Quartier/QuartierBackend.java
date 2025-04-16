package org.georchestra.urbanisme.Quartier;

import org.apache.commons.dbcp2.BasicDataSource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class QuartierBackend {

    private String functionQuartier;
    private String jdbcUrl;
    private BasicDataSource basicDataSource;

    /**
     * Create a new instance of QuartierBackend and crate a BasicDataSource configured with jdbc URL
     *
     * @param functionQuartier      name of function containing nomnum
     * @param jdbcUrl    jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data
     */
    public QuartierBackend(final String driverClassName,
                                   final String functionQuartier, final String jdbcUrl) {
        this.functionQuartier = functionQuartier;

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
     * Get numnom
     *
     * @param parcelle
     * @return Quartier instance containing numnom
     * @throws SQLException
     */
    public Quartier getNumNom(String parcelle) throws SQLException {
        String numnom = "";
        String query = "SELECT"
                +" numnom "
                +" FROM "
                + this.functionQuartier+"(?);";
        ResultSet rs = null;
        try (
             Connection connection = this.basicDataSource.getConnection();
             PreparedStatement queryQuartierByParcelle = connection.prepareStatement(query);
        ) {
            queryQuartierByParcelle.setString(1, parcelle);
            rs = queryQuartierByParcelle.executeQuery();

            while (rs.next()) {
                numnom = rs.getString("numnom");
            }

            return new Quartier(numnom);
        } finally {
            if (rs != null) {
                rs.close();
            }
        }
    }
}
