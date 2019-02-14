/*
 * Copyright (C) 2019 B3Partners B.V.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package nl.b3p.viewer.stripes;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import javax.persistence.EntityManager;
import net.sourceforge.stripes.action.ErrorResolution;
import net.sourceforge.stripes.action.FileBean;
import net.sourceforge.stripes.action.Resolution;
import net.sourceforge.stripes.action.StreamingResolution;
import net.sourceforge.stripes.action.StrictBinding;
import net.sourceforge.stripes.action.UrlBinding;
import net.sourceforge.stripes.validation.Validate;
import nl.b3p.viewer.config.services.Layer;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.data.DataAccess;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureSource;
import org.geotools.data.Transaction;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.factory.CommonFactoryFinder;
import org.geotools.factory.GeoTools;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.geotools.feature.NameImpl;
import org.geotools.filter.identity.FeatureIdImpl;
import org.geotools.filter.text.cql2.CQLException;
import org.geotools.filter.text.ecql.ECQL;
import org.json.JSONException;
import org.json.JSONObject;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.filter.Filter;
import org.opengis.filter.FilterFactory2;
import org.stripesstuff.stripersist.Stripersist;

/**
 *
 * @author Meine Toonen
 */
@UrlBinding("/action/mob/feature/edit")
@StrictBinding
public class MOBEditActionBean extends EditFeatureActionBean {

    private static final Log log = LogFactory.getLog(MOBEditActionBean.class);

    @Validate
    private String GEM_CODE_CBS;

    @Validate
    private String METING_ID;

    @Validate
    private String meting;

    private boolean overrideUserEditableMethod = false;

    @Validate
    private FileBean UPLOAD;

    @Validate
    private Integer CV_ID;

    @Validate
    private Integer AGM_ID;

    // <editor-fold desc="Getters and setters" defaultstate="collapsed">
    public String getGEM_CODE_CBS() {
        return GEM_CODE_CBS;
    }

    public void setGEM_CODE_CBS(String GEM_CODE_CBS) {
        this.GEM_CODE_CBS = GEM_CODE_CBS;
    }

    public String getMETING_ID() {
        return METING_ID;
    }

    public void setMETING_ID(String METING_ID) {
        this.METING_ID = METING_ID;
    }

    public String getMeting() {
        return meting;
    }

    public void setMeting(String meting) {
        this.meting = meting;
    }

    public FileBean getUPLOAD() {
        return UPLOAD;
    }

    public void setUPLOAD(FileBean UPLOAD) {
        this.UPLOAD = UPLOAD;
    }

    public Integer getCV_ID() {
        return CV_ID;
    }

    public void setCV_ID(Integer CV_ID) {
        this.CV_ID = CV_ID;
    }

    public Integer getAGM_ID() {
        return AGM_ID;
    }

    public void setAGM_ID(Integer AGM_ID) {
        this.AGM_ID = AGM_ID;
    }

    // </editor-fold>
    public Resolution editFeature() {

        // @ToDo authorizations
        // create correctie status
        // set correctie_status_id on jsonfeature
        // CORRECTIESTATUS
        //  Resolution r = saveRelatedFeatures();
        setFeature(meting);
        return edit();
    }

