public with sharing class QuoteForcePricingService {

    public class PricingResult {
        public Id productId;
        public Id priceBookId;
        public Id priceBookEntryId;
        public Decimal unitPrice;
        public String currencyCode;
        public String productCode;
    }

    private class PricingContext {
        public Id priceBookId;
        public String currencyCode;
    }

    public static String resolveQuoteCurrency(Id quoteId) {
        return resolveQuotePricingContext(quoteId).currencyCode;
    }

    public static Id resolveQuotePriceBookId(Id quoteId) {
        return resolveQuotePricingContext(quoteId).priceBookId;
    }

    public static Id resolveInvoicePriceBookId(Id invoiceId) {
        return resolveInvoicePricingContext(invoiceId).priceBookId;
    }

    public static Map<Id, Decimal> resolveQuoteProductPrices(Id quoteId, Set<Id> productIds) {
        Map<Id, Decimal> pricesByProductId = new Map<Id, Decimal>();
        for (PricingResult pricing : resolveQuoteProductPricing(quoteId, productIds).values()) {
            pricesByProductId.put(pricing.productId, pricing.unitPrice);
        }
        return pricesByProductId;
    }

    public static Map<Id, PricingResult> resolveQuoteProductPricing(Id quoteId, Set<Id> productIds) {
        return resolveProductPricing(resolveQuotePricingContext(quoteId), productIds);
    }

    public static Map<Id, PricingResult> resolveInvoiceProductPricing(Id invoiceId, Set<Id> productIds) {
        return resolveProductPricing(resolveInvoicePricingContext(invoiceId), productIds);
    }

    public static void syncCatalogProducts(List<Product__c> productsToSync) {
        return;
    }

    private static PricingContext resolveQuotePricingContext(Id quoteId) {
        PricingContext context = new PricingContext();
        if (quoteId == null) {
            return context;
        }

        Quotes__c quoteRecord = [
            SELECT Id, Currency__c, Price_Book__c
            FROM Quotes__c
            WHERE Id = :quoteId
            LIMIT 1
        ];

        context.currencyCode = quoteRecord.Currency__c;
        context.priceBookId = quoteRecord.Price_Book__c != null
            ? quoteRecord.Price_Book__c
            : resolveDefaultPriceBookId(context.currencyCode);
        return context;
    }

    private static PricingContext resolveInvoicePricingContext(Id invoiceId) {
        PricingContext context = new PricingContext();
        if (invoiceId == null) {
            return context;
        }

        Invoice__c invoiceRecord = [
            SELECT Id, Price_Book__c, Quotes__r.Currency__c, Quotes__r.Price_Book__c
            FROM Invoice__c
            WHERE Id = :invoiceId
            LIMIT 1
        ];

        context.currencyCode = invoiceRecord.Quotes__r != null ? invoiceRecord.Quotes__r.Currency__c : null;
        if (invoiceRecord.Price_Book__c != null) {
            context.priceBookId = invoiceRecord.Price_Book__c;
        } else if (invoiceRecord.Quotes__r != null && invoiceRecord.Quotes__r.Price_Book__c != null) {
            context.priceBookId = invoiceRecord.Quotes__r.Price_Book__c;
        } else {
            context.priceBookId = resolveDefaultPriceBookId(context.currencyCode);
        }
        return context;
    }

    private static Map<Id, PricingResult> resolveProductPricing(PricingContext context, Set<Id> productIds) {
        Map<Id, PricingResult> pricingByProductId = new Map<Id, PricingResult>();
        if (productIds == null || productIds.isEmpty()) {
            return pricingByProductId;
        }

        Map<Id, Product__c> productById = new Map<Id, Product__c>([
            SELECT Id, Product_Code__c, Default_Price__c, Currency__c
            FROM Product__c
            WHERE Id IN :productIds
        ]);

        Map<Id, Price_Book_Entry__c> entryByProductId = new Map<Id, Price_Book_Entry__c>();
        if (context.priceBookId != null) {
            for (Price_Book_Entry__c entry : [
                SELECT Id, Price_Book__c, Product__c, Product_Code__c, Currency__c, Unit_Price__c
                FROM Price_Book_Entry__c
                WHERE Price_Book__c = :context.priceBookId
                AND Product__c IN :productIds
                AND Is_Active__c = true
            ]) {
                if (!entryByProductId.containsKey(entry.Product__c)) {
                    entryByProductId.put(entry.Product__c, entry);
                }
            }
        }

        for (Id productId : productIds) {
            Product__c productRecord = productById.get(productId);
            if (productRecord == null) {
                continue;
            }

            Price_Book_Entry__c priceBookEntry = entryByProductId.get(productId);

            PricingResult pricing = new PricingResult();
            pricing.productId = productId;
            pricing.priceBookId = context.priceBookId;
            pricing.priceBookEntryId = priceBookEntry != null ? priceBookEntry.Id : null;
            pricing.unitPrice = priceBookEntry != null && priceBookEntry.Unit_Price__c != null
                ? priceBookEntry.Unit_Price__c
                : (productRecord.Default_Price__c != null ? productRecord.Default_Price__c : 0);
            pricing.currencyCode = String.isNotBlank(context.currencyCode)
                ? context.currencyCode
                : (priceBookEntry != null && String.isNotBlank(priceBookEntry.Currency__c)
                    ? priceBookEntry.Currency__c
                    : productRecord.Currency__c);
            pricing.productCode = priceBookEntry != null && String.isNotBlank(priceBookEntry.Product_Code__c)
                ? priceBookEntry.Product_Code__c
                : productRecord.Product_Code__c;

            pricingByProductId.put(productId, pricing);
        }

        return pricingByProductId;
    }

    private static Id resolveDefaultPriceBookId(String currencyCode) {
        List<Price_Book__c> priceBooks;
        if (String.isBlank(currencyCode)) {
            priceBooks = [
                SELECT Id, Currency__c
                FROM Price_Book__c
                WHERE Is_Active__c = true
                ORDER BY Is_Default__c DESC, CreatedDate ASC
                LIMIT 1
            ];
        } else {
            priceBooks = [
                SELECT Id, Currency__c
                FROM Price_Book__c
                WHERE Is_Active__c = true
                AND (Currency__c = :currencyCode OR Currency__c = null)
                ORDER BY Is_Default__c DESC, CreatedDate ASC
                LIMIT 1
            ];
        }
        return priceBooks.isEmpty() ? null : priceBooks[0].Id;
    }
}

