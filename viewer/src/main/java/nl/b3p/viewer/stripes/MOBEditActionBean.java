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
import net.sourceforge.stripes.action.Resolution;
import net.sourceforge.stripes.action.StreamingResolution;
import net.sourceforge.stripes.action.StrictBinding;
import net.sourceforge.stripes.action.UrlBinding;
import net.sourceforge.stripes.validation.Validate;
import nl.b3p.viewer.config.app.Application;
import nl.b3p.viewer.config.app.ApplicationLayer;
import org.json.JSONObject;

/**
 *
 * @author Meine Toonen
 */
@UrlBinding("/action/mob/feature/edit")
@StrictBinding
public class MOBEditActionBean extends EditFeatureActionBean{
    /*
    application: FlamingoAppLoader.get('appId'),
                appLayer: this.layer,
                GEM_CODE_CBS: this.gemeente,
                METING_ID: this.peildatum,
                form: data,
    */
    
    @Validate
    private Application application;
    
    @Validate
    private ApplicationLayer appLayer;
    
    @Validate
    private String GEM_CODE_CBS;
    
    @Validate
    private String METING_ID;
    
    @Validate
    private String meting;

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
    // </editor-fold>
    
    public Resolution editFeature(){
        
        // @ToDo authorizations
        // create correctie status
        // set correctie_status_id on jsonfeature
        
        // CORRECTIESTATUS
      //  Resolution r = saveRelatedFeatures();
        
        return edit();
    }
    
    public Resolution saveIbis(){
        setFeature(meting);
        
        //return new StreamingResolution("application/json", new StringReader(obj.toString(4)));
        return edit();
    }
    
    
}
