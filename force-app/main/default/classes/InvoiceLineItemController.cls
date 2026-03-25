public class InvoiceLineItemController {

	@AuraEnabled
    public static Invoice__c getInvoiceDetails(String recordId) {
        Invoice__c invlist = [
            SELECT  Id, Name,  Date__c, Expiration_Date__c, First_Name__c, Last_Name__c, Layout_Name__c, LayoutId__c, Letter_from_the_owner__c, Opportunity__c, Pages_JSON__c, Primary_Image__c, Quotes__c, Quotes_Name__c, Untitled_spreadsheet_Untitled_spreadshe__c, State_Province__c, Status__c, Street_Address__c, Tax__c, Terms_Conditions__c, Warranty__c, Zip_code_Postal_code__c, Ship_To__Street__s, Ship_To__City__s, Ship_To__PostalCode__s, Ship_To__StateCode__s, Ship_To__CountryCode__s, Ship_To__Latitude__s, Ship_To__Longitude__s, Ship_To__GeocodeAccuracy__s, Ship_To__c, Bill_to__Street__s, Bill_to__City__s, Bill_to__PostalCode__s, Bill_to__StateCode__s, Bill_to__CountryCode__s, Bill_to__Latitude__s, Bill_to__Longitude__s, Bill_to__GeocodeAccuracy__s, Bill_to__c, Secondary_Image__c FROM Invoice__c  WHERE Id = :recordId
        ];

        System.debug('invlist'+invlist);
        return invlist;
    }
   
    @AuraEnabled
    public static Master_Template__c CreateMasterLayout(Master_Template__c mstLayoutObj){
        
        try {
            insert mstLayoutObj;  
        } catch (Exception e) {
            system.debug('e- - - -  - - - -:'+e);
        }
        return mstLayoutObj;
    }

    
    @AuraEnabled
    public static Custom_Page__c CreateCustomPage(Custom_Page__c customObj){
        
        try {
            insert customObj;  
        } catch (Exception e) {
            system.debug('e- - - -  - - - -:'+e);
        }
        return customObj;
    }
    
    @AuraEnabled
    public static Custom_Page__c updateCustomPage(Custom_Page__c customObj){
        
        try {
            update customObj;  
        } catch (Exception e) {
            system.debug('e- - - -  - - - -:'+e);
        }
        return customObj;
    }
    
    @AuraEnabled
    public static List<Custom_Page__c> getCustomPage(string recordId) {
        return [SELECT Id, Name, label__c, selected__c, editMode__c, Text_Page__c,
                toggle__c, Master_Template__c,Type__c,
                (SELECT ContentDocumentId, ContentDocument.LatestPublishedVersionId,ContentDocument.Title
                 FROM ContentDocumentLinks)
                FROM Custom_Page__c 
                where Master_Template__c =: recordId];
    }

    @AuraEnabled
    public static List<Custom_Page__c> getCustomPageQuote(string recordId) {
        return [SELECT Id, Name, label__c, selected__c, editMode__c, Text_Page__c,Quotes__c,
                toggle__c, Master_Template__c,Type__c,
                (SELECT ContentDocumentId, ContentDocument.LatestPublishedVersionId,ContentDocument.Title
                 FROM ContentDocumentLinks)
                FROM Custom_Page__c 
                where Quotes__c =: recordId];
    }

    @AuraEnabled
    public static List<Custom_Page__c> getCustomPageInvoice(string recordId) {
        return [SELECT Id, Name, label__c, selected__c, editMode__c, Text_Page__c, Quotes__c, Invoice__c,
                toggle__c, Master_Template__c, Type__c,
                (SELECT ContentDocumentId, ContentDocument.LatestPublishedVersionId,ContentDocument.Title
                 FROM ContentDocumentLinks)
                FROM Custom_Page__c
                WHERE Invoice__c = :recordId];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Master_Template__c> getLayouts() {
        return [SELECT Id, Layout_Name__c, Date__c, First_Name__c, Last_Name__c, 
                Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c, Pages_JSON__c,
                Letter_from_the_owner__c, IsDefault__c FROM Master_Template__c  ORDER BY CreatedDate DESC];
    }
    
    @AuraEnabled
    public static List<Master_Template__c> getLayoutSearch(String searchKey) {
        String searchTerm = '%' + String.escapeSingleQuotes(searchKey) + '%';
        return [SELECT Id, Layout_Name__c, Date__c, First_Name__c, Last_Name__c, 
                Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c, Pages_JSON__c,
                Letter_from_the_owner__c, IsDefault__c FROM Master_Template__c WHERE Layout_Name__c LIKE :searchTerm ORDER BY CreatedDate DESC];
    }
    
    
    @AuraEnabled
    public static Master_Template__c getLayoutRecord(String mtId) {
        Master_Template__c mt = [
            SELECT Id, Layout_Name__c, Date__c, First_Name__c, Last_Name__c,
            Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
            Letter_from_the_owner__c,
            Primary_Image__c, Secondary_Image__c,Pages_JSON__c,Warranty_Doc__c,Terms_Condition_doc__c,
            (SELECT ContentDocumentId, ContentDocument.LatestPublishedVersionId,ContentDocument.Title, LinkedEntityId
             FROM ContentDocumentLinks)
            FROM Master_Template__c 
            WHERE Id =: mtId
            LIMIT 1
        ];
        return mt;
    }
    @AuraEnabled
    public static void attachDocsToQuote(Id quoteId, Id primaryDocId, Id secondaryDocId, Id warrantyDocId, Id termConDocId) {
        List<ContentDocumentLink> linksToInsert = new List<ContentDocumentLink>();

        if (primaryDocId != null) {
            linksToInsert.add(new ContentDocumentLink(
                ContentDocumentId = primaryDocId,
                LinkedEntityId = quoteId,
                ShareType = 'V', // Viewer access
                Visibility = 'AllUsers'
            ));
        }

        if (secondaryDocId != null) {
            linksToInsert.add(new ContentDocumentLink(
                ContentDocumentId = secondaryDocId,
                LinkedEntityId = quoteId,
                ShareType = 'V',
                Visibility = 'AllUsers'
            ));
        }

         if (warrantyDocId != null) {
            linksToInsert.add(new ContentDocumentLink(
                ContentDocumentId = warrantyDocId,
                LinkedEntityId = quoteId,
                ShareType = 'V',
                Visibility = 'AllUsers'
            ));
        }

         if (termConDocId != null) {
            linksToInsert.add(new ContentDocumentLink(
                ContentDocumentId = termConDocId,
                LinkedEntityId = quoteId,
                ShareType = 'V',
                Visibility = 'AllUsers'
            ));
        }

        if (!linksToInsert.isEmpty()) {
            insert linksToInsert;
        }
    }

    @AuraEnabled
    public static Invoice__c getQuoteDocumentLinks(String quoteId) {
        return [
            SELECT Id,
                (SELECT ContentDocumentId, ContentDocument.LatestPublishedVersionId, ContentDocument.Title
                FROM ContentDocumentLinks)
            FROM Invoice__c
            WHERE Id = :quoteId
            LIMIT 1
        ];
    }



    @AuraEnabled
    public static void updateInvoiceDetails(
        Id quoteId,
        String firstName,
        String lastName,
        String streetAddress,
        String city,
        String stateProvince,
        String zipCode,
        String layoutName,
        Date CreatedDate,
        String letterForm,
        string pagesJSON

    ) {
        if (String.isBlank(quoteId)) return;

        Invoice__c quote = [SELECT Id, First_Name__c, Last_Name__c, Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,Date__c, Layout_Name__c, Letter_from_the_owner__c ,Pages_JSON__c FROM Invoice__c WHERE Id = :quoteId LIMIT 1];

        if (firstName != null) quote.First_Name__c = firstName;
        if (lastName != null) quote.Last_Name__c = lastName;
        if (pagesJSON != null) quote.Pages_JSON__c = pagesJSON;
        if (streetAddress != null) quote.Street_Address__c = streetAddress;
        if (city != null) quote.City__c = city;
        if (stateProvince != null) quote.State_Province__c = stateProvince;
        if (zipCode != null) quote.Zip_code_Postal_code__c = zipCode;
        if (layoutName != null) quote.Layout_Name__c = layoutName;
        if (CreatedDate != null) quote.Date__c = CreatedDate;
        if (letterForm != null) quote.Letter_from_the_owner__c = letterForm;

        update quote;
    }

    @AuraEnabled
    public static Id uploadFile(String base64Data, String fileName, Id parentId) {
        try {
            ContentVersion contentVersion = new ContentVersion();
            contentVersion.VersionData = EncodingUtil.base64Decode(base64Data);
            contentVersion.Title = fileName;
            contentVersion.PathOnClient = '/' + fileName;
            insert contentVersion;
            
            // Get ContentDocumentId
            ContentVersion insertedContentVersion = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id LIMIT 1];
            
            // Now create ContentDocumentLink to link it to Quotes__c record
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = insertedContentVersion.ContentDocumentId;
            cdl.LinkedEntityId = parentId; // Your Quotes__c record Id
            cdl.ShareType = 'V'; // View permission
            insert cdl;
            
            return insertedContentVersion.ContentDocumentId;
        } catch (Exception ex) {
            throw new AuraHandledException('Error uploading file: ' + ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static Map<String, Id> uploadFileQuote(String base64Data, String fileName, Id parentId) {
        try {
            ContentVersion contentVersion = new ContentVersion();
            contentVersion.VersionData = EncodingUtil.base64Decode(base64Data);
            contentVersion.Title = fileName;
            contentVersion.PathOnClient = '/' + fileName;
            insert contentVersion;
            
            ContentVersion insertedCV = [
                SELECT Id, ContentDocumentId, ContentDocument.LatestPublishedVersionId
                FROM ContentVersion
                WHERE Id = :contentVersion.Id
                LIMIT 1
            ];
            
            ContentDocumentLink cdl = new ContentDocumentLink();
            cdl.ContentDocumentId = insertedCV.ContentDocumentId;
            cdl.LinkedEntityId = parentId;
            cdl.ShareType = 'V';
            insert cdl;
            
            return new Map<String, Id>{
                'documentId' => insertedCV.ContentDocumentId, // 069
                    'versionId'  => insertedCV.Id,                // 068 (this version)
                    'latestVersionId' => insertedCV.ContentDocument.LatestPublishedVersionId // always preview safe
                    };
                        } catch (Exception ex) {
                            throw new AuraHandledException('Error uploading file: ' + ex.getMessage());
                        }
    }


    @AuraEnabled
    public static void deleteQuoteFile(String contentDocumentId, String quoteId) {
        List<ContentDocumentLink> links = [
            SELECT Id 
            FROM ContentDocumentLink 
            WHERE ContentDocumentId = :contentDocumentId 
            AND LinkedEntityId = :quoteId
        ];

        if (!links.isEmpty()) {
            delete links;
        }
    }
    
    
    @AuraEnabled
    public static void deleteFile(Id contentDocumentId) {
        try {
            System.debug('ContentDocumentId to delete: ' + contentDocumentId);
            delete [SELECT Id FROM ContentDocument WHERE Id = :contentDocumentId];
        } catch (Exception e) {
            System.debug('Failed to delete ContentDocument: ' + e.getMessage());
            throw new AuraHandledException('Failed to delete the image: ' + e.getMessage());
        }
    }
    
    // Update
    @AuraEnabled
    public static Master_Template__c UpdateMasterLayout(Master_Template__c mstLayoutObj){
        try {
            if (mstLayoutObj.Id != null) {
                update mstLayoutObj;
            }
        } catch (Exception e) {
            System.debug('Exception: ' + e);
        }
        return mstLayoutObj;
    }
    @AuraEnabled
    public static void makeDefault(String layoutId) {
        try {
            // Step 1: Set all layouts to false
            List<Master_Template__c> layouts = [SELECT Id, IsDefault__c FROM Master_Template__c WHERE IsDefault__c = true];
            for (Master_Template__c layout : layouts) {
                layout.IsDefault__c = false;
            }
            update layouts;
            
            // Step 2: Set the selected layout to true
            Master_Template__c defaultLayout = [SELECT Id FROM Master_Template__c WHERE Id = :layoutId LIMIT 1];
            defaultLayout.IsDefault__c = true;
            update defaultLayout;
        } catch (Exception e) {
            throw new AuraHandledException('Failed to set default layout: ' + e.getMessage());
        }
    }

    @AuraEnabled
    public static void deleteLayout(Id layoutId) {
        // Find related ContentDocumentLink records
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :layoutId
        ];

        // Collect ContentDocumentIds
        Set<Id> documentIds = new Set<Id>();
        for (ContentDocumentLink link : links) {
            documentIds.add(link.ContentDocumentId);
        }

        // Delete the links (optional if you delete the document)
        delete links;

        // Optionally delete the documents themselves
        if (!documentIds.isEmpty()) {
            List<ContentDocument> docs = [SELECT Id FROM ContentDocument WHERE Id IN :documentIds];
            delete docs;
        }

        // Finally delete the layout
        Master_Template__c layoutToDelete = [SELECT Id FROM Master_Template__c  WHERE Id = :layoutId LIMIT 1];
        delete layoutToDelete;
    }

    @AuraEnabled
    public static void deleteLayoutPage(Id layoutId) {
        // Find related ContentDocumentLink records
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :layoutId
        ];

        // Collect ContentDocumentIds
        Set<Id> documentIds = new Set<Id>();
        for (ContentDocumentLink link : links) {
            documentIds.add(link.ContentDocumentId);
        }

        // Delete the links (optional if you delete the document)
        delete links;

        // Optionally delete the documents themselves
        if (!documentIds.isEmpty()) {
            List<ContentDocument> docs = [SELECT Id FROM ContentDocument WHERE Id IN :documentIds];
            delete docs;
        }

        // Finally delete the layout
        Custom_Page__c layoutToDelete = [SELECT Id FROM Custom_Page__c  WHERE Id = :layoutId LIMIT 1];
        delete layoutToDelete;
    }
    
    @AuraEnabled
    public static String uploadBulkFiles(String filesJson, String recId){
        System.debug('## in the method'+ filesJson);
        System.debug('## recId'+ recId);
        try{
            if(String.isNotBlank(filesJson)){
                List<String> recordIds = new List<String>();
                List<fileWrapper> files = (List<fileWrapper>) System.json.deserialize(filesJson, List<fileWrapper>.class);
                
                List<ContentVersion> cvListToInsert = new List<ContentVersion>();
                
                for(fileWrapper fl: files){
                    recordIds.add(fl.recordId);
                    ContentVersion cv = new ContentVersion();
                    cv.VersionData = EncodingUtil.base64Decode(fl.base64);
                    cv.Title = fl.filename;
                    cv.PathOnClient = fl.filename;
                    cvListToInsert.add(cv);
                }
                
                if(!cvListToInsert.isEmpty()){
                    INSERT cvListToInsert;
                    
                    List<ContentVersion> cvList =  [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN : cvListToInsert];
                    
                    List<ContentDocumentLink> contDocLinkList = new List<ContentDocumentLink>();
                    integer i = 0;
                    for(ContentVersion cv: cvList){
                        String recordId = recordIds[i];
                        ContentDocumentLink cdl = new ContentDocumentLink();
                        cdl.ContentDocumentId = cv.ContentDocumentId;
                        cdl.LinkedEntityId = (String.isNotBlank(recId))? recId : recordId;
                        cdl.ShareType = 'V';
                        contDocLinkList.add(cdl);
                        i++;
                    }
                    
                    if(!contDocLinkList.isEmpty()){
                        INSERT contDocLinkList;
                        System.debug('## in the second if: '+ contDocLinkList);
                    }
                }
            }else{
                throw new auraHandledException('Didn\'t Find Any File To Upload.');
            }
            return 'done';
        }catch(Exception ex){
            throw new auraHandledException(ex.getMessage());
        }
        
    }
    
    // wrapper class to get all the files in the bulk
    public class fileWrapper{
        public String filename;	
        public String base64;
        public String recordId;	
    }

    @AuraEnabled
    public static void saveImageUrl(Id recordId, String fieldName, String fileUrl) {
        if (String.isNotBlank(recordId) && String.isNotBlank(fieldName)) {
            Invoice__c quoteRecord = new Invoice__c(Id = recordId);
            quoteRecord.put(fieldName, fileUrl); // dynamic field set
            update quoteRecord;
        }
    }

}
