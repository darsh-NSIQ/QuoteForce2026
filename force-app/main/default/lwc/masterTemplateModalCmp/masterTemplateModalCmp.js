import { LightningElement, api, track } from 'lwc';
import uploadImagesAndUpdateRecord from '@salesforce/apex/MasterTemplateController.uploadImagesAndUpdateRecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import CreateMasterLayout from '@salesforce/apex/createMasterTemplateRecord.CreateMasterLayout';
import getLayoutRecord from '@salesforce/apex/createMasterTemplateRecord.getLayoutRecord';
import UpdateMasterLayout from '@salesforce/apex/createMasterTemplateRecord.UpdateMasterLayout';
import deleteFile from '@salesforce/apex/createMasterTemplateRecord.deleteFile';


export default class MasterTemplateModalCmp extends LightningElement {
    @api recordId; // The Id of the Master_Template__c record
    @api templateType;
    imageUrl;
    primaryImage;
    secondaryImage;
    selectedRecordId = '';
    fileTypes = ['.jpg', '.png', '.jpeg'];
    @track fieldValues = {}; // Stores fields to update

    @track layoutName = '';
    @track letterForm = '';
    @track zipCode = '';
    @track stateProvince = '';
    @track city = '';
    @track streetAddress = '';
    @track lastName = '';
    @track firstName = '';
    @track date = '';
    @track primaryImage = '';
    @track secondaryImage = '';

    @track PrimaryAvailableBool = false;
    @track PrimaryUploadedFilesUrl = [];
    @track noImageAvail = false;
    fileDataPrimary;

    @track SecondaryAvailableBool = false;
    @track SecondaryUploadedFilesUrl = [];
    fileDataSecondary;

    @track primaryImageUrl = '';
    @track secondaryImageUrl = '';
    @track primaryContentDocumentId;
    @track secondaryContentDocumentId;

    handleSave() {
        this.template.querySelector('c-custom-quote-c-m-p').handleSaveTeamplate();
        this.dispatchEvent(new CustomEvent('refreshlist'));
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    // Close modal
    handleClose() {
        this.closeModal();
    }

    closeModal() {
        const closeEvent = new CustomEvent('close');
        this.dispatchEvent(closeEvent);
    }
}