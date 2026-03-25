public class ProductImporterController {

    // =========================================
    // 🔹 METHOD 1: Insert Products
    // =========================================
    @AuraEnabled
    public static Map<String, Object> insertProducts(String productsJson) {

        Map<String, Object> result = new Map<String, Object>{
            'insertedCount' => 0,
            'errors' => new List<String>()
        };

        if (String.isBlank(productsJson)) {
            ((List<String>)result.get('errors')).add('Empty payload');
            return result;
        }

        List<Object> records = (List<Object>) JSON.deserializeUntyped(productsJson);

        Set<String> incomingCodes = new Set<String>();
        Set<String> seenCodeCurrencyKeys = new Set<String>();
        Set<String> incomingCodeCurrencyKeys = new Set<String>();
        List<String> errors = (List<String>) result.get('errors');

        Integer rowIndex = 1;

        // 🔥 STEP 1: Duplicate in file
        for (Object obj : records) {
            Map<String, Object> rec = (Map<String, Object>) obj;
            String code = (String) rec.get('Product_Code__c');
            String currencyCode = (String) rec.get('Currency__c');
            String compositeKey = String.valueOf(code) + '::' + String.valueOf(currencyCode);

            if (code != null) {
                if (seenCodeCurrencyKeys.contains(compositeKey)) {
                    errors.add('Row ' + rowIndex + ': Duplicate code/currency in file -> ' + compositeKey);
                    return result; // ❌ STOP
                }
                seenCodeCurrencyKeys.add(compositeKey);
                incomingCodes.add(code);
                incomingCodeCurrencyKeys.add(compositeKey);
            }
            rowIndex++;
        }

        // 🔥 STEP 2: Duplicate in DB
        for (Product__c p : [
            SELECT Product_Code__c, Currency__c
            FROM Product__c 
            WHERE Product_Code__c IN :incomingCodes
        ]) {
            String existingKey = String.valueOf(p.Product_Code__c) + '::' + String.valueOf(p.Currency__c);
            if (incomingCodeCurrencyKeys.contains(existingKey)) {
                errors.add('Product code/currency already exists -> ' + existingKey);
                return result; // ❌ STOP
            }
        }

        // 🔥 STEP 3: Insert
        List<Product__c> toInsert = new List<Product__c>();

        for (Object obj : records) {
            Map<String, Object> rec = (Map<String, Object>) obj;

            Product__c p = new Product__c();
            p.Name = (String) rec.get('Name');
            p.Product_Code__c = (String) rec.get('Product_Code__c');
            p.Description__c = (String) rec.get('Description__c');
            p.Default_Price__c = rec.get('Default_Price__c') != null 
                ? Decimal.valueOf(String.valueOf(rec.get('Default_Price__c'))) 
                : null;
            p.Default_Quantity__c = rec.get('Default_Quantity__c') != null 
                ? Integer.valueOf(String.valueOf(rec.get('Default_Quantity__c'))) 
                : null;
            p.Currency__c = (String) rec.get('Currency__c');
            p.Active__c = (Boolean) rec.get('Active__c');

            toInsert.add(p);
        }

        insert toInsert;
        result.put('insertedCount', toInsert.size());

        return result;
    }


    // =========================================
    // 🔹 METHOD 2: Insert Products in Bundle
    // =========================================
    @AuraEnabled
    public static Map<String, Object> insertProductsInBundle(String productsJson, Id bundleId) {

        Map<String, Object> result = new Map<String, Object>{
            'insertedCount' => 0,
            'errors' => new List<String>()
        };

        if (String.isBlank(productsJson)) {
            ((List<String>)result.get('errors')).add('Empty payload');
            return result;
        }

        try {
            List<Object> parsed = (List<Object>) JSON.deserializeUntyped(productsJson);

            Set<String> incomingCodes = new Set<String>();
            Set<String> seenCodeCurrencyKeys = new Set<String>();
            Set<String> incomingCodeCurrencyKeys = new Set<String>();
            List<String> errors = (List<String>) result.get('errors');

            Integer rowIndex = 1;

            // 🔥 STEP 1: Duplicate in file
            for (Object o : parsed) {
                Map<String, Object> m = (Map<String, Object>) o;
                String code = (String) m.get('Product_Code__c');
                String currencyCode = (String) m.get('Currency__c');
                String compositeKey = String.valueOf(code) + '::' + String.valueOf(currencyCode);

                if (code != null) {
                    if (seenCodeCurrencyKeys.contains(compositeKey)) {
                        errors.add('Row ' + rowIndex + ': Duplicate code/currency in file -> ' + compositeKey);
                        return result; // ❌ STOP
                    }
                    seenCodeCurrencyKeys.add(compositeKey);
                    incomingCodes.add(code);
                    incomingCodeCurrencyKeys.add(compositeKey);
                }
                rowIndex++;
            }

            // 🔥 STEP 2: Duplicate in DB
            for (Product__c p : [
                SELECT Product_Code__c, Currency__c
                FROM Product__c 
                WHERE Product_Code__c IN :incomingCodes
            ]) {
                String existingKey = String.valueOf(p.Product_Code__c) + '::' + String.valueOf(p.Currency__c);
                if (incomingCodeCurrencyKeys.contains(existingKey)) {
                    errors.add('Product code/currency already exists -> ' + existingKey);
                    return result; // ❌ STOP
                }
            }

            // 🔥 STEP 3: Insert Products
            List<Product__c> toInsert = new List<Product__c>();

            for (Object o : parsed) {
                Map<String, Object> m = (Map<String, Object>) o;

                Product__c p = new Product__c();

                p.Name = (String) m.get('Name');
                p.Product_Code__c = (String) m.get('Product_Code__c');
                p.Description__c = (String) m.get('Description__c');

                if (m.get('Default_Price__c') != null) {
                    p.Default_Price__c = Decimal.valueOf(String.valueOf(m.get('Default_Price__c')));
                }

                if (m.get('Default_Quantity__c') != null) {
                    p.Default_Quantity__c = Integer.valueOf(String.valueOf(m.get('Default_Quantity__c')));
                }

                p.Currency__c = (String) m.get('Currency__c');
                p.Active__c = (Boolean) m.get('Active__c');

                toInsert.add(p);
            }

            insert toInsert;

            // 🔥 STEP 4: Create Product Line Items
            List<Product_Line_Items__c> pliList = new List<Product_Line_Items__c>();

            for (Product__c prod : toInsert) {
                Product_Line_Items__c pli = new Product_Line_Items__c();
                pli.Product_Bundle__c = bundleId;
                pli.Product__c = prod.Id;
                pli.Quantity__c = prod.Default_Quantity__c;
                pli.Price__c = prod.Default_Price__c;

                pliList.add(pli);
            }

            if (!pliList.isEmpty()) {
                insert pliList;
            }

            result.put('insertedCount', toInsert.size());

        } catch (Exception ex) {
            ((List<String>)result.get('errors')).add('Exception: ' + ex.getMessage());
        }

        return result;
    }
}
