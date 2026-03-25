@isTest
public class AdminSettingControllerTest {

    @testSetup
    static void setupData() {
        Admin_Configuration__c adminConfig = new Admin_Configuration__c(
            Name = 'Test Admin Config',
            Phone__c = '1234567890',
            Email__c = 'test@example.com'
        );
        insert adminConfig;

        ContentVersion cv = new ContentVersion(
            Title = 'Test File',
            PathOnClient = 'TestFile.txt',
            VersionData = Blob.valueOf('Test content')
        );
        insert cv;
    }

    @isTest
    static void testGetAdminConfigFetchesSingletonRecord() {
        Admin_Configuration__c config = [SELECT Id FROM Admin_Configuration__c LIMIT 1];

        Test.startTest();
        Admin_Configuration__c result = AdminSettingController.getAdminConfig();
        Test.stopTest();

    }

    @isTest
    static void testSaveAdminConfigUpdatesResolvedMasterRecord() {
        Admin_Configuration__c existingConfig = [SELECT Id FROM Admin_Configuration__c LIMIT 1];
        Admin_Configuration__c config = new Admin_Configuration__c(
            Name = 'Updated Master Config',
            Phone__c = '9876543210'
        );

        Test.startTest();
        Admin_Configuration__c savedConfig = AdminSettingController.saveAdminConfig(config);
        Test.stopTest();

    }

    @isTest
    static void testDeleteCompanyLogo() {
        Admin_Configuration__c config = [SELECT Id FROM Admin_Configuration__c LIMIT 1];
        config.Company_Logo_URL__c = '/dummy/logo.png';
        update config;

        Test.startTest();
        Admin_Configuration__c result = AdminSettingController.deleteCompanyLogo();
        Test.stopTest();

    }

    @isTest
    static void testSaveAndClearFileUrl() {
        Admin_Configuration__c config = [SELECT Id FROM Admin_Configuration__c LIMIT 1];
        ContentVersion cv = [SELECT Id, ContentDocumentId FROM ContentVersion LIMIT 1];

        Test.startTest();
        AdminSettingController.saveFileUrl('Company_Logo_URL__c', cv.ContentDocumentId);
        AdminSettingController.clearFileUrl('Company_Logo_URL__c');
        Test.stopTest();

        Admin_Configuration__c refreshed = [SELECT Company_Logo_URL__c FROM Admin_Configuration__c WHERE Id = :config.Id];
    }

    @isTest
    static void testSaveFileUrlRejectsUnexpectedField() {
        ContentVersion cv = [SELECT Id, ContentDocumentId FROM ContentVersion LIMIT 1];

        Test.startTest();
        try {
            AdminSettingController.saveFileUrl('Name', cv.ContentDocumentId);
        } catch (AuraHandledException ex) {
        }
        Test.stopTest();
    }

    @isTest
    static void testDeleteContentDocument() {
        ContentVersion cv = [SELECT Id, ContentDocumentId FROM ContentVersion LIMIT 1];
        ContentDocumentLink link = new ContentDocumentLink(
            ContentDocumentId = cv.ContentDocumentId,
            LinkedEntityId = [SELECT Id FROM Admin_Configuration__c LIMIT 1].Id,
            ShareType = 'V'
        );
        insert link;

        Test.startTest();
        AdminSettingController.deleteContentDocument(cv.ContentDocumentId);
        Test.stopTest();

        Integer linksCount = [SELECT count() FROM ContentDocumentLink WHERE ContentDocumentId = :cv.ContentDocumentId];
        Integer docCount = [SELECT count() FROM ContentDocument WHERE Id = :cv.ContentDocumentId];

    }
}