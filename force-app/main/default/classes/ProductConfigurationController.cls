public class ProductConfigurationController {
    public class InvoiceSectionItemWrapper {
        @AuraEnabled public Id itemId { get; set; }
        @AuraEnabled public Id productId { get; set; }
        @AuraEnabled public String productName { get; set; }
        @AuraEnabled public Decimal quantity { get; set; }
        @AuraEnabled public Decimal price { get; set; }
        @AuraEnabled public String unitOfMeasurement { get; set; }
    }

    public class InvoiceSectionWrapper {
        @AuraEnabled public Id sectionId { get; set; }
        @AuraEnabled public String sectionName { get; set; }
        @AuraEnabled public String notes { get; set; }
        @AuraEnabled public Id invoiceId { get; set; }
        @AuraEnabled public List<InvoiceSectionItemWrapper> lineItems { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static Product__c getProductDetails(Id productId, Id quoteId, Id invoiceId) {
        Product__c productRecord = [
            SELECT Id, Name, Product_Code__c, Default_Price__c, Default_Quantity__c, Currency__c
            FROM Product__c
            WHERE Id = :productId
            LIMIT 1
        ];

        Map<Id, QuoteForcePricingService.PricingResult> pricingByProduct = invoiceId != null
            ? QuoteForcePricingService.resolveInvoiceProductPricing(invoiceId, new Set<Id>{ productId })
            : QuoteForcePricingService.resolveQuoteProductPricing(quoteId, new Set<Id>{ productId });
        QuoteForcePricingService.PricingResult pricing = pricingByProduct.get(productId);
        if (pricing != null) {
            productRecord.Default_Price__c = pricing.unitPrice;
            if (String.isNotBlank(pricing.currencyCode)) {
                productRecord.Currency__c = pricing.currencyCode;
            }
            if (String.isNotBlank(pricing.productCode)) {
                productRecord.Product_Code__c = pricing.productCode;
            }
        }

        return productRecord;
    }

    public class ProductBundleWrapper{
        @AuraEnabled 
        public string Id{get;set;}
        @AuraEnabled 
        public string Name{get;set;}
        @AuraEnabled 
        public string Description{get;set;}
        @AuraEnabled 
        public String CurrencyType;
        @AuraEnabled 
        public List<ProductLineItemWrapper> ProductLineItemWrapperList{get;set;}
    }
    
    public class ProductLineItemWrapper{
        @AuraEnabled 
        public string Id{get;set;}
        @AuraEnabled 
        public string Name{get;set;}
        @AuraEnabled 
        public string UnitOfMeasurement{get;set;}
        @AuraEnabled 
        public string productName{get;set;}
        @AuraEnabled 
        public Decimal unitCost{get;set;}
        @AuraEnabled 
        public Decimal Qty{get;set;}
    }

    public static List<ProductBundleWrapper> getProductWithProductBundle() {
        return getProductWithProductBundle(null);
    }

    @AuraEnabled(cacheable=true)
    public static list<ProductBundleWrapper> getProductWithProductBundle(String currencyCode){
        
        List<ProductBundleWrapper> productWrapperList = new List<ProductBundleWrapper>();
        
        List<Product_Bundle__c> bundlelist;
        if (String.isBlank(currencyCode)) {
            bundlelist = [SELECT Id,Name,Description__c,Currency__c, (SELECT Id, Product__c ,Product__r.Name, Name, Price__c, Quantity__c, Unit_Of_Measurement__c FROM Product_Line_Items__r) From Product_Bundle__c];
        } else {
            bundlelist = [SELECT Id,Name,Description__c,Currency__c, (SELECT Id, Product__c ,Product__r.Name, Name, Price__c, Quantity__c, Unit_Of_Measurement__c FROM Product_Line_Items__r) From Product_Bundle__c WHERE Currency__c = :currencyCode];
        }
        if(!bundlelist.isEmpty()){
            for(Product_Bundle__c pbObj : bundlelist){
                ProductBundleWrapper pbWrapObj = new ProductBundleWrapper();
                pbWrapObj.Id = pbObj.Id;
                pbWrapObj.Name = pbObj.Name;
                pbWrapObj.Description = pbObj.Description__c;
                pbWrapObj.CurrencyType = pbObj.Currency__c;
                List<ProductLineItemWrapper> proItemWrapList = new List<ProductLineItemWrapper>();
                for(Product_Line_Items__c ProdObj : pbObj.Product_Line_Items__r){
                    ProductLineItemWrapper proLineItemObj = new ProductLineItemWrapper();
                    proLineItemObj.Id = ProdObj.Id;
                    proLineItemObj.Name = ProdObj.Product__r.Name;
                    proLineItemObj.unitCost = ProdObj.Price__c;
                    proLineItemObj.UnitOfMeasurement = ProdObj.Unit_Of_Measurement__c;
                    proLineItemObj.productName = ProdObj.Product__c;
                    proLineItemObj.Qty = ProdObj.Quantity__c;
                    proItemWrapList.add(proLineItemObj);
                }
                pbWrapObj.ProductLineItemWrapperList = proItemWrapList;
                productWrapperList.add(pbWrapObj);
            }
        }
        
        return productWrapperList;
    }

    @AuraEnabled(cacheable=true)
    public static List<ProductBundleWrapper> getProductWithProductBundleForQuote(Id quoteId) {
        return getProductWithProductBundleForContext(quoteId, null);
    }

    @AuraEnabled(cacheable=true)
    public static List<ProductBundleWrapper> getProductWithProductBundleForContext(Id quoteId, Id invoiceId) {
        List<Product_Bundle__c> bundleList = [
            SELECT Id, Name, Description__c, Currency__c,
                (SELECT Id, Product__c, Product__r.Name, Name, Price__c, Quantity__c, Unit_Of_Measurement__c
                 FROM Product_Line_Items__r)
            FROM Product_Bundle__c
        ];

        Set<Id> productIds = new Set<Id>();
        for (Product_Bundle__c bundleRecord : bundleList) {
            for (Product_Line_Items__c lineItem : bundleRecord.Product_Line_Items__r) {
                if (lineItem.Product__c != null) {
                    productIds.add(lineItem.Product__c);
                }
            }
        }

        Map<Id, QuoteForcePricingService.PricingResult> pricingByProductId = invoiceId != null
            ? QuoteForcePricingService.resolveInvoiceProductPricing(invoiceId, productIds)
            : QuoteForcePricingService.resolveQuoteProductPricing(quoteId, productIds);
        String pricingCurrency = invoiceId != null
            ? resolveInvoiceSnapshotCurrency(invoiceId)
            : QuoteForcePricingService.resolveQuoteCurrency(quoteId);

        List<ProductBundleWrapper> productWrapperList = new List<ProductBundleWrapper>();
        for (Product_Bundle__c bundleRecord : bundleList) {
            ProductBundleWrapper bundleWrapper = new ProductBundleWrapper();
            bundleWrapper.Id = bundleRecord.Id;
            bundleWrapper.Name = bundleRecord.Name;
            bundleWrapper.Description = bundleRecord.Description__c;
            bundleWrapper.CurrencyType = String.isNotBlank(pricingCurrency)
                ? pricingCurrency
                : bundleRecord.Currency__c;

            List<ProductLineItemWrapper> lineItemWrappers = new List<ProductLineItemWrapper>();
            for (Product_Line_Items__c lineItem : bundleRecord.Product_Line_Items__r) {
                ProductLineItemWrapper lineWrapper = new ProductLineItemWrapper();
                lineWrapper.Id = lineItem.Id;
                lineWrapper.Name = lineItem.Product__r != null ? lineItem.Product__r.Name : null;
                lineWrapper.UnitOfMeasurement = lineItem.Unit_Of_Measurement__c;
                lineWrapper.productName = lineItem.Product__c;
                lineWrapper.Qty = lineItem.Quantity__c;
                lineWrapper.unitCost = lineItem.Price__c;

                QuoteForcePricingService.PricingResult pricing = pricingByProductId.get(lineItem.Product__c);
                if (pricing != null && pricing.unitPrice != null) {
                    lineWrapper.unitCost = pricing.unitPrice;
                }

                lineItemWrappers.add(lineWrapper);
            }
            bundleWrapper.ProductLineItemWrapperList = lineItemWrappers;
            productWrapperList.add(bundleWrapper);
        }

        return productWrapperList;
    }

    @AuraEnabled
    public static void createProductLineItem(Id quoteId, List<Map<String, Object>> lineItems) {
        List<QuoteLineItem__c> qliList = new List<QuoteLineItem__c>();

        for (Map<String, Object> item : lineItems) {
            QuoteLineItem__c qli = new QuoteLineItem__c();
            qli.Quotes__c = quoteId;

            if (item.containsKey('Product__c')) {
                qli.Product__c = (Id)item.get('Product__c');
            }
            if (item.containsKey('Quantity__c')) {
                qli.Quantity__c = (Decimal)item.get('Quantity__c');
            }
            if (item.containsKey('Price__c')) {
                qli.Price__c = (Decimal)item.get('Price__c');
            }
            if (item.containsKey('Section_Id__c')) {
                qli.Section_Id__c = (String)item.get('Section_Id__c');
            }

            qliList.add(qli);
        }

        applyQuoteLineItemSnapshots(quoteId, qliList);
        if (!qliList.isEmpty()) {
            insert qliList;
        }
    }


    @AuraEnabled
    public static Quotes__c fetchingQuoteLineFromQuotes (Id quoteId) {
         return [
            SELECT Id,
                (SELECT Id, Unit_Of_Measurement__c, Quantity__c, Price__c, Product__c,Section_Id__c
                    FROM QuoteLineItems__r)
            FROM Quotes__c
            WHERE Id = :quoteId
            LIMIT 1
        ];
    }

    

    @AuraEnabled
    public static List<QuoteLineItem__c> insertQuoteLineItemsFromTemplate(Id masterTemplateId, Id quoteId) {
        Master_Template__c mt = [
            SELECT Id,
                (SELECT Id, Unit_Of_Measurement__c, Quantity__c, Price__c, Product__c,Section_Id__c
                    FROM QuoteLineItems__r)
            FROM Master_Template__c
            WHERE Id = :masterTemplateId
            LIMIT 1
        ];

        List<QuoteLineItem__c> newQuoteItems = new List<QuoteLineItem__c>();

        for (QuoteLineItem__c item : mt.QuoteLineItems__r) {
            newQuoteItems.add(new QuoteLineItem__c(
                Unit_Of_Measurement__c = item.Unit_Of_Measurement__c,
                Quantity__c = item.Quantity__c,
                Price__c = item.Price__c,
                Product__c = item.Product__c,
                Quotes__c = quoteId,
                Type__c = 'Quote Product'
            ));
        }

        applyQuoteLineItemSnapshots(quoteId, newQuoteItems);
        if (!newQuoteItems.isEmpty()) {
            insert newQuoteItems;
        }

        return newQuoteItems;
    }


   @AuraEnabled
    public static void createQuoteLineItems(Id parentId, List<Map<String, Object>> lineItems) {
        List<QuoteLineItem__c> qliList = new List<QuoteLineItem__c>();
        Boolean hasQuoteItems = false;

        for (Map<String, Object> item : lineItems) {
            Id productId = (Id)item.get('prodId');
            Decimal quantity = (Decimal)item.get('Quantity');
            Decimal unitPrice = (Decimal)item.get('Price');
            String measurementType = (String)item.get('MeasurementType');
            String type = (String)item.get('Type');
            Boolean isQuote = (Boolean)item.get('isQuote');
            String sectionId = (String)item.get('sectionId'); 

            if (productId != null && quantity != null && unitPrice != null) {
                QuoteLineItem__c qli = new QuoteLineItem__c(
                    Product__c = productId,
                    Quantity__c = quantity,
                    Price__c = unitPrice,
                    Unit_Of_Measurement__c = measurementType,
                    Type__c = isQuote ? 'Quote Product' : 'Master Template Product',
                    Section_Id__c = sectionId
                );

                if (isQuote) {
                    qli.Quotes__c = parentId;
                    hasQuoteItems = true;
                } else {
                    qli.Master_Template__c = parentId;
                }

                qliList.add(qli);
            }
        }

        if (hasQuoteItems) {
            applyQuoteLineItemSnapshots(parentId, qliList);
        }
        if (!qliList.isEmpty()) {
            insert qliList;
        }
    }


    @AuraEnabled
    public static void updateQuoteLineItems(Id parentId,List<Map<String, Object>> lineItems) {
        List<QuoteLineItem__c> recordsToUpdate = new List<QuoteLineItem__c>();
        Boolean hasQuoteItems = false;

        for (Map<String, Object> item : lineItems) {
            Id recordId = (Id)item.get('id');
            Id productId = (Id)item.get('prodId');
            Decimal quantity = (Decimal)item.get('Quantity');
            Decimal price = (Decimal)item.get('Price');
            String measurementType = (String)item.get('MeasurementType');
            String type = (String)item.get('Type');
            Boolean isQuote = (Boolean)item.get('isQuote');

            if (recordId != null) {
                QuoteLineItem__c qli = new QuoteLineItem__c(
                    Id = recordId,
                    Product__c = productId,
                    Quantity__c = quantity,
                    Price__c = price,
                    Unit_Of_Measurement__c = measurementType,
                    Type__c = type
                );

                if (isQuote) {
                    qli.Quotes__c = parentId;
                    hasQuoteItems = true;
                } else {
                    qli.Master_Template__c = parentId;
                }
                recordsToUpdate.add(qli);
            }
        }

        if (hasQuoteItems) {
            applyQuoteLineItemSnapshots(parentId, recordsToUpdate);
        }
        if (!recordsToUpdate.isEmpty()) {
            update recordsToUpdate;
        }
    }

    @AuraEnabled
    public static void deleteQuoteLineItems(Id parentId, List<Id> quoteLineItemIds) {
        if (parentId == null || quoteLineItemIds == null || quoteLineItemIds.isEmpty()) {
            return;
        }

        List<QuoteLineItem__c> itemsToDelete = [
            SELECT Id 
            FROM QuoteLineItem__c 
            WHERE Id IN :quoteLineItemIds
            AND (Master_Template__c = :parentId OR Quotes__c = :parentId)
        ];

        if (!itemsToDelete.isEmpty()) {
            delete itemsToDelete;
        }
    }

    @AuraEnabled
    public static void deleteQuoteLineItemsBySection(Id parentId, String sectionId) {
        if (parentId == null || String.isBlank(sectionId)) return;
        List<QuoteLineItem__c> itemsToDelete = [
            SELECT Id 
            FROM QuoteLineItem__c 
            WHERE Section_Id__c = :sectionId 
            AND (Master_Template__c = :parentId OR Quotes__c = :parentId)
        ];

        if (!itemsToDelete.isEmpty()) {
            delete itemsToDelete;
        }
    }


	
    @AuraEnabled
    public static Boolean createProductConfigs(List<Product_Configuration__c> productList){
        try{
            System.debug('## mine: '+ productList);
            INSERT (List<Product_Configuration__c>) productList;
            return true;
        }catch(exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
    }

    @AuraEnabled
    public static Product_Section__c createProductSection(Product_Section__c ProdSecObj){
        try{
            INSERT ProdSecObj;
            return ProdSecObj;
        }catch(exception ex){
            throw new AuraHandledException(ex.getMessage());
        }
    }



    @AuraEnabled
    public static List<Product_Section__c> getSectionData(Id quoteId) {
        List<Product_Section__c> sections = [
            SELECT Id, Name, Notes__c, Quotes__c,Master_Template__c,
                   (SELECT Id, Product__c, Product__r.Name, Quantity__c, Price__c 
                    FROM QuoteLineItems__r 
                    ORDER BY CreatedDate ASC)
            FROM Product_Section__c
            WHERE Master_Template__c =: quoteId
            ORDER BY CreatedDate ASC
        ];
        return sections;
    }

    @AuraEnabled
    public static List<Product_Section__c> getSectionDataQuote(Id quoteId) {

    List<Product_Section__c> sections = [
        SELECT Id, Name, Notes__c, Quotes__c, Master_Template__c,
               (SELECT Id, Product__c, Product__r.Name, Quantity__c, Price__c
                FROM QuoteLineItems__r
                WHERE Quotes__c = :quoteId
                ORDER BY CreatedDate ASC)
        FROM Product_Section__c
        WHERE Quotes__c = :quoteId
        ORDER BY CreatedDate ASC
    ];

    return sections;
}

    @AuraEnabled
    public static List<InvoiceSectionWrapper> getInvoiceSectionData(Id invoiceId) {
        List<Product_Section__c> sections = [
            SELECT Id, Name, Notes__c, Invoice__c
            FROM Product_Section__c
            WHERE Invoice__c = :invoiceId
            ORDER BY CreatedDate ASC
        ];

        Map<String, List<InvoiceSectionItemWrapper>> itemsBySectionId = new Map<String, List<InvoiceSectionItemWrapper>>();
        for (Invoice_line_items__c item : [
            SELECT Id, Product__c, Product__r.Name, Quantity__c, Price__c, Unit_Of_Measurement__c, Section_Id__c
            FROM Invoice_line_items__c
            WHERE Invoice__c = :invoiceId
            ORDER BY CreatedDate ASC
        ]) {
            String sectionId = item.Section_Id__c;
            if (!itemsBySectionId.containsKey(sectionId)) {
                itemsBySectionId.put(sectionId, new List<InvoiceSectionItemWrapper>());
            }

            InvoiceSectionItemWrapper wrappedItem = new InvoiceSectionItemWrapper();
            wrappedItem.itemId = item.Id;
            wrappedItem.productId = item.Product__c;
            wrappedItem.productName = item.Product__r != null ? item.Product__r.Name : null;
            wrappedItem.quantity = item.Quantity__c;
            wrappedItem.price = item.Price__c;
            wrappedItem.unitOfMeasurement = item.Unit_Of_Measurement__c;
            itemsBySectionId.get(sectionId).add(wrappedItem);
        }

        List<InvoiceSectionWrapper> wrappedSections = new List<InvoiceSectionWrapper>();
        for (Product_Section__c section : sections) {
            InvoiceSectionWrapper wrappedSection = new InvoiceSectionWrapper();
            wrappedSection.sectionId = section.Id;
            wrappedSection.sectionName = section.Name;
            wrappedSection.notes = section.Notes__c;
            wrappedSection.invoiceId = section.Invoice__c;
            wrappedSection.lineItems = itemsBySectionId.containsKey(String.valueOf(section.Id))
                ? itemsBySectionId.get(String.valueOf(section.Id))
                : new List<InvoiceSectionItemWrapper>();
            wrappedSections.add(wrappedSection);
        }

        return wrappedSections;
    }

    @AuraEnabled
    public static void saveSections(List<Product_Section__c> sectionsToSave) {
        List<Product_Section__c> toInsert = new List<Product_Section__c>();
        List<Product_Section__c> toUpdate = new List<Product_Section__c>();

        for (Product_Section__c sec : sectionsToSave) {
            if (String.isBlank(sec.Id)) {
                toInsert.add(sec);
            } else {
                toUpdate.add(sec);
            }
        }

        if (!toInsert.isEmpty()) insert toInsert;
        if (!toUpdate.isEmpty()) update toUpdate;
    }

    @AuraEnabled
    public static void saveQuoteLineItems(List<QuoteLineItem__c> itemsToSave) {
        List<QuoteLineItem__c> toInsert = new List<QuoteLineItem__c>();
        List<QuoteLineItem__c> toUpdate = new List<QuoteLineItem__c>();

        for (QuoteLineItem__c item : itemsToSave) {
            if (String.isBlank(item.Id)) {
                toInsert.add(item);
            } else {
                toUpdate.add(item);
            }
        }

        if (!toInsert.isEmpty()) insert toInsert;
        if (!toUpdate.isEmpty()) update toUpdate;
    }

    @AuraEnabled
    public static void deleteQuoteLineItem(Id itemId) {
        QuoteLineItem__c item = [SELECT Id FROM QuoteLineItem__c WHERE Id = :itemId LIMIT 1];
        delete item;
    }

    @AuraEnabled
    public static void deleteSection(Id sectionId) {
        // First delete child QuoteLineItem__c records
        List<QuoteLineItem__c> children = [SELECT Id FROM QuoteLineItem__c WHERE Product_Section__c = :sectionId];
        if (!children.isEmpty()) {
            delete children;
        }

        // Now delete the section itself
        delete [SELECT Id FROM Product_Section__c WHERE Id = :sectionId LIMIT 1];
    }

    @AuraEnabled
    public static Product_Section__c createNewSection(Id quoteId, String sectionName) {
        Product_Section__c newSection = new Product_Section__c(
            Name = sectionName,
            Master_Template__c = quoteId,
            Notes__c = ''
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static Product_Section__c createNewSectionQuote(Id quoteId, String sectionName) {
        Product_Section__c newSection = new Product_Section__c(
            Name = sectionName,
            Quotes__c = quoteId,
            Notes__c = ''
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static Product_Section__c createNewSectionInvoice(Id invoiceId, String sectionName) {
        Product_Section__c newSection = new Product_Section__c(
            Name = sectionName,
            Invoice__c = invoiceId,
            Notes__c = ''
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static QuoteLineItem__c createNewSectionProduct(Id quoteId , Id sectionId) {
        QuoteLineItem__c newSection = new QuoteLineItem__c(
            Master_Template__c = quoteId,
            Type__c = 'Master Template Product',
            Product_Section__c = sectionId
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static QuoteLineItem__c createNewSectionProductQuote(Id quoteId , Id sectionId) {
        QuoteLineItem__c newSection = new QuoteLineItem__c(
            Quotes__c = quoteId,
            Type__c = 'Quote Product',
            Product_Section__c = sectionId
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static Invoice_line_items__c createNewSectionProductInvoice(Id invoiceId , Id sectionId) {
        Invoice_line_items__c newSection = new Invoice_line_items__c(
            Invoice__c = invoiceId,
            Type__c = 'Invoice Product',
            Section_Id__c = String.valueOf(sectionId)
        );
        insert newSection;
        return newSection;
    }

    @AuraEnabled
    public static Product_Section__c updateProdSection(Product_Section__c prod_sec_obj) {
        update prod_sec_obj;
        return prod_sec_obj;
    }

    @AuraEnabled
    public static QuoteLineItem__c updateProdLineItms(QuoteLineItem__c prod_lin_itms_obj) {
        applyQuoteLineItemSnapshots(prod_lin_itms_obj.Quotes__c, new List<QuoteLineItem__c>{ prod_lin_itms_obj });
        update prod_lin_itms_obj;
        return prod_lin_itms_obj;
    }

    @AuraEnabled
    public static Invoice_line_items__c updateInvoiceLineItms(Invoice_line_items__c invoiceLineItemObj) {
        applyInvoiceLineItemSnapshots(invoiceLineItemObj.Invoice__c, new List<Invoice_line_items__c>{ invoiceLineItemObj });
        update invoiceLineItemObj;
        return invoiceLineItemObj;
    }

    @AuraEnabled
    public static QuoteLineItem__c insertProdLineItms(QuoteLineItem__c prod_lin_itms_obj) {
        applyQuoteLineItemSnapshots(prod_lin_itms_obj.Quotes__c, new List<QuoteLineItem__c>{ prod_lin_itms_obj });
        insert prod_lin_itms_obj;
        return prod_lin_itms_obj;
    }

    @AuraEnabled
    public static Invoice_line_items__c insertInvoiceLineItms(Invoice_line_items__c invoiceLineItemObj) {
        applyInvoiceLineItemSnapshots(invoiceLineItemObj.Invoice__c, new List<Invoice_line_items__c>{ invoiceLineItemObj });
        insert invoiceLineItemObj;
        return invoiceLineItemObj;
    }
    @AuraEnabled
    public static List<Product_Section__c> SectionUpdate(Id quoteId) {
        List<Product_Section__c> sections = [
            SELECT Id,Master_Template__c
            FROM Product_Section__c
            WHERE Master_Template__c = null
            ORDER BY CreatedDate ASC
        ];

        list<Product_Section__c> psList= new list<Product_Section__c>();

        for(Product_Section__c ps:sections){
            Product_Section__c psObj = New Product_Section__c();
            psObj.Id =ps.Id;
            psObj.Master_Template__c = quoteId;
            psList.add(psObj);

        }
        update psList;
        return sections;
    }

    @AuraEnabled
    public static string SectionDeleteCancel() {
        List<QuoteLineItem__c> children = [SELECT Id FROM QuoteLineItem__c WHERE Product_Section__c = ''];
        if (!children.isEmpty()) {
            delete children;
        }

        // Now delete the section itself
        delete [SELECT Id FROM Product_Section__c WHERE Master_Template__c = '' LIMIT 1];
        return 'Success';
    }

    @AuraEnabled
    public static void deleteInvoiceLineItem(Id itemId) {
        Invoice_line_items__c item = [SELECT Id FROM Invoice_line_items__c WHERE Id = :itemId LIMIT 1];
        delete item;
    }

    @AuraEnabled
    public static void deleteInvoiceSection(Id sectionId) {
        List<Invoice_line_items__c> children = [
            SELECT Id
            FROM Invoice_line_items__c
            WHERE Section_Id__c = :String.valueOf(sectionId)
        ];
        if (!children.isEmpty()) {
            delete children;
        }

        delete [SELECT Id FROM Product_Section__c WHERE Id = :sectionId LIMIT 1];
    }
    private static void applyQuoteLineItemSnapshots(Id quoteId, List<QuoteLineItem__c> lineItems) {
        if (lineItems == null || lineItems.isEmpty()) {
            return;
        }

        Set<Id> productIds = new Set<Id>();
        for (QuoteLineItem__c lineItem : lineItems) {
            if (lineItem.Product__c != null) {
                productIds.add(lineItem.Product__c);
            }
        }

        Map<Id, Product__c> productById = productIds.isEmpty()
            ? new Map<Id, Product__c>()
            : new Map<Id, Product__c>([
                SELECT Id, Product_Code__c, Default_Price__c, Currency__c
                FROM Product__c
                WHERE Id IN :productIds
            ]);
        Map<Id, QuoteForcePricingService.PricingResult> pricingByProduct =
            QuoteForcePricingService.resolveQuoteProductPricing(quoteId, productIds);

        for (QuoteLineItem__c lineItem : lineItems) {
            QuoteForcePricingService.PricingResult pricing = pricingByProduct.get(lineItem.Product__c);
            Product__c productRecord = productById.get(lineItem.Product__c);
            applyQuoteSnapshot(lineItem, pricing, productRecord);
        }
    }

    private static void applyInvoiceLineItemSnapshots(Id invoiceId, List<Invoice_line_items__c> lineItems) {
        if (lineItems == null || lineItems.isEmpty()) {
            return;
        }

        Set<Id> productIds = new Set<Id>();
        for (Invoice_line_items__c lineItem : lineItems) {
            if (lineItem.Product__c != null) {
                productIds.add(lineItem.Product__c);
            }
        }

        Map<Id, Product__c> productById = productIds.isEmpty()
            ? new Map<Id, Product__c>()
            : new Map<Id, Product__c>([
                SELECT Id, Product_Code__c, Default_Price__c, Currency__c
                FROM Product__c
                WHERE Id IN :productIds
            ]);
        Map<Id, QuoteForcePricingService.PricingResult> pricingByProduct =
            QuoteForcePricingService.resolveInvoiceProductPricing(invoiceId, productIds);

        for (Invoice_line_items__c lineItem : lineItems) {
            QuoteForcePricingService.PricingResult pricing = pricingByProduct.get(lineItem.Product__c);
            Product__c productRecord = productById.get(lineItem.Product__c);
            applyInvoiceSnapshot(lineItem, pricing, productRecord);
        }
    }

    private static void applyQuoteSnapshot(
        QuoteLineItem__c lineItem,
        QuoteForcePricingService.PricingResult pricing,
        Product__c productRecord
    ) {
        if (lineItem.Product__c == null) {
            lineItem.Price_Book_Entry__c = null;
            lineItem.ProductCode__c = null;
            return;
        }

        lineItem.Price_Book_Entry__c = pricing != null ? pricing.priceBookEntryId : null;
        lineItem.ProductCode__c = pricing != null && String.isNotBlank(pricing.productCode)
            ? pricing.productCode
            : (productRecord != null ? productRecord.Product_Code__c : null);
        if (lineItem.Price__c == null && pricing != null) {
            lineItem.Price__c = pricing.unitPrice;
        }
        if (String.isBlank(lineItem.Currency__c)) {
            lineItem.Currency__c = pricing != null ? pricing.currencyCode : null;
        }
    }

    private static void applyInvoiceSnapshot(
        Invoice_line_items__c lineItem,
        QuoteForcePricingService.PricingResult pricing,
        Product__c productRecord
    ) {
        if (lineItem.Product__c == null) {
            lineItem.Price_Book_Entry__c = null;
            lineItem.ProductCode__c = null;
            return;
        }

        lineItem.Price_Book_Entry__c = pricing != null ? pricing.priceBookEntryId : null;
        lineItem.ProductCode__c = pricing != null && String.isNotBlank(pricing.productCode)
            ? pricing.productCode
            : (productRecord != null ? productRecord.Product_Code__c : null);
        if (lineItem.Price__c == null && pricing != null) {
            lineItem.Price__c = pricing.unitPrice;
        }
        if (String.isBlank(lineItem.Currency__c)) {
            lineItem.Currency__c = pricing != null ? pricing.currencyCode : null;
        }
    }

    private static String resolveInvoiceSnapshotCurrency(Id invoiceId) {
        if (invoiceId == null) {
            return null;
        }

        List<Invoice__c> invoices = [
            SELECT Id, Price_Book__r.Currency__c, Quotes__r.Currency__c
            FROM Invoice__c
            WHERE Id = :invoiceId
            LIMIT 1
        ];
        if (invoices.isEmpty()) {
            return null;
        }

        Invoice__c invoiceRecord = invoices[0];
        if (invoiceRecord.Price_Book__r != null && String.isNotBlank(invoiceRecord.Price_Book__r.Currency__c)) {
            return invoiceRecord.Price_Book__r.Currency__c;
        }
        return invoiceRecord.Quotes__r != null ? invoiceRecord.Quotes__r.Currency__c : null;
    }
}