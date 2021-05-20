/**
 * @File Name          : CustomLookupController_Test.cls
 * @Description        : 
 * @Author             : MinGyoon Woo (woomg@dkbmc.com)
 * @Group              : 
 * @Last Modified By   : woomg@dkbmc.com
 * @Last Modified On   : 02-03-2021
 * @Modification Log   : 
 *==============================================================================
 * Ver         Date                     Author      		      Modification
 *==============================================================================
 * 1.0    7/10/2019, 12:00:00 PM   MinGyoon Woo (woomg@dkbmc.com)     Initial Version
 * 1.4    2/03/2019, 12:00:00 PM   MinGyoon Woo (woomg@dkbmc.com)     additionalSelect, filter isNumeric, filter expression
**/
@IsTest
public with sharing class CustomLookupController_Test {
    static {

        Account ac = new Account(
            Name='Test Account'
        );
        insert ac;
    }

    @IsTest
	private static void testMethodOne() {
        Test.startTest();
        system.debug(CustomLookupController.initComponent('Account'));
        system.debug(CustomLookupController.queryRecords('Test', 'Account', '', '', '', '', '', '', '', '', false, '', '5'));
        try {
            system.debug(CustomLookupController.queryRecords('Test', 'Account', 'Email', '', '', '', '', '', '', '', false, '', '5'));
        } catch(Exception e){}
        system.debug(CustomLookupController.getCreatedRecord('Account'));
        system.debug(CustomLookupController.makeQueryString('Email, Phone'));
        system.debug(CustomLookupController.makeSearchString('Email, Phone', 'Test'));
        system.debug(CustomLookupController.makeFilterString('User', 'Email, Phone','empty, 0000','eq,eq',''));
        system.debug(CustomLookupController.makeRecordTypeFilter('Email, Phone'));
        system.debug(CustomLookupController.makeOrderBy('Email, Phone'));
        system.debug(CustomLookupController.convertOperator('eq'));
        system.debug(CustomLookupController.convertOperator('ne'));
        system.debug(CustomLookupController.convertOperator('gt'));
        system.debug(CustomLookupController.convertOperator('lt'));
        system.debug(CustomLookupController.convertOperator('gte'));
        system.debug(CustomLookupController.convertOperator('lte'));
    }
}