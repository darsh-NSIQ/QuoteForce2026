@isTest
public class saveAsNewVersionTest {

    @isTest
    static void testSaveAsNewVersion() {

        // Create Opportunity (required lookup)
        Opportunity opp = new Opportunity(
            Name = 'Test Opportunity',
            StageName = 'Prospecting',
            CloseDate = Date.today()
        );
        insert opp;

        // Create Original Quote
        Quotes__c q = new Quotes__c(
            Name = 'Test Quote',
            Opportunity__c = opp.Id,
            Expiration_Date__c = Date.today(),
            Status__c = 'Draft',
            State_Province__c = 'Rajasthan'
        );
        insert q;

        // Create Quote Line Item
        QuoteLineItem__c qli = new QuoteLineItem__c(
            Quotes__c = q.Id,
            Quantity__c = 2,
            Price__c = 100
        );
        insert qli;

        Test.startTest();

        String newQuoteId = saveAsNewVersion.saveAsNewVersion(q.Id);

        Test.stopTest();

        System.debug('New Quote Version Id: ' + newQuoteId);
    }
}