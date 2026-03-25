public with sharing class saveAsNewVersion {
   

@AuraEnabled
public static String saveAsNewVersion(String currentQuoteId) {
    if (String.isBlank(currentQuoteId)) {
        throw new AuraHandledException('Apex Error: Quote ID is null.');
    }
      Quotes__c newVersion;
    try {
        // Correct Object: Quotes__c
        Quotes__c original = [SELECT Name, Opportunity__c, Expiration_Date__c, Status__c, State_Province__c,
                              Pages_JSON__c, Terms_Conditions__c, Warranty__c, Tax__c,
                              Bill_To__Street__s, Bill_To__City__s, Bill_To__PostalCode__s, Bill_To__Longitude__s,
                              Bill_To__GeocodeAccuracy__s, Bill_To__StateCode__s,
                              Layout_Name__c, Date__c,Ship_To__c, Ship_To__GeocodeAccuracy__s, Ship_To__Longitude__s,
                              Ship_To__Latitude__s, Ship_To__StateCode__s, Ship_To__CountryCode__s,Bill_To__CountryCode__s, 
                              Ship_To__PostalCode__s, Ship_To__City__s, Ship_To__Street__s
                              FROM Quotes__c 
                              WHERE Id = :currentQuoteId LIMIT 1];

         newVersion = new Quotes__c();
        String oldName = original.Name;
        String newName;
        
        if (oldName.contains(' Version ')) {
           
            String baseName = oldName.substringBeforeLast(' Version ');
            String versionStr = oldName.substringAfterLast(' Version ');
            
            try {
                Integer versionNum = Integer.valueOf(versionStr.trim());
                newName = baseName + ' Version ' + (versionNum + 1);
            } catch (Exception e) {
               
                newName = oldName + ' Version 1';
            }
        } else {
            newName = oldName + ' Version 1';
        }
        
        newVersion.Name = newName;
        newVersion.Opportunity__c = original.Opportunity__c;
        newVersion.Expiration_Date__c = original.Expiration_Date__c;
        newVersion.Status__c = original.Status__c ;
        newVersion.Pages_JSON__c = original.Pages_JSON__c;
        newVersion.Terms_Conditions__c = original.Terms_Conditions__c;
        newVersion.Warranty__c = original.Warranty__c;
        newVersion.Tax__c = original.Tax__c;
        newVersion.Layout_Name__c = original.Layout_Name__c;
        newVersion.Date__c = original.Date__c;
        
        // Billing Mapping
        newVersion.Bill_To__Street__s = original.Bill_To__Street__s;
        newVersion.Bill_To__City__s = original.Bill_To__City__s;
        newVersion.Bill_To__PostalCode__s = original.Bill_To__PostalCode__s;
        newVersion.Bill_To__CountryCode__s = original.Bill_To__CountryCode__s;
        
        //shipping Mapping
        newVersion.Ship_To__Street__s = original.Ship_To__Street__s;
        newVersion.Ship_To__City__s = original.Ship_To__City__s;
        newVersion.Ship_To__PostalCode__s = original.Ship_To__PostalCode__s;
        newVersion.Ship_To__Longitude__s = original.Ship_To__Longitude__s;
        newVersion.Ship_To__GeocodeAccuracy__s = original.Ship_To__GeocodeAccuracy__s;  
        newVersion.Ship_To__StateCode__s = original.Ship_To__StateCode__s;
        newVersion.Ship_To__PostalCode__s = original.Ship_To__PostalCode__s; 
        newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s;
        

      
      newVersion.State_Province__c = original.State_Province__c;
        /*
newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s;
newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s;
newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s;
newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s;
newVersion.Ship_To__CountryCode__s = original.Ship_To__CountryCode__s

Ship_To__Latitude__s = original.Ship_To__Latitude__s ;
*/
        

        insert newVersion;

    } catch (Exception e) {
        throw new AuraHandledException('Error on Quotes__c: ' + e.getMessage());
    }
    
    list<QuoteLineItem__c> orginalineIteam  = [SELECT  Product_Bundle__c, Price__c, Product_Section__c,Quantity__c 
                                              FROM QuoteLineItem__c
                                              WHERE Quotes__c = :currentQuoteId];
    
    if(!orginalineIteam.isEmpty()){
        
         list<QuoteLineItem__c> newVersion1 = new list<QuoteLineItem__c>();
        
        for(QuoteLineItem__c lineitem : orginalineIteam ){    
            
             QuoteLineItem__c lineItemnewVersion = new QuoteLineItem__c();
             lineItemnewVersion.Product_Bundle__c = lineitem.Product_Bundle__c;
             lineItemnewVersion.Price__c  = lineitem.Price__c ;
             lineItemnewVersion.Product_Section__c = lineitem.Product_Section__c;
             lineItemnewVersion.Quantity__c =  lineitem.Quantity__c;
             lineItemnewVersion.Quotes__c =  newVersion.ID ;
            
             newVersion1.add(lineItemnewVersion);
             
        }
        if(!newVersion1.isEmpty()){
            insert newVersion1 ; 
        }
         
    }
    
        return newVersion.Id;
}
}