@isTest
public class ProductConfigurationController_Test {

    @testSetup
    static void setupData() {

        // Product
        Product__c p = new Product__c(
            Name = 'Test Product',
            Product_Code__c = 'SKU-TEST',
            Default_Price__c = 100,
            Default_Quantity__c = 2
        );
        insert p;

        // Bundle
        Product_Bundle__c pb = new Product_Bundle__c(
            Name = 'Test Bundle',
            Description__c = 'Bundle Desc'
        );
        insert pb;

        // Bundle Line Item
        Product_Line_Items__c pli = new Product_Line_Items__c(
            Product_Bundle__c = pb.Id,
            Product__c = p.Id,
            Price__c = 50,
            Quantity__c = 2
        );
        insert pli;

        Price_Book__c priceBook = new Price_Book__c(Name = 'Default USD', Currency__c = 'USD', Is_Active__c = true, Is_Default__c = true);
        insert priceBook;

        Price_Book_Entry__c priceBookEntry = new Price_Book_Entry__c(
            Price_Book__c = priceBook.Id,
            Product__c = p.Id,
            Product_Code__c = 'SKU-TEST',
            Currency__c = 'USD',
            Unit_Price__c = 120,
            Is_Active__c = true
        );
        insert priceBookEntry;

        // Quote
        Quotes__c q = new Quotes__c(Name = 'Sample Quote', Currency__c = 'USD', Price_Book__c = priceBook.Id);
        insert q;

        // Master Template
        Master_Template__c mt = new Master_Template__c();
        insert mt;

        // Master Template Product
        QuoteLineItem__c qliTemp = new QuoteLineItem__c(
            Master_Template__c = mt.Id,
            Product__c = p.Id,
            Quantity__c = 5,
            Price__c = 100,
            Type__c = 'Master Template Product'
        );
        insert qliTemp;

        // Quote Section
        Product_Section__c psQuote = new Product_Section__c(
            Name = 'Quote Section',
            Quotes__c = q.Id
        );
        insert psQuote;

        // Template Section
        Product_Section__c psTemplate = new Product_Section__c(
            Name = 'Template Section',
            Master_Template__c = mt.Id
        );
        insert psTemplate;

        // Quote Line Item
        QuoteLineItem__c qli = new QuoteLineItem__c(
            Quotes__c = q.Id,
            Product__c = p.Id,
            Product_Section__c = psQuote.Id,
            Quantity__c = 1,
            Price__c = 10
        );
        insert qli;
        
        QuoteLineItem__c qli2 = new QuoteLineItem__c(
            Quotes__c = q.Id,
            Product__c = p.Id,
            Product_Section__c = psQuote.Id,
            Quantity__c = 1,
            Price__c = 10
        );
        
        ProductConfigurationController.updateProdLineItms(qli);
        ProductConfigurationController.insertProdLineItms(qli2);
    }

