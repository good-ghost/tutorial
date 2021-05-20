/**
 * @description       : 
 * @author            : woomg@dkbmc.com
 * @group             : 
 * @last modified on  : 03-04-2021
 * @last modified by  : woomg@dkbmc.com
 * Modifications Log 
 * Ver   Date         Author            Modification
 * 1.0   03-04-2021   woomg@dkbmc.com   Initial Version
**/
({
    doInit : function(component, event, helper) {
        if(window.event){
            window.event.cancelBubble = true;
            window.addEventListener('keypress', function(ev){
                if(ev.code == 'Escape') {
                    ev.preventDefault();
                    ev.stopImmediatePropagation();
                }
            });
        } else {
            window.addEventListener('keydown', function(ev){
                if(ev.code == 'Escape')
                    ev.stopImmediatePropagation();
            }, true);
        }
    },
    closeActionModal : function(component, event, helper) {
        $A.get("e.force:closeQuickAction").fire();
    }
})