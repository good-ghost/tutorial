/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 03-04-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   02-26-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import formFactor from '@salesforce/client/formFactor';
import deleteEventAttendee from "@salesforce/apex/EventAttendeeController.deleteEventAttendee";


export default class EventAttendeeProLineitem extends LightningElement {

	@api	isMobile = false;
	@api	recordId = "";
	@api	name = "";
	@api	status = "";
	@api	response = 0;

	connectedCallback(){
		if(formFactor == "Small") isMobile = true;
	}

	selectMenu(event){
		// This will contain the string of the "value" attribute of the selected
		// lightning-menu-item
		var selectedMenuItemValue = event.detail.value;
		console.log('selected menu item -> ', selectedMenuItemValue);
		switch (selectedMenuItemValue){
			case 'delete':
				this.deleteEvent();
				break;
			default:
				this.showMyToast('error', 'Error', 'Unknown submenu item!!!');
		}
	}

	deleteEvent(){
		this.spinnerToggle();
		console.log('relation Id -> ', this.recordId);
		deleteEventAttendee({ attendeeId : this.recordId })
			.then(result => {
				console.log('deleteEventAttendee ->', result);
				const changedEvent = new CustomEvent('change');
				this.dispatchEvent(changedEvent);
				this.spinnerToggle();
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.spinnerToggle();
			});
	}

	// Spinner toggle
	spinnerToggle(){
		this.template.querySelector('[data-spinner]').classList.toggle("slds-hide");
	}

	errorHandler(errors){
		if(Array.isArray(errors)){
			errors.forEach(error => {
				this.showMyToast('error', 'Error', error.message, 'sticky');
			})
		} else {
			console.log(errors);
			this.showMyToast('error', 'Error', 'Unknown error in javascript controller/helper.', 'sticky');
		}
	}

	showMyToast(variant, title, msg, mode){
		let dismissible = mode != undefined ? mode : 'dismissible';
		const event = new ShowToastEvent({
			"variant" : variant,
			"title" : title,
			"message" : msg,
			"mode" : dismissible
		});
		this.dispatchEvent(event);
	}

}