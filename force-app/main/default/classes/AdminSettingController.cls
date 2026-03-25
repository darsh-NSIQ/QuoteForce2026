public with sharing class AdminSettingController {

    private static final List<String> ADMIN_CONFIG_FIELDS = new List<String>{
        'Id',
        'Name',
        'Phone__c',
        'Email__c',
        'Address__c',
        'Street__c',
        'City__c',
        'State_Province__c',
        'Postal_Code__c',
        'Country__c',
        'Company_Logo_URL__c',
        'Default_Warranty__c',
        'Default_Terms_Conditions__c',
        'Active_Letter_Of_Owner__c',
        'Active_Quote_Details__c',
        'Active_Terms_and_Conditions__c',
        'Active_Title__c',
        'Active_Warranty__c',
        'Fecth_Address_From_Account__c',
        'Currency__c',
        'Link_With_Opportunity__c'
    };

    private static final Set<String> FILE_URL_FIELDS = new Set<String>{
        'Company_Logo_URL__c',
        'Default_Warranty__c',
        'Default_Terms_Conditions__c'
    };

    @AuraEnabled
    public static void deleteContentDocument(Id contentDocumentId) {
        List<ContentDocumentLink> links = [
            SELECT Id
            FROM ContentDocumentLink
            WHERE ContentDocumentId = :contentDocumentId
        ];
        delete links;

        ContentDocument doc = [SELECT Id FROM ContentDocument WHERE Id = :contentDocumentId];
        delete doc;
    }

    @AuraEnabled(cacheable=false)
    public static Admin_Configuration__c getAdminConfig() {
        Id resolvedId = resolveAdminConfigId();
        return queryAdminConfig(resolvedId);
    }

    @AuraEnabled
    public static Admin_Configuration__c saveAdminConfig(Admin_Configuration__c config) {
        if (config == null) {
            throw new AuraHandledException('Configuration payload is required');
        }

        if (config.Id == null) {
            Id resolvedId = resolveAdminConfigId();
            if (resolvedId != null) {
                config.Id = resolvedId;
            }
        }
        if(String.isBlank(config.Name)){
        config.Name = null;
    }

        upsert config;
        return queryAdminConfig(config.Id);
    }

    @AuraEnabled
    public static Admin_Configuration__c deleteCompanyLogo() {
        Id resolvedId = requireAdminConfigId();
        Admin_Configuration__c conf = new Admin_Configuration__c(
            Id = resolvedId,
            Company_Logo_URL__c = null
        );
        update conf;
        return queryAdminConfig(resolvedId);
    }

    @AuraEnabled
    public static void saveFileUrl(String fieldName, String documentId) {
        validateFileField(fieldName);
        if (String.isBlank(documentId)) {
            throw new AuraHandledException('Invalid parameters');
        }

        ContentVersion cv = [
            SELECT Id, ContentDocumentId
            FROM ContentVersion
            WHERE ContentDocumentId = :documentId
            ORDER BY CreatedDate DESC
            LIMIT 1
        ];

        String fileUrl = '/sfc/servlet.shepherd/document/download/' + cv.ContentDocumentId;
        Admin_Configuration__c config = new Admin_Configuration__c(Id = requireAdminConfigId());
        config.put(fieldName, fileUrl);
        update config;
    }

    @AuraEnabled
    public static void clearFileUrl(String fieldName) {
        validateFileField(fieldName);
        Admin_Configuration__c config = new Admin_Configuration__c(Id = requireAdminConfigId());
        config.put(fieldName, null);
        update config;
    }

    private static void validateFileField(String fieldName) {
        if (String.isBlank(fieldName) || !FILE_URL_FIELDS.contains(fieldName)) {
            throw new AuraHandledException('Invalid file field');
        }
    }

    private static Id requireAdminConfigId() {
        return resolveAdminConfigId();
    }

    private static Id resolveAdminConfigId() {
        List<Admin_Configuration__c> defaults = [
            SELECT Id
            FROM Admin_Configuration__c
            ORDER BY CreatedDate ASC
            LIMIT 1
        ];
        if (!defaults.isEmpty()) {
            return defaults[0].Id;
        }

        Admin_Configuration__c config = createDefaultAdminConfig();
        insert config;
        return config.Id;
    }

    private static Admin_Configuration__c createDefaultAdminConfig() {
        return new Admin_Configuration__c(
            Name = 'Default Configuration',
            Currency__c = 'USD',
            Active_Title__c = true,
            Active_Quote_Details__c = true,
            Active_Warranty__c = true,
            Active_Terms_and_Conditions__c = true,
            Active_Letter_Of_Owner__c = false,
            Fecth_Address_From_Account__c = false,
            Link_With_Opportunity__c = false
        );
    }

    private static Admin_Configuration__c queryAdminConfig(Id recordId) {
        String soql = 'SELECT ' + String.join(ADMIN_CONFIG_FIELDS, ', ') +
            ' FROM Admin_Configuration__c WHERE Id = :recordId LIMIT 1';
        return Database.query(soql);
    }
}