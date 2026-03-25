@isTest
public class editQuoteControllerTest {

    @isTest
    static void testControllerInitialization() {
        // Create a dummy 18-character Id (any valid Id format works)
        Id testRecordId = Id.valueOf('001000000000000AAA');
        String testObjectName = 'Quote__c';
        
        // Create a PageReference with parameters
        PageReference pageRef = new PageReference('/apex/dummyPage'); // Replace with actual VF page if needed
        pageRef.getParameters().put('Id', testRecordId);
        pageRef.getParameters().put('objectName', testObjectName);
        Test.setCurrentPage(pageRef);
        
        // Instantiate controller
        editQuoteController controller = new editQuoteController();
        
      
    }
}