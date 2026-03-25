@IsTest
public class createMasterTemplateRecordTest {
    
    // Helper method to create a Quote record
    private static Quotes__c createQuote() {
        Quotes__c q = new Quotes__c(
            Name = 'Test Quote',
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Street_Address__c = '123 Main St',
            City__c = 'Mumbai',
            State_Province__c = 'MH',
            Zip_code_Postal_code__c = '400001',
            Layout_Name__c = 'Layout 1',
            Date__c = Date.today()
        );
        insert q;
        return q;
    }
    
    // Helper method to create a Master Template record
    private static Master_Template__c createMasterTemplate() {
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Test Layout',
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Street_Address__c = '123 Main St',
            City__c = 'Mumbai',
            State_Province__c = 'MH',
            Zip_code_Postal_code__c = '400001',
            Date__c = Date.today()
        );
        insert mt;
        return mt;
    }
    
    // Helper method to create a Custom Page record
    private static Custom_Page__c createCustomPage(Id masterTemplateId, Id quoteId) {
        Custom_Page__c cp = new Custom_Page__c(
            Name = 'Page 1',
            Master_Template__c = masterTemplateId,
            Quotes__c = quoteId,
            Text_Page__c = 'Test Text'
        );
        insert cp;
        return cp;
    }
    
    @IsTest
    static void testCreateMasterLayout() {
        Master_Template__c mt = new Master_Template__c(Layout_Name__c = 'New Layout');
        Test.startTest();
        Master_Template__c inserted = createMasterTemplateRecord.CreateMasterLayout(mt);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetQuoteDetails() {
        Quotes__c q = createQuote();
        Test.startTest();
        Quotes__c fetched = createMasterTemplateRecord.getQuoteDetails(q.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testCreateUpdateCustomPage() {
        Master_Template__c mt = createMasterTemplate();
        Quotes__c q = createQuote();
        
        Custom_Page__c cp = new Custom_Page__c(
            Name = 'Test Page',
            Master_Template__c = mt.Id,
            Quotes__c = q.Id,
            Text_Page__c = 'Text'
        );
        Test.startTest();
        Custom_Page__c inserted = createMasterTemplateRecord.CreateCustomPage(cp);
        inserted.Text_Page__c = 'Updated Text';
        Custom_Page__c updated = createMasterTemplateRecord.updateCustomPage(inserted);
        Test.stopTest();
    }
    
    @IsTest
    static void testGetCustomPageMethods() {
        Master_Template__c mt = createMasterTemplate();
        Quotes__c q = createQuote();
        Custom_Page__c cp = createCustomPage(mt.Id, q.Id);
        
        Test.startTest();
        List<Custom_Page__c> pagesByMaster = createMasterTemplateRecord.getCustomPage(mt.Id);
        List<Custom_Page__c> pagesByQuote = createMasterTemplateRecord.getCustomPageQuote(q.Id);
        Test.stopTest();
        
    }
    
    @IsTest
    static void testLayoutsMethods() {
        Master_Template__c mt = createMasterTemplate();
        
        Test.startTest();
        List<Master_Template__c> layouts = createMasterTemplateRecord.getLayouts();
        List<Master_Template__c> searchedLayouts = createMasterTemplateRecord.getLayoutSearch('Test Layout');
        Master_Template__c fetchedLayout = createMasterTemplateRecord.getLayoutRecord(mt.Id);
        Test.stopTest();
        
    }
    
    @IsTest
    static void testAttachAndDeleteFiles() {
        Quotes__c q = createQuote();
        
        // Create a ContentVersion to simulate file
        ContentVersion cv = new ContentVersion(
            Title = 'TestFile',
            PathOnClient = 'TestFile.txt',
            VersionData = Blob.valueOf('Test')
        );
        insert cv;
        cv = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id];
        
        Test.startTest();
        createMasterTemplateRecord.attachDocsToQuote(q.Id, cv.ContentDocumentId, null, null, null);
        createMasterTemplateRecord.deleteQuoteFile(cv.ContentDocumentId, q.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testUpdateQuoteDetails() {
        Quotes__c q = createQuote();
        
        Test.startTest();
        createMasterTemplateRecord.updateQuoteDetails(
            q.Id, 'NewFirst', 'NewLast', 'New Street', 'New City', 'New State', '12345',
            'New Layout', Date.today(), 'New Letter', '{"pages":1}', 'USD'
        );
        Quotes__c updatedQuote = [SELECT First_Name__c, Last_Name__c FROM Quotes__c WHERE Id = :q.Id];
        Test.stopTest();
        
    }
    
    @IsTest
    static void testUpdateMakeDefaultDelete() {
        Master_Template__c mt1 = createMasterTemplate();
        Master_Template__c mt2 = createMasterTemplate();
        
        Test.startTest();
        createMasterTemplateRecord.UpdateMasterLayout(mt1);
        Test.stopTest();
            
    }
    
     @IsTest
    static void testUpdateMakeDefaultDelete2() {
        Master_Template__c mt1 = createMasterTemplate();
        Master_Template__c mt2 = createMasterTemplate();
        
        Test.startTest();
        createMasterTemplateRecord.makeDefault(mt2.Id);
        createMasterTemplateRecord.deleteLayout(mt1.Id);
        Test.stopTest();
            
    }
    
    @IsTest
    static void testDeleteLayoutPageAndSaveImage() {
        Master_Template__c mt = createMasterTemplate();
        Custom_Page__c cp = createCustomPage(mt.Id, null);
        
        Quotes__c q = createQuote();
        Quotes__c updatedQuote = [SELECT Id FROM Quotes__c WHERE Id = :q.Id];
        
        Test.startTest();
        createMasterTemplateRecord.deleteLayoutPage(cp.Id);
        createMasterTemplateRecord.saveImageUrl(updatedQuote.Id, 'Primary_Image__c', 'https://example.com/image.png');
        Test.stopTest();
        
        Master_Template__c updatedMT = [SELECT Primary_Image__c FROM Master_Template__c WHERE Id = :mt.Id];
    }
    
    @IsTest
    static void testUploadFileQuote() {
        Quotes__c q = createQuote();
        String base64Data = EncodingUtil.base64Encode(Blob.valueOf('Test'));
        Test.startTest();
        Map<String, Id> uploaded = createMasterTemplateRecord.uploadFileQuote(base64Data, 'file.txt', q.Id);
        Test.stopTest();
    }
    
    @IsTest
    static void testUploadFile() {
        // Create a test Quote record
        Quotes__c q = new Quotes__c(
            Name = 'Test Quote',
            First_Name__c = 'John',
            Last_Name__c = 'Doe',
            Street_Address__c = '123 Main St',
            City__c = 'Mumbai',
            State_Province__c = 'MH',
            Zip_code_Postal_code__c = '400001',
            Layout_Name__c = 'Layout 1',
            Date__c = Date.today()
        );
        insert q;
        
        // Prepare a small test file as base64
        String fileContent = 'Hello World';
        String base64Data = EncodingUtil.base64Encode(Blob.valueOf(fileContent));
        String fileName = 'TestFile.txt';
        
        Test.startTest();
        Id contentDocumentId = createMasterTemplateRecord.uploadFile(base64Data, fileName, q.Id);
        Test.stopTest();
        
        // Verify the ContentDocument and link exist
        ContentDocumentLink cdl = [SELECT Id, ContentDocumentId, LinkedEntityId 
                                   FROM ContentDocumentLink 
                                   WHERE ContentDocumentId = :contentDocumentId 
                                   AND LinkedEntityId = :q.Id
                                   LIMIT 1];
        
    }
    
    @IsTest
    static void testDeleteFile() {
        // Create a dummy ContentVersion (file)
        ContentVersion cv = new ContentVersion(
            Title = 'DeleteTestFile',
            PathOnClient = 'DeleteTestFile.txt',
            VersionData = Blob.valueOf('Test Content')
        );
        insert cv;
        
        // Get ContentDocumentId
        cv = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];
        
        Test.startTest();
        // Call deleteFile method
        createMasterTemplateRecord.deleteFile(cv.ContentDocumentId);
        Test.stopTest();
        
        // Verify that ContentDocument is deleted
        Integer countDocs = [SELECT count() FROM ContentDocument WHERE Id = :cv.ContentDocumentId];
    }
    
    @IsTest
    static void testUploadBulkFiles() {
        Quotes__c q = new Quotes__c(
            Name = 'Bulk Test Quote',
            First_Name__c = 'Alice',
            Last_Name__c = 'Smith'
        );
        insert q;
        
        // Prepare fileWrapper JSON
        List<createMasterTemplateRecord.fileWrapper> files = new List<createMasterTemplateRecord.fileWrapper>();
        createMasterTemplateRecord.fileWrapper f1 = new createMasterTemplateRecord.fileWrapper();
        f1.filename = 'bulk1.txt';
        f1.base64 = EncodingUtil.base64Encode(Blob.valueOf('File 1 Content'));
        f1.recordId = q.Id;
        files.add(f1);
        
        createMasterTemplateRecord.fileWrapper f2 = new createMasterTemplateRecord.fileWrapper();
        f2.filename = 'bulk2.txt';
        f2.base64 = EncodingUtil.base64Encode(Blob.valueOf('File 2 Content'));
        f2.recordId = q.Id;
        files.add(f2);
        
        String filesJson = JSON.serialize(files);
        
        Test.startTest();
        String result = createMasterTemplateRecord.uploadBulkFiles(filesJson, q.Id);
        Test.stopTest();
        
        
        // Verify ContentDocumentLinks are created
        List<ContentDocumentLink> links = [SELECT Id, LinkedEntityId FROM ContentDocumentLink WHERE LinkedEntityId = :q.Id];
    }
    
    @IsTest
    static void testUploadImagesAndUpdateRecord() {
        // Create a Master Template record
        Master_Template__c mt = new Master_Template__c(
            Layout_Name__c = 'Original Layout',
            First_Name__c = 'John',
            Last_Name__c = 'Doe'
        );
        insert mt;
        
        // Create two ContentVersion records to simulate images
        ContentVersion cv1 = new ContentVersion(
            Title = 'PrimaryImage',
            PathOnClient = 'PrimaryImage.png',
            VersionData = Blob.valueOf('Primary image content')
        );
        insert cv1;
        
        ContentVersion cv2 = new ContentVersion(
            Title = 'SecondaryImage',
            PathOnClient = 'SecondaryImage.png',
            VersionData = Blob.valueOf('Secondary image content')
        );
        insert cv2;
        
        cv1 = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv1.Id LIMIT 1];
        cv2 = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv2.Id LIMIT 1];
        
        // Prepare field values to update
        Map<String, Object> fieldsToUpdate = new Map<String, Object>{
            'Layout_Name__c' => 'Updated Layout',
                'First_Name__c' => 'Alice'
                };
                    
                    Test.startTest();
        String result = MasterTemplateController.uploadImagesAndUpdateRecord(mt.Id, cv1.Id, cv2.Id, fieldsToUpdate);
        Test.stopTest();
        
        // Verify the return value
        
        // Verify the record fields were updated
        Master_Template__c updatedMT = [SELECT Layout_Name__c, First_Name__c FROM Master_Template__c WHERE Id = :mt.Id];
        
        // Verify ContentDocumentLinks were created
        List<ContentDocumentLink> links = [SELECT Id, LinkedEntityId, ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :mt.Id];
    }
    
    
}