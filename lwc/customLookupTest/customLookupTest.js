/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 02-18-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   02-18-2021   woomg@dkbmc.com   Initial Version
**/
import { LightningElement, api, track } from 'lwc';

export default class CustomLookupTest extends LightningElement {
    @track  srs;

    changeEvent(event){
        console.log('changed ->', event.detail);
        console.log('query selector ->', this.template.querySelector('[data-lookup]').selectedRecord);
    }
}