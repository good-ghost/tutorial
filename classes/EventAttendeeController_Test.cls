@isTest
private class EventAttendeeController_Test {
	private static	Account		ac;
	private static	Contact		co;
	private static	Event		ev;
	static {
		ac = new Account(Name='Test');
		insert ac;
		co = new Contact(LastName='Last', FirstName='first', AccountId=ac.Id);
		insert co;
		ev = new Event(Subject='Test', WhatId=ac.Id, StartDateTime=system.now(), EndDateTime=system.now().addHours(1));
		insert ev;
	}
	@isTest static void test_method_one() {
		//Test.startTest();
		system.debug(EventAttendeeController.queryEventInfo(ev.Id));
		system.debug(EventAttendeeController.queryUserId());
		system.debug(EventAttendeeController.queryPerson('contact', ac.Id, 'first'));
		system.debug(EventAttendeeController.queryEventAttendee(ev.Id));
		list<String> lco = new list<String>();
		lco.add(co.Id);
		EventAttendeeController.addEventAttendee(ev.Id, lco);
		String erid = [SELECT Id FROM EventRelation LIMIT 1].Id;
		system.debug(EventAttendeeController.deleteEventAttendee(erid));
		system.debug(EventAttendeeController.queryUserId());

		//Test.stopTest();
		// Implement test code
	}
}