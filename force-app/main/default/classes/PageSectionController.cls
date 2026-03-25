public with sharing class PageSectionController {
    public Quotes__c Quotes { get; set; }
    public Admin_Configuration__c companyinfo { get; set; }
    public List<Map<String,Object>> activePages { get; set; }
    public List<SectionWrap> sectionsData { get; set; }
    public Decimal grandTotal { get; set; }
    public Boolean isTitle  {get;set;}
    public Boolean isLetterFromOwner  {get;set;}
    public Boolean isQuoteDetails  {get;set;}
    public Boolean isWarranty  {get;set;}
    public Boolean isTermsAndConditions  {get;set;}
    public Boolean isCustomPage  {get;set;}
    
    
    public class SectionWrap {
        public Product_Section__c section { get; set; }
        public Decimal sectionTotal { get; set; }
    }
    
    public class SectionWrapper {
        public String Id {get;set;}
        public String Name {get;set;}
        public String label {get;set;}
        public Boolean selected {get;set;}
        public Boolean editMode {get;set;}
        public Boolean toggle {get;set;}
    }
    
    public PageSectionController() {
        isTitle = false;
        isLetterFromOwner = false;
        isQuoteDetails = false;
        isWarranty = false;
        isTermsAndConditions = false;
        isCustomPage = false;
        string recordId = ApexPages.currentPage().getParameters().get('id');
        grandTotal = 0;
        System.debug('Record Id from LWC: ' + recordId);
        
        Quotes__c quotelist = [
            SELECT Name, Expiration_Date__c, Status__c, Tax__c,Terms_Conditions__c,Warranty__c,Pages_JSON__c,Secondary_Image__c,Primary_Image__c,
            Bill_To__Street__s, Bill_To__City__s, Bill_To__StateCode__s, Bill_To__PostalCode__s, Bill_To__CountryCode__s, 
            Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s, Ship_To__PostalCode__s, Ship_To__CountryCode__s,
            First_Name__c, Last_Name__c, Layout_Name__c, Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
            Date__c, Letter_from_the_owner__c FROM Quotes__c WHERE Id = :recordId Limit 1
        ];
        
        Quotes = quotelist;
        
        List<SectionWrapper> sections = new List<SectionWrapper>();
        if (!String.isBlank(Quotes.Pages_JSON__c)) {
            try {
                sections = (List<SectionWrapper>) JSON.deserialize(Quotes.Pages_JSON__c, List<SectionWrapper>.class);
            } catch (Exception ex) {
                System.debug('Failed to parse Pages_JSON__c: ' + ex.getMessage());
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
        List<Product_Section__c> rawSections = [
            SELECT Id, Name, Notes__c, Quotes__c, Master_Template__c,
            (SELECT Id, Product__c, Product__r.Name, Quantity__c, Price__c 
             FROM QuoteLineItems__r ORDER BY CreatedDate ASC)
            FROM Product_Section__c
            WHERE Quotes__c = :recordId
            ORDER BY CreatedDate ASC
        ];
        
        sectionsData = new List<SectionWrap>();
        for (Product_Section__c sec : rawSections) {
            Decimal total = 0;
            if (sec.QuoteLineItems__r != null) {
                for (QuoteLineItem__c qli : sec.QuoteLineItems__r) {
                    total += (qli.Quantity__c != null ? qli.Quantity__c : 0) *
                        (qli.Price__c != null ? qli.Price__c : 0);
                }
            }
            SectionWrap sw = new SectionWrap();
            sw.section = sec;
            sw.sectionTotal = total;
            sectionsData.add(sw);
            grandTotal += total;
        }
    }
    
    public Decimal getSectionTotal(Product_Section__c sec){
        Decimal total = 0;
        if(sec.QuoteLineItems__r != null){
            for(QuoteLineItem__c qli : sec.QuoteLineItems__r){
                total += (qli.Quantity__c != null ? qli.Quantity__c : 0) * 
                    (qli.Price__c != null ? qli.Price__c : 0);
            }
        }
        return total;
    }
}