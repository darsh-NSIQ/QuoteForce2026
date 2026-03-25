/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 10-02-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class MasterTemplateController {
    
    @AuraEnabled
    public static String uploadImagesAndUpdateRecord(Id recordId, String primaryImageId, String secondaryImageId, Map<String, Object> fieldValues) {
        try {
            // Check if primary and secondary image IDs are provided
            if (primaryImageId != null) {
                linkFileToRecord(primaryImageId, recordId);
            }
            if (secondaryImageId != null) {
                linkFileToRecord(secondaryImageId, recordId);
            }

            // Update the Master_Template__c record
            Master_Template__c recordToUpdate = [SELECT Id FROM Master_Template__c WHERE Id = :recordId LIMIT 1];
            for (String fieldName : fieldValues.keySet()) {
                recordToUpdate.put(fieldName, fieldValues.get(fieldName));
            }
            update recordToUpdate;

            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // Link the ContentVersion (file) to the Master_Template__c record via ContentDocumentLink
    public static void linkFileToRecord(String contentVersionId, Id recordId) {
        ContentDocumentLink link = new ContentDocumentLink();
        link.LinkedEntityId = recordId;
        link.ContentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersionId].ContentDocumentId;
        link.ShareType = 'V';
        link.Visibility = 'AllUsers';
        insert link;
    }
}