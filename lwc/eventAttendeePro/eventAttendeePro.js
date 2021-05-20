/**
 * @description	   : 
 * @author			: woomg@dkbmc.com
 * @group			 : 
 * @last modified on  : 03-04-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date		 Author			Modification
 * 1.0   02-26-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import formFactor from '@salesforce/client/formFactor';
import queryEventInfo from "@salesforce/apex/EventAttendeeController.queryEventInfo";
import queryEventAttendee from "@salesforce/apex/EventAttendeeController.queryEventAttendee";
import queryUserId from "@salesforce/apex/EventAttendeeController.queryUserId";
import addEventAttendee from "@salesforce/apex/EventAttendeeController.addEventAttendee";

export default class EventAttendeePro extends LightningElement {
	@api	recordId;
	@api	displayType = "Card";

	@track	showSpinner = false;
	@track	attendee = new Array();
	@track	existing = new Array();
	@track	ownerId = "";
	@track	accountId = "";

	@track	modalOpen = false;

	connectedCallback(){
		this.showSpinner = true;		
		queryEventInfo({ eventId : this.recordId })
			.then(result => {
				console.log('queryEventInfo -> ', result);
				this.ownerId = result.OwnerId;
				this.accountId = result.AccountId != undefined && result.AccountId != null ? result.AccountId : "";
				this.getEventAttendee(this.recordId);
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	getEventAttendee(eventId){
		this.showSpinner = true;
		queryEventAttendee({ eventId : eventId })
			.then(result => {
				console.log('queryEventAttendee -> ', result);
				this.attendee = result;
				if(result.length > 0){
					var existings = new Array();
					result.forEach(function(element, index, array){
						var o = {};
						o.Id = element.Relation.Id;
						o.Name = element.Relation.Name;
						existings.push(o);
					});
					this.existing = existings;
				}
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	clickAdd(){
		this.showSpinner = true;
		queryUserId({})
			.then(result => {
				console.log('queryUserId -> ', result);
				if(this.ownerId != result){
					alert();
					this.addMySelf(result);
				} else {
					// this.openModal();
					this.modalOpen = true;	
				}
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	reloadAttendee(){
		console.log('event fired from child for reload attendee');
		this.getEventAttendee(this.recordId);
	}

	addMySelf(uId){
		var persons = new Array();
		persons.push(uId);
		this.showSpinner = true;
		addEventAttendee({ eventId : this.recordId, persons : persons })
			.then(result => {
				console.log('addEventAttendee -> ', result);
				this.getEventAttendee(this.recordId);
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}
	
	closeAddAttendee(){
		this.modalOpen = false;
		this.reloadAttendee();
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