package org.georchestra.urbanisme.AdsSecteurInstruction;

public class AdsSecteurInstruction {

    private String nom;
    private String ini_instru;

    /**
     * Create a new instance of AdsSecteurInstruction
     *
     * @param nom
     * @param ini_instru
     */
    public AdsSecteurInstruction(String nom, String ini_instru) {
        this.nom = nom;
        this.ini_instru = ini_instru;
    }

    public String getNom() {
        return nom;
    }

    public String getIni_instru() {
        return ini_instru;
    }
}
