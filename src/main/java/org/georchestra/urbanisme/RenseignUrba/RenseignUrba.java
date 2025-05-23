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

package org.georchestra.urbanisme.RenseignUrba;

import java.util.List;

/**
 * This class hold informations about renseignement d'urbanisme.
 */
public class RenseignUrba {

	private String parcelle;
	private List<String> libelles;
	private List<String> groupesRu;
	private List<String> typeDocuments;
	private List<Long> ordres;

	/**
	 * Create a new instance of renseignUrban
	 *
	 * @param parcelle Parcelle ID.
	 * @param libelles List of libelle string
	 */
	public RenseignUrba(String parcelle, List<String> libelles) {
		this.parcelle = parcelle;
		this.libelles = libelles;
	}

	/**
	 * Create a new instance of renseignUrban
	 *
	 * @param parcelle      Parcelle ID.
	 * @param libelles      List of libelle string
	 * @param groupesRu     List of groupe Ru
	 * @param typeDocuments List of the type of documents
	 */
	public RenseignUrba(String parcelle, List<String> libelles, List<String> groupesRu, List<String> typeDocuments,
			List<Long> ordres) {
		this.parcelle = parcelle;
		this.libelles = libelles;
		this.groupesRu = groupesRu;
		this.typeDocuments = typeDocuments;
		this.ordres = ordres;
	}

	public String getParcelle() {
		return parcelle;
	}

	public List<String> getLibelles() {
		return libelles;
	}

	public List<String> getGroupesRu() {
		return groupesRu;
	}

	public List<String> getTypeDocuments() {
		return typeDocuments;
	}

	public List<Long> getOrdres() {
		return ordres;
	}
}
