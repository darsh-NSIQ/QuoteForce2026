public class customInvoiceCreateController {

	@AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getCountryPicklistValues() {
        List<Map<String, String>> countryList = new List<Map<String, String>>();
        
        // Get country values from the standard country field
        Schema.DescribeFieldResult countryFieldDescribe = Quote__c.Bill_To__CountryCode__s.getDescribe();
        List<Schema.PicklistEntry> countryPicklistValues = countryFieldDescribe.getPicklistValues();

        for (Schema.PicklistEntry countryEntry : countryPicklistValues) {
            Map<String, String> countryMap = new Map<String, String>();
            countryMap.put('label', countryEntry.getLabel());
            countryMap.put('value', countryEntry.getValue());
            countryList.add(countryMap);
        }
        return countryList;
    }

	@AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getStatePicklistValues(String countryCode) {
        List<Map<String, String>> stateList = new List<Map<String, String>>();

        // Hardcoded state values for USA and India as an example
        Map<String, List<String>> countryStateMap = new Map<String, List<String>>{
            'US' => new List<String>{'CA', 'TX'}, // California, Texas
            'IN' => new List<String>{'MH', 'GJ'}, // Maharashtra, Gujarat
            'CA' => new List<String>{'ON', 'BC'}, // Ontario, British Columbia
            'AU' => new List<String>{'NSW', 'VIC'}, // New South Wales, Victoria
            'GB' => new List<String>{'ENG', 'SCT'}, // England, Scotland
            'DE' => new List<String>{'BW', 'BY'}, // Baden-WÃ¼rttemberg, Bavaria
            'FR' => new List<String>{'IDF', 'NAQ'}, // ÃŽle-de-France, Nouvelle-Aquitaine
            'BR' => new List<String>{'SP', 'RJ'}, // SÃ£o Paulo, Rio de Janeiro
            'JP' => new List<String>{'13', '27'}, // Tokyo, Osaka
            'IT' => new List<String>{'LAZ', 'LOM'}, // Lazio, Lombardy
            'CN' => new List<String>{'BJ', 'SH'}, // Beijing, Shanghai
            'MX' => new List<String>{'CDMX', 'JAL'}, // Mexico City, Jalisco
            'ZA' => new List<String>{'GP', 'WC'}, // Gauteng, Western Cape
            'AR' => new List<String>{'C', 'B'}, // Buenos Aires, Cordoba
            'ES' => new List<String>{'MD', 'CT'}, // Madrid, Catalonia
            'RU' => new List<String>{'MOW', 'SPE'}, // Moscow, Saint Petersburg
            'KR' => new List<String>{'11', '26'}, // Seoul, Busan
            'NG' => new List<String>{'LA', 'FC'}, // Lagos, Federal Capital Territory (Abuja)
            'NZ' => new List<String>{'AUK', 'WGN'}, // Auckland, Wellington
            'NL' => new List<String>{'NH', 'ZH'}, // North Holland, South Holland
            'SE' => new List<String>{'ST', 'VG'}, // Stockholm, VÃ¤stra GÃ¶taland
            'CH' => new List<String>{'ZH', 'BE'}, // Zurich, Bern
            'BE' => new List<String>{'VBR', 'WHT'}, // Flemish Brabant, Walloon Brabant
            'NO' => new List<String>{'03', '12'}, // Oslo, Hordaland
            'DK' => new List<String>{'84', '82'}, // Capital Region, Central Jutland
            'FI' => new List<String>{'ES', 'IS'}, // Uusimaa, Lapland
            'PL' => new List<String>{'MZ', 'DS'}, // Masovian, Lower Silesian
            'PT' => new List<String>{'11', '13'}, // Lisbon, Porto
            'AT' => new List<String>{'9', '3'}, // Vienna, Lower Austria
            'IE' => new List<String>{'CW', 'DB'}, // Carlow, Dublin
            'GR' => new List<String>{'I', 'A1'}, // Attica, Central Macedonia
            'TR' => new List<String>{'34', '06'}, // Istanbul, Ankara
            'EG' => new List<String>{'C', 'GZ'}, // Cairo, Giza
            'KE' => new List<String>{'110', '200'}, // Nairobi, Mombasa
            'SA' => new List<String>{'01', '02'}, // Riyadh, Mecca
            'AE' => new List<String>{'AZ', 'DU'}, // Abu Dhabi, Dubai
            'IL' => new List<String>{'TA', 'JM'}, // Tel Aviv, Jerusalem
            'PK' => new List<String>{'PB', 'SD'}, // Punjab, Sindh
            'BD' => new List<String>{'13', '27'}, // Dhaka, Chittagong
            'MY' => new List<String>{'14', '01'}, // Kuala Lumpur, Johor
            'TH' => new List<String>{'10', '63'}, // Bangkok, Chiang Mai
            'VN' => new List<String>{'SG', 'HN'}, // Ho Chi Minh City, Hanoi
            'PH' => new List<String>{'00', '03'}, // National Capital Region (Metro Manila), Central Luzon
            'ID' => new List<String>{'JK', 'BT'}, // Jakarta, Banten
            'SG' => new List<String>{'01'}, // Central Singapore
            'HK' => new List<String>{'HK'}, // Hong Kong Island
            'TW' => new List<String>{'TPQ', 'TXG'}// Taipei, Taichung
        };        

        // Fetch the state list based on the country code provided
        if (countryStateMap.containsKey(countryCode)) {
            List<String> states = countryStateMap.get(countryCode);
            for (String state : states) {
                Map<String, String> stateMap = new Map<String, String>();
                stateMap.put('label', state);
                stateMap.put('value', state);
                stateList.add(stateMap);
            }
        } else {
            // Optionally handle unsupported country code scenario
            System.debug('No states available for country code: ' + countryCode);
        }

        return stateList;
    }

	@AuraEnabled
    public static List<Master_Template__c> getmasterTemplate(String templateName) {
       
            List<Master_Template__c> mt = [Select Id ,
                                           Layout_Name__c,IsDefault__c,
                                           Pages_JSON__c,
                                           Terms_Condition_doc__c,
                                           Warranty_Doc__c
                                           From Master_Template__c 
                                           where Layout_Name__c =: templateName];
        
                                                 return mt;
       
    }
    
    public static Opportunity getAddressFromAccount(Id accId){
        
        Opportunity opp = [SELECT Id, Name FROM Opportunity WHERE Id = :accId LIMIT 1];
        return opp;
        
    }

	@AuraEnabled
    public static String createInvoiceRecord(Invoice__c invoiceWrapMap)
    {
        System.debug('invoiceWrapMap --***- '+ invoiceWrapMap);
        if(invoiceWrapMap != null){
            insert invoiceWrapMap;
        }
        return invoiceWrapMap.Id; 

    }

	@AuraEnabled
    public static String updateInvoiceRecord(Invoice__c invoiceWrapMap) {
        System.debug('quoteWrapMap123 --***- '+ invoiceWrapMap);
        if(invoiceWrapMap != null){
            update invoiceWrapMap;
        }
        return invoiceWrapMap.Id;
    }

	@AuraEnabled
    public static Quotes__c getQuoteDetails(String recordId) {
        Quotes__c quotelist = [
            SELECT Name, Expiration_Date__c, Status__c, Tax__c, Opportunity__c, LayoutId__c, Price_Book__c,
                Bill_To__Street__s, Bill_To__City__s, Bill_To__StateCode__s, Bill_To__PostalCode__s, Bill_To__CountryCode__s, 
                Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s, Ship_To__PostalCode__s, Ship_To__CountryCode__s,
                First_Name__c,Primary_Image__c,Pages_JSON__c ,Secondary_Image__c , Last_Name__c, Layout_Name__c, Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
                Date__c, Letter_from_the_owner__c FROM Quotes__c WHERE Id = :recordId
        ];

        System.debug('quotelist'+quotelist);
        return quotelist;
    }

	@AuraEnabled
    public static Invoice__c getInvoiceDetails(String recordId) {
        Invoice__c invoiceRecord = [
            SELECT Id, Name, Expiration_Date__c, Status__c, Tax__c, Opportunity__c, Quotes__c, LayoutId__c, Price_Book__c,
                Bill_to__Street__s, Bill_to__City__s, Bill_to__StateCode__s, Bill_to__PostalCode__s, Bill_to__CountryCode__s,
                Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s, Ship_To__PostalCode__s, Ship_To__CountryCode__s,
                First_Name__c, Primary_Image__c, Pages_JSON__c, Secondary_Image__c, Last_Name__c, Layout_Name__c, Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
                Date__c, Letter_from_the_owner__c, Quotes_Name__c
            FROM Invoice__c
            WHERE Id = :recordId
            LIMIT 1
        ];

        System.debug('invoiceRecord ' + invoiceRecord);
        return invoiceRecord;
    }

	@AuraEnabled
    public static Id createQuoteWithChildren(Id quoteId, Id invoiceId) {

        Quotes__c q = [
            SELECT Id, Name, LayoutId__c, Layout_Name__c, Date__c, First_Name__c, Last_Name__c, Price_Book__c,
                   Terms_Conditions__c, Warranty__c, Pages_JSON__c,
                   Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
                   Primary_Image__c, Secondary_Image__c, Letter_from_the_owner__c,
                   Bill_To__Street__s, Bill_To__City__s, Bill_To__StateCode__s, Bill_To__PostalCode__s, Bill_To__CountryCode__s,
                   Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s, Ship_To__PostalCode__s, Ship_To__CountryCode__s
            FROM Quotes__c
            WHERE Id = :quoteId
            LIMIT 1
        ];

        Invoice__c inv = new Invoice__c(
            Id = invoiceId,
            Quotes__c = quoteId,
            Quotes_Name__c = q.Name,
            LayoutId__c = q.LayoutId__c,
            Layout_Name__c = q.Layout_Name__c,
            First_Name__c = q.First_Name__c,
            Last_Name__c = q.Last_Name__c,
            Street_Address__c = q.Street_Address__c,
            City__c = q.City__c,
            State_Province__c = q.State_Province__c,
            Zip_code_Postal_code__c = q.Zip_code_Postal_code__c,
            Date__c = q.Date__c,
            Letter_from_the_owner__c = q.Letter_from_the_owner__c,
            Terms_Conditions__c = q.Terms_Conditions__c,
            Warranty__c = q.Warranty__c,
            Primary_Image__c = q.Primary_Image__c,
            Secondary_Image__c = q.Secondary_Image__c,
            Pages_JSON__c = q.Pages_JSON__c,
            Price_Book__c = q.Price_Book__c,
            Bill_to__Street__s = q.Bill_To__Street__s,
            Bill_to__City__s = q.Bill_To__City__s,
            Bill_to__StateCode__s = q.Bill_To__StateCode__s,
            Bill_to__PostalCode__s = q.Bill_To__PostalCode__s,
            Bill_to__CountryCode__s = q.Bill_To__CountryCode__s,
            Ship_To__Street__s = q.Ship_To__Street__s,
            Ship_To__City__s = q.Ship_To__City__s,
            Ship_To__StateCode__s = q.Ship_To__StateCode__s,
            Ship_To__PostalCode__s = q.Ship_To__PostalCode__s,
            Ship_To__CountryCode__s = q.Ship_To__CountryCode__s
        );

        update inv;

        List<Invoice_line_items__c> existingInvoiceLineItems = [
            SELECT Id
            FROM Invoice_line_items__c
            WHERE Invoice__c = :invoiceId
        ];
        if (!existingInvoiceLineItems.isEmpty()) {
            delete existingInvoiceLineItems;
        }

        List<Custom_Page__c> existingInvoicePages = [
            SELECT Id
            FROM Custom_Page__c
            WHERE Invoice__c = :invoiceId
        ];
        if (!existingInvoicePages.isEmpty()) {
            delete existingInvoicePages;
        }

        List<Product_Section__c> existingInvoiceSections = [
            SELECT Id
            FROM Product_Section__c
            WHERE Invoice__c = :invoiceId
        ];
        if (!existingInvoiceSections.isEmpty()) {
            delete existingInvoiceSections;
        }

        List<Product_Section__c> quoteSections = [
            SELECT Id, Name, Notes__c
            FROM Product_Section__c
            WHERE Quotes__c = :quoteId
            ORDER BY CreatedDate ASC
        ];

        Map<Id, Id> invoiceSectionIdByQuoteSectionId = new Map<Id, Id>();
        if (!quoteSections.isEmpty()) {
            List<Product_Section__c> invoiceSectionsToInsert = new List<Product_Section__c>();
            for (Product_Section__c quoteSection : quoteSections) {
                invoiceSectionsToInsert.add(new Product_Section__c(
                    Name = quoteSection.Name,
                    Notes__c = quoteSection.Notes__c,
                    Quotes__c = quoteId,
                    Invoice__c = invoiceId
                ));
            }

            insert invoiceSectionsToInsert;

            for (Integer i = 0; i < quoteSections.size(); i++) {
                invoiceSectionIdByQuoteSectionId.put(
                    quoteSections[i].Id,
                    invoiceSectionsToInsert[i].Id
                );
            }
        }

        List<QuoteLineItem__c> quoteLineItems = [
            SELECT Product_Bundle__c, Product__c, ProductCode__c, Quantity__c, Price__c, Price_Book_Entry__c,
                   Unit_Of_Measurement__c, Type__c, Product_Section__c, Currency__c
            FROM QuoteLineItem__c
            WHERE Quotes__c = :quoteId
        ];

        List<Invoice_line_items__c> invoiceLineItemsToInsert = new List<Invoice_line_items__c>();
        for (QuoteLineItem__c qli : quoteLineItems) {
            invoiceLineItemsToInsert.add(new Invoice_line_items__c(
                Invoice__c = invoiceId,
                Quotes__c = quoteId,
                Product_Bundle__c = qli.Product_Bundle__c,
                Product__c = qli.Product__c,
                ProductCode__c = qli.ProductCode__c,
                Quantity__c = qli.Quantity__c,
                Price__c = qli.Price__c,
                Price_Book_Entry__c = qli.Price_Book_Entry__c,
                Unit_Of_Measurement__c = qli.Unit_Of_Measurement__c,
                Type__c = qli.Type__c,
                Currency__c = qli.Currency__c,
                Section_Id__c = String.valueOf(invoiceSectionIdByQuoteSectionId.get(qli.Product_Section__c))
            ));
        }

        if (!invoiceLineItemsToInsert.isEmpty()) {
            insert invoiceLineItemsToInsert;
        }

        List<Custom_Page__c> quoteCustomPages = [
            SELECT Name, label__c, selected__c, editMode__c, Text_Page__c, toggle__c, Type__c, Currency__c,
                   (SELECT ContentDocumentId FROM ContentDocumentLinks)
            FROM Custom_Page__c
            WHERE Quotes__c = :quoteId
            ORDER BY CreatedDate ASC
        ];

        if (!quoteCustomPages.isEmpty()) {
            List<Custom_Page__c> invoiceCustomPagesToInsert = new List<Custom_Page__c>();
            for (Custom_Page__c quotePage : quoteCustomPages) {
                invoiceCustomPagesToInsert.add(new Custom_Page__c(
                    Name = quotePage.Name,
                    label__c = quotePage.label__c,
                    selected__c = quotePage.selected__c,
                    editMode__c = quotePage.editMode__c,
                    Text_Page__c = quotePage.Text_Page__c,
                    toggle__c = quotePage.toggle__c,
                    Type__c = quotePage.Type__c,
                    Currency__c = quotePage.Currency__c,
                    Quotes__c = quoteId,
                    Invoice__c = invoiceId
                ));
            }

            insert invoiceCustomPagesToInsert;

            List<ContentDocumentLink> pageLinksToInsert = new List<ContentDocumentLink>();
            for (Integer i = 0; i < quoteCustomPages.size(); i++) {
                for (ContentDocumentLink existingLink : quoteCustomPages[i].ContentDocumentLinks) {
                    pageLinksToInsert.add(new ContentDocumentLink(
                        ContentDocumentId = existingLink.ContentDocumentId,
                        LinkedEntityId = invoiceCustomPagesToInsert[i].Id,
                        ShareType = 'V',
                        Visibility = 'AllUsers'
                    ));
                }
            }

            if (!pageLinksToInsert.isEmpty()) {
                insert pageLinksToInsert;
            }
        }

        return q.LayoutId__c;
    }
    
    
}





