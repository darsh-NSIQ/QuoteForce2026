@isTest
public class EmailClassTest {

    @testSetup
    static void setupTestData() {
        // Test Contacts
        List<Contact> contacts = new List<Contact>();
        for(Integer i=0; i<5; i++){
            contacts.add(new Contact(FirstName='Test'+i, LastName='User'+i, Email='testuser'+i+'@example.com'));
        }
        insert contacts;

        // Test Users
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];
        List<User> users = new List<User>();
        for(Integer i=0; i<3; i++){
            users.add(new User(
                FirstName='TestUser'+i,
                LastName='Demo'+i,
                Email='testuserdemo'+i+'@example.com',
                Username='testuserdemo'+i+'@example.com',
                Alias='tuser'+i,
                TimeZoneSidKey='America/Los_Angeles',
                LocaleSidKey='en_US',
                EmailEncodingKey='UTF-8',
                LanguageLocaleKey='en_US',
                ProfileId=p.Id,
                IsActive=true
            ));
        }
        insert users;

        // Dummy Quotes__c record for PDF generation
        Account acc = new Account(Name='Test Account');
        insert acc;
        Quotes__c q = new Quotes__c(Name='Test Quote');
        insert q;
    }

    @isTest
    static void testSearch() {
        Test.startTest();
        List<SObject> results = EmailClass.search('Test');
        Test.stopTest();

    }

    @isTest
    static void testSendEmailController() {
        // Query a Quotes__c record to pass its Id
        Quotes__c q = [SELECT Id FROM Quotes__c LIMIT 1];

        // Prepare EmailWrapper JSON
        EmailClass.EmailWrapper wrapper = new EmailClass.EmailWrapper();
        wrapper.toAddress = new List<String>{'testuser@example.com'};
        wrapper.ccAddress = new List<String>{'ccuser@example.com'};
        wrapper.subject = 'Test Subject';
        wrapper.body = 'Test Body';
        wrapper.files = new List<String>();

        String emailJson = JSON.serialize(wrapper);

        Test.startTest();
        EmailClass.sendEmailController(emailJson, q.Id);
        Test.stopTest();

    }
}