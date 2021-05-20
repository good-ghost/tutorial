/**
 * @description       : 
 * @author            : 
 * @last modified on  : 2020-12-16
 * @last modified by  : leehyo
 * Modifications Log 
 * Ver   Date         Author   Modification
 * 1.0   2020-12-16   leehyo   Event Attendee 추가/삭제 시 Knox 일정 수정 I/F 연동
**/
global without sharing class EventAttendeeController {

    @AuraEnabled
    global static Event queryEventInfo(String eventId){
        Event ev = new Event();
        try {
            ev = [SELECT Id, OwnerId, AccountId FROM Event WHERE Id = :eventId LIMIT 1];
        } catch(Exception e){
            return ev;
        }
        return ev;
    }

    @AuraEnabled
    global static String queryUserId(){
        return UserInfo.getUserId();
    }

    @AuraEnabled
    global static list<Person> queryPerson(String selType, String accountId, String searchText){
        list<Person> lp = new list<Person>();
        String query = '';
        if(selType == 'user')
        	query += 'SELECT Id, Name FROM User WHERE IsActive = true AND UserType = \'Standard\' ';
        else
        	query += 'SELECT Id, Name FROM Contact WHERE AccountId = :accountId ';
            
        if(searchText != '') query += 'AND Name LIKE \'%' + searchText + '%\' ';
        query += 'ORDER BY Name';
        // query += 'LIMIT 20';
        
        list<sObject> lobj = Database.query(query);
        
        if(!lobj.isEmpty()){
            for(sObject o : lobj){
                Person p = new Person();
                p.Name = (String) o.get('Name');
                p.Id = (String) o.get('Id');
                lp.add(p);
            }
        }

        return lp;
    }

    @AuraEnabled
    global static list<EventRelation> queryEventAttendee(String eventId){
        list<EventRelation> ler = new list<EventRelation>();
        if(IsSharedActivitiesEnabled()){
            ler = [SELECT Id, RelationId, Relation.Name, RespondedDate, Response, Status FROM EventRelation WHERE EventId = :eventId AND IsInvitee = true];
        } else {
            ler = [SELECT Id, RelationId, Relation.Name, RespondedDate, Response, Status FROM EventRelation WHERE EventId = :eventId];
        }
        return ler;
    }

    @AuraEnabled
    global static void addEventAttendee(String eventId, list<String> persons){
        list<EventRelation> ler = new list<EventRelation>();
        if(persons != null && persons.size() > 0){
            for(String p : persons){
                EventRelation er = new EventRelation(EventId = eventId, RelationId = p);
                ler.add(er);
            }
        }
        if(!ler.isEmpty()) { 
            insert ler;

            // [Knox 일정 수정 CallOut]
            callKnoxSheduleUpdate(eventId);
        }
    }
    
    @AuraEnabled
    global static Boolean deleteEventAttendee(String attendeeId){
        try {
            EventRelation er = [SELECT Id, EventId FROM EventRelation WHERE Id = :attendeeId LIMIT 1];
            Id eventId = er.EventId;

            delete er;

            // [Knox 일정 수정 CallOut]
            callKnoxSheduleUpdate(eventId);

        } catch(Exception e){
            return false;
        }
        return true;
    }
    
    private static void callKnoxSheduleUpdate(Id eventId){
        List<Event> eventList = Utils.queryObjectWithoutRichText('Event'
                , 'WHERE Id = \'' + eventId + '\'' );
        Map<Id, Event> eventMap = new Map<Id, Event>{ eventId => eventList[0] };
        Employee__c eventCreatorEmp = Utils.getLoginEmployeeData(eventList[0].CreatedById);
        if(String.isNotBlank(eventCreatorEmp.EvMailAddr__c)) {
            System.enqueueJob( new EventTriggerHelper(eventList, eventMap, TriggerOperation.AFTER_UPDATE, eventCreatorEmp) );
        }
    }

    private static Boolean IsSharedActivitiesEnabled(){
		//Schema.DescribeSobjectResult objType = Schema.SObjectType.EventRelation;
		//map<String, Schema.SObjectField> fieldMap = objType.fields.getMap();
		map<String, Schema.SObjectField> fieldMap = Schema.SObjectType.EventRelation.fields.getMap();
        if(fieldMap.containsKey('isinvitee')){
            system.debug('Shared Activities enabled');
            return true;
        }
    	system.debug('Shared Activities disabled');
		return false;
    }
    
    global class Person {
        @AuraEnabled
        global	String	Name;
        @AuraEnabled
        global	String	Id;
    }
}