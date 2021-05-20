/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 11-05-2020
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   11-05-2020   woomg@dkbmc.com   Initial Version
**/
({
	doInit : function(component, event) {
        window.console.log('Local IP View Start');
        try {
            console.log('chrome extension call');
            var extensionId = "lkelmmpckdonojdehammffjoffbcdlai";
            chrome.runtime.sendMessage(extensionId, { localIP : true }, function(response) {
                console.log("Chrome extension responded: " + response);
                component.set("v.localIp", response);
            });
        } catch(ex){
            console.log('chrome extension error ->', ex.message)
        }
    }
})