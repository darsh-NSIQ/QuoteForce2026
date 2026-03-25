@isTest
public class PageSectionControllerTest {

    @testSetup
    static void setupTestData() {
        // Insert Admin Configuration
        Admin_Configuration__c adminConfig = new Admin_Configuration__c(
            Name = 'Test Company',
            Phone__c = '1234567890',
            Email__c = 'test@company.com',
            City__c = 'CityX',
            State_Province__c = 'StateX',
            Postal_Code__c = 12345,
            Country__c = 'CountryX'
        );
        insert adminConfig;

        // Insert Quotes
        Quotes__c quote = new Quotes__c(
            Name = 'Test Quote',
            Pages_JSON__c = '[{"Id":1,"Name":"Title","toggle":true},{"Id":2,"Name":"Warranty","toggle":true}]',
            Status__c = 'Draft',
            Tax__c = 10,
            Terms_Conditions__c = 'T&C',
            Warranty__c = 'Warranty'
        );
        insert quote;

        // Insert Product Sections
        Product_Section__c section1 = new Product_Section__c(
            Name = 'Section 1',
            Quotes__c = quote.Id
        );
        insert section1;

        Product_Section__c section2 = new Product_Section__c(
            Name = 'Section 2',
            Quotes__c = quote.Id
        );
        insert section2;

        // Insert Quote Line Items
        QuoteLineItem__c item1 = new QuoteLineItem__c(
            Product_Section__c = section1.Id,
            Product__c = null,
            Quantity__c = 2,
            Price__c = 50
        );

        QuoteLineItem__c item2 = new QuoteLineItem__c(
            Product_Section__c = section2.Id,
            Product__c = null,
            Quantity__c = 3,
            Price__c = 30
        );
        insert new List<QuoteLineItem__c>{item1, item2};
    }

    @isTest
    static void testPageSectionController() {
        // Get inserted quote
        Quotes__c quote = [SELECT Id FROM Quotes__c LIMIT 1];

        // Set the page parameter
        Test.setCurrentPageReference(new PageReference('/apex/dummyPage?id=' + quote.Id));

        // Instantiate controller
        PageSectionController controller = new PageSectionController();

    }
    
    @isTest
    static void testGetSectionTotalCoverage() {
        Quotes__c quote = [SELECT Id FROM Quotes__c LIMIT 1];
        Test.setCurrentPageReference(new PageReference('/apex/dummyPage?id=' + quote.Id));
        
        PageSectionController controller = new PageSectionController();
        
        // Re-query section with QuoteLineItems__r populated
        Product_Section__c sectionWithItems = [
            SELECT Id, Name,
            (SELECT Id, Quantity__c, Price__c FROM QuoteLineItems__r)
            FROM Product_Section__c
            WHERE Quotes__c = :quote.Id
            LIMIT 1
        ];
        
        // Call the method to cover it
        Decimal total = controller.getSectionTotal(sectionWithItems);
        System.assertEquals(100, total); // matches test data: 2*50
    }

}