public class EmailClass {
    @AuraEnabled
    public static List<SObject> search(String searchString) {
        List<SObject> searchList = new List<SObject>();
        try {
            String searchStr = '*' + searchString + '*';
            String searchquery =
                'FIND\'' +
                searchStr +
                '\'IN ALL FIELDS RETURNING Contact(id, name, email where email != null), User(id, name, email where email != null AND isActive = true) LIMIT 10';
            List<List<SObject>> searchResult = search.query(searchquery);
            for (List<SObject> curList : searchResult) {
                searchList.addAll(curList);
            }
            System.debug('searchList:::' + searchList.size());
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        return searchList;
    }
    
    @AuraEnabled
    public static void sendEmailController(String emailDetailStr, String recordId) {
        
        System.debug('=== sendEmailController START ===');
        System.debug('Email Detail String : ' + emailDetailStr);
        System.debug('Record Id : ' + recordId);
        
        EmailWrapper emailDetails = (EmailWrapper) JSON.deserialize(emailDetailStr, EmailWrapper.class);
        System.debug('Deserialized EmailWrapper : ' + emailDetails);
        
        Messaging.reserveSingleEmailCapacity(1);
        
        try {
            
            Id targetId = (Id) recordId;
            System.debug('Target Id : ' + targetId);
            
            Schema.SObjectType recordType = targetId.getSObjectType();
            System.debug('Record Type : ' + recordType);
            
            Boolean isInvoice = recordType == Invoice__c.SObjectType;
            System.debug('Is Invoice : ' + isInvoice);
            
            PageReference pdfPage = isInvoice ? Page.invoicePDFpage : Page.quotePDFpage;
            System.debug('PDF Page Selected : ' + pdfPage);
            
            pdfPage.getParameters().put('id', recordId);
            System.debug('PDF Page Parameters : ' + pdfPage.getParameters());
            
            Blob pdfBlob;
            
            if (!Test.isRunningTest()) {
                System.debug('Generating PDF using getContentAsPDF()');
                pdfBlob = pdfPage.getContentAsPDF();
            } else {
                System.debug('Running in TEST context');
                pdfBlob = Blob.valueOf('Test PDF');
            }
            
            System.debug('PDF Blob Size : ' + pdfBlob.size());
            
            Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
            attachment.setFileName(isInvoice ? 'Invoice.pdf' : 'Quote.pdf');
            attachment.setBody(pdfBlob);
            
            System.debug('Attachment Created : ' + attachment.getFileName());
            
            Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
            
            mail.setToAddresses(emailDetails.toAddress);
            mail.setCcAddresses(emailDetails.ccAddress);
            mail.setSenderDisplayName('Test');
            mail.setSubject(emailDetails.subject);
            mail.setHtmlBody(emailDetails.body);
            mail.setEntityAttachments(emailDetails.files);
            mail.setFileAttachments(new Messaging.EmailFileAttachment[] { attachment });
            
            System.debug('To Address : ' + emailDetails.toAddress);
            System.debug('CC Address : ' + emailDetails.ccAddress);
            System.debug('Subject : ' + emailDetails.subject);
            System.debug('Files : ' + emailDetails.files);
            
            System.debug('Sending Email...');
            
            Messaging.SendEmailResult[] results = Messaging.sendEmail(
                new List<Messaging.SingleEmailMessage>{ mail }
            );
            
            System.debug('Email Send Result : ' + results);
            
            if(results != null && results.size() > 0){
                System.debug('Success : ' + results[0].isSuccess());
                if(!results[0].isSuccess()){
                    System.debug('Errors : ' + results[0].getErrors());
                }
            }
            
            System.debug('=== sendEmailController END SUCCESS ===');
            
        } catch (Exception e) {
            
            System.debug('=== ERROR OCCURRED ===');
            System.debug('Message : ' + e.getMessage());
            System.debug('Line Number : ' + e.getLineNumber());
            System.debug('Stack Trace : ' + e.getStackTraceString());
            
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    public class EmailWrapper {
        public List<String> toAddress;
        public List<String> ccAddress;
        public String subject;
        public String body;
        public List<String> files;
    }
}