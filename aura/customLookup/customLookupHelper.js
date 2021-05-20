/**
 * @File Name          : customLookupHelper.js
 * @Description        : 
 * @Author             : MinGyoon Woo (woomg@dkbmc.com)
 * @Group              : 
 * @Last Modified By   : woomg@dkbmc.com
 * @Last Modified On   : 02-04-2021
 * @Modification Log   : 
 *==============================================================================
 * Ver         Date                     Author      		      Modification
 *==============================================================================
 * 1.0    7/10/2019, 12:00:00 PM   MinGyoon Woo (woomg@dkbmc.com)     Initial Version
 * 1.4    2/03/2019, 12:00:00 PM   MinGyoon Woo (woomg@dkbmc.com)     additionalSelect, filter isNumeric, filter expression
**/
({
    init : function(component, event){
        if(this.checkMultiObject(component) && this.checkRequired(component) 
            && this.checkAdditionalFields(component) && this.checkSearchFields(component)
            && this.checkFilters(component) && this.checkOrderBy(component)){

            var self = this,
                objectName = component.get('v.objectName');

            self.apex(component, 'initComponent', { 'objectName': objectName })
                .then(function(result){
                    component.set('v.objectLabel', result);
                })
                .catch(function(errors){
                    self.errorHandler(errors);
                });
        }
    },

    checkMultiObject: function(component){
        var enableMultiObject = component.get("v.enableMultiObject"),
            multiObjectList = component.get("v.multiObjectList");
    
        if(enableMultiObject){
            if(multiObjectList == null || multiObjectList.length < 1){
                this.showToast('error', 'CustomLookup Error', 'Need to set multiObjectList for using Multiple Object. Lookup disabled!!');
                component.set("v.disabled", true);
                return false;
            }
            var searchFields = component.get("v.searchFields");
            if(searchFields != ""){
                this.showToast('warning', 'CustomLookup Alert', 'Can not use searchFields with multiObject. searchFields cleared!!');
                component.set("v.searchFields", "");
            }
            var additionalDisplay = component.get("v.additionalDisplay");
            if(additionalDisplay != ""){
                this.showToast('warning', 'CustomLookup Alert', 'Can not use additionalDisplay with multiObject. additionalDisplay cleared!!');
                component.set("v.additionalDisplay", "");
            }
            var filterFields = component.get("v.filterFields");
            if(filterFields != ""){
                this.showToast('warning', 'CustomLookup Alert', 'Can not use Filter with multiObject. Filter cleared!!');
                component.set("v.filterFields", "");
                component.set("v.filterValues", "");
                component.set("v.filterConditions", "");
                component.set("v.filterExpression", "");
            }
            var recordTypeNames = component.get("v.recordTypeNames");
            if(recordTypeNames != ""){
                this.showToast('warning', 'CustomLookup Alert', 'Can not use recordTypeNames with multiObject. recordTypeNames cleared!!');
                component.set("v.recordTypeNames", "");
            }

            component.set("v.objectName", multiObjectList[0].value);
            component.set("v.objectLabel", multiObjectList[0].label);
            component.set("v.iconName", multiObjectList[0].iconName);
        }
        return true;
    },

    checkRequired: function(component){
        var objectName = component.get("v.objectName"),
            label = component.get("v.label"),
            iconName = component.get("v.iconName");
        if(objectName == "" || label == "" || iconName == ""){
            this.showToast('error', 'CustomLookup Error', 'objectName, label, iconName are required. Lookup disabled!!');
            component.set("v.disabled", true);
            return false;
        }
        return true;   
    },

    checkAdditionalFields: function(component){
        var additionalFields = component.get("v.additionalDisplay");

        if(additionalFields != ""){
            var listField = additionalFields.replace(" ","").split(",");
            if(listField.length > 2){
                this.showToast('error', 'CustomLookup Error', 'The additionalField only accept maximum 2. Lookup disabled!!');
                component.set("v.disabled", true);    
                return false;
            }

            component.set("v.hasMeta", true);
        }
        return true;
    },
    
    checkSearchFields: function(component){
        var additionalFields = component.get("v.additionalDisplay");

        if(additionalFields != ""){
            var listField = additionalFields.replace(" ","").split(",");
            if(listField.length > 2){
                this.showToast('error', 'CustomLookup Error', 'The searchField only accept maximum 3. Lookup disabled!!');
                component.set("v.disabled", true);    
                return false;
            }
        }
        return true;
    },
    
    checkFilters: function(component){
        var filterFields = component.get("v.filterFields"),
            filterValues = component.get("v.filterValues"),
            filterConditions = component.get("v.filterConditions");
        
        if(filterFields != ""){
            var listField = filterFields.replace(" ","").split(","),
                listValue = filterValues.replace(" ","").split(","),
                listCondition = filterConditions.replace(" ","").split(",");
            if(listField.length() != listValue.length() || listField.length() != listCondition.length()){
                this.showToast('error', 'CustomLookup Error', 'The number of filter fields, values and conditions must match. Lookup disabled!!');
                component.set("v.disabled", true);    
                return false;
            }
        }
        return true;
    },

    checkOrderBy: function(component){
        var orderBy = component.get("v.orderBy");

        if(orderBy != ""){
            var listField = orderBy.replace(" ","").split(",");
            if(listField.length > 2){
                this.showToast('error', 'CustomLookup Error', 'Additional order by fields accept maximum 3. Lookup disabled!!');
                component.set("v.disabled", true);    
                return false;
            }
        }
        return true;
    },
    
    queryRecords : function(component, event, getInputkeyword) {
        var self = this;

        self.spinnerToggle(component, event);
        self.apex(component, 'queryRecords', {
                'searchKeyword': getInputkeyword,
                'objectName' : component.get("v.objectName"),
                'searchFields' : component.get("v.searchFields"),
                'additionalDisplay' : component.get("v.additionalDisplay"),
                'additionalSelect' : component.get("v.additionalSelect"),
                'filterFields' : component.get("v.filterFields"),
                'filterValues' : component.get("v.filterValues"),
                'filterConditions' : component.get("v.filterConditions"),
                'filterExpression' : component.get("v.filterExpression"),
                'recordTypeNames' : component.get("v.recordTypeNames"),         
                'onlyOwned' : component.get('v.onlyOwned'),
                'orderBy' : component.get('v.orderBy'),
                'numLimit' : component.get("v.numOfQuery")
            })
            .then(function(result){
                if (result.length == 0) {
                    var msg = 'No Result Found...';
                    component.set("v.message", msg);
                } else {
                    component.set("v.message", '');
                }
                component.set("v.searchRecords", result);
                self.spinnerToggle(component, event);
            })
            .catch(function(errors){
                self.errorHandler(errors);
                self.spinnerToggle(component, event);
            });
    },

    getCreatedRecord : function(component, event){
        var self = this,
            objectName = component.get('v.objectName'),
            action = component.get("c.getCreatedRecord");
        
        self.apex(component, 'getCreatedRecord', { 'objectName': objectName })
            .then(function(result){
                if(result != null)
                    this.recordSelected(component, result);
            })
            .catch(function(errors){
                self.errorHandler(errors);
                self.spinnerToggle(component, event);
            });
    },

    recordSelected : function(component, record){
        var lookUpTarget = component.find("lookupField"),
            enableMultiRecord = component.get("v.enableMultiRecord"),
            onchangeEvent = component.get("v.onchange"),
            isIgnoredDuplicatedRule = component.get('v.isIgnoredDuplicatedRule');

        //console.log('enableMultiRecord', JSON.stringify(enableMultiRecord));
        //console.log('onchange', onchangeEvent);

        if(enableMultiRecord){
            var records = component.get("v.selectedRecords");
            if(!isIgnoredDuplicatedRule){
                for(var i=0; i<records.length; i++){
                    if(records[i].Id == record.Id){
                        this.showToast('error', 'error', 'Record already exist.');
                        return;
                    }
                }
            } else {
                records.push(record);
            }
            component.set("v.selectedRecords", records);
        } else {
            var pillContainer = component.find("lookup-pill");
                
            $A.util.removeClass(pillContainer, 'slds-hide');      
            $A.util.addClass(pillContainer, 'slds-show');
            $A.util.removeClass(lookUpTarget, 'slds-show');
            $A.util.addClass(lookUpTarget, 'slds-hide');

            component.set("v.selectedRecord" , record); 
        }

        component.set('v.searchClass','slds-is-close');
        component.set("v.searchKeyword", "");

        /* execute Aura.Action from parent component */
        if(onchangeEvent != null)
            $A.enqueueAction(onchangeEvent );
    },

    listToggleHelper : function(component, event){
        window.setTimeout(function(e){
            // resultList close
            component.set('v.searchClass','slds-is-close');
        }, 500);
    },

    showToast : function(type, title, message){
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            "type": type,
            "title": title,
            "message": message
        });
        toastEvent.fire();
    },

    // Spinner toggle
    spinnerToggle : function(component, event){
        var spinner = component.find("result-spinner");
        $A.util.toggleClass(spinner, "slds-hide");
    },
    
    apex : function(component, apexAction, params){
        return new Promise( $A.getCallback( function( resolve, reject ) {
            var action = component.get("c."+apexAction+"");
            action.setParams( params );
            action.setCallback( this, function(callbackResult) {
                if(callbackResult.getState()=='SUCCESS') {
                    resolve( callbackResult.getReturnValue() );
                }
                if(callbackResult.getState()=='ERROR') {
                    console.log('ERROR', callbackResult.getError() ); 
                    reject( callbackResult.getError() );
                }
            });
            $A.enqueueAction( action );
        }));
    },

    /**
     * 
    promiseCall : function(component, event){
        var self = this;
        self.apex(component, 'apexServerMethod_1', { recordId : component.get("v.recordId")})
            .then(function(result){
                console.log('Call 1 : ', result);
                return self.apex(component, 'apexServerMethod_2', { recordId : result});
            })
            .then(function(result){
                console.log('Call 2 : ', result);
                return self.apex(component, 'apexServerMethod_3', { recordId : result});
            })
            .then(function(result){
                console.log('Call 3 : ', result);
            });
    },
     */

    errorHandler : function(errors){
        var self = this;
        if(Array.isArray(errors)){
            errors.forEach(function(err){
                self.showMyToast('error', err.exceptionType + " : " + err.message);
            });
        } else {
            console.log(errors);
            self.showMyToast('error', 'Unknown error in javascript controller/helper.')
        }
    },

    showMyToast : function(type, msg) {
        var toastEvent = $A.get("e.force:showToast");
        toastEvent.setParams({
            type: type,
            duration: 3000,
            mode: 'dismissible',
            message: msg
        });
        toastEvent.fire();
	},

})