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

import net.sourceforge.stripes.action.*;
import net.sourceforge.stripes.validation.Validate;
import nl.b3p.mail.Mailer;
import nl.b3p.viewer.config.services.Layer;
import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.data.DataAccess;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.FeatureSource;
import org.geotools.data.Transaction;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.factory.CommonFactoryFinder;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.geotools.feature.NameImpl;
import org.geotools.filter.identity.FeatureIdImpl;
import org.geotools.filter.text.cql2.CQLException;
import org.geotools.filter.text.ecql.ECQL;
import org.geotools.util.factory.GeoTools;
import org.json.JSONException;
import org.json.JSONObject;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.filter.Filter;
import org.opengis.filter.FilterFactory2;
import org.opengis.filter.sort.SortBy;
import org.opengis.filter.sort.SortOrder;
import org.stripesstuff.stripersist.Stripersist;

import javax.persistence.EntityManager;
import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.security.Principal;
import java.util.*;

/**
 *
 * @author Meine Toonen
 */
@UrlBinding("/action/mob/feature/edit")
@StrictBinding
public class MOBEditActionBean extends EditFeatureActionBean {

    private static final Log log = LogFactory.getLog(MOBEditActionBean.class);

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

    @Validate
    private Double uitgifte;

    // <editor-fold desc="Getters and setters" defaultstate="collapsed">
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

    public Double getUitgifte() {
        return uitgifte;
    }

    public void setUitgifte(Double uitgifte) {
        this.uitgifte = uitgifte;
    }
    // </editor-fold>

    private boolean isAuthorized() {
        HttpServletRequest req = getContext().getRequest();
        Principal geb = req.getUserPrincipal();
        return geb != null && (req.isUserInRole("gemeente") || req.isUserInRole("provincie"));
    }

    public Resolution editFeature() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
        // create correctie status
        // set correctie_status_id on jsonfeature
        // CORRECTIESTATUS
        //  Resolution r = saveRelatedFeatures();
        setFeature(meting);
        edit();
        
        HttpServletRequest req = getContext().getRequest();
        
