/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 03-09-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   05-20-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import formFactor from '@salesforce/client/formFactor';
import canIEditPerms from "@salesforce/apex/LightningManualSharingController.canIEditPerms";
import getSharings from "@salesforce/apex/LightningManualSharingController.getSharings";
import deletePerm from "@salesforce/apex/LightningManualSharingController.deletePerm";
import upsertPerm from "@salesforce/apex/LightningManualSharingController.upsertPerm";
import doQuery from "@salesforce/apex/LightningManualSharingController.doQuery";

export default class LightningManualSharingLWC extends LightningElement {

	@api	recordId;
	@api	objectApiName;

	@track	showSpinner = false;
	@track	viewAdd = false;
	@track	shares;
	@track	recordName = "";
	@track	selectedTabId = "permList";
	@track	searchObject = "user";
	@track	results = new Array();
	@track	perm = "Read/Write";
	@track	selectedShare = "";

	category = [
		{ label : "Users", value : "user" },
		{ label : "Public Groups", value : "group" },
		{ label : "Role", value : "userrole" },
		{ label : "Role & Subordinates", value : "hierarchy" }
	];

	lookupField = "ParentId";
	accessLevelField = "AccessLevel";

	connectedCallback(){
		this.showSpinner = true;
		canIEditPerms({ recordId : this.recordId })
			.then(result => {
				if(result){
					this.showSpinner = false;
					return this.reload();
				} else {
					this.showSpinner = false;
					this.showMyToast("error", "Error", "You don't have permission to handle sharing!");
					this.closeModal();
				}
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}
    
	reload(){
		this.showSpinner = true;
		getSharings({ recordId : this.recordId, objectName : this.objectApiName })
			.then(result => {
				console.log('getSharings -> ', JSON.parse(result));
				this.shares = JSON.parse(result);
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	closeModal(){
		this.dispatchEvent(new CustomEvent('close'));
	}

	clickDone(){
		this.selectedTabId = "permList";
	}

	deleteSharing(event){
		console.log('delete sharing -> ', event.currentTarget.name)
		this.showSpinner = true;
		deletePerm({ UserOrGroupID : event.currentTarget.name, recordId : this.recordId })
			.then(result => {
				this.reload();
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	changeCategory(event){
		console.log('change category -> ', event.currentTarget.value);
		this.searchObject = event.currentTarget.value;
		this.results = [];
	}

	search(event){
		console.log('search for -> ', event.currentTarget.value);
		var searchString = event.currentTarget.value,
			searchObject = this.searchObject;

		if (searchString.length < 2){
			this.results = [];
			return; //too short to search
		}

		this.showSpinner = true;
		doQuery({ searchString : searchString, objectType : searchObject })
			.then(result => {
				console.log('doQuery -> ', JSON.parse(result));
				this.results = JSON.parse(result);
				this.showSpinner = false;
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
	}

	setRead(event){
		console.log('set read for -> ', event.currentTarget.name);
		this.commonUpsert(event.currentTarget.name, "read");
	}

	setReadWrite(event){
		console.log('set read/write for -> ', event.currentTarget.name);
		this.commonUpsert(event.currentTarget.name, "edit");
	}

	commonUpsert(targetId, accessLevel){
		this.showSpinner = true;
		upsertPerm({
				UserOrGroupId : targetId,
				recordId : this.recordId,
				level : accessLevel
			})
			.then(result => {
				console.log('commonUpsert -> ', JSON.parse(result))
				this.showMyToast("success", "Success", "Change Successful");
				this.showSpinner = false;
				this.reload();
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.showSpinner = false;
			});
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
		const event = new ShowToastEvent({
			"variant" : variant,
			"title" : title,
			"message" : msg,
			"mode" : mode || 'dismissible'
		});
		this.dispatchEvent(event);
	}
}