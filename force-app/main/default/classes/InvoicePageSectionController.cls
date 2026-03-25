public with sharing class InvoicePageSectionController {
    public Invoice__c invoiceRecord { get; set; }
    public Admin_Configuration__c companyinfo { get; set; }
    public Boolean isTitle { get; set; }
    public Boolean isLetterFromOwner { get; set; }
    public Boolean isQuoteDetails { get; set; }
    public Boolean isWarranty { get; set; }
    public Boolean isTermsAndConditions { get; set; }
    public Boolean isCustomPage { get; set; }

    public class SectionWrapper {
        public String Id { get; set; }
        public String Name { get; set; }
        public String label { get; set; }
        public Boolean selected { get; set; }
        public Boolean editMode { get; set; }
        public Boolean toggle { get; set; }
    }

    public InvoicePageSectionController() {
        isTitle = false;
        isLetterFromOwner = false;
        isQuoteDetails = false;
        isWarranty = false;
        isTermsAndConditions = false;
        isCustomPage = false;

        String recordId = ApexPages.currentPage().getParameters().get('id');

        invoiceRecord = [
            SELECT Id, Name, Expiration_Date__c, Status__c, Tax__c,
                Terms_Conditions__c, Warranty__c, Pages_JSON__c,
                Secondary_Image__c, Primary_Image__c,
                Bill_to__Street__s, Bill_to__City__s, Bill_to__StateCode__s,
                Bill_to__PostalCode__s, Bill_to__CountryCode__s,
                Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s,
                Ship_To__PostalCode__s, Ship_To__CountryCode__s,
                First_Name__c, Last_Name__c, Layout_Name__c, Street_Address__c,
                City__c, State_Province__c, Zip_code_Postal_code__c,
                Date__c, Letter_from_the_owner__c
            FROM Invoice__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        List<SectionWrapper> sections = new List<SectionWrapper>();
        if (!String.isBlank(invoiceRecord.Pages_JSON__c)) {
            try {
                sections = (List<SectionWrapper>) JSON.deserialize(invoiceRecord.Pages_JSON__c, List<SectionWrapper>.class);
            } catch (Exception ex) {
                System.debug('Failed to parse invoice Pages_JSON__c: ' + ex.getMessage());
            }
        }

        for (SectionWrapper sec : sections) {
            if (sec.toggle == true) {
                if (sec.Name == 'Title') {
                    isTitle = true;
                } else if (sec.Name == 'Letter from the owner') {
                    isLetterFromOwner = true;
                } else if (sec.Name == 'Quote Details') {
                    isQuoteDetails = true;
                } else if (sec.Name == 'Warranty') {
                    isWarranty = true;
                } else if (sec.Name == 'Terms and Conditions') {
                    isTermsAndConditions = true;
                }
            }
        }

        companyinfo = AdminSettingController.getAdminConfig();
    }
}