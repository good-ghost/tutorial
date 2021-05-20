/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 03-04-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   03-02-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import formFactor from '@salesforce/client/formFactor';
import queryPerson from "@salesforce/apex/EventAttendeeController.queryPerson";
import addEventAttendee from "@salesforce/apex/EventAttendeeController.addEventAttendee";

export default class EventAttendeeProAdd extends LightningElement {
    @api    eventId;
    @api    existing;
    @api    ownerId;
    @api    accountId;
    
	@track	showSpinner = false;
	@track	isMobile = false;
	@track	selType = "user";
	@track	available = new Array();
	@track	options = new Array();
	@track	existMap = {};

	selTypes = [{ label: 'User', value: 'user' }];

    connectedCallback(){
		if(formFactor == "Small") this.isMobile = true;
		if(this.accountId != "") this.selTypes.push({ label: 'Contact', value: 'contact' });

		this.existMap = this.list2map(this.existing);
		this.queryPerson(this.selType, this.accountId, "");
    }

	list2map(lst){
		var mtmp = {};
		if(lst.length > 0){
			lst.forEach(function(el, idx, arr){
				mtmp[el.Id] = el.Name;
			});
		}
		return mtmp;
    }

    queryPerson(selType, accountId, searchText){
		this.showSpinner = true;
		queryPerson({ selType : selType, accountId : accountId, searchText : searchText })
			.then(result => {
				console.log('queryPerson -> ', result);
				this.available = result;
				this.options = this.makeTargetOption(result, this.existMap, this.ownerId);
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

    makeTargetOption(avail, exist, ownerId){
		console.log('make available option');
		console.log('this avail -> ', avail);
		var opts = new Array();
		if(avail.length > 0){
			avail.forEach(function(el, idx, arr){
                if((el.Id in exist) != true && el.Id != ownerId)
                	opts.push({"class": "optionClass", label: el.Name, value: el.Id})
            });
		}
		return opts;
	}

    addAttendee() {
		console.log('add new attendee to event');
		var persons = this.template.querySelector('[data-listbox]').value;
		console.log('selected -> ', persons);
		if(persons.length > 0){
			this.showSpinner = true;
			addEventAttendee({ eventId : this.eventId, persons : persons })
				.then(result => {
					console.log('addEventAttendee -> ', result);
					this.showSpinner = false;
					this.closeModal();
				})
				.catch(errors => {
					this.errorHandler(errors);
					this.showSpinner = false;
				});
		}
	}

    changeType(event){
		this.selType = event.currentTarget.value;
		console.log('onchange selType -> ', this.selType);
		this.queryPerson(this.selType, this.accountId, "");
    }

    changeSearch(event){
		var searchText = event.currentTarget.value;
		console.log('onchange search with text -> ', searchText);
		this.queryPerson(this.selType, this.accountId, searchText);
    }

    clickCancel(){
		this.closeModal();
    }

    clickSave(){

		this.addAttendee();
    }

	closeModal(){
		const closeEvent = new CustomEvent('close');
		this.dispatchEvent(closeEvent);
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