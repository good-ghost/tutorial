/**
 * @File Name          : customLookupResultController.js
 * @Description        : 
 * @Author             : MinGyoon Woo (woomg@dkbmc.com)
 * @Group              : 
 * @Last Modified By   : MinGyoon Woo (woomg@dkbmc.com)
 * @Last Modified On   : 7/11/2019, 11:01:12 AM
 * @Modification Log   : 
 *==============================================================================
 * Ver         Date                     Author      		      Modification
 *==============================================================================
 * 1.0    7/2/2019, 5:36:43 PM   MinGyoon Woo (woomg@dkbmc.com)     Initial Version
**/
({
	doInit :function(component, event, helper){       
		var record = component.get('v.record'),
			additionalFields = component.get('v.additionalFields'),
			additionalData = "";

		var listField = additionalFields.replace(" ","").split(",");
		if(additionalFields != ""){
			component.set("v.hasMeta", true);
			component.set("v.metaCss","slds-listbox__option_has-meta");
		}
		for(var i=0;i<listField.length;i++){
			var key = listField[i];
			additionalData += record[key];
			if(i > 0 && i != listField.length) additionalData += ', ';
		}
		component.set('v.additionalData', additionalData);
	},

	selectRecord : function(component, event, helper){
		// get the selected record from list  
		var getSelectRecord = component.get("v.record");
		// call the event   
		var compEvent = component.getEvent("recordSelectedEvent");
		// set the Selected sObject Record to the event attribute.  
		compEvent.setParams({"recordByEvent" : getSelectRecord });  
		// fire the event  
		compEvent.fire();
	},
})