package org.georchestra.urbanisme.AdsSecteurInstruction;

import org.apache.commons.dbcp2.BasicDataSource;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class AdsSecteurInstructionBackend {

    private String functionAdsInstruction;
    private String jdbcUrl;
    private BasicDataSource basicDataSource;

    /**
     * Create a new instance of AdsSecteurInstructionBackend and crate a BasicDataSource configured with jdbc URL
     *
     * @param functionAdsInstruction      name of function containing nom && ini_instru
     * @param jdbcUrl    jdbc URL used to connect to database. Example : jdbc:postgresql://localhost:5432/georchestra?user=www-data&password=www-data
     */
    public AdsSecteurInstructionBackend(final String driverClassName,
                                    final String functionAdsInstruction,  final String jdbcUrl) {
        this.functionAdsInstruction = functionAdsInstruction;

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
     * Get nom and ini_instru.
     *
     * @param parcelle
     * @return AdsSecteurInstruction instance containing nom && ini_instru
     * @throws SQLException
     */
    public AdsSecteurInstruction getadsInstruction(String parcelle) throws SQLException {
        String nom = "";
        String ini_instru = "";
        String query = "SELECT"
                +" nom,ini_instru "
                +" FROM "
                + this.functionAdsInstruction+"(?);";
        ResultSet rs = null;
        try (
            Connection connection = this.basicDataSource.getConnection();
            PreparedStatement queryNomAndIniInstruByParcelle = connection.prepareStatement(query);
        ){
            queryNomAndIniInstruByParcelle.setString(1, parcelle);
            rs = queryNomAndIniInstruByParcelle.executeQuery();

            while(rs.next()) {
                nom= rs.getString("nom");
                ini_instru= rs.getString("ini_instru");
            }

            return new AdsSecteurInstruction(nom, ini_instru);
        } finally {
            if (rs != null) {
                rs.close();
            }
        }
    }

}
