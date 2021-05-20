/**
 * @File Name			: LightningManualSharingController.cls
 * @Description			: 
 * @Author				: woomg@dkbmc.com
 * @Group				: 
 * @Last Modified By	: woomg@dkbmc.com
 * @Last Modified On	: 03-09-2021
 * @Modification Log	: 
 * Ver		Date		Author				Modification
 * 1.0		1/2/2020	woomg@dkbmc.com		Initial Version
**/
global with sharing  class LightningManualSharingController {
	global class CustomException extends Exception{}

	global class SharingTarget {
		global	String	Id				{ get; set; }
		global	String	Name			{ get; set; }
		global	String	Description		{ get; set; }
		global	String	Type			{ get; set; }
		global	String	IconName		{ get; set; }
		global	Boolean	IsUser			{ get; set; }
	}

	global class SharingHolder {
		global	String	UserOrGroupName	{ get; set; }
		global	String	SubType			{ get; set; }
		global	String	IconName		{ get; set; }
		global	String	UserOrGroupType	{ get; set; }
		global	String	UserOrGroupId	{ get; set; }
		global	String	AccessLevel		{ get; set; }
		global	String	RowCause		{ get; set; }
		global	String	Role			{ get; set; }
		global	String	Title			{ get; set; }
		global	String	Description		{ get; set; }
		global	Boolean	IsManual		{ get; set; }
		global	Boolean	IsOwner			{ get; set; }
		global	Boolean	IsUser			{ get; set; }
		global	Boolean	CanEdit			{ get; set; }
	}

	@AuraEnabled
	global static Boolean canIEditPerms(Id recordId){
		try {
			//if you're the owner, you're cool
			String query = 'SELECT OwnerId FROM ' + objectTypeFromId(recordId) + ' WHERE Id = \'' + recordId + '\'';
			sObject o = Database.query(query);
			if (o.get('OwnerId') == UserInfo.getUserID()){
				System.debug('edit allowed because owner');
				return true;
			}

			//if you have modify allData, you're also cool
			list<PermissionSetAssignment> modifiers = [SELECT AssigneeId FROM PermissionSetAssignment WHERE PermissionSet.PermissionsModifyAllData = true];
			for (PermissionSetAssignment psa : modifiers){
				if (psa.AssigneeId == userInfo.getUserID()){
					System.debug('edit allowed because has modify allData permission');
					return true;
				}
			}

			// Check using UserRecordAccess sObject to check permission
			list<UserRecordAccess> lura = [SELECT RecordId, HasEditAccess FROM UserRecordAccess WHERE RecordId = :recordId AND UserId = :UserInfo.getUserId()];
			for(UserRecordAccess ura : lura){
				if(ura.HasEditAccess) return true;
			}

		} catch (System.queryException e){
			//it's possible you can't even see that record and the queries are null!
			return false;
		}
		return false;
	}

	@AuraEnabled
	global static String getSharings(Id recordId){
		if (!canIEditPerms(recordId)){
			throw new AuraHandledException('Only the record owner or administrators can access permissions');
		}
		if (!User.Id.getDescribe().isAccessible()
			|| !User.Name.getDescribe().isAccessible()
			|| !User.UserType.getDescribe().isAccessible()
			|| !Group.Id.getDescribe().isAccessible()
			|| !Group.Name.getDescribe().isAccessible()
			|| !Group.Type.getDescribe().isAccessible()){
			
			throw new AuraHandledException('You do not have the required permissions for this action');
		}

		list<sObject> results = Database.query(buildQuery(recordId));
		list<SharingHolder> output = new list<SharingHolder>();

		set<Id> groupAndUserIDs = new set<Id>();
		set<Id> roleIds = new set<Id>();

		for (sObject so : results){
			SharingHolder sh = new SharingHolder();
			sh.RowCause = String.valueOf(so.get('RowCause'));
			sh.IsManual = sh.RowCause == 'Manual' ? true : false;
			sh.IsOwner = sh.RowCause == 'Owner' ? true : false;
			sh.AccessLevel = string.valueOf(so.get(getAccessLevelField(objectTypeFromId(recordId))));
			sh.CanEdit = sh.AccessLevel == 'Edit' ? true : false;
			sh.UserOrGroupId = String.valueOf(so.get('UserOrGroupID'));
			groupAndUserIDs.add(sh.UserOrGroupId);
			output.add(sh);
		}

		map<Id, User> userMap = new map<Id, User>([SELECT Name, UserType, MediumPhotoUrl, Email, UserRole.Name, Title FROM User WHERE Id IN :groupAndUserIDs]);
		map<Id, Group> groupMap = new map<Id, Group>([SELECT Name, Type, RelatedId FROM Group WHERE Id IN :groupAndUserIDs]);
		for (Group g : groupMap.values()){
			if (g.RelatedId != null){
				roleIds.add(g.RelatedId);
			}
		}
		map<Id, UserRole> roleMap = new map<Id, UserRole>([SELECT Name FROM UserRole WHERE Id IN :roleIds]);

		for (SharingHolder sh : output){
			if (userMap.get(sh.UserOrGroupId) != null){
				//it's a user
				sh.IconName = userMap.get(sh.UserOrGroupId).MediumPhotoUrl;
				sh.Role = userMap.get(sh.UserOrGroupId).UserRoleId != null ? userMap.get(sh.UserOrGroupId).UserRole.Name : '';
				sh.Title = userMap.get(sh.UserOrGroupId).Title != null ? userMap.get(sh.UserOrGroupId).Title : '';
				sh.Description = userMap.get(sh.UserOrGroupId).Email != null ? userMap.get(sh.UserOrGroupId).Email : '';
				sh.IsUser = true;

				sh.UserOrGroupType = 'User';
				sh.UserOrGroupName = userMap.get(sh.UserOrGroupId).Name;
				sh.SubType = userMap.get(sh.UserOrGroupId).UserType;
			} else if (groupMap.get(sh.UserOrGroupId) != null){
				String subType = groupMap.get(sh.UserOrGroupId).Type;
				sh.IconName = 'standard:' + (subType == 'Role' ? 'user_role' : subType == 'RoleAndSubordinates' ? 'hierarchy' : 'groups');
				sh.Role = '';
				sh.Title = '';
				sh.Description = groupMap.get(sh.UserOrGroupId).Type;
				sh.IsUser = false;

				sh.UserOrGroupType = 'Group';
				sh.SubType = groupMap.get(sh.UserOrGroupId).Type;
				sh.UserOrGroupName = groupMap.get(sh.UserOrGroupId).Name;
				//special handling for roles
				if (sh.SubType.contains('Role')){
					sh.UserOrGroupName = roleMap.get(groupMap.get(sh.UserOrGroupId).RelatedId).Name;
				}
			}
		}

		return JSON.serialize(output);
	}

	@AuraEnabled
	global static void deletePerm(Id UserOrGroupId, Id recordId){
		//access check
		Schema.DescribeSObjectResult describe = getSharingDescribe(recordId);

		//can I delete the sharing objects?
		if (!describe.isDeletable() || !describe.isAccessible()){
			throw new AuraHandledException('You don\'t have the proper permissions for ths action');
		}

		String query = buildQuery(recordId);
		query = query + ' AND UserOrGroupId =\'' + UserOrGroupId + '\'';
		System.debug(query);

		list<sObject> existing = Database.query(query);
		System.debug(existing);
		delete existing;
	}

	@AuraEnabled
	global static String doQuery(String searchString, String objectType){
        System.debug('search :' + searchString);
        System.debug('type :' + objectType);

		list<SharingTarget> targets = new list<SharingTarget>();
		String objectName = objectType == 'user' ? 'User' : 'Group';

		Schema.DescribeSObjectResult describe = Schema.getGlobalDescribe().get(objectName).getDescribe();
		//can I query?
		if (!describe.isQueryable() || !describe.isAccessible()){
			throw new AuraHandledException('You don\'t have the proper permissions for ths action');
		}

		map<String, Schema.SObjectField> fieldMap = describe.fields.getMap();
		for (Schema.SObjectField field : fieldMap.values()){
			if (field.getDescribe().isNameField()){
				if (!field.getDescribe().isAccessible()){
					throw new AuraHandledException('You don\'t have the proper permissions for ths action');
				}
			}
		}

        searchString = searchString.replace('\\','');
        String query = 'SELECT Id, Name, ';
        
        if(objectType == 'user'){
            query += ' Department, MediumPhotoUrl, UserRole.Name, Email, Title FROM User' ;
            query += ' WHERE Name LIKE \'%' + searchString + '%\' AND UserType = \'Standard\' AND IsActive = true LIMIT 50';
            list<User> userList = Database.query(query);
            
            System.debug('user :' + userList);
            
            for(User u : userList){
				SharingTarget sh = new SharingTarget();
                sh.Id = u.Id;
                sh.Name = u.Name;
                sh.Description = u.Title != null ? u.Title + '/' : '';
                sh.Description += u.UserRoleId != null ? u.UserRole.Name + '/' : '';
                sh.Description += u.Email;
				sh.Type = 'Standard';
                sh.IconName = u.MediumPhotoUrl;
                sh.IsUser = true;
                
                targets.add(sh);
            }
        } else if(objectType == 'group'){
            query += ' DeveloperName FROM Group' ;
            query += ' WHERE Name LIKE \'%' + searchString + '%\' AND Type = \'Regular\' LIMIT 50';
            list<Group> groupList = Database.query(query);
                        
            for(Group g : groupList){
				SharingTarget sh = new SharingTarget();
                sh.Id = g.Id;
                sh.Name = g.Name;
                sh.Description = g.DeveloperName;
				sh.Type = 'Public Group';
                sh.IconName = 'standard:groups';
                sh.IsUser = false;
                
                targets.add(sh);
            }            
        } else {
			objectType = objectType == 'userrole' ? 'Role' : 'RoleAndSubordinates';
            query += ' DeveloperName, Related.Name FROM Group' ;
            query += ' WHERE Related.Name LIKE \'%' + searchString + '%\' AND Type = \'' + objectType + '\' LIMIT 50';
            list<Group> groupList = Database.query(query);
                        
            for(Group g : groupList){
				SharingTarget sh = new SharingTarget();
                sh.Id = g.Id;
                sh.Name = g.Related.Name;
                sh.Description = g.DeveloperName;
				sh.Type = objectType == 'Role' ? objectType : 'Role And Subordinates';
                sh.IconName = 'standard:' + (objectType == 'Role' ? 'user_role' : 'hierarchy');
                sh.IsUser = false;
                
                targets.add(sh);
            }            
        }

		return JSON.serialize(targets);
	}

	@AuraEnabled
	global static String upsertPerm (Id UserOrGroupId, Id recordId, String level){

		Schema.DescribeSObjectResult describe = getSharingDescribe(recordId);
		level = String.escapeSingleQuotes(level);

		if (!canIEditPerms(recordId)){
			throw new AuraHandledException('Only the record owner or administrators can modify permissions');
		}
		System.debug('doing perm upsert');

		// special handling for role => groups
		if (UserOrGroupId.getSobjectType() == Schema.UserRole.SObjectType){
			//it's a role...find the matching group?
			list<Group> matchingGroups = [SELECT Id, Name, Type FROM Group WHERE RelatedId = :UserOrGroupId AND Type = 'Role'];
			if (matchingGroups.size() > 1){
				throw new AuraHandledException('There are multiple groups for that role');
			}
			UserOrGroupId = matchingGroups[0].Id;
		}


		String query = buildQuery(recordId);
		query = query + ' AND UserOrGroupId = \'' + String.escapeSingleQuotes(String.valueOf(UserOrGroupId)) + '\'';
		System.debug(query);

		list<sObject> existing = Database.query(query);
		String objectName = objectTypeFromId(recordId);

		if (existing.size() > 0){
			System.debug('already existing. will update');
			//can I update this thing?

			if (!describe.isUpdateable()
				|| !describe.fields.getMap().get(getAccessLevelField(objectName)).getDescribe().isUpdateable()){
				
				throw new AuraHandledException('Only the record owner or administrators can modify permissions');
			}

			existing[0].put(getAccessLevelField(objectName), level);
			update existing;
			return JSON.serialize(existing);
		} else {
			System.debug('not already existing. will create');
			//are we even allowed to insert this?  for these specific fields that we'll set?
			if (!describe.isCreateable()
				|| !describe.fields.getMap().get(getAccessLevelField(objectName)).getDescribe().isCreateable()
				|| !describe.fields.getMap().get(getLookupField(objectName)).getDescribe().isCreateable()
				|| !describe.fields.getMap().get('UserOrGroupId').getDescribe().isCreateable()){

				throw new AuraHandledException('Only the record owner or administrators can create new permissions');
			}
			//create a new SObject dynamically and insert
			Schema.SObjectType newShareObject = Schema.getGlobalDescribe().get(getSharingTableName(objectName));
			sObject share = newShareObject.newSObject();

			share.put(getAccessLevelField(objectName), level);
			share.put(getLookupField(objectName), recordId);
			share.put('UserOrGroupId', String.escapeSingleQuotes(String.valueOf(UserOrGroupId)));

			if (objectName == 'Account'){
				//share.put('ContactAccessLevel', level);
				share.put('CaseAccessLevel', level);
				share.put('OpportunityAccessLevel', level);
			}

			insert share;
			return JSON.serialize(share);
		}
		//return null;
	}

	@TestVisible
	private static String buildQuery(Id recordId){
		String objectName = objectTypeFromId(recordId);

		Schema.DescribeSObjectResult describe = getSharingDescribe(recordId);

		if (!describe.isAccessible()
			|| !describe.fields.getMap().get('Id').getDescribe().isAccessible()
			|| !describe.fields.getMap().get('RowCause').getDescribe().isAccessible()
			|| !describe.fields.getMap().get('UserOrGroupId').getDescribe().isAccessible()
			|| !describe.fields.getMap().get(getAccessLevelField(objectName)).getDescribe().isAccessible()
			|| !describe.fields.getMap().get(getLookupField(objectName)).getDescribe().isAccessible()){
			
			throw new AuraHandledException('You don\'t have the required permissions for this action');
		}

		String query = 'SELECT Id, RowCause, UserOrGroupId, ' + getAccessLevelField(objectName) + ' FROM ' + getSharingTableName(objectName) + ' WHERE ' + getLookupField(objectName) + ' = \'' + recordId + '\'';
		System.debug(query);
		return query;
	}

	private static Boolean isStandard (String objectName){
		Schema.DescribeSObjectResult describe = Schema.getGlobalDescribe().get(objectName).getDescribe();
		return !describe.isCustom();
	}

	@TestVisible
	private static String getLookupField (String objectName){
		if (isStandard(objectName)){
			return objectName + 'Id';
		} else {
			return 'ParentId';
		}
	}

	@TestVisible
	private static String getAccessLevelField (String objectName){
		System.debug('accesslevelField received sobject type :' + objectName);
		if (isStandard(objectName)){
			System.debug('is a special object');
			return objectName + 'AccessLevel';
		} else {
			System.debug('is not a special object');
			return 'AccessLevel';
		}
	}

	@TestVisible
	private static String objectTypeFromId(Id recordId){
		Schema.SObjectType token = recordId.getSObjectType();
		Schema.DescribeSObjectResult dr = token.getDescribe();
		return dr.getName();
	}

	@TestVisible
	private static String getSharingTableName (String objectName){
		if (objectName.contains('__c')){
			return objectName.replace('__c','__Share');
		} else {
			return objectName+'Share';
		}
	}

	@TestVisible
	private static Schema.DescribeSObjectResult getSharingDescribe (Id recordId){
		try{
			String sharingName = getSharingTableName(objectTypeFromId(recordId));
			return Schema.getGlobalDescribe().get(sharingName).getDescribe();
		} catch (Exception e){
			//probably means they don't have sharing turned on for this object
			throw new AuraHandledException('There is no sharing table for that object. Are you SURE you changed the sharing setting to PRIVATE or READ ? ');
		}
	}
}
