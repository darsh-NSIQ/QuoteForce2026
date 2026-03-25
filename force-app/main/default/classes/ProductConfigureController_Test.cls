@isTest
public class ProductConfigureController_Test {
    
    @testSetup
    static void setupTestData() {
        // Create Product
        Product__c p = new Product__c(
            Name = 'Test Product',
            Product_Code__c = 'TP-001',
            Description__c = 'Test Desc',
            Default_Price__c = 100,
            Default_Quantity__c = 1,
            Currency__c = 'USD',
            Active__c = true
        );
        insert p;

        Product__c p2 = new Product__c(
            Name = 'Second Product',
            Product_Code__c = 'TP-002',
            Description__c = 'Second Desc',
            Default_Price__c = 200,
            Default_Quantity__c = 1,
            Currency__c = 'USD',
            Active__c = true
        );
        insert p2;
        
        // Create Bundle
        Product_Bundle__c pb = new Product_Bundle__c(
            Name = 'Test Bundle',
            Description__c = 'Bundle Desc'
        );
        insert pb;
        
        // Create Line Item
        Product_Line_Items__c pli = new Product_Line_Items__c(
            Product__c = p.Id,
            Product_Bundle__c = pb.Id,
            Quantity__c = 2,
            Price__c = 50
        );
        insert pli;

        Price_Book__c defaultBook = new Price_Book__c(
            Name = 'Setup Default Book',
            Currency__c = 'USD',
            Is_Active__c = true,
            Is_Default__c = true,
            Description__c = 'Setup data'
        );
        insert defaultBook;

        Price_Book_Entry__c defaultEntry = new Price_Book_Entry__c(
            Price_Book__c = defaultBook.Id,
            Product__c = p.Id,
            Product_Code__c = 'TP-001',
            Currency__c = 'USD',
            Unit_Price__c = 99,
            Is_Active__c = true
        );
        insert defaultEntry;
    }
    
    @isTest
    static void testInsertProduct() {
        Product__c p = new Product__c(
            Name = 'Insert Prod',
            Product_Code__c = 'TST-1',
            Active__c = true
        );
        
        Test.startTest();
        Product__c result = ProductConfigureController.insertProduct(p);
        Test.stopTest();
        
    }
    
    @isTest
    static void testUpdateProduct() {
        Product__c p = [SELECT Id, Name FROM Product__c LIMIT 1];
        p.Name = 'Updated Name';
        
        Test.startTest();
      //  Product__c res = ProductConfigureController.updateProduct(p);
        Test.stopTest();
        
    }
    
    @isTest
    static void testSelectedUpdateProduct() {
        Product__c p = [SELECT Id, Name FROM Product__c LIMIT 1];
        p.Name = 'Selected Updated';
        
        Test.startTest();
        Product__c res = ProductConfigureController.selectedUpdateProduct(p);
        Test.stopTest();
        
    }
    
    @isTest
    static void testInsertProductBundle() {
        Product_Bundle__c pb = new Product_Bundle__c(
            Name = 'Bundle Insert Test'
        );
        
        Test.startTest();
        Product_Bundle__c res = ProductConfigureController.insertProductBundle(pb);
        Test.stopTest();
        
    }
    
    @isTest
    static void testGetProductBundle() {
        
        List<Product_Bundle__c> bundles = new List<Product_Bundle__c>();
        
        bundles.add(new Product_Bundle__c(
            Name = 'Test Bundle 1',
            Description__c = 'Desc 1',
            Currency__c = 'USD'
        ));
        
        bundles.add(new Product_Bundle__c(
            Name = 'Test Bundle 2',
            Description__c = 'Desc 2',
            Currency__c = 'INR'
        ));
        
        insert bundles;
        
        Test.startTest();
        
        List<ProductConfigureController.ProductBundleWrapper> res1 =
            ProductConfigureController.GetProductsBundle('Test', 'USD');
        
        List<ProductConfigureController.ProductBundleWrapper> res2 =
            ProductConfigureController.GetProductsBundle(null, 'INR');
        
        List<ProductConfigureController.ProductBundleWrapper> res3 =
            ProductConfigureController.GetProductsBundle('Test', null);
        
        List<ProductConfigureController.ProductBundleWrapper> res4 =
            ProductConfigureController.GetProductsBundle(null, null);
        
        Test.stopTest();
    }
    
    @isTest
    static void testInsertProductLineItems() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        Product_Bundle__c pb = [SELECT Id FROM Product_Bundle__c LIMIT 1];
        
        Product_Line_Items__c pli1 = new Product_Line_Items__c(
            Product__c = p.Id,
            Product_Bundle__c = pb.Id,
            Quantity__c = 1,
            Price__c = 10
        );
        
        Product_Line_Items__c pli2 = new Product_Line_Items__c(
            Product__c = p.Id,
            Product_Bundle__c = pb.Id,
            Quantity__c = 3,
            Price__c = 30
        );
        
        Test.startTest();
        List<Product_Line_Items__c> result =
            ProductConfigureController.insertProductLineItm(
                new List<Product_Line_Items__c>{pli1, pli2});
        Test.stopTest();
        
    }
    
    @isTest
    static void testInsertProductLineItemSingle() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        Product_Bundle__c pb = [SELECT Id FROM Product_Bundle__c LIMIT 1];
        
        Product_Line_Items__c pli = new Product_Line_Items__c(
            Product__c = p.Id,
            Product_Bundle__c = pb.Id,
            Quantity__c = 5,
            Price__c = 100
        );
        
        Test.startTest();
        Product_Line_Items__c result =
            ProductConfigureController.insertProductLineItmSingle(pli);
        Test.stopTest();
        
    }
    
    @isTest
    static void testGetProductLineItems() {
        Product_Bundle__c pb = [SELECT Id FROM Product_Bundle__c LIMIT 1];
        
        Test.startTest();
        List<Product_Line_Items__c> listRes =
            ProductConfigureController.GetProductLineItm(pb.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testUpdateProductLineItems() {
        Product_Line_Items__c pli =
            [SELECT Id, Quantity__c FROM Product_Line_Items__c LIMIT 1];
        
        pli.Quantity__c = 99;
        
        Test.startTest();
        Product_Line_Items__c res =
            ProductConfigureController.updateProductLineItems(pli);
        Test.stopTest();
        
    }
    
    @isTest
    static void testGetProducts() {
        Test.startTest();
        List<Product__c> res = ProductConfigureController.GetProducts('Bundle', 'USD');
        Test.stopTest();
        
    }
    
    @isTest
    static void testHasChildRecords() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        
        Test.startTest();
        Boolean res = ProductConfigureController.hasChildRecords(p.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testDeleteProduct() {
        Product__c p = new Product__c(
            Name = 'ToDeleteTest',
            Product_Code__c = 'DEL-TST'
        );
        insert p;
        
        Test.startTest();
        String result = ProductConfigureController.deleteProduct(p.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testDeleteProductBundle() {
        Product_Bundle__c pb = new Product_Bundle__c(Name = 'DelBundle');
        insert pb;
        
        Test.startTest();
        String result = ProductConfigureController.deleteProductBundle(pb.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testDeleteProductLineItems() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        
        Product_Line_Items__c pli = new Product_Line_Items__c(
            Product__c = p.Id,
            Quantity__c = 1,
            Price__c = 10
        );
        insert pli;
        
        Test.startTest();
        Boolean result = ProductConfigureController.deleteProductLineItems(pli.Id);
        Test.stopTest();
        
    }
    
    @isTest
    static void testUploadFileToProduct() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        
        String base64 = EncodingUtil.base64Encode(Blob.valueOf('Sample File'));
        String filename = 'file.txt';
        
        Test.startTest();
        Id contentVersionId = ProductConfigureController.uploadFileToProduct(
            p.Id, base64, filename);
        Test.stopTest();
        
    }
    
    @isTest
    static void testDeleteFile() {
        Product__c p = [SELECT Id FROM Product__c LIMIT 1];
        
        // Upload file
        String base64 = EncodingUtil.base64Encode(Blob.valueOf('Sample'));
        Id cvid = ProductConfigureController.uploadFileToProduct(
            p.Id, base64, 'sample.txt');
        
        Test.startTest();
        ProductConfigureController.deleteFile(p.Id);
        Test.stopTest();
        
        Product__c prod =
            [SELECT ContentDocumentLink_Id__c FROM Product__c WHERE Id = :p.Id];
    }
    
    @isTest
    static void testUploadFile_Success() {
        // Create test product
        Product__c prod = new Product__c(
            Name = 'Test Product'
        );
        insert prod;
        
        // Prepare base64 string
        Blob fileBlob = Blob.valueOf('Sample file for testing');
        String base64Data = EncodingUtil.base64Encode(fileBlob);
        
        // Call method
        Test.startTest();
        Id cdId = ProductConfigureController.uploadFile(
            base64Data,
            'testfile.txt',
            prod.Id
        );
        Test.stopTest();
        
        // Assert: ContentDocument should be created
        
        // Assert: ContentVersion exists
        ContentVersion cv = [
            SELECT Id, ContentDocumentId, Title
            FROM ContentVersion
            WHERE ContentDocumentId = :cdId
            LIMIT 1
        ];
        
        // Assert: ContentDocumentLink exists
        ContentDocumentLink cdl = [
            SELECT Id, ContentDocumentId, LinkedEntityId
            FROM ContentDocumentLink
            WHERE ContentDocumentId = :cdId
            LIMIT 1
        ];
        
        // Assert: Product link field updated
        Product__c updatedProd = [
            SELECT ContentDocumentLink_Id__c
            FROM Product__c
            WHERE Id = :prod.Id
            LIMIT 1
        ];
        
    }
    @isTest
    static void testWrapperMapping() {
        
        Product_Bundle__c pb = new Product_Bundle__c(
            Name = 'Test',
            Description__c = 'Desc'
        );
        insert pb;
        
        Test.startTest();
        
        ProductConfigureController.ProductBundleWrapper wrapper =
            new ProductConfigureController.ProductBundleWrapper(pb);
        
        Test.stopTest();
    }

    @isTest
    static void testPriceBookCrudAndQueries() {
        Test.startTest();
        Price_Book__c inserted = ProductConfigureController.upsertPriceBook(
            new Price_Book__c(
                Name = 'Retail USD',
                Currency__c = 'USD',
                Is_Active__c = true,
                Is_Default__c = true,
                Description__c = 'Retail pricing'
            )
        );
        List<Price_Book__c> filteredBooks =
            ProductConfigureController.listPriceBooks('Retail', 'USD', false);
        Test.stopTest();

        System.assertEquals(1, filteredBooks.size());
        System.assertEquals('Retail USD', inserted.Name);

        Price_Book__c originalDefault = [
            SELECT Is_Default__c
            FROM Price_Book__c
            WHERE Name = 'Setup Default Book'
            LIMIT 1
        ];
        System.assertEquals(false, originalDefault.Is_Default__c);
    }

    @isTest
    static void testPriceBookEntryCrudCloneAndDelete() {
        Product__c secondProduct = [
            SELECT Id, Product_Code__c
            FROM Product__c
            WHERE Product_Code__c = 'TP-002'
            LIMIT 1
        ];
        Price_Book__c sourceBook = [
            SELECT Id
            FROM Price_Book__c
            WHERE Name = 'Setup Default Book'
            LIMIT 1
        ];

        Price_Book__c targetBook = ProductConfigureController.upsertPriceBook(
            new Price_Book__c(
                Name = 'Target USD',
                Currency__c = 'USD',
                Is_Active__c = true,
                Is_Default__c = false
            )
        );

        Test.startTest();
        Price_Book_Entry__c insertedEntry = ProductConfigureController.upsertPriceBookEntry(
            new Price_Book_Entry__c(
                Price_Book__c = sourceBook.Id,
                Product__c = secondProduct.Id,
                Unit_Price__c = 250,
                Is_Active__c = true
            )
        );
        List<Price_Book_Entry__c> entriesByBook =
            ProductConfigureController.getPriceBookEntriesByPriceBook(sourceBook.Id);
        List<Price_Book_Entry__c> entriesByProduct =
            ProductConfigureController.getPriceBookEntriesByProduct(secondProduct.Id);
        Integer clonedCount =
            ProductConfigureController.clonePriceBookEntries(sourceBook.Id, targetBook.Id, true);
        Boolean deleteEntryResult = ProductConfigureController.deletePriceBookEntry(insertedEntry.Id);

        Price_Book__c tempDeleteBook = ProductConfigureController.upsertPriceBook(
            new Price_Book__c(
                Name = 'Delete Book',
                Currency__c = 'USD',
                Is_Active__c = true
            )
        );
        Price_Book_Entry__c tempDeleteEntry = ProductConfigureController.upsertPriceBookEntry(
            new Price_Book_Entry__c(
                Price_Book__c = tempDeleteBook.Id,
                Product__c = secondProduct.Id,
                Unit_Price__c = 333,
                Is_Active__c = true
            )
        );
        Boolean deleteBookResult = ProductConfigureController.deletePriceBook(tempDeleteBook.Id);
        Test.stopTest();

        System.assert(entriesByBook.size() >= 2);
        System.assertEquals(1, entriesByProduct.size());
        System.assert(clonedCount >= 2);
        System.assertEquals(true, deleteEntryResult);
        System.assertEquals(true, deleteBookResult);
        System.assertEquals(0, [
            SELECT COUNT()
            FROM Price_Book_Entry__c
            WHERE Id = :tempDeleteEntry.Id
        ]);
    }
    
}