    public Resolution submitCorrections() {
        try {
            JSONObject json = new JSONObject();
            json.put("success", false);
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);

            FeatureSource fs = l.getFeatureType().openGeoToolsFeatureSource();
            SimpleFeatureStore d = (SimpleFeatureStore) fs;

            try {
                if (submitCorrectieVoorstellen(d, json)) {
                    json.put("success", submitAfspraakgebiedMetingen(d, json));
                }
            } finally {
                fs.getDataStore().dispose();
            }

            return new StreamingResolution("application/json", new StringReader(json.toString(4)));
        } catch (Exception ex) {
            log.error("Cannot update corrections: ", ex);
            return new ErrorResolution(500, "Cannot update corrections: " + ex.getLocalizedMessage());
        }
    }

    private boolean submitCorrectieVoorstellen(SimpleFeatureStore d, JSONObject json) throws IOException {
        Transaction transaction = new DefaultTransaction("edit");
        d.setTransaction(transaction);
        try {
            // Get all corrections with status "opgeslagen and from this municipality
            Filter f = ECQL.toFilter("CORRECTIE_STATUS_ID = 1 and AGM_ID = " + AGM_ID);
            d.modifyFeatures("CORRECTIE_STATUS_ID", 2, f);
            transaction.commit();

            return true;
        } catch (IOException | CQLException| JSONException ex) {
            log.error("Cannot update corrections: ", ex);
            transaction.rollback();
            json.put("message", "Cannot update corrections: " + ex.getLocalizedMessage());
            return false;
        } finally {
            transaction.close();
        }
    }
    private boolean submitAfspraakgebiedMetingen(SimpleFeatureStore mainFs, JSONObject json) throws IOException {

        DataAccess da = mainFs.getDataStore();
        FeatureSource fs = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

        SimpleFeatureStore d = (SimpleFeatureStore) fs;

        Transaction transaction = new DefaultTransaction("edit");
        d.setTransaction(transaction);
        try {
            // Get all corrections with status "opgeslagen and from this municipality

            
            
            FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
            Filter f = ff.id(new FeatureIdImpl(AGM_ID.toString()));
            d.modifyFeatures("IND_CORRECTIES_INGEDIEND_JN", "J", f);
            transaction.commit();

            json.put("success", true);
            return true;
        } catch (IOException | JSONException ex) {
            log.error("Cannot update corrections: ", ex);
            transaction.rollback();
            json.put("message", "Cannot update corrections: " + ex.getLocalizedMessage());
            return false;
        } finally {
            transaction.close();
        }
    }

    public Resolution downloadAttachment() {
        try {
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);

            FeatureSource fs = l.getFeatureType().openGeoToolsFeatureSource();
            FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
            Filter f = ff.id(new FeatureIdImpl(CV_ID.toString()));

            FeatureCollection fc = fs.getFeatures(f);
            FeatureIterator<SimpleFeature> it = fc.features();
            SimpleFeature feature = null;
            while (it.hasNext()) {
                feature = it.next();
            }
            if (feature != null) {
                byte[] ar = (byte[]) feature.getAttribute("UPLOAD");
                String filename = (String) feature.getAttribute("BESTANDSNAAM");
                String mimetype = (String) feature.getAttribute("MIMETYPE");
                return new StreamingResolution(mimetype, new ByteArrayInputStream(ar)).setFilename(filename).setAttachment(true);
            } else {
                return new ErrorResolution(500, "Upload not found");
            }
        } catch (Exception ex) {
            log.error("Cannot retrieve upload: ", ex);
            return new ErrorResolution(500, "Cannot retrieve upload: " + ex.getLocalizedMessage());
        }
    }

    @Override
    protected JSONObject getJsonFeature(String feature) {
        JSONObject f = new JSONObject(feature);
        if (UPLOAD != null) {

            try (InputStream is = UPLOAD.getInputStream()) {
                byte[] bytes = IOUtils.toByteArray(is);
                f.put("UPLOAD", bytes);
                f.put("BESTANDSNAAM", UPLOAD.getFileName());
                f.put("MIMETYPE", UPLOAD.getContentType());
            } catch (IOException ex) {
                log.error("Cannot read upload: ", ex);
            }
        }
        return f;
    }

    public Resolution saveIbis() {
        saveBedrijventerrein();
        setFeature(meting);
        return edit();
    }

    private void saveBedrijventerrein() {
        try {
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);

            FeatureSource mainFs = l.getFeatureType().openGeoToolsFeatureSource();
            DataAccess da = mainFs.getDataStore();
            FeatureSource fs = da.getFeatureSource(new NameImpl("BEDRIJVENTERREINEN"));

            store = (SimpleFeatureStore) fs;
            Layer prev = layer;
            layer = l;
            JSONObject orig = new JSONObject(meting);
            JSONObject bedrijventerrein = orig.optJSONObject("BEDRIJVENTERREIN");
            jsonFeature = bedrijventerrein;
            overrideUserEditableMethod = true;
            editFeature(bedrijventerrein.optString(FeatureInfoActionBean.FID));
            layer = prev;
            overrideUserEditableMethod = false;
        } catch (Exception ex) {
            log.error("Cannot save bedrijventerrein", ex);
        }
    }

    @Override
    protected boolean isAttributeUserEditingDisabled(String attrName) {
        if (overrideUserEditableMethod) {
            return false;
        } else {
            return super.isAttributeUserEditingDisabled(attrName);
        }
    }
}
