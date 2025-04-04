package org.georchestra.urbanisme.AdsAutorisation;

import org.apache.commons.dbcp2.BasicDataSource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class AdsAutorisationBackend {


    private String functionAdsAutorisation;
    private String jdbcUrl;
    private BasicDataSource basicDataSource;

    /**
     * Create a new instance of AdsAutorisationBackend and crate a BasicDataSource configured with jdbc URL
     *
     * @param functionAdsAutorisation      name of function containing numdossier
     * @param jdbcUrl    jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data
     */
    public AdsAutorisationBackend(final String driverClassName,
                                        final String functionAdsAutorisation, final String jdbcUrl) {
        this.functionAdsAutorisation = functionAdsAutorisation;

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
     * Get numdossier.
     *
     * @param parcelle
     * @return AdsAutorisation instance containing numdossier
     * @throws SQLException
     */
    public AdsAutorisation getNumDossier(String parcelle) throws SQLException {
        List<String> numDossiers = new ArrayList<>();
        String query = "SELECT"
                +" numdossier "
                +" FROM "
                + this.functionAdsAutorisation+"(?);";
        ResultSet rs = null;

        try (Connection connection = this.basicDataSource.getConnection(); PreparedStatement queryNumDossierByParcelle = connection.prepareStatement(query)) {
            queryNumDossierByParcelle.setString(1, parcelle);
            rs = queryNumDossierByParcelle.executeQuery();

            while (rs.next()) {
                String numdossier = rs.getString("numdossier");
                numDossiers.add(numdossier);
            }

            return new AdsAutorisation(numDossiers);
        } finally {
            if (rs != null) {
                rs.close();
            }
        }
    }
}
