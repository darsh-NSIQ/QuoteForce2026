@IsTest(seeAllData=false)
private class customInvoiceCreateControllerTest {
    @IsTest
    static void testCountryAndStatePicklist() {
        Test.startTest();
        List<Map<String,String>> countries = customInvoiceCreateController.getCountryPicklistValues();
        List<Map<String,String>> states = customInvoiceCreateController.getStatePicklistValues('IN');
        Test.stopTest();
    }

    @IsTest
    static void testGetMasterTemplate() {
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Test Layout'
        );
        insert mt;

        Test.startTest();
        List<Master_Template__c> result = customInvoiceCreateController.getmasterTemplate('test');
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
        Opportunity result = customInvoiceCreateController.getAddressFromAccount(opp.Id);
        Test.stopTest();
    }

    @IsTest
    static void testCreateQuoteRecord() {
        Invoice__c quoteData = new Invoice__c(Name = 'test');

        Test.startTest();
        Id quoteId = customInvoiceCreateController.createInvoiceRecord(quoteData);
        Test.stopTest();
    }

    @IsTest
    static void testGetQuoteDetails() {
        Quotes__c qt = new Quotes__c(Name='Detail Quote');
        insert qt;

        Test.startTest();
        Quotes__c result = customInvoiceCreateController.getQuoteDetails(qt.Id);
        Test.stopTest();
    }

    @IsTest
    static void testCreateQuoteWithChildren() {
        Master_Template__c mt = new Master_Template__c(Layout_Name__c = 'Template Test');
        insert mt;

        Price_Book__c pb = new Price_Book__c(
            Name = 'Invoice Test Book',
            Currency__c = 'USD',
            Is_Active__c = true,
            Is_Default__c = true
        );
        insert pb;

        Quotes__c qt = new Quotes__c(
            Name = 'Template Test',
            Layout_Name__c = 'Template Test',
            Currency__c = 'USD',
            Price_Book__c = pb.Id
        );
        insert qt;

        Product__c prod = new Product__c(
            Name = 'Test Product',
            Product_Code__c = 'INV-SKU'
        );
        insert prod;

        Price_Book_Entry__c pbe = new Price_Book_Entry__c(
            Price_Book__c = pb.Id,
            Product__c = prod.Id,
            Product_Code__c = 'INV-SKU',
            Currency__c = 'USD',
            Unit_Price__c = 100,
            Is_Active__c = true
        );
        insert pbe;

        Product_Section__c sec = new Product_Section__c(
            Name = 'Section 1',
            Quotes__c = qt.Id
        );
        insert sec;

        QuoteLineItem__c qli = new QuoteLineItem__c(
            Quotes__c = qt.Id,
            Product__c = prod.Id,
            ProductCode__c = 'INV-SKU',
            Price_Book_Entry__c = pbe.Id,
            Quantity__c = 2,
            Price__c = 100,
            Currency__c = 'USD',
            Product_Section__c = sec.Id
        );
        insert qli;

        Custom_Page__c page = new Custom_Page__c(
            Name = 'Page1',
            Quotes__c = qt.Id
        );
        insert page;

        Invoice__c invoiceData = new Invoice__c(Name = 'test');
        insert invoiceData;

        Test.startTest();
        Id newQuoteId = customInvoiceCreateController.createQuoteWithChildren(qt.Id, invoiceData.Id);
        Test.stopTest();
    }
}