    // -------- GET PRODUCT DETAILS --------
    @isTest
    static void testGetProductDetails() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        Test.startTest();
        Product__c result = ProductConfigurationController.getProductDetails(p.Id, null, null);
        Test.stopTest();
    }

    // -------- GET PRODUCT WITH BUNDLE --------
    @isTest
    static void testGetProductWithProductBundle() {
        Test.startTest();
        List<ProductConfigurationController.ProductBundleWrapper> res =
            ProductConfigurationController.getProductWithProductBundle();
        Test.stopTest();
    }

    // -------- CREATE PRODUCT LINE ITEM --------
    @isTest
    static void testCreateProductLineItem() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];

        List<Map<String, Object>> items = new List<Map<String, Object>>();
        items.add(new Map<String, Object>{
            'Product__c' => p.Id,
            'Quantity__c' => 2,
            'Price__c' => 50,
            'Section_Id__c' => '123'
        });

        Test.startTest();
        ProductConfigurationController.createProductLineItem(q.Id, items);
        Test.stopTest();

        
    }

    // -------- FETCH QUOTE LINES --------
    @isTest
    static void testFetchingQuoteLineFromQuotes() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Test.startTest();
        Quotes__c res = ProductConfigurationController.fetchingQuoteLineFromQuotes(q.Id);
        Test.stopTest();
    }

    // -------- COPY TEMPLATE ITEMS --------
    @isTest
    static void testInsertQuoteLineItemsFromTemplate() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Master_Template__c mt = [SELECT Id FROM Master_Template__c LIMIT 1];

        Test.startTest();
        List<QuoteLineItem__c> inserted =
            ProductConfigurationController.insertQuoteLineItemsFromTemplate(mt.Id, q.Id);
        ProductConfigurationController.SectionUpdate(mt.Id);
        Test.stopTest();

    }

    // -------- CREATE QUOTE LINE ITEMS --------
    @isTest
    static void testCreateQuoteLineItems() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];

        List<Map<String, Object>> listData = new List<Map<String, Object>>();
        listData.add(new Map<String, Object>{
            'prodId' => p.Id,
            'Quantity' => 3,
            'Price' => 100,
            'Type' => 'Quote Product',
            'isQuote' => true,
            'sectionId' => 'ABC'
        });

        Test.startTest();
        ProductConfigurationController.createQuoteLineItems(q.Id, listData);
        Test.stopTest();

        
    }

    // -------- UPDATE QUOTE LINE ITEMS --------
    @isTest
    static void testUpdateQuoteLineItems() {
        QuoteLineItem__c qli = [SELECT Id, Quantity__c, Product__c, Price__c FROM QuoteLineItem__c LIMIT 1];
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];

        List<Map<String, Object>> items = new List<Map<String, Object>>();
        items.add(new Map<String, Object>{
            'id' => qli.Id,
            'prodId' => qli.Product__c,
            'Quantity' => 9,
            'Price' => 500,
            'Type' => 'Quote Product',
            'isQuote' => true
        });

        Test.startTest();
        ProductConfigurationController.updateQuoteLineItems(q.Id, items);
        Test.stopTest();

        QuoteLineItem__c updated = [
            SELECT Quantity__c FROM QuoteLineItem__c WHERE Id = :qli.Id
        ];
    }

    // -------- DELETE QUOTE LINE ITEMS --------
    @isTest
    static void testDeleteQuoteLineItems() {
        QuoteLineItem__c qli = [SELECT Id, Quotes__c FROM QuoteLineItem__c LIMIT 1];
        List<Id> ids = new List<Id>{qli.Id};

        Test.startTest();
        ProductConfigurationController.deleteQuoteLineItems(qli.Quotes__c, ids);
        //ProductConfigurationController.saveQuoteLineItems(qli);
        Test.stopTest();

        
    }

    // -------- GET SECTIONS --------
    @isTest
    static void testGetSectionDataQuote() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Test.startTest();
        List<Product_Section__c> res = ProductConfigurationController.getSectionDataQuote(q.Id);
        ProductConfigurationController.getSectionData(q.Id);
        ProductConfigurationController.updateProdSection(res[0]);
        Test.stopTest();
    }

    // -------- CREATE NEW SECTION --------
    @isTest
    static void testCreateNewSection() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];

        Test.startTest();
        Product_Section__c sec = ProductConfigurationController.createNewSectionQuote(q.Id, 'New Sec');
        Master_Template__c mt = new Master_Template__c();
        insert mt;
        
        Product_Section__c psTemplate = new Product_Section__c(
            Name = 'Template Section',
            Master_Template__c = mt.Id
        );
        ProductConfigurationController.createProductSection(psTemplate);
        Test.stopTest();

    }

    // -------- CREATE NEW SECTION PRODUCT --------
    @isTest
    static void testCreateNewSectionProduct() {
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];
        Product_Section__c sec = [SELECT Id FROM Product_Section__c WHERE Quotes__c = :q.Id LIMIT 1];
        Master_Template__c mt = [SELECT Id FROM Master_Template__c LIMIT 1];

        Test.startTest();
        QuoteLineItem__c qli = ProductConfigurationController.createNewSectionProductQuote(q.Id, sec.Id);
        QuoteLineItem__c qli2 = ProductConfigurationController.createNewSectionProduct(mt.Id, sec.Id);
       // ProductConfigurationController.createNewSectionProduct(q.Id, sec.Id);
        ProductConfigurationController.createNewSection(mt.Id, sec.Id);
        Test.stopTest();

    }

    // -------- SAVE SECTIONS --------
    @isTest
    static void testSaveSections() {
        Product_Section__c sec = new Product_Section__c(Name = 'Insert Sec');

        Test.startTest();
        ProductConfigurationController.saveSections(new List<Product_Section__c>{sec});
        Test.stopTest();

        
    }

    // -------- DELETE SECTION --------
    @isTest
    static void testDeleteSection() {
        Product_Section__c sec = new Product_Section__c(Name = 'Delete Test');
        insert sec;

        Test.startTest();
        ProductConfigurationController.deleteSection(sec.Id);
        ProductConfigurationController.SectionDeleteCancel();
        Test.stopTest();

      
        
    }
}


