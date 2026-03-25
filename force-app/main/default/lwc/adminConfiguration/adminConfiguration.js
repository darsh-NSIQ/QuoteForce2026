import { LightningElement, track } from 'lwc';
import getAdminConfig from '@salesforce/apex/AdminSettingController.getAdminConfig';
import saveAdminConfig from '@salesforce/apex/AdminSettingController.saveAdminConfig';
import deleteCompanyLogo from '@salesforce/apex/AdminSettingController.deleteCompanyLogo';
import saveFileUrl from '@salesforce/apex/AdminSettingController.saveFileUrl';
import clearFileUrl from '@salesforce/apex/AdminSettingController.clearFileUrl';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AdminConfiguration extends LightningElement {
    currencyOptions = [
        { label: '($) USD', value: 'USD' },
        { label: '(Rs) INR' , value: 'INR' },
        { label: '(EUR) EUR', value: 'EUR' },
        { label: '(GBP) GBP', value: 'GBP' }
    ];

    @track configRecord = {};
    @track selectedCheckboxes = [];
    @track logoUrl;
    @track warrantyUrl;
    @track termsUrl;
    @track isModalOpen = false;
    @track modalFileUrl;
    @track modalTitle;
    @track modalIsImg = false;

    loaded = false;
    isEditMode = false;

    checkboxOptions = [
        { label: 'Letter Of Owner', value: 'Active_Letter_Of_Owner__c' },
        { label: 'Quote Details', value: 'Active_Quote_Details__c' },
        { label: 'Terms and Conditions', value: 'Active_Terms_and_Conditions__c' },
        { label: 'Title', value: 'Active_Title__c' },
        { label: 'Warranty', value: 'Active_Warranty__c' }
    ];

    connectedCallback() {
        this.loadConfig();
    }

    toggleEdit() {
        this.isEditMode = !this.isEditMode;
        this.loadConfig();
    }

    // loadConfig() {
    //     this.loaded = true;
    //     getAdminConfig()
    //         .then((result) => {
    //             this.configRecord = { ...result };
    //             this.logoUrl = result.Company_Logo_URL__c;
    //             this.warrantyUrl = result.Default_Warranty__c;
    //             this.termsUrl = result.Default_Terms_Conditions__c;
    //             this.selectedCheckboxes = this.checkboxOptions
    //                 .filter((opt) => result[opt.value])
    //                 .map((opt) => opt.value);
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('info', error.body?.message || 'Failed to load configuration', 'error');
    //             this.loaded = false;
    //         });
    // }

    loadConfig() {
    this.loaded = true;

    return getAdminConfig()   // 🔥 RETURN THIS
        .then((result) => {
            this.configRecord = { ...result };
            this.logoUrl = result.Company_Logo_URL__c;
            this.warrantyUrl = result.Default_Warranty__c;
            this.termsUrl = result.Default_Terms_Conditions__c;

            this.selectedCheckboxes = this.checkboxOptions
                .filter((opt) => result[opt.value])
                .map((opt) => opt.value);
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to load configuration', 'error');
        })
        .finally(() => {
            this.loaded = false;
        });
}

    handleInputChange(event) {
        console.log('Record Data:', JSON.stringify(this.configRecord));
        const field = event.target.label;
        switch (field) {
            case 'Name':
                this.configRecord.Name = event.target.value;
                break;
            case 'Phone':
                this.configRecord.Phone__c = event.target.value;
                break;
            case 'Email':
                this.configRecord.Email__c = event.target.value;
                break;
            case 'Link With Opportunity':
                this.configRecord.Link_With_Opportunity__c = event.target.checked;
                break;
            case 'Fetch Address From Account':
                this.configRecord.Fecth_Address_From_Account__c = event.target.checked;
                break;
            case 'Street address':
                this.configRecord.Street__c = event.target.value;
                break;
            case 'City':
                this.configRecord.City__c = event.target.value;
                break;
            case 'Postal Code':
                this.configRecord.Postal_Code__c = event.target.value;
                break;
            case 'State':
                this.configRecord.State_Province__c = event.target.value;
                break;
            case 'Country':
                this.configRecord.Country__c = event.target.value;
                break;
            default:
                break;
        }
    }
      get displayName() {
        return this.configRecord?.Name ? this.configRecord.Name : '';
    }

    handleCheckboxChange(event) {
        this.selectedCheckboxes = event.detail.value;
        this.checkboxOptions.forEach((opt) => {
            this.configRecord[opt.value] = this.selectedCheckboxes.includes(opt.value);
        });
    }

    // handleSave() {
    //     this.loaded = true;
    //     saveAdminConfig({ config: this.configRecord })
    //         .then((result) => {
    //             this.configRecord = { ...result };
    //             this.logoUrl = result.Company_Logo_URL__c;
    //             this.warrantyUrl = result.Default_Warranty__c;
    //             this.termsUrl = result.Default_Terms_Conditions__c;
    //             this.showToast('Success', 'Configuration saved', 'success');
    //             this.toggleEdit();
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to save configuration', 'error');
    //             this.loaded = false;
    //         });
    // }

    handleSave() {
    this.loaded = true;

    saveAdminConfig({ config: this.configRecord })
        .then(() => {
            this.showToast('Success', 'Configuration saved', 'success');

            this.isEditMode = false;   // exit edit mode
            this.loadConfig();        // 🔥 single refresh
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to save configuration', 'error');
            this.loaded = false;
        });
}


    // handleLogoUpload(event) {
    //     console.log('Record Data:', JSON.stringify(this.configRecord));
    //     const documentId = event.detail.files[0]?.documentId;
    //     if (!documentId) {
    //         return;
    //     }

    //     this.loaded = true;
    //     saveFileUrl({ fieldName: 'Company_Logo_URL__c', documentId })
    //         .then(() => {
    //             this.logoUrl = '/sfc/servlet.shepherd/document/download/' + documentId;
    //             this.configRecord.Company_Logo_URL__c = this.logoUrl;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to upload logo', 'error');
    //             this.loaded = false;
    //         });
    // }

    handleLogoUpload(event) {
    const documentId = event.detail.files[0]?.documentId;
    if (!documentId) return;

    this.loaded = true;

    saveFileUrl({ fieldName: 'Company_Logo_URL__c', documentId })
        .then(() => {
            this.loadConfig();   // ✅ REFRESH ALL DATA
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to upload logo', 'error');
            this.loaded = false;
        });
}

    // handleWarrantyUpload(event) {
    //     const documentId = event.detail.files[0]?.documentId;
    //     if (!documentId) {
    //         return;
    //     }

    //     this.loaded = true;
    //     saveFileUrl({ fieldName: 'Default_Warranty__c', documentId })
    //         .then(() => {
    //             this.warrantyUrl = '/sfc/servlet.shepherd/document/download/' + documentId;
    //             this.configRecord.Default_Warranty__c = this.warrantyUrl;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to upload warranty', 'error');
    //             this.loaded = false;
    //         });
    // }
    handleWarrantyUpload(event) {
    const documentId = event.detail.files[0]?.documentId;
    if (!documentId) return;

    this.loaded = true;

    saveFileUrl({ fieldName: 'Default_Warranty__c', documentId })
        .then(() => {
            this.loadConfig();
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to upload warranty', 'error');
            this.loaded = false;
        });
}

    // handleTermsUpload(event) {
    //     const documentId = event.detail.files[0]?.documentId;
    //     if (!documentId) {
    //         return;
    //     }

    //     this.loaded = true;
    //     saveFileUrl({ fieldName: 'Default_Terms_Conditions__c', documentId })
    //         .then(() => {
    //             this.termsUrl = '/sfc/servlet.shepherd/document/download/' + documentId;
    //             this.configRecord.Default_Terms_Conditions__c = this.termsUrl;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to upload terms', 'error');
    //             this.loaded = false;
    //         });
    // }

    handleTermsUpload(event) {
    const documentId = event.detail.files[0]?.documentId;
    if (!documentId) return;

    this.loaded = true;

    saveFileUrl({ fieldName: 'Default_Terms_Conditions__c', documentId })
        .then(() => {
            this.loadConfig();
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to upload terms', 'error');
            this.loaded = false;
        });
}

    // handleDeleteLogo() {
    //     this.loaded = true;
    //     deleteCompanyLogo()
    //         .then(() => {
    //             this.logoUrl = null;
    //             this.configRecord.Company_Logo_URL__c = null;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to delete logo', 'error');
    //             this.loaded = false;
    //         });
    // }


handleDeleteLogo() {
    this.loaded = true;

    deleteCompanyLogo()
        .then(() => {
            this.loadConfig();   // ✅ REFRESH
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to delete logo', 'error');
            this.loaded = false;
        });
}

    // handleDeleteWarranty() {
    //     this.loaded = true;
    //     clearFileUrl({ fieldName: 'Default_Warranty__c' })
    //         .then(() => {
    //             this.warrantyUrl = null;
    //             this.configRecord.Default_Warranty__c = null;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to delete warranty', 'error');
    //             this.loaded = false;
    //         });
    // }


    handleDeleteWarranty() {
    this.loaded = true;

    clearFileUrl({ fieldName: 'Default_Warranty__c' })
        .then(() => {
            this.loadConfig();
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to delete warranty', 'error');
            this.loaded = false;
        });
}



    // handleDeleteTerms() {
    //     this.loaded = true;
    //     clearFileUrl({ fieldName: 'Default_Terms_Conditions__c' })
    //         .then(() => {
    //             this.termsUrl = null;
    //             this.configRecord.Default_Terms_Conditions__c = null;
    //             this.loaded = false;
    //         })
    //         .catch((error) => {
    //             this.showToast('Error', error.body?.message || 'Failed to delete terms', 'error');
    //             this.loaded = false;
    //         });
    // }

    handleDeleteTerms() {
    this.loaded = true;

    clearFileUrl({ fieldName: 'Default_Terms_Conditions__c' })
        .then(() => {
            this.loadConfig();
        })
        .catch((error) => {
            this.showToast('Error', error.body?.message || 'Failed to delete terms', 'error');
            this.loaded = false;
        });
}

    handleViewLogo() {
        this.modalFileUrl = this.logoUrl;
        this.modalTitle = 'Company Logo';
        this.isModalOpen = true;
        this.modalIsImg = true;
    }

    handleViewWarranty() {
        this.modalFileUrl = this.warrantyUrl;
        this.modalTitle = 'Warranty';
        this.isModalOpen = true;
        this.modalIsImg = false;
    }

    handleViewTerms() {
        this.modalFileUrl = this.termsUrl;
        this.modalTitle = 'Terms & Conditions';
        this.isModalOpen = true;
        this.modalIsImg = false;
    }

    closeModal() {
        this.isModalOpen = false;
        this.modalFileUrl = null;
        this.modalTitle = null;
    }

    handleCurrencyChange(event) {
        this.configRecord.Currency__c = event.detail.value;
    }

     get formattedAddress() {
        if (!this.configRecord) {
            return '';
        }

        const parts = [
            this.configRecord.Street__c,
            this.configRecord.City__c,
            this.configRecord.State_Province__c,
            this.configRecord.Postal_Code__c,
            this.configRecord.Country__c
        ];

        return parts.filter(part => part).join(', ');
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

}