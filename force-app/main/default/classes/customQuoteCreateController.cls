/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 10-01-2024
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
public with sharing class customQuoteCreateController {

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
            'DE' => new List<String>{'BW', 'BY'}, // Baden-Württemberg, Bavaria
            'FR' => new List<String>{'IDF', 'NAQ'}, // Île-de-France, Nouvelle-Aquitaine
            'BR' => new List<String>{'SP', 'RJ'}, // São Paulo, Rio de Janeiro
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
            'SE' => new List<String>{'ST', 'VG'}, // Stockholm, Västra Götaland
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
    public static List<Master_Template__c> getmasterTemplate() {
       
            List<Master_Template__c> mt = [Select Id ,Layout_Name__c,IsDefault__c,Pages_JSON__c,Terms_Condition_doc__c,Warranty_Doc__c, Currency__c From Master_Template__c];
            return mt;
       
    }

    @AuraEnabled
    public static Opportunity getAddressFromAccount(string recordId){
        Opportunity oppObj =  [SELECT Id,Name,Account.BillingAddress , Account.ShippingAddress from Opportunity where Id =: recordId limit 1];
        system.debug('oppObj'+oppObj);
        return oppObj;
    }

    @AuraEnabled
    public static Id createQuoteRecord(Map<String, Object> quoteData) {
        try {
            Quote__c newQuote = new Quote__c();
            newQuote.Quote_Name__c = (String)quoteData.get('quoteName');
            newQuote.ExpirationDate__c = Date.valueOf((String)quoteData.get('expirationDate'));
            newQuote.Status__c = (String)quoteData.get('status');
            
            String taxStr = (String)quoteData.get('tax');
            if (taxStr != null && taxStr != '') {
                newQuote.Tax__c = Decimal.valueOf(taxStr);  // Safely converting String to Decimal
            } else {
                newQuote.Tax__c = null;  // Or handle this scenario as needed
            }

            insert newQuote;
            return newQuote.Id;
        } catch (Exception e) {
            throw new AuraHandledException('Error creating quote: ' + e.getMessage() + ' - ' + e.getStackTraceString());
        }
    }

   @AuraEnabled
    public static Quotes__c getQuoteDetails(String recordId) {
        Quotes__c quotelist = [
            SELECT Name, Expiration_Date__c, Status__c, Tax__c, Opportunity__c,LayoutId__c,Currency__c,
                Bill_To__Street__s, Bill_To__City__s, Bill_To__StateCode__s, Bill_To__PostalCode__s, Bill_To__CountryCode__s, 
                Ship_To__Street__s, Ship_To__City__s, Ship_To__StateCode__s, Ship_To__PostalCode__s, Ship_To__CountryCode__s,
                First_Name__c,Primary_Image__c,Pages_JSON__c ,Secondary_Image__c , Last_Name__c, Layout_Name__c, Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
                Date__c, Letter_from_the_owner__c FROM Quotes__c WHERE Id = :recordId
        ];

        System.debug('quotelist'+quotelist);
        return quotelist;
    }


    @AuraEnabled
    public static String createQuotesRecord(Quotes__c quoteWrapMap)
    {
        System.debug('quoteWrapMap --***- '+ quoteWrapMap);
        if(quoteWrapMap != null){
            syncRecordCurrency(quoteWrapMap);
            insert quoteWrapMap;
        }
        return quoteWrapMap.Id; 

    }

    @AuraEnabled
    public static String updateQuotesRecord(Quotes__c quoteWrapMap) {
        System.debug('quoteWrapMap123 --***- '+ quoteWrapMap);
        if(quoteWrapMap != null){
            syncRecordCurrency(quoteWrapMap);
            update quoteWrapMap;
        }
        return quoteWrapMap.Id;
    }

    @AuraEnabled
    public static Id createQuoteWithChildren(String mtId, String quoteId) {
        System.debug('DEBUG: Template Id = ' + mtId);
        System.debug('DEBUG: Quote Id = ' + quoteId);
        Master_Template__c mt = [
            SELECT Id, Layout_Name__c, Date__c, First_Name__c, Last_Name__c,
                Terms_Condition_doc__c, Warranty_Doc__c, Pages_JSON__c, Currency__c,
                Street_Address__c, City__c, State_Province__c, Zip_code_Postal_code__c,
                Primary_Image__c, Secondary_Image__c, Letter_from_the_owner__c
            FROM Master_Template__c
            WHERE Id = :mtId
            LIMIT 1
        ];
        Quotes__c newQuote = new Quotes__c(
            Id = quoteId,
            First_Name__c = mt.First_Name__c,
            LayoutId__c = mtId,
            Layout_Name__c = mt.Layout_Name__c,
            Last_Name__c = mt.Last_Name__c,
            Street_Address__c = mt.Street_Address__c,
            City__c = mt.City__c,
            State_Province__c = mt.State_Province__c,
            Zip_code_Postal_code__c = mt.Zip_code_Postal_code__c,
            Date__c = mt.Date__c,
            Letter_from_the_owner__c = mt.Letter_from_the_owner__c,
            Terms_Conditions__c = mt.Terms_Condition_doc__c,
            Primary_Image__c = mt.Primary_Image__c,
            Secondary_Image__c = mt.Secondary_Image__c,
            Pages_JSON__c = mt.Pages_JSON__c,
            Warranty__c = mt.Warranty_Doc__c,
            Currency__c = mt.Currency__c
        );
        syncRecordCurrency(newQuote);
        update newQuote;
        List<Product_Section__c> oldSections = [
            SELECT Id, Name, Notes__c,
                (SELECT Id, Product__c, Product__r.Name, Quantity__c, Price__c
                 FROM QuoteLineItems__r)
            FROM Product_Section__c
            WHERE Master_Template__c = :mtId
        ];
        List<Product_Section__c> newSections = new List<Product_Section__c>();
        for (Product_Section__c sec : oldSections) {
            newSections.add(new Product_Section__c(
                Name = sec.Name,
                Notes__c = sec.Notes__c,
                Quotes__c = newQuote.Id
            ));
        }
        if (!newSections.isEmpty()) {
            insert newSections;
        }
        Map<Id, Id> sectionMap = new Map<Id, Id>();
        for (Integer i = 0; i < oldSections.size(); i++) {
            sectionMap.put(oldSections[i].Id, newSections[i].Id);
        }
        List<QuoteLineItem__c> finalLineItems = new List<QuoteLineItem__c>();
        for (Integer i = 0; i < oldSections.size(); i++) {
            if (oldSections[i].QuoteLineItems__r != null) {
                for (QuoteLineItem__c qli : oldSections[i].QuoteLineItems__r) {
                    finalLineItems.add(new QuoteLineItem__c(
                        Product__c = qli.Product__c,
                        Quantity__c = qli.Quantity__c,
                        Price__c = qli.Price__c,
                        Product_Section__c = sectionMap.get(oldSections[i].Id),
                        Quotes__c = newQuote.Id
                    ));
                }
            }
        }
        if (!finalLineItems.isEmpty()) {
            insert finalLineItems;
        }
        List<Custom_Page__c> oldPages = [
            SELECT Id, Name, label__c, selected__c, editMode__c, Text_Page__c,
                toggle__c, Type__c
            FROM Custom_Page__c
            WHERE Master_Template__c = :mtId
        ];
        List<Custom_Page__c> newPages = new List<Custom_Page__c>();
        for (Custom_Page__c page : oldPages) {
            newPages.add(new Custom_Page__c(
                Name = page.Name,
                label__c = page.label__c,
                selected__c = page.selected__c,
                editMode__c = page.editMode__c,
                Text_Page__c = page.Text_Page__c,
                toggle__c = page.toggle__c,
                Type__c = page.Type__c,
                Quotes__c = newQuote.Id
            ));
        }
        if (!newPages.isEmpty()) {
            insert newPages;
        }
        return newQuote.Id;
    }

    private static void syncRecordCurrency(SObject recordObj) {
        if (recordObj == null) {
            return;
        }
        String currencyCode = (String) recordObj.get('Currency__c');
        if (String.isBlank(currencyCode)) {
            return;
        }
        try {
            recordObj.put('CurrencyIsoCode', currencyCode);
        } catch (Exception ex) {
            System.debug('CurrencyIsoCode not available on record type: ' + ex.getMessage());
        }
    }
}