        if(req.isUserInRole("provincie") ){

            if( jsonFeature.getInt("CORRECTIE_STATUS_ID") == 1) {
                try {
                    EntityManager em = Stripersist.getEntityManager();
                    Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);
                    AGM_ID = jsonFeature.getInt("AGM_ID");
                    FeatureSource fs = l.getFeatureType().openGeoToolsFeatureSource();
                    SimpleFeatureStore d = (SimpleFeatureStore) fs;
                    JSONObject json = new JSONObject();
                    submitAfspraakgebiedMetingen(d, json, false);
                } catch (Exception ex) {
                    log.error("Cannot reset afspraakgebiedmetingen to ingediend = N");
                }
            }
            mailMunicipality(meting);
        }

        // See https://docs.sencha.com/extjs/6.2.0/classic/Ext.form.action.Submit.html for error response
        return new StreamingResolution("text/xml", new StringReader(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?><message success=\"true\"></message>"
        ));
    }

    private void mailMunicipality(String feature){
        Map<Integer, String> correctieStatussen = new HashMap<>();
        correctieStatussen.put(3, "In behandeling");
        correctieStatussen.put(4, "Geaccepteerd");
        correctieStatussen.put(1, "Opgeslagen");
        correctieStatussen.put(6, "Vervallen");
        correctieStatussen.put(2, "Ingediend");
        correctieStatussen.put(5, "Afgewezen");


        Map<Integer, String> classificaties = new HashMap<>();
        classificaties.put(11, "Geen bedrijventerrein");
        classificaties.put(12, "Langdurige verhuur");
        classificaties.put(2, "Aanbod overheid");
        classificaties.put(10, "IJskast - tijdelijke natuur (particulier)");
        classificaties.put(1, "Uitgegeven");
        classificaties.put(4, "Infra en overige bestemmingen");
        classificaties.put(7, "IJskast - tijdelijke natuur (overheid)");
        classificaties.put(8, "IJskast – zonnepark (particulier)");
        classificaties.put(6, "IJskast – uitgifteverbod (overheid)");
        classificaties.put(3, "Aanbod particulier");
        classificaties.put(9, "IJskast – uitgifteverbod (particulier)");
        classificaties.put(5, "IJskast – zonnepark (overheid)");

        JSONObject feat = getJsonFeature(feature);
        String agm_id = feat.getString("AGM_ID");
        List<String> mailaddresses = getMailAddress(agm_id);

        if(mailaddresses == null || mailaddresses.size() == 0){
            return;
        }
        String subject = "MOB: statuswijziging correctievoorstel";
        String fromMail = "bedrijventerreinen@overijssel.nl";
        //String fromMail = "support@b3partners.nl";
        String fromName = "Provincie Overijssel";
        String cc = null;
        //String cc = "bedrijventerreinen@overijssel.nl";
        int correctieStatus = feat.getInt("CORRECTIE_STATUS_ID");
        int classificatie = feat.getInt("CLASSIFICATIE_ID");
        String toelichting = feat.getString("TOELICHTING");

        String message = "Beste indiener, \n\n";
        message += "Het ingediende correctievoorstel in de MOB viewer is van status gewijzigd naar "
                + correctieStatussen.get(correctieStatus)  +"\n" +
                "\n" +
                "Je voorgestelde classificatie: " + classificaties.get(classificatie) +"\n" +
                "Toelichting: " + toelichting + " \n" +
                "Status: " + correctieStatussen.get(correctieStatus) +"\n" +
                "\n" +
                "Vriendelijke groeten,\n" +
                "Team MOB\n" +
                "Provincie Overijssel";

        try {
            log.debug("Message: " + message);
            Mailer.sendMail(fromName, fromMail, String.join(",", mailaddresses), subject, message, cc);
        } catch (Exception e) {
            log.error("Error sending statusupdate mail: ", e);
        }
    }

    private List<String> getMailAddress(String agmId){
        Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), Stripersist.getEntityManager());
        FeatureSource mainFs = null;
        try {
            mainFs = l.getFeatureType().openGeoToolsFeatureSource();
            DataAccess da = mainFs.getDataStore();

            FeatureSource afspraakgeb_metingen = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

            SimpleFeatureStore d = (SimpleFeatureStore) afspraakgeb_metingen;
            Filter f = ECQL.toFilter("AGM_ID = '" + agmId + "'");
            SimpleFeatureCollection fc = d.getFeatures(f);
            FeatureIterator<SimpleFeature> it = fc.features();
            SimpleFeature feature = null;
            while (it.hasNext()) {
                feature = it.next();
            }
            Object agId = feature.getAttribute("AFSPRAAKGEBIED_ID");

            FeatureSource gebruikersauth = da.getFeatureSource(new NameImpl("GEBRUIKERSAUTORISATIE"));
            SimpleFeatureStore gebruiksAuthStore = (SimpleFeatureStore) gebruikersauth;
            Filter agFilter = ECQL.toFilter("AG_ID = '" + agId + "'");
            SimpleFeatureCollection authFc = gebruiksAuthStore.getFeatures(agFilter);
            FeatureIterator<SimpleFeature> gebIt = authFc.features();
            SimpleFeature geb = null;
            List<String> mails = new ArrayList<>();
            while (gebIt.hasNext()) {
                geb = gebIt.next();
                String mail = (String)geb.getAttribute("MAILADDRESS");
                mails.add(mail);
            }

            return mails;
        } catch (Exception e) {
            log.error("Cannot retrieve mailaddress", e);
        }finally {
            mainFs.getDataStore().dispose();
        }
        return null;
    }

    public Resolution retrieveVariables() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
        try {
            JSONObject json = new JSONObject();
            json.put("success", false);
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);
            FeatureSource mainFs = l.getFeatureType().openGeoToolsFeatureSource();
            try {
                DataAccess da = mainFs.getDataStore();

                String username = getContext().getRequest().getUserPrincipal().getName();

                FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
                // afspraakgebieden
                {
                    FeatureSource fs = da.getFeatureSource(new NameImpl("GEBRUIKERSAUTORISATIE"));

                    SimpleFeatureStore d = (SimpleFeatureStore) fs;
                    Filter f = ECQL.toFilter("GEBRUIKERSNAAM = '" + username + "'");
                    SimpleFeatureCollection fc = d.getFeatures(f);
                    FeatureIterator<SimpleFeature> it = fc.features();
                    SimpleFeature feature = null;
                    while (it.hasNext()) {
                        feature = it.next();
                    }
                    if (feature != null) {
                        json.put("GEM_CODE_CBS", feature.getAttribute("GEM_CODE_CBS"));
                        json.put("AG_ID", feature.getAttribute("AG_ID"));
                    }
                }

                // metingen
                {
                    FeatureSource fs = da.getFeatureSource(new NameImpl("METINGEN"));
                    SimpleFeatureStore d = (SimpleFeatureStore) fs;

                    SimpleFeature feature = getIBISMeting(ff,d);
                    if (feature != null) {
                        json.put("IBIS_MTG_ID", feature.getAttribute("MTG_ID"));
                        json.put("IBIS_PEILDATUM", feature.getAttribute("PEILDATUM"));
                    }

                    SimpleFeature mobFeature = getMOBMeting(ff, d);

                    if (mobFeature != null) {
                        json.put("MOB_MTG_ID", mobFeature.getAttribute("MTG_ID"));
                        json.put("MOB_PEILDATUM", mobFeature.getAttribute("PEILDATUM"));
                    }
                }

                if (json.has("AG_ID")) {
                    // afspraakgeb_metingen
                    FeatureSource fs = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

                    SimpleFeatureStore d = (SimpleFeatureStore) fs;
                    Filter f = ECQL.toFilter("METING_ID = " + json.get("MOB_MTG_ID") + " AND AFSPRAAKGEBIED_ID = " + json.get("AG_ID"));
                    SimpleFeatureCollection fc = d.getFeatures(f);
                    FeatureIterator<SimpleFeature> it = fc.features();
                    SimpleFeature feature = null;
                    while (it.hasNext()) {
                        feature = it.next();
                    }
                    if (feature != null) {
                        json.put("AGM_ID", feature.getAttribute("AGM_ID"));
                        json.put("IND_IBIS_INGEDIEND_JN", feature.getAttribute("IND_IBIS_INGEDIEND_JN"));
                        json.put("IND_CORRECTIES_INGEDIEND_JN", feature.getAttribute("IND_CORRECTIES_INGEDIEND_JN"));
                        json.put("VERWACHTE_UITGIFTE", feature.getAttribute("VERWACHTE_UITGIFTE"));
                    }
                }
                json.put("success", true);
                return new StreamingResolution("application/json", new StringReader(json.toString(4)));
            } catch (Exception ex) {
                log.error("Cannot retrieve variables: ", ex);
                return new ErrorResolution(500, "Kan gegevens niet ophalen " + ex.getLocalizedMessage());
            } finally {
                mainFs.getDataStore().dispose();
            }
        } catch (Exception ex) {
            log.error("Kan gegevens niet ophalen ", ex);
            return new ErrorResolution(500, "Kan gegevens niet ophalen" + ex.getLocalizedMessage());
        }
    }

    private SimpleFeature getMOBMeting(FilterFactory2 ff, SimpleFeatureStore d) throws IOException {
        // peildatum mob: 1 januari of 1 juli huidig jaar + indicatie vastgesteld
        SortBy sort = ff.sort("PEILDATUM", SortOrder.DESCENDING);
        SimpleFeatureCollection mobFc = d.getFeatures();
        mobFc = mobFc.sort(sort);
        FeatureIterator<SimpleFeature> mobIterator = mobFc.features();
        SimpleFeature mobFeature = null;
        while (mobIterator.hasNext()) {
            mobFeature = mobIterator.next();
            break;
        }
        return mobFeature;
    }

    private SimpleFeature getIBISMeting(FilterFactory2 ff, SimpleFeatureStore d) throws IOException {
        SortBy sort = ff.sort("PEILDATUM", SortOrder.DESCENDING);

        SimpleFeatureCollection fc = d.getFeatures();
        fc = fc.sort(sort);
        FeatureIterator<SimpleFeature> it = fc.features();
        SimpleFeature feature = null;
        // peildatum ibis: 1 januari huidig jaar
        while (it.hasNext()) {
            feature = it.next();
            Date pd = (Date) feature.getAttribute("PEILDATUM");
            Calendar c = Calendar.getInstance();
            c.setTime(pd);
            if(c.get(Calendar.MONTH) == 0){
                break;
            }
        }
        return feature;
    }

    public Resolution submitExpectedAllotment() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
        try {
            JSONObject json = new JSONObject();
            json.put("success", false);
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);
            FeatureSource mainFs = l.getFeatureType().openGeoToolsFeatureSource();
            DataAccess da = mainFs.getDataStore();
            FeatureSource fs = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

            SimpleFeatureStore d = (SimpleFeatureStore) fs;

            Transaction transaction = new DefaultTransaction("edit");
            d.setTransaction(transaction);
            try {
                FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
                Filter f = ff.id(new FeatureIdImpl(AGM_ID.toString()));
                d.modifyFeatures("VERWACHTE_UITGIFTE", uitgifte, f);
                transaction.commit();

                json.put("success", true);
            } catch (IOException | JSONException ex) {
                log.error("Kan ibisgegevens niet indienen: ", ex);
                transaction.rollback();
                json.put("message", "Kan ibisgegevens niet indienen: " + ex.getLocalizedMessage());
            } finally {
                transaction.close();
            }
            return new StreamingResolution("application/json", new StringReader(json.toString(4)));
        } catch (Exception ex) {
            log.error("Cannot submit ibis: ", ex);
            return new ErrorResolution(500, "Kan ibisgegevens niet indienen " + ex.getLocalizedMessage());
        }
    }

    public Resolution submitIbis() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
        try {
            JSONObject json = new JSONObject();
            json.put("success", false);
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);
            FeatureSource mainFs = l.getFeatureType().openGeoToolsFeatureSource();
            DataAccess da = mainFs.getDataStore();
            FeatureSource fs = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

            SimpleFeatureStore d = (SimpleFeatureStore) fs;

            Transaction transaction = new DefaultTransaction("edit");
            d.setTransaction(transaction);
            try {
                FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
                Filter f = ff.id(new FeatureIdImpl(AGM_ID.toString()));
                d.modifyFeatures("IND_IBIS_INGEDIEND_JN", "J", f);
                transaction.commit();

                json.put("success", true);
            } catch (IOException | JSONException ex) {
                log.error("Kan ibisgegevens niet indienen: ", ex);
                transaction.rollback();
                json.put("message", "Kan ibisgegevens niet indienen: " + ex.getLocalizedMessage());
            } finally {
                transaction.close();
            }
            return new StreamingResolution("application/json", new StringReader(json.toString(4)));
        } catch (Exception ex) {
            log.error("Cannot submit ibis: ", ex);
            return new ErrorResolution(500, "Kan ibisgegevens niet indienen " + ex.getLocalizedMessage());
        }
    }

    public Resolution submitCorrections() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
        try {
            JSONObject json = new JSONObject();
            json.put("success", false);
            EntityManager em = Stripersist.getEntityManager();
            Layer l = getAppLayer().getService().getLayer(getAppLayer().getLayerName(), em);

            FeatureSource fs = l.getFeatureType().openGeoToolsFeatureSource();
            SimpleFeatureStore d = (SimpleFeatureStore) fs;

            try {
                if (submitCorrectieVoorstellen(d, json)) {
                    json.put("success", submitAfspraakgebiedMetingen(d, json, true));
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
        } catch (IOException | CQLException | JSONException ex) {
            log.error("Cannot update corrections: ", ex);
            transaction.rollback();
            json.put("message", "Cannot update corrections: " + ex.getLocalizedMessage());
            return false;
        } finally {
            transaction.close();
        }
    }

    private boolean submitAfspraakgebiedMetingen(SimpleFeatureStore mainFs, JSONObject json, boolean ingediend) throws IOException {
        DataAccess da = mainFs.getDataStore();
        FeatureSource fs = da.getFeatureSource(new NameImpl("AFSPRAAKGEB_METINGEN"));

        SimpleFeatureStore d = (SimpleFeatureStore) fs;

        Transaction transaction = new DefaultTransaction("edit");
        d.setTransaction(transaction);
        try {
            // Get all corrections with status "opgeslagen and from this municipality

            FilterFactory2 ff = CommonFactoryFinder.getFilterFactory2(GeoTools.getDefaultHints());
            Filter f = ff.id(new FeatureIdImpl(AGM_ID.toString()));
            d.modifyFeatures("IND_CORRECTIES_INGEDIEND_JN", ingediend ? "J" : "N", f);
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
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
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

    public Resolution saveIbis() {
        if (!isAuthorized()) {
            log.error("Unauthorized access");
            return new ErrorResolution(401, "Geen toegang");
        }
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

}
