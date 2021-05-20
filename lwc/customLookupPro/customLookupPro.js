/**
 * @description			: 
 * @author				: woomg@dkbmc.com
 * @group				: 
 * @last modified on	: 02-18-2021
 * @last modified by	: woomg@dkbmc.com
 * Modifications Log 
 * Ver	Date		Author				Modification
 * 1.0	02-09-2021	woomg@dkbmc.com		Initial Version
**/
import { LightningElement, api, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
import initComponent from "@salesforce/apex/CustomLookupController.initComponent";
import queryRecords from "@salesforce/apex/CustomLookupController.queryRecords";
import getCreatedRecord from "@salesforce/apex/CustomLookupController.getCreatedRecord";

//export default class CustomLookupPro extends LightningElement {
export default class CustomLookupPro extends NavigationMixin(LightningElement) {
	// required parameters
	@api	objectName = "";					// Object API Name
	@api	iconName = "";						// Object Icon Name
	@api	selectedRecord = {};				// Selected Record if enableMultiRecord is false
	@api	selectedRecords = [];				// Selected Records if enableMultiRecord is true

	// optional parameters
	@api	label;
	@api	required = false;					// mark required
	@api	minimum = 3;						// minimum number of characters to query
	@api	additionalDisplays = "";			// additional display fields, comma seperated, max 2
	@api	additionalSelect = "";				// add Select Query Field (!must exclude additionalDisplay field, Id, Name)
	@api	searchFields = "";					// additional search targets, comma seperated, max 3
	@api	filterFields = "";
	@api	filterValues = "";
	@api	filterConditions = "";
	@api	filterExpression = "";
	@api	recordTypeNames = "";
	@api	ownedOnly = false;
	@api	orderBy = "";
	@api	numOfQuery = "5"
	@api	enableNewRecord = false;
	@api	enableMultiObject = false;
	@api	multiObjectList = [];
	@api	enableMultiRecord = false;
	@api	isIgnoredDuplicatedRule = false;
	@api	disabled = false;

	// internally used variables, need re-render component
	@track  placeholder = "";
	@track  objectLabel = "";
	@track  searchRecords = [];
	@track  message = "";
	@track  hasMeta = false;
	@track  searchClass = "";
	@track  lookupPillClass = "";
	@track  lookupFieldClass1 = "";
	@track  lookupFieldClass2 = "";
	@track	hasSelectedRecords = false;

	createWin;

	/**
	 * **********************************************
	 * doInit of Aura Component (controller + helper)
	 * **********************************************
	 */
	connectedCallback(){
		console.log('connected callback ->', this.enableMultiRecord);
		this.required = this.required == "true" ? true : false;
		this.ownedOnly = this.ownedOnly == "true" ? true : false;
		this.enableNewRecord = this.enableNewRecord == "true" ? true : false;
		this.enableMultiObject = this.enableMultiObject == "true" ? true : false;
		this.enableMultiRecord = this.enableMultiRecord == "true" ? true : false;
		this.isIgnoredDuplicatedRule = this.isIgnoredDuplicatedRule == "true" ? true : false;
		this.disabled = this.disabled == "true" ? true : false;

		this.searchClass = 'slds-is-close slds-form-element slds-lookup';
		this.lookupPillClass = "slds-form-element__control slds-hide";
		this.lookupFieldClass1 = "slds-show slds-input-has-icon slds-input-has-icon_right";
		this.lookupFieldClass2 = "slds-show slds-box_border slds-input-has-icon slds-input-has-icon_right";

		// doInit part of helper of Aura
		if(this.checkMultiObject() && this.checkRequired() && this.checkAdditionalFields() && this.checkAdditionalDisplays()
			&& this.checkSearchFields() && this.checkFilters() && this.checkOrderBy()){
			
			initComponent({ objectName : this.objectName })
				.then(result => {
					console.log('initComponent ->', result);
					this.objectLabel = result;
					this.placeholder = "Search in " + this.objectLabel;
				})
				.catch(errors => {
					this.errorHandler(errors);
				});
		}
	}

	/**
	 * **********************************************
	 * Controller part of Aura Component
	 * **********************************************
	 */
	/* onFocus, becuase LWC do not allow start with 'on' */
	handleFocus(event){
		console.log('focused');
		this.searchClass = 'slds-is-open slds-form-element slds-lookup';
	}
	/* onBlur, becuase LWC do not allow start with 'on' */
	handleBlur(event){
		console.log('leaved');
		this.listToggleHelper('off');
	}
	/* onKeyup, becuase LWC do not allow start with 'on' */
	handleChange(event){
		event.preventDefault();
		var searchText = event.target.value;
		console.log('changed ->', searchText);
		if(searchText.length > this.minimum - 1){
			this.searchClass = 'slds-is-open slds-form-element slds-lookup';
			this.queryRecords(searchText);
		}
	}

	doScroll(event) {
		event.preventDefault();
		this.timeout = setTimeout(function(e){
			this.searchClass = 'slds-is-open slds-form-element slds-lookup';
			//this.template.querySelector('[data-search-input]').focus();
		}.bind(this), 510);
	}

	clear(event){
		var detail;

		if(this.enableMultiRecord){
			var recordId = event.currentTarget.getAttribute("data-item-id"),
				records = this.selectedRecords,
				removeIdx;

			for(var i=0;i<records.length;i++){
				if(recordId == records[i].Id) removeIdx = i;
			}
			
			records.splice(removeIdx, 1);
			this.template.querySelector('[data-search-input]').value = "";
			this.selectedRecords = records;
			this.searchRecords = [];
			detail = this.selectedRecords;

			if(records.length == 0){
				this.hasSelectedRecords = false;
				this.lookupPillClass = "slds-form-element__control slds-hide";
				this.lookupFieldClass2 = "slds-show slds-box--border slds-input-has-icon slds-input-has-icon_right";
			}
		} else {
			this.lookupPillClass = "slds-form-element__control slds-hide";
			this.lookupFieldClass1 = "slds-show slds-input-has-icon slds-input-has-icon_right";
					
			this.template.querySelector('[data-search-input]').value = "";
			this.selectedRecord = {};
			this.searchRecords = [];
			detail = this.selectedRecord;
		}

		// Creates the event with parameter
		// const selectedEvent = new CustomEvent('recordSelectedEvent', { recordByEvent : this.record });
		const changedEvent = new CustomEvent('change', { detail : detail });

		// Dispatches the event.
		this.dispatchEvent(changedEvent);
	}

	recordSelectedEventHandler(event){
		console.log('recordSelectedEventHandler');
		console.log(event.detail);
		console.log(event.detail.Id);

		// get the selected record from the COMPONETN event
		var recordFromEvent = event.detail;
		console.log('recordFromEvent', JSON.stringify(recordFromEvent));	   
		this.recordSelected(recordFromEvent);
	}

	// Using NavigationMixin
	createNewRecord(event){
		let evt = {
			type: 'standard__objectPage',
			attributes: {
				objectApiName: 'Account',
				actionName: 'new'
			},
			state: {
				nooverride: '1'
			}
		};
		//this[NavigationMixin.Navigate](evt);
		this[NavigationMixin.GenerateUrl](evt)
			.then(url => {
				console.log('url ->', url);
				this.createWin = window.open(url, "_blank");
				// This callback does not work!!!
				this.createWin.onbeforeunload = function(){
					console.log('onbeforeunload');
					this.getCreatedRecord();
				}
			});
	}

	objectSelect(event){
		event.preventDefault();
		let selectedObject = event.detail.value;
		this.multiObjectList.forEach(item => {
			if(item.value == selectedObject){
				this.objectName = item.value;
				this.objectLabel = item.label;
				this.iconName = item.iconName;
				this.placeholder = "Search in " + this.objectLabel;
			}
		});
	}

	// on-render handler of Aura Component
	renderedCallback(){
		console.log('rendered callback ->');
		//this.template.querySelector('[data-custom-lookup]').classList.add('slds-is-close');

		if(this.selectedRecord.Name != undefined){
			this.lookupPillClass = "slds-form-element__control slds-show";
			this.lookupFieldClass1 = "slds-hide slds-input-has-icon slds-input-has-icon_right";
		}
		if(Array.isArray(this.selectedRecords) && this.selectedRecords.length > 0) {
			this.hasSelectedRecords = true;
			this.lookupFieldClass2 = "slds-hide slds-box--border slds-input-has-icon slds-input-has-icon_right";
		}
	}

	/**
	 * **********************************************
	 * Helper part of Aura Component
	 * **********************************************
	 */
	checkMultiObject(){
		if(this.enableMultiObject){
			if(this.multiObjectList == null || this.multiObjectList.length < 1){
				this.showMyToast('error', 'CustomLookup Error', 'Need to set multiObjectList for using Multiple Object. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
			if(this.searchFields != ""){
				this.showMyToast('warning', 'CustomLookup Alert', 'Can not use searchFields with multiObject. searchFields cleared!!');
				this.searchFields = "";
			}
			if(this.additionalSelect != ""){
				this.showMyToast('warning', 'CustomLookup Alert', 'Can not use additionalSelect with multiObject. additionalSelect cleared!!');
				this.additionalSelect = "";
			}
			if(this.additionalDisplay != ""){
				this.showMyToast('warning', 'CustomLookup Alert', 'Can not use additionalDisplay with multiObject. additionalDisplay cleared!!');
				this.additionalDisplays = "";
			}
			if(this.filterFields != "" || this.filterExpression != ""){
				this.showMyToast('warning', 'CustomLookup Alert', 'Can not use Filter with multiObject. Filter cleared!!');
				this.filterFields = "";
				this.filterValues = "";
				this.filterConditions = "";
				this.filterExpression = "";
			}
			if(recordTypeNames != ""){
				this.showMyToast('warning', 'CustomLookup Alert', 'Can not use recordTypeNames with multiObject. recordTypeNames cleared!!');
				this.recordTypeNames = "";
			}

			this.objectName = multiObjectList[0].value;
			this.objectLabel = multiObjectList[0].label;
			this.iconName = multiObjectList[0].iconName;
		}
		return true;
	}

	checkRequired(){
		if(this.objectName == "" || this.iconName == ""){
			this.showMyToast('error', 'CustomLookup Error', 'objectName, iconName are required. Lookup disabled!!');
			this.disabled = true;
			return false;
		}
		return true;   
	}

	checkAdditionalFields(){
		if(this.additionalSelect != ""){
			var listField = this.additionalSelect.split(",");
			if(listField.length > 2){
				this.showMyToast('error', 'CustomLookup Error', 'The additionalField only accept maximum 2 fields. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
			this.hasMeta = true;
		}
		return true;
	}

	checkAdditionalDisplays(){
		if(this.additionalDisplays != ""){
			var listField = this.additionalDisplays.split(",");
			if(listField.length > 2){
				this.showMyToast('error', 'CustomLookup Error', 'The additionalDisplays only accept maximum 2 fields. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
			this.hasMeta = true;
		}
		return true;
	}

	checkSearchFields(){
		if(this.searchFields != ""){
			var listField = this.searchFields.split(",");
			if(listField.length > 2){
				this.showMyToast('error', 'CustomLookup Error', 'The searchField only accept maximum 3 fields. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
		}
		return true;
	}

	checkFilters(){
		if(this.filterFields != ""){
			var listField = this.filterFields.split(","),
				listValue = this.filterValues.split(","),
				listCondition = this.filterConditions.split(",");
			if(listField.length() != listValue.length() || listField.length() != listCondition.length()){
				this.showMyToast('error', 'CustomLookup Error', 'The number of filter fields, values and conditions must match. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
		}
		return true;
	}

	checkOrderBy(){
		if(this.orderBy != ""){
			var listField = this.orderBy.split(",");
			if(listField.length > 2){
				this.showToast('error', 'CustomLookup Error', 'Additional order by fields accept maximum 3. Lookup disabled!!');
				this.disabled = true;
				return false;
			}
		}
		return true;
	}

	queryRecords(searchText){
		this.spinnerToggle();
		queryRecords({
				'searchKeyword': searchText,
				'objectName' : this.objectName,
				'searchFields' : this.searchFields,
				'additionalDisplay' : this.additionalDisplay,
				'additionalSelect' : this.additionalSelect,
				'filterFields' : this.filterFields,
				'filterValues' : this.filterValues,
				'filterConditions' : this.filterConditions,
				'filterExpression' : this.filterExpression,
				'recordTypeNames' : this.recordTypeNames,		 
				'onlyOwned' : this.ownedOnly,
				'orderBy' : this.orderBy,
				'numLimit' : this.numOfQuery
			})
			.then(result => {
				console.log('queryRecords ->', result);
				if(result.length == 0){
					this.message = 'No Result Found...';
				} else {
					this.message = '';
				}
				this.searchRecords = result;
				this.spinnerToggle();
			})
			.catch(errors => {
				this.errorHandler(errors);
				this.spinnerToggle();
			});
	}

	getCreatedRecord(){
		console.log('callback executed....');
		getCreatedRecord({ 'objectName' : this.objectName })
			.then(result => {
				console.log('getCreatedRecord ->', result);
				if(result != null)
					this.selectedRecord = result;
			})
			.catch(errors => {
				this.errorHandler(errors);
			});
	}

	recordSelected(record){
		var detail;
		if(this.enableMultiRecord){
			if(Array.isArray(this.selectedRecords)){
				this.selectedRecords.push(record);
			} else {
				this.selectedRecords = new Array();
				this.selectedRecords.push(record);
			}
			if(this.selectedRecords.length > 0) this.hasSelectedRecords = true;
			detail = this.selectedRecords;
		} else {
			this.lookupPillClass = "slds-form-element__control slds-show";
			this.lookupFieldClass1 = "slds-hide slds-box--border slds-input-has-icon slds-input-has-icon_right";

			this.selectedRecord = record;
			detail = this.selectedRecord;
		}

		this.searchClass = 'slds-is-close slds-form-element slds-lookup';
		this.template.querySelector('[data-search-input]').value = "";
		this.searchRecords = [];

		// Creates the event with parameter
		//const selectedEvent = new CustomEvent('recordSelectedEvent', { recordByEvent : this.record });
		const changedEvent = new CustomEvent('change', { detail : detail });

		// Dispatches the event.
		this.dispatchEvent(changedEvent);
	}

	listToggleHelper(mode){
		this.timeout = setTimeout(function(e){
			if(mode == 'on'){
				// resultList open
				this.searchClass = 'slds-is-open slds-form-element slds-lookup';
			} else {
				// resultList close
				this.searchClass = 'slds-is-close slds-form-element slds-lookup';
			}
		}.bind(this), 500);
	}

	// Spinner toggle
	spinnerToggle(){
		this.template.querySelector('[data-result-spinner]').classList.toggle("slds-hide");
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