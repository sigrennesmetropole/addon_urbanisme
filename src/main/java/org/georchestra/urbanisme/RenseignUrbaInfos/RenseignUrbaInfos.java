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

package org.georchestra.urbanisme.RenseignUrbaInfos;

/**
 * This class hold informations about renseignement d'urbanisme.
 */
public class RenseignUrbaInfos {
    private String code_commune;
    private String date_ru;
    private String date_pci;

    /**
     * Create a new instance of renseignUrban
     *
     * @param code_commune code commune
     * @param date_ru date de production des RU
     * @param date_pci 	Le millésime du cadastre
     */
    public RenseignUrbaInfos(String code_commune, String date_ru, String date_pci) {
        this.code_commune = code_commune;
        this.date_ru = date_ru;
        this.date_pci = date_pci;
    }

    public String getCode_commune() {
        return code_commune;
    }

    public String getDate_ru() {
        return date_ru;
    }

    public String getDate_pci() {
        return date_pci;
    }
}
