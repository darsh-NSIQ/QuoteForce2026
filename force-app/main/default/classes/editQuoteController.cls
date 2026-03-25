public class editQuoteController {
    public Id currentRecId {get;set;}
    public string currentObjectName {get;set;}
    public editQuoteController(){
        //currentRecId en con.getId();
        //ApexPages.standardController con
        currentRecId = System.currentPagereference().getParameters().get('Id');
        currentObjectName = System.currentPagereference().getParameters().get('objectName');
        System.debug('======currentRecId====='+currentRecId);
        System.debug('======currentRecId====='+currentObjectName);
    }

}