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

import net.sourceforge.stripes.action.ActionBeanContext;
import net.sourceforge.stripes.action.Resolution;
import net.sourceforge.stripes.action.StrictBinding;
import net.sourceforge.stripes.action.UrlBinding;

/**
 *
 * @author Meine Toonen
 */
@UrlBinding("/action/mob/feature/edit")
@StrictBinding
public class MOBEditActionBean extends EditFeatureActionBean{
    

    // <editor-fold desc="Getters and setters" defaultstate="collapsed">

    
    // </editor-fold>
    
    public Resolution editFeature(){
        
        // @ToDo authorizations
        // create correctie status
        // set correctie_status_id on jsonfeature
        
        // CORRECTIESTATUS
      //  Resolution r = saveRelatedFeatures();
        
        return edit();
    }
    
    
}
