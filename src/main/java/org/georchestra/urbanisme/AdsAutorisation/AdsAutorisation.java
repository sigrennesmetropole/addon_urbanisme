package org.georchestra.urbanisme.AdsAutorisation;

import java.util.List;

public class AdsAutorisation {

     private List<String> numdossier;

    /**
     * Create a new instance of AdsAutorisation
     *
     * @param numdossier Parcelle ID.
     */
    public AdsAutorisation(List<String> numdossier) {
        this.numdossier = numdossier;
    }

    public List<String> getNumdossier() {
        return numdossier;
    }

}
