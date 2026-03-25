@IsTest
public class MasterTemplateControllerTest {

    @IsTest
    static void testCreateQuoteWithChildren() {

        // ---- Create Product ----
        Product__c p = new Product__c(
            Name = 'Test Product',
            Default_Price__c = 100,
            Default_Quantity__c = 2
        );
        insert p;

        // ---- Create Master Template ----
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Layout A',
            First_Name__c = 'John',
            Last_Name__c = 'Smith',
            Street_Address__c = '123 Street',
            City__c = 'NYC',
            State_Province__c = 'NY',
            Zip_code_Postal_code__c = '10001',
            Date__c = Date.today(),
            Pages_JSON__c = '{}'
        );
        insert mt;

        // ---- Create OLD Product Section ----
        Product_Section__c sec = new Product_Section__c(
            Name = 'Section 1',
            Master_Template__c = mt.Id,
            Notes__c = 'Testing'
        );
        insert sec;

        // ---- Create OLD Quote Line Item ----
        QuoteLineItem__c qli = new QuoteLineItem__c(
            Product__c = p.Id,
            Quantity__c = 2,
            Price__c = 100,
            Product_Section__c = sec.Id
        );
        insert qli;

        // ---- Create OLD Custom Page ----
        Custom_Page__c page = new Custom_Page__c(
            Name = 'Page 1',
            Master_Template__c = mt.Id,
            label__c = 'Label',
            selected__c = true,
            editMode__c = false,
            Text_Page__c = 'Test text',
            toggle__c = true
        );
        insert page;

        // ---- Create Quote (to update in method) ----
        Quotes__c quote = new Quotes__c(
            Name = 'Test Quote'
        );
        insert quote;


        // ---- CALL METHOD ----
        Test.startTest();
        Id newQuoteId = customQuoteCreateController.createQuoteWithChildren(mt.Id, quote.Id);


        // ---- ASSERTIONS ----
        Quotes__c newQ = [SELECT Id, First_Name__c, Layout_Name__c FROM Quotes__c WHERE Id = :newQuoteId];


        // New sections created?
        List<Product_Section__c> newSecs = [
            SELECT Id FROM Product_Section__c WHERE Quotes__c = :newQuoteId
        ];

        // New line items created?
        List<QuoteLineItem__c> newQLI = [
            SELECT Id FROM QuoteLineItem__c WHERE Product_Section__c = :newSecs[0].Id
        ];

        // New custom pages created?
        List<Custom_Page__c> newPages = [
            SELECT Id FROM Custom_Page__c WHERE Quotes__c = :newQuoteId
        ];
    }
    
    
    @IsTest
    static void testAuraMethods() {

        // ===========================
        // 1️⃣ Create Account + Opportunity (for getAddressFromAccount)
        // ===========================
        Account acc = new Account(
            Name = 'Test Account',
            BillingStreet = '123 Street',
            BillingCity = 'City',
            BillingState = 'ST',
            BillingPostalCode = '12345',
            BillingCountry = 'US',

            ShippingStreet = 'Ship Street',
            ShippingCity = 'Ship City',
            ShippingState = 'SS',
            ShippingPostalCode = '54321',
            ShippingCountry = 'US'
        );
        insert acc;

        Opportunity opp = new Opportunity(
            Name = 'Test Opp',
            StageName = 'Prospecting',
            CloseDate = Date.today(),
            AccountId = acc.Id
        );
        insert opp;

        // ===========================
        // 2️⃣ Create Master Template (for getmasterTemplate)
        // ===========================
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Layout A',
            IsDefault__c = true,
            Pages_JSON__c = '{}'
        );
        insert mt;
        Test.startTest();

        // ===========================
        // 3️⃣ Test getCountryPicklistValues()
        // ===========================
        List<Map<String, String>> countries = customQuoteCreateController.getCountryPicklistValues();

        // ===========================
        // 4️⃣ Test getStatePicklistValues()
        // ===========================
       // Test.startTest();
        //List<Map<String, String>> states = customQuoteCreateController.getStatePicklistValues('US');
       // Test.stopTest();

        // ===========================
        // 5️⃣ Test getmasterTemplate()
        // ===========================
        List<Master_Template__c> mtList = customQuoteCreateController.getmasterTemplate();
     
        Opportunity oppResult = customQuoteCreateController.getAddressFromAccount(opp.Id);

        // ===========================
        // 7️⃣ Test createQuoteRecord()
        // ===========================
        Map<String, Object> quoteData = new Map<String, Object>{
            'quoteName' => 'My Quote',
            'expirationDate' => String.valueOf(Date.today()),
            'status' => 'Draft',
            'tax' => '10.50'
        };

        Id newQuoteId = customQuoteCreateController.createQuoteRecord(quoteData);


        // ===========================
        // 8️⃣ Test getQuoteDetails()
        // ===========================
      //  Quotes__c quoteDetails = customQuoteCreateController.getQuoteDetails(newQuoteId);


        // ===========================
        // 9️⃣ Test createQuotesRecord()
        // ===========================
        Quotes__c q2 = new Quotes__c(
            Name = 'Another Quote',
            Status__c = 'Draft'
        );

        String createdId = customQuoteCreateController.createQuotesRecord(q2);


        Quotes__c q3 = [SELECT Id FROM Quotes__c WHERE Id = :createdId];
        q3.Status__c = 'Approved';

        String updatedId = customQuoteCreateController.updateQuotesRecord(q3);
        Test.stopTest();

        Quotes__c updated = [SELECT Status__c FROM Quotes__c WHERE Id = :updatedId];
    }
    
      @IsTest
    static void testGetStatePicklistValues() {
        // Call the method with a valid country code
        List<Map<String, String>> result = CustomQuoteCreateController.getStatePicklistValues('US');

        System.assertNotEquals(null, result, 'Result should not be null');
        System.assert(result.size() > 0, 'State list should not be empty');

        // Verify that states returned are correct
        Boolean hasCA = false;
        Boolean hasTX = false;

        for (Map<String, String> m : result) {
            if (m.get('value') == 'CA') hasCA = true;
            if (m.get('value') == 'TX') hasTX = true;
        }

        System.assert(hasCA, 'USA should contain CA');
        System.assert(hasTX, 'USA should contain TX');
    }

    @IsTest
    static void testGetStatePicklistValues_Invalid() {
        // Test unknown country
        List<Map<String, String>> result = CustomQuoteCreateController.getStatePicklistValues('XX');
        System.assertEquals(0, result.size(), 'Unknown country should return empty list');
    }
}