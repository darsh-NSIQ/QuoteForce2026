@IsTest
private class InvoiceLineItemControllerTest {
    
    @testSetup
    static void createTestData(){
        
        Account acc = new Account(Name='Test Account');
        insert acc;
        
        Opportunity opp = new Opportunity(
            Name='Test Opportunity',
            StageName='Prospecting',
            CloseDate=Date.today(),
            AccountId=acc.Id
        );
        insert opp;
        
        Quotes__c qt = new Quotes__c(
            Name='Test Quote'
        );
        insert qt;
        
        Invoice__c inv = new Invoice__c(
            Name='Test Invoice',
            Opportunity__c = opp.Id
        );
        insert inv;
        
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c='Test Layout'
        );
        insert mt;
        
        Custom_Page__c cp = new Custom_Page__c(
            Name='Test Page',
            Master_Template__c = mt.Id
        );
        insert cp;
    }
    
    
    @IsTest
    static void testInvoiceMethods(){
        
        Invoice__c inv = [SELECT Id FROM Invoice__c LIMIT 1];
        Master_Template__c mt = [SELECT Id FROM Master_Template__c LIMIT 1];
        Custom_Page__c cp = [SELECT Id,Name FROM Custom_Page__c LIMIT 1];
        Quotes__c qt = [SELECT Id FROM Quotes__c LIMIT 1];
        
        Test.startTest();
        
        InvoiceLineItemController.getInvoiceDetails(inv.Id);
        
        InvoiceLineItemController.getLayouts();
        
        InvoiceLineItemController.getLayoutSearch('Test');
        InvoiceLineItemController.CreateMasterLayout(mt);
        
        
        InvoiceLineItemController.getLayoutRecord(mt.Id);
        
        InvoiceLineItemController.getCustomPage(mt.Id);
        
        InvoiceLineItemController.getCustomPageQuote(qt.Id);
        InvoiceLineItemController.CreateCustomPage(cp);
        
        
        cp.Name='Updated Page';
        InvoiceLineItemController.updateCustomPage(cp);
        
        InvoiceLineItemController.updateInvoiceDetails(
            inv.Id,
            'John',
            'Doe',
            'Street',
            'City',
            'State',
            '12345',
            'Test Layout',
            Date.today(),
            'Letter',
            '{}'
        );
        
        Test.stopTest();
    }
    
    
    @IsTest
    static void testAttachDocsToQuote() {
        
        Quotes__c qt = new Quotes__c(Name='Test Quote');
        insert qt;
        
        // File 1
        ContentVersion cv1 = new ContentVersion(
            Title='File1',
            PathOnClient='File1.txt',
            VersionData=Blob.valueOf('Test1')
        );
        insert cv1;
        
        // File 2
        ContentVersion cv2 = new ContentVersion(
            Title='File2',
            PathOnClient='File2.txt',
            VersionData=Blob.valueOf('Test2')
        );
        insert cv2;
        
        // File 3
        ContentVersion cv3 = new ContentVersion(
            Title='File3',
            PathOnClient='File3.txt',
            VersionData=Blob.valueOf('Test3')
        );
        insert cv3;
        
        // File 4
        ContentVersion cv4 = new ContentVersion(
            Title='File4',
            PathOnClient='File4.txt',
            VersionData=Blob.valueOf('Test4')
        );
        insert cv4;
        
        Id doc1 = [SELECT ContentDocumentId FROM ContentVersion WHERE Id=:cv1.Id].ContentDocumentId;
        Id doc2 = [SELECT ContentDocumentId FROM ContentVersion WHERE Id=:cv2.Id].ContentDocumentId;
        Id doc3 = [SELECT ContentDocumentId FROM ContentVersion WHERE Id=:cv3.Id].ContentDocumentId;
        Id doc4 = [SELECT ContentDocumentId FROM ContentVersion WHERE Id=:cv4.Id].ContentDocumentId;
        
        Test.startTest();
        
        InvoiceLineItemController.attachDocsToQuote(
            qt.Id,
            doc1,
            doc2,
            doc3,
            doc4
        );
        
       // InvoiceLineItemController.getQuoteDocumentLinks(qt.Id);
        
        Test.stopTest();
        
        
    }
    
    
    @IsTest
    static void testFileUploadMethods(){
        
        Quotes__c qt = [SELECT Id FROM Quotes__c LIMIT 1];
        
        String base64Data = EncodingUtil.base64Encode(Blob.valueOf('Test File'));
        
        Test.startTest();
        
        InvoiceLineItemController.uploadFile(base64Data,'test.txt',qt.Id);
        
        InvoiceLineItemController.uploadFileQuote(base64Data,'test2.txt',qt.Id);
        
        Test.stopTest();
    }
    
    
    @IsTest
    static void testLayoutUpdateDelete(){
        
        Master_Template__c mt = [SELECT Id FROM Master_Template__c LIMIT 1];
        Custom_Page__c cp = [SELECT Id FROM Custom_Page__c LIMIT 1];
        
        Test.startTest();
        
        InvoiceLineItemController.makeDefault(mt.Id);
        
        InvoiceLineItemController.UpdateMasterLayout(mt);
        InvoiceLineItemController.deleteLayout(mt.Id);
        
        InvoiceLineItemController.deleteLayoutPage(cp.Id);
        
        Test.stopTest();
    }
    
    @IsTest
    static void testUploadBulkFiles() {
        
        
        // Create record
        Quotes__c qt = new Quotes__c(Name='Test Quote');
        insert qt;
        
        // Create base64 file content
        String base64Data = EncodingUtil.base64Encode(Blob.valueOf('Test File Data'));
        
        // Prepare wrapper data
        List<Map<String,String>> files = new List<Map<String,String>>();
        
        Map<String,String> file1 = new Map<String,String>();
        file1.put('filename','file1.txt');
        file1.put('base64',base64Data);
        file1.put('recordId',qt.Id);
        
        Map<String,String> file2 = new Map<String,String>();
        file2.put('filename','file2.txt');
        file2.put('base64',base64Data);
        file2.put('recordId',qt.Id);
        
        files.add(file1);
        files.add(file2);
        
        // Convert to JSON
        String filesJson = JSON.serialize(files);
        
        Test.startTest();
        
        InvoiceLineItemController.uploadBulkFiles(filesJson, qt.Id);
        
        Test.stopTest();
        
        
    }
    @IsTest
    static void testSaveImageUrl(){
        
        
        Quotes__c qt = [SELECT Id FROM Quotes__c LIMIT 1];
        
        Test.startTest();
        
       /* InvoiceLineItemController.saveImageUrl(
            qt.Id,
            'Primary_Image__c',
            'https://testimage.com/img.png'
        );*/
        
        Test.stopTest();
        
        
    }
    
    
    
    
}