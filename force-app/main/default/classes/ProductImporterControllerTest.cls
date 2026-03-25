@IsTest
private class ProductImporterControllerTest {

    @IsTest
    static void testInsertProductsSuccess() {
        // Prepare JSON payload
        List<Map<String, Object>> products = new List<Map<String, Object>>();

        products.add(new Map<String, Object>{
            'Name' => 'Test Product 1',
            'Product_Code__c' => 'P001',
            'Description__c' => 'Description 1',
            'Default_Price__c' => 100.50,
            'Default_Quantity__c' => 10,
            'Active__c' => true
        });

        products.add(new Map<String, Object>{
            'Name' => 'Test Product 2',
            'Product_Code__c' => 'P002',
            'Description__c' => 'Description 2',
            'Default_Price__c' => '200', // String numeric
            'Default_Quantity__c' => '5', // String numeric
            'Active__c' => 'false' // String boolean
        });

        String jsonPayload = JSON.serialize(products);

        // Call the method
        Test.startTest();
        Map<String, Object> result = ProductImporterController.insertProducts(jsonPayload);
        Test.stopTest();


        // Verify records in database
       
    }

    @IsTest
    static void testInsertProductsEmptyJson() {
        String emptyJson = '';

        Test.startTest();
        Map<String, Object> result = ProductImporterController.insertProducts(emptyJson);
        Test.stopTest();

    }

    @IsTest
    static void testInsertProductsInvalidData() {
        // Invalid numeric values
        List<Map<String, Object>> products = new List<Map<String, Object>>();
        products.add(new Map<String, Object>{
            'Name' => 'Invalid Product',
            'Default_Price__c' => 'abc', // Not numeric
            'Default_Quantity__c' => 'xyz', // Not numeric
            'Active__c' => 'maybe' // Not true/false
        });

        String jsonPayload = JSON.serialize(products);

        Test.startTest();
        Map<String, Object> result = ProductImporterController.insertProducts(jsonPayload);
        Test.stopTest();

    }
       @isTest
    static void testInsertProductsInBundle() {

        // Create bundle
        Product_Bundle__c bundle = new Product_Bundle__c(
            Name = 'Test Bundle',
            Description__c = 'Bundle Desc'
        );
        insert bundle;

        // Valid JSON payload
        String productsJson = '[{' +
            '"Name":"Product A",' +
            '"Product_Code__c":"PA01",' +
            '"Description__c":"Test Product",' +
            '"Default_Price__c":"100",' +
            '"Default_Quantity__c":"2",' +
            '"Active__c":"true"' +
        '}]';

        Test.startTest();

        Map<String,Object> result =
            ProductImporterController.insertProductsInBundle(productsJson, bundle.Id);

        Test.stopTest();
    }


    @isTest
    static void testInsertProductsInBundle_EmptyPayload() {

        Product_Bundle__c bundle = new Product_Bundle__c(
            Name = 'Bundle Empty Test'
        );
        insert bundle;

        Test.startTest();

        Map<String,Object> result =
            ProductImporterController.insertProductsInBundle('', bundle.Id);

        Test.stopTest();
    }


    @isTest
    static void testInsertProductsInBundle_Exception() {

        Product_Bundle__c bundle = new Product_Bundle__c(
            Name = 'Bundle Exception Test'
        );
        insert bundle;

        // Invalid JSON to trigger exception
        String invalidJson = 'INVALID_JSON';

        Test.startTest();

        Map<String,Object> result =
            ProductImporterController.insertProductsInBundle(invalidJson, bundle.Id);

        Test.stopTest();
    }

}