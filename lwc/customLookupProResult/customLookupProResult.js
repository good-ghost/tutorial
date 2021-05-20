/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 02-16-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   02-16-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, api, track } from 'lwc';

export default class CustomLookupProResult extends LightningElement {
	@api	record = {};
	@api	iconName = "";
	@api	additionalFields = "";

	@track	additionalData = "";
	@track	hasMeta = false;
	@track	metaCss = "slds-media slds-listbox__option slds-listbox__option_entity";

	connectedCallback(){
		if(this.additionalFields != ""){
			this.hasMeta = true;
			this.metaCss = this.metaCss + ' slds-listbox__option_has-meta';

			var listField = this.additionalFields.replace(" ","").split(",");
			for(var i = 0; i < listField.length; i++){
				var key = listField[i];
				this.additionalData += this.record[key];
				if(i > 0 && i != listField.length) this.additionalData += ', ';
			}
		}
	}

	selectRecord(event){
		// Prevents the anchor element from navigating to a URL.
		event.preventDefault();

		// Creates the event with parameter
		//const selectedEvent = new CustomEvent('recordSelectedEvent', { recordByEvent : this.record });
		const selectedEvent = new CustomEvent('select', { detail : this.record });

		// Dispatches the event.
		this.dispatchEvent(selectedEvent);
	}
}