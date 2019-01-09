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

import java.io.StringReader;
import java.util.Collection;
import java.util.NoSuchElementException;
import javafx.application.Application;
import javax.persistence.EntityManager;
import net.sourceforge.stripes.action.ActionBean;
import net.sourceforge.stripes.action.ActionBeanContext;
import net.sourceforge.stripes.action.Resolution;
import net.sourceforge.stripes.action.StreamingResolution;
import net.sourceforge.stripes.action.StrictBinding;
import net.sourceforge.stripes.action.UrlBinding;
import net.sourceforge.stripes.validation.Validate;
import nl.b3p.viewer.config.services.FeatureSource;
import nl.b3p.viewer.config.services.SimpleFeatureType;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.geotools.feature.FeatureCollection;
import org.geotools.feature.FeatureIterator;
import org.json.JSONArray;
import org.json.JSONObject;
import org.opengis.feature.Property;
import org.opengis.feature.simple.SimpleFeature;
import org.stripesstuff.stripersist.Stripersist;

/**
 *
 * @author Meine Toonen
 */
@UrlBinding("/action/mob/store")
@StrictBinding
public class MOBStoreActionBean implements ActionBean {

    private static final Log log = LogFactory.getLog(MOBStoreActionBean.class);

    private ActionBeanContext context;

    @Validate
    private FeatureSource fs;

    @Validate
    private String featureTypeName;

    @Validate
    private Application application;

    // <editor-fold defaultstate="collapsed" desc="getters and setters">
    @Override
    public ActionBeanContext getContext() {
        return context;
    }

    @Override
    public void setContext(ActionBeanContext context) {
        this.context = context;
    }

    public FeatureSource getFs() {
        return fs;
    }

    public void setFs(FeatureSource fs) {
        this.fs = fs;
    }

    public String getFeatureTypeName() {
        return featureTypeName;
    }

    public void setFeatureTypeName(String featureTypeName) {
        this.featureTypeName = featureTypeName;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    // </editor-fold>
    public Resolution store() {
        String error;

        JSONObject response = new JSONObject();
        EntityManager em = Stripersist.getEntityManager();
        /*  @ToDo: do some authorizations
        if (!Authorizations.isAppLayerReadAuthorized(application, al, context.getRequest(), em)) {
            error = "Not authorized";
            break;
        }*/

        SimpleFeatureType sft = fs.getFeatureType(featureTypeName);
        try {
            org.geotools.data.FeatureSource source = sft.openGeoToolsFeatureSource();
            FeatureCollection fc = source.getFeatures();
            FeatureIterator<SimpleFeature> it = null;
            JSONArray features = new JSONArray();
            response.put("features", features);
            try {
                it = fc.features();
                int featureIndex = 0;
                while (it.hasNext()) {
                    SimpleFeature f = it.next();
                    features.put(featureToJSON(f));

                }
            } catch (NoSuchElementException e) {
                log.error("Cannot get feature:", e);
            } finally {
                if (it != null) {
                    it.close();
                }
                source.getDataStore().dispose();
            }
        } catch (Exception ex) {
            log.error("Cannot open featuresource:", ex);
        }

        return new StreamingResolution("application/json", new StringReader(response.toString(4)));
    }

    private JSONObject featureToJSON(SimpleFeature sf) {
        JSONObject obj = new JSONObject();
        Collection<Property> props = sf.getProperties();
        for (Property prop : props) {
            obj.put(prop.getName().getLocalPart(), prop.getValue());
        }
        return obj;
    }

}
