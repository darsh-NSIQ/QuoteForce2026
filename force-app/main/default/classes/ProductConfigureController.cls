public class ProductConfigureController {


  @AuraEnabled
public static Product__c insertProduct(Product__c prod_Obj) {

    // 🔥 VALIDATE FIRST
    if (String.isBlank(prod_Obj.Product_Code__c)) {
        throw new AuraHandledException('Product Code is required');
    }

    // 🔥 SAFE DUPLICATE CHECK
    List<Product__c> existingProducts = [
        SELECT Id 
        FROM Product__c 
        WHERE Product_Code__c = :prod_Obj.Product_Code__c
        AND Currency__c = :prod_Obj.Currency__c
        LIMIT 1
    ];

    if (!existingProducts.isEmpty()) {
        throw new AuraHandledException('Product with same code and currency already exists');
    }

    insert prod_Obj;
    return prod_Obj;
}
	
    // @AuraEnabled
    // public static Product__c insertProduct(Product__c prod_Obj) {
    //     try {
    //         insert prod_Obj;
    //         return prod_Obj;
    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }

    @AuraEnabled
    public static Product__c selectedUpdateProduct(Product__c prod_Obj) {
        return updateProduct(prod_Obj);
    }
    
    @AuraEnabled
    public static Product_Bundle__c insertProductBundle(Product_Bundle__c prod_Bundle_Obj) {
        try {
            insert prod_Bundle_Obj;
            return prod_Bundle_Obj;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<Product_Line_Items__c> insertProductLineItm(list<Product_Line_Items__c> prod_itm_Lst) {
        try {
            insert prod_itm_Lst;
            return prod_itm_Lst;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static Product_Line_Items__c insertProductLineItmSingle(Product_Line_Items__c plObj) {
        try {
            insert plObj;
            return plObj;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static List<Product_Line_Items__c> GetProductLineItm(string Id) {
        try {
            List<Product_Line_Items__c> prod_itm_Lst = [SELECT Id, Product_Bundle__c, Quantity__c,Currency__c, Product__c, Price__c FROM Product_Line_Items__c Where Product_Bundle__c =: Id ORDER BY CreatedDate ASC];
            return prod_itm_Lst;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }


   @AuraEnabled
public static Product__c updateProduct(Product__c prod_Obj) {

    if (String.isBlank(prod_Obj.Product_Code__c)) {
        throw new AuraHandledException('Product Code is required');
    }

    List<Product__c> existingProducts = [
        SELECT Id 
        FROM Product__c 
        WHERE Product_Code__c = :prod_Obj.Product_Code__c
        AND Currency__c = :prod_Obj.Currency__c
        AND Id != :prod_Obj.Id
        LIMIT 1
    ];

    if (!existingProducts.isEmpty()) {
        throw new AuraHandledException('Product with same code and currency already exists');
    }

    update prod_Obj;
    return prod_Obj;
}
    
    // @AuraEnabled
    // public static Product__c updateProduct(Product__c prod_Obj) {
    //     try {
    //         update prod_Obj;
    //         return prod_Obj;
    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }


    /*
    * Created on Tue Jan 21 2025
    * Create by: Shubham Sen
    * Description: This function will update product line item
    * Copyright (c) 2025 NSIQ
    */
    @AuraEnabled
    public static Product_Line_Items__c updateProductLineItems(Product_Line_Items__c plitem_Obj) {
        try {
            update plitem_Obj;
            return plitem_Obj;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
   /* @AuraEnabled
    public static List<Product__c> GetProducts(String searchKey) {
        try {
            String searchTerm = '%' + String.escapeSingleQuotes(searchKey) + '%';
            List<Product__c> productList = New List<Product__c>();
            if(searchTerm != ''){
                productList = [Select Id, Name, Product_Code__c,Currency__c, ContentDocumentLink_Id__c, Description__c, Default_Price__c, Default_Quantity__c, Active__c From Product__c WHERE Name LIKE :searchTerm ORDER BY CreatedDate DESC];
            }else{
                productList = [Select Id, Name, Product_Code__c,Currency__c, ContentDocumentLink_Id__c, Description__c, Default_Price__c, Default_Quantity__c, Active__c From Product__c];
            }
            return productList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }*/

    @AuraEnabled
    public static List<Product__c> GetProducts(String searchKey, String currencyFilter) {
        try {

            String searchTerm = '%' + String.escapeSingleQuotes(searchKey) + '%';

            String query = 'SELECT Id, Name, Product_Code__c, Currency__c, ContentDocumentLink_Id__c, Description__c, Default_Price__c, Default_Quantity__c, Active__c FROM Product__c WHERE Name LIKE :searchTerm';

            if(String.isNotBlank(currencyFilter)){
                query += ' AND Currency__c = :currencyFilter';
            }

            query += ' ORDER BY CreatedDate DESC';

            return Database.query(query);

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean hasChildRecords(Id parentId) {
        Integer count = [SELECT COUNT() FROM Product_Line_Items__c WHERE Product__c = :parentId];
        return count > 0;
    }
    
    @AuraEnabled
    public static string deleteProduct(String Id) {
        try {
            Delete [Select Id  From Product__c WHERE Id =: Id];
            
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static string deleteProductBundle(String Id) {
        try {
            List<Product_Line_Items__c> prod_itm_Lst = [SELECT Id, Product_Bundle__c, Quantity__c, Product__c, Price__c FROM Product_Line_Items__c Where Product_Bundle__c =: Id ];
            List<Product_Bundle__c> productBundleList = [SELECT Id FROM Product_Bundle__c Where Id =: Id];
            delete prod_itm_Lst;
            delete productBundleList;
            return 'Success';
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static boolean deleteProductLineItems(String Id) {
        try {
            Delete [Select Id  From Product_Line_Items__c WHERE Id =: Id];
            
            return true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    
    }
    
    public class ProductBundleWrapper {
        @AuraEnabled public Id bundleId { get; set; }
        @AuraEnabled public String name { get; set; }
        @AuraEnabled public String description { get; set; }
        @AuraEnabled public String currencyCode { get; set; }
        @AuraEnabled public boolean selected { get; set; }

        public ProductBundleWrapper(Product_Bundle__c productBundle) {
            this.bundleId = productBundle.Id;
            this.name = productBundle.Name;
            this.description = productBundle.Description__c;
            this.currencyCode = productBundle.Currency__c;
            this.selected = false;
        }
    }


   /* @AuraEnabled
    public static List<ProductBundleWrapper> GetProductsBundle(String searchKey) {
        try {
            String searchTerm = '%' + String.escapeSingleQuotes(searchKey) + '%';
            List<Product_Bundle__c> productBundleList = new List<Product_Bundle__c>();

            if (searchTerm != '') {
                system.debug('Call If - - -'+searchTerm);
                productBundleList = [SELECT Id, Name, Description__c 
                                    FROM Product_Bundle__c 
                                    WHERE Name LIKE :searchTerm 
                                    ORDER BY CreatedDate DESC];
            }else {
                system.debug('Call If - - -');
                productBundleList = [SELECT Id, Name, Description__c 
                                    FROM Product_Bundle__c];
            }

            List<ProductBundleWrapper> wrappedBundles = new List<ProductBundleWrapper>();
            for (Product_Bundle__c bundle : productBundleList) {
                wrappedBundles.add(new ProductBundleWrapper(bundle));
            }

            return wrappedBundles;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }*/

    @AuraEnabled
    public static List<ProductBundleWrapper> GetProductsBundle(String searchKey, String currencyFilter) {
        try {

            String searchTerm = '%' + (searchKey != null ? searchKey : '') + '%';

            List<Product_Bundle__c> productBundleList;

            if(String.isNotBlank(currencyFilter) && String.isNotBlank(searchKey)){

                productBundleList = [
                    SELECT Id, Name, Description__c,Currency__c
                    FROM Product_Bundle__c
                    WHERE Name LIKE :searchTerm
                    AND Currency__c = :currencyFilter
                    ORDER BY CreatedDate DESC
                ];

            }else if(String.isNotBlank(currencyFilter)){

                productBundleList = [
                    SELECT Id, Name, Description__c,Currency__c
                    FROM Product_Bundle__c
                    WHERE Currency__c = :currencyFilter
                    ORDER BY CreatedDate DESC
                ];

            }else if(String.isNotBlank(searchKey)){

                productBundleList = [
                    SELECT Id, Name, Description__c, Currency__c
                    FROM Product_Bundle__c
                    WHERE Name LIKE :searchTerm
                    ORDER BY CreatedDate DESC
                ];

            }else{

                productBundleList = [
                    SELECT Id, Name, Description__c, Currency__c
                    FROM Product_Bundle__c
                    ORDER BY CreatedDate DESC
                ];
            }

            List<ProductBundleWrapper> wrappedBundles = new List<ProductBundleWrapper>();

            for(Product_Bundle__c bundle : productBundleList){
                wrappedBundles.add(new ProductBundleWrapper(bundle));
            }

            return wrappedBundles;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Id uploadFile(String base64, String filename, Id recordId) {
        if (String.isBlank(base64) || String.isBlank(filename) || String.isBlank(recordId)) {
            throw new AuraHandledException('Invalid file upload parameters.');
        }

        // Decode base64
        Blob fileBody;
        try {
            fileBody = EncodingUtil.base64Decode(base64);
        } catch (Exception e) {
            throw new AuraHandledException('File decoding failed.');
        }

        // Create ContentVersion
        ContentVersion cv = new ContentVersion();
        cv.Title = filename;
        cv.PathOnClient = filename;
        cv.VersionData = fileBody;
        insert cv;

        // Get ContentDocumentId
        cv = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1];

        // Link to Product2
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = cv.ContentDocumentId;
        cdl.LinkedEntityId = recordId;
        cdl.ShareType = 'V';
        cdl.Visibility = 'AllUsers';
        insert cdl;

        // Update Product2 custom field
        Product__c prod = [SELECT Id FROM Product__c WHERE Id = :recordId LIMIT 1];
        prod.ContentDocumentLink_Id__c = cv.Id;
        update prod;

        return cv.ContentDocumentId;
    }

    @AuraEnabled
    public static void deleteFile(Id recordId) {
        if (String.isBlank(recordId)) {
            throw new AuraHandledException('Invalid Product Id.');
        }

        // Fetch the ContentDocumentLink(s)
        List<ContentDocumentLink> links = [
            SELECT Id, ContentDocumentId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :recordId
        ];

        if (!links.isEmpty()) {
            // Collect all unique ContentDocument Ids
            Set<Id> contentDocIds = new Set<Id>();
            for (ContentDocumentLink link : links) {
                contentDocIds.add(link.ContentDocumentId);
            }

            // Delete the links first
            delete links;

            // Now delete the ContentDocuments (this auto-deletes ContentVersions)
            List<ContentDocument> docsToDelete = [
                SELECT Id FROM ContentDocument WHERE Id IN :contentDocIds
            ];
            delete docsToDelete;

            // Clear the reference from Product2
            Product__c prod = [SELECT Id, ContentDocumentLink_Id__c FROM Product__c WHERE Id = :recordId LIMIT 1];
            prod.ContentDocumentLink_Id__c = null;
            update prod;
        }
    }


    @AuraEnabled
    public static Id uploadFileToProduct(Id productId, String base64Data, String fileName) {
        if (String.isBlank(productId) || String.isBlank(base64Data) || String.isBlank(fileName)) {
            throw new AuraHandledException('Missing required parameters.');
        }

        // Step 1: Upload ContentVersion
        ContentVersion version = new ContentVersion();
        version.Title = fileName;
        version.PathOnClient = fileName;
        version.VersionData = EncodingUtil.base64Decode(base64Data);
        insert version;

        // Step 2: Query ContentDocument Id
        ContentVersion insertedVersion = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :version.Id LIMIT 1];

        // Step 3: Create ContentDocumentLink to Product
        ContentDocumentLink link = new ContentDocumentLink();
        link.ContentDocumentId = insertedVersion.ContentDocumentId;
        link.LinkedEntityId = productId;
        link.ShareType = 'V';
        link.Visibility = 'AllUsers';
        insert link;

        // Step 4: Update custom field in Product2 (optional)
        Product__c prod = [SELECT Id FROM Product__c WHERE Id = :productId LIMIT 1];
        prod.ContentDocumentLink_Id__c = insertedVersion.Id;
        update prod;

        return prod.ContentDocumentLink_Id__c;
    }

    @AuraEnabled(cacheable=true)
    public static List<Price_Book__c> listPriceBooks(String searchKey, String currencyFilter, Boolean activeOnly) {
        try {
            String searchTerm = '%' + String.escapeSingleQuotes(String.isBlank(searchKey) ? '' : searchKey.trim()) + '%';

            String query =
                'SELECT Id, Name, Currency__c, Description__c, Is_Active__c, Is_Default__c, CreatedDate ' +
                'FROM Price_Book__c WHERE Name LIKE :searchTerm';

            if (String.isNotBlank(currencyFilter)) {
                query += ' AND Currency__c = :currencyFilter';
            }
            if (activeOnly == true) {
                query += ' AND Is_Active__c = true';
            }

            query += ' ORDER BY Is_Default__c DESC, Name ASC';
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Price_Book__c upsertPriceBook(Price_Book__c priceBookRecord) {
        try {
            if (priceBookRecord == null) {
                throw new AuraHandledException('Price Book data is required.');
            }
            if (String.isBlank(priceBookRecord.Name)) {
                throw new AuraHandledException('Price Book name is required.');
            }
            if (priceBookRecord.Is_Default__c == true && priceBookRecord.Is_Active__c != true) {
                throw new AuraHandledException('Default Price Book must be active.');
            }

            upsert priceBookRecord;

            if (priceBookRecord.Is_Default__c == true) {
                clearOtherDefaultPriceBooks(priceBookRecord.Currency__c, priceBookRecord.Id);
            }

            return [
                SELECT Id, Name, Currency__c, Description__c, Is_Active__c, Is_Default__c
                FROM Price_Book__c
                WHERE Id = :priceBookRecord.Id
                LIMIT 1
            ];
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean deletePriceBook(Id priceBookId) {
        try {
            if (priceBookId == null) {
                throw new AuraHandledException('Price Book Id is required.');
            }

            List<Price_Book_Entry__c> entriesToDelete = [
                SELECT Id
                FROM Price_Book_Entry__c
                WHERE Price_Book__c = :priceBookId
            ];

            if (!entriesToDelete.isEmpty()) {
                delete entriesToDelete;
            }

            delete [
                SELECT Id
                FROM Price_Book__c
                WHERE Id = :priceBookId
                LIMIT 1
            ];

            return true;
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Price_Book_Entry__c> listPriceBookEntries(
        String searchKey,
        Id priceBookId,
        Id productId,
        String currencyFilter,
        Boolean activeOnly
    ) {
        try {
            String searchTerm = '%' + String.escapeSingleQuotes(String.isBlank(searchKey) ? '' : searchKey.trim()) + '%';

            String query =
                'SELECT Id, Name, Price_Book__c, Price_Book__r.Name, Product__c, Product__r.Name, Product__r.Product_Code__c, ' +
                'Product_Code__c, Currency__c, Unit_Price__c, Is_Active__c, CreatedDate ' +
                'FROM Price_Book_Entry__c WHERE Id != null';

            if (String.isNotBlank(searchKey)) {
                query += ' AND (Product__r.Name LIKE :searchTerm OR Product_Code__c LIKE :searchTerm OR Price_Book__r.Name LIKE :searchTerm)';
            }
            if (priceBookId != null) {
                query += ' AND Price_Book__c = :priceBookId';
            }
            if (productId != null) {
                query += ' AND Product__c = :productId';
            }
            if (String.isNotBlank(currencyFilter)) {
                query += ' AND Currency__c = :currencyFilter';
            }
            if (activeOnly == true) {
                query += ' AND Is_Active__c = true';
            }

            query += ' ORDER BY Price_Book__r.Name ASC, Product__r.Name ASC, CreatedDate DESC';
            return Database.query(query);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Price_Book_Entry__c> getPriceBookEntriesByProduct(Id productId) {
        return listPriceBookEntries(null, null, productId, null, false);
    }

    @AuraEnabled(cacheable=true)
    public static List<Price_Book_Entry__c> getPriceBookEntriesByPriceBook(Id priceBookId) {
        return listPriceBookEntries(null, priceBookId, null, null, false);
    }

    @AuraEnabled
    public static Price_Book_Entry__c upsertPriceBookEntry(Price_Book_Entry__c entryRecord) {
        try {
            if (entryRecord == null) {
                throw new AuraHandledException('Price Book Entry data is required.');
            }
            if (entryRecord.Price_Book__c == null) {
                throw new AuraHandledException('Price Book is required.');
            }
            if (entryRecord.Product__c == null) {
                throw new AuraHandledException('Product is required.');
            }

            Price_Book__c priceBookRecord = [
                SELECT Id, Currency__c
                FROM Price_Book__c
                WHERE Id = :entryRecord.Price_Book__c
                LIMIT 1
            ];

            Product__c productRecord = [
                SELECT Id, Product_Code__c, Currency__c
                FROM Product__c
                WHERE Id = :entryRecord.Product__c
                LIMIT 1
            ];

            List<Price_Book_Entry__c> duplicateEntries = [
                SELECT Id
                FROM Price_Book_Entry__c
                WHERE Price_Book__c = :entryRecord.Price_Book__c
                AND Product__c = :entryRecord.Product__c
                AND Id != :entryRecord.Id
                LIMIT 1
            ];
            if (!duplicateEntries.isEmpty()) {
                throw new AuraHandledException('This product already has a Price Book Entry in the selected Price Book.');
            }

            entryRecord.Product_Code__c = productRecord.Product_Code__c;
            entryRecord.Currency__c = String.isNotBlank(priceBookRecord.Currency__c)
                ? priceBookRecord.Currency__c
                : (
                    String.isNotBlank(entryRecord.Currency__c)
                    ? entryRecord.Currency__c
                    : productRecord.Currency__c
                );
            if (entryRecord.Unit_Price__c == null) {
                entryRecord.Unit_Price__c = 0;
            }

            upsert entryRecord;

            return [
                SELECT Id, Name, Price_Book__c, Price_Book__r.Name, Product__c, Product__r.Name, Product__r.Product_Code__c,
                    Product_Code__c, Currency__c, Unit_Price__c, Is_Active__c
                FROM Price_Book_Entry__c
                WHERE Id = :entryRecord.Id
                LIMIT 1
            ];
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Boolean deletePriceBookEntry(Id entryId) {
        try {
            if (entryId == null) {
                throw new AuraHandledException('Price Book Entry Id is required.');
            }

            delete [
                SELECT Id
                FROM Price_Book_Entry__c
                WHERE Id = :entryId
                LIMIT 1
            ];

            return true;
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static Integer clonePriceBookEntries(Id sourcePriceBookId, Id targetPriceBookId, Boolean overwriteExisting) {
        try {
            if (sourcePriceBookId == null || targetPriceBookId == null) {
                throw new AuraHandledException('Source and target Price Books are required.');
            }
            if (sourcePriceBookId == targetPriceBookId) {
                throw new AuraHandledException('Source and target Price Books must be different.');
            }

            Price_Book__c targetPriceBook = [
                SELECT Id, Currency__c
                FROM Price_Book__c
                WHERE Id = :targetPriceBookId
                LIMIT 1
            ];

            List<Price_Book_Entry__c> sourceEntries = [
                SELECT Id, Product__c, Product_Code__c, Currency__c, Unit_Price__c, Is_Active__c
                FROM Price_Book_Entry__c
                WHERE Price_Book__c = :sourcePriceBookId
            ];

            Map<Id, Price_Book_Entry__c> targetEntryByProductId = new Map<Id, Price_Book_Entry__c>();
            for (Price_Book_Entry__c existingEntry : [
                SELECT Id, Product__c
                FROM Price_Book_Entry__c
                WHERE Price_Book__c = :targetPriceBookId
            ]) {
                targetEntryByProductId.put(existingEntry.Product__c, existingEntry);
            }

            List<Price_Book_Entry__c> entriesToInsert = new List<Price_Book_Entry__c>();
            List<Price_Book_Entry__c> entriesToUpdate = new List<Price_Book_Entry__c>();

            for (Price_Book_Entry__c sourceEntry : sourceEntries) {
                Price_Book_Entry__c existingTargetEntry = targetEntryByProductId.get(sourceEntry.Product__c);
                if (existingTargetEntry != null && overwriteExisting != true) {
                    continue;
                }

                Price_Book_Entry__c workingEntry = existingTargetEntry != null
                    ? new Price_Book_Entry__c(Id = existingTargetEntry.Id)
                    : new Price_Book_Entry__c();

                workingEntry.Price_Book__c = targetPriceBookId;
                workingEntry.Product__c = sourceEntry.Product__c;
                workingEntry.Product_Code__c = sourceEntry.Product_Code__c;
                workingEntry.Currency__c = String.isNotBlank(targetPriceBook.Currency__c)
                    ? targetPriceBook.Currency__c
                    : sourceEntry.Currency__c;
                workingEntry.Unit_Price__c = sourceEntry.Unit_Price__c;
                workingEntry.Is_Active__c = sourceEntry.Is_Active__c;

                if (existingTargetEntry != null) {
                    entriesToUpdate.add(workingEntry);
                } else {
                    entriesToInsert.add(workingEntry);
                }
            }

            if (!entriesToInsert.isEmpty()) {
                insert entriesToInsert;
            }
            if (!entriesToUpdate.isEmpty()) {
                update entriesToUpdate;
            }

            return entriesToInsert.size() + entriesToUpdate.size();
        } catch (AuraHandledException e) {
            throw e;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static void clearOtherDefaultPriceBooks(String currencyCode, Id currentPriceBookId) {
        List<Price_Book__c> priceBooksToReset;
        if (String.isBlank(currencyCode)) {
            priceBooksToReset = [
                SELECT Id, Is_Default__c
                FROM Price_Book__c
                WHERE Is_Default__c = true
                AND Currency__c = null
                AND Id != :currentPriceBookId
            ];
        } else {
            priceBooksToReset = [
                SELECT Id, Is_Default__c
                FROM Price_Book__c
                WHERE Is_Default__c = true
                AND Currency__c = :currencyCode
                AND Id != :currentPriceBookId
            ];
        }

        for (Price_Book__c priceBookToReset : priceBooksToReset) {
            priceBookToReset.Is_Default__c = false;
        }

        if (!priceBooksToReset.isEmpty()) {
            update priceBooksToReset;
        }
    }
    

    // @AuraEnabled
    // public static Product2 selectedUpdateProduct(Product2 prod_Obj) {
    //     if (prod_Obj == null || String.isBlank(prod_Obj.Id)) {
    //         throw new AuraHandledException('Invalid product data.');
    //     }

    //     update prod_Obj;
    //     return prod_Obj;
    // }

}
