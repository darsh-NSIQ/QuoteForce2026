@IsTest(seeAllData=false)
private class customQuoteCreateControllerTest {

    @IsTest
    static void testCountryAndStatePicklist() {

        Test.startTest();

        List<Map<String,String>> countries =
            customQuoteCreateController.getCountryPicklistValues();

        List<Map<String,String>> states =
            customQuoteCreateController.getStatePicklistValues('IN');

        Test.stopTest();
    }


    @IsTest
    static void testGetMasterTemplate() {

        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Test Layout'
        );
        insert mt;

        Test.startTest();

        List<Master_Template__c> result =
            customQuoteCreateController.getmasterTemplate();

        Test.stopTest();
    }


    @IsTest
    static void testGetAddressFromAccount() {

        Account acc = new Account(Name='Test Account');
        insert acc;

        Opportunity opp = new Opportunity(
            Name='Test Opp',
            StageName='Prospecting',
            CloseDate=Date.today().addDays(10),
            AccountId=acc.Id
        );
        insert opp;

        Test.startTest();

        Opportunity result =
            customQuoteCreateController.getAddressFromAccount(opp.Id);

        Test.stopTest();
    }


    @IsTest
    static void testCreateQuoteRecord() {

        Map<String,Object> quoteData = new Map<String,Object>();
        quoteData.put('quoteName','Test Quote');
        quoteData.put('expirationDate',String.valueOf(Date.today()));
        quoteData.put('status','Draft');
        quoteData.put('tax','10');

        Test.startTest();

        Id quoteId =
            customQuoteCreateController.createQuoteRecord(quoteData);

        Test.stopTest();
    }


    @isTest
    static void testCreateQuotesRecord() {

        // Create test quote record
        Quotes__c q = new Quotes__c();
        q.Name = 'Test Quote';

        Test.startTest();
        String quoteId = customQuoteCreateController.createQuotesRecord(q);
        Test.stopTest();

        System.debug('Returned Quote Id: ' + quoteId);
    }

    @IsTest
    static void testGetQuoteDetails() {

        Quotes__c qt = new Quotes__c(
            Name='Detail Quote'
        );
        insert qt;

        Test.startTest();

        Quotes__c result =
            customQuoteCreateController.getQuoteDetails(qt.Id);

        Test.stopTest();
    }


   @IsTest
static void testCreateQuoteWithChildren() {

    // Create Master Template
    Master_Template__c mt = new Master_Template__c(
        Layout_Name__c = 'Template Test'
    );
    insert mt;

    // Create Quote FIRST
    Quotes__c qt = new Quotes__c(
        Name = 'Test Quote'
    );
    insert qt;

    // Product
    Product__c prod = new Product__c(
        Name = 'Test Product'
    );
    insert prod;

    // Section linked with template
    Product_Section__c sec = new Product_Section__c(
        Name = 'Section 1',
        Master_Template__c = mt.Id
    );
    insert sec;

    // Line item
    QuoteLineItem__c qli = new QuoteLineItem__c(
        Product__c = prod.Id,
        Quantity__c = 2,
        Price__c = 100,
        Product_Section__c = sec.Id
    );
    insert qli;

    // Custom Page
    Custom_Page__c page = new Custom_Page__c(
        Name = 'Page1',
        Master_Template__c = mt.Id
    );
    insert page;

    Test.startTest();

    Id newQuoteId =
        customQuoteCreateController.createQuoteWithChildren(mt.Id, qt.Id);

    Test.stopTest();
}
}