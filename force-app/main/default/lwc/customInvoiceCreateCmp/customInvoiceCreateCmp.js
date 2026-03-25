import { LightningElement, track, wire, api } from 'lwc';
import customQuoteCMP from 'c/customQuoteCMP';
import Toast from 'lightning/toast';
import getCountryPicklistValues from '@salesforce/apex/customInvoiceCreateController.getCountryPicklistValues';
import getStatePicklistValues from '@salesforce/apex/customInvoiceCreateController.getStatePicklistValues';
import getmasterTemplate from '@salesforce/apex/customInvoiceCreateController.getmasterTemplate';
import getAdminConfig from '@salesforce/apex/AdminSettingController.getAdminConfig';
import createInvoiceRecord from '@salesforce/apex/customInvoiceCreateController.createInvoiceRecord';
import updateInvoiceRecord from '@salesforce/apex/customInvoiceCreateController.updateInvoiceRecord';
import getQuoteDetails from '@salesforce/apex/customInvoiceCreateController.getQuoteDetails';
import getInvoiceDetails from '@salesforce/apex/customInvoiceCreateController.getInvoiceDetails';
import createQuoteWithChildren from '@salesforce/apex/customInvoiceCreateController.createQuoteWithChildren';

export default class CustomQuoteCreateCmp extends LightningElement {
    @api parentId;
    @api recordId;
    @api objectApiName;
    @track isEditable
    @track createdInvoiceId = '';
    @track invoiceName;
    @track expirationDate;
    @track status;
    @track tax;
    @track firstname;
    @track lastname;
    @track streetaddress;
    @track city;
    @track zipcode;
    @track state;
    @track letterFromOwner;
    @track layoutName;
    @track pdate;
    @track successMessage = '';
    @track errorMessage = '';

    @track currentStep = 1;
    @track isFirstStep = true;
    @track isSecondStep = false;
    @track isThirdStep = false;
    @track layoutAvailabel = false;
    @track selectedValue = '';
    @track options = [];
    loaded = false;
    isFromQuote = true;
    pageSize = 5;
    currentPage = 1;



    statusOptions = [
        { label: 'Draft', value: 'Draft' },
        { label: 'Needs Review', value: 'Needs Review' },
        { label: 'In Review', value: 'In Review' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Presented', value: 'Presented' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Denied', value: 'Denied' }
    ];

    @track billingAddress = {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
    };

    @track shippingAddress = {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
    };

    @track previousValues = {
        invoiceName: '',
        expirationDate: '',
        status: '',
        tax: ''
    };

    @track countryOptions = [];
    @track billingProvinceOptions = [];
    @track shippingProvinceOptions = [];

    @track selectedCountryForBilling = '';
    @track selectedCountryForShipping = '';
    currentLayoutId = '';

    get totalPages() {
        return Math.ceil(this.options.length / this.pageSize);
    }

    get paginatedOptions() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.options.slice(start, start + this.pageSize);
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === this.totalPages;
    }

    handleRadioChange(event) {
        this.selectedValue = event.target.value;
        console.log('Selected Template ID:', this.selectedValue);

        this.options = this.options.map(opt => {
            return {
                ...opt,
                checked: opt.value === this.selectedValue
            };
        });
    }

    handleNext() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
        }
    }

    handlePrev() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
    }





    // Fetch Country Picklist Values
    @wire(getCountryPicklistValues)
    wiredCountries({ error, data }) {
        if (data) {
            this.countryOptions = data.map(country => ({
                label: country.label,
                value: country.value
            }));
        } else if (error) {
            console.error(error);
        }
    }

    connectedCallback() {
        console.log('parentId from Aura:', this.parentId);
        console.log('recordId from Aura:', this.recordId);
        console.log('objectApiName from Aura:', this.objectApiName);
        this.loaded = true;
        this.getQuoteDetailsFromApex();
        console.log('templetid....', this.templateId);
        this.loadConfig();
    }
    @track linkOpportunity = false;

    loadConfig() {
        getAdminConfig()
            .then(adminResult => {
                console.log('Admin Config:', adminResult);

                // Checkbox values direct Boolean hoti hain
                this.linkOpportunity = adminResult.Link_With_Opportunity__c === true;
                console.log('Link_With_Opportunity__c:', this.linkOpportunity);

                console.log('ParentId:', this.parentId);
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }





    getQuoteDetailsFromApex() {
        const targetInvoiceId = this.activeInvoiceId;

        if (targetInvoiceId) {
            getInvoiceDetails({ recordId: targetInvoiceId })
                .then(result => {
                    if (result) {
                        this.isFirstStep = true;
                        this.isSecondStep = false;
                        this.isThirdStep = false;

                        this.layoutName = result.Layout_Name__c;
                        this.currentLayoutId = result.LayoutId__c || '';
                        this.layoutAvailabel = !!this.layoutName;

                        this.invoiceName = result.Name || '';
                        this.expirationDate = result.Expiration_Date__c || '';
                        this.status = result.Status__c || '';
                        this.tax = result.Tax__c || '';

                        this.billingAddress = {
                            street: result.Bill_to__Street__s || '',
                            city: result.Bill_to__City__s || '',
                            province: result.Bill_to__StateCode__s || '',
                            postalCode: result.Bill_to__PostalCode__s || '',
                            country: result.Bill_to__CountryCode__s || ''
                        };

                        this.shippingAddress = {
                            street: result.Ship_To__Street__s || '',
                            city: result.Ship_To__City__s || '',
                            province: result.Ship_To__StateCode__s || '',
                            postalCode: result.Ship_To__PostalCode__s || '',
                            country: result.Ship_To__CountryCode__s || ''
                        };
                    }
                })
                .then(() => {
                    this.getmasterTemplateRadioGroup();
                })
                .catch(error => {
                    console.error('Invoice edit load error', error);
                    this.showToast('Error', error.body?.message || 'Failed to load invoice details', 'error');
                    this.loaded = false;
                });
            return;
        }

        if (!this.parentId) {
            this.loaded = false;
            return;
        }

        getQuoteDetails({ recordId: this.parentId })
            .then(result => {
                if (result) {
                    this.layoutName = result.Layout_Name__c;
                    this.currentLayoutId = result.LayoutId__c || '';
                    this.layoutAvailabel = !!this.layoutName;

                    this.invoiceName = result.Name || '';
                    this.expirationDate = result.Expiration_Date__c || '';
                    this.status = result.Status__c || '';
                    this.tax = result.Tax__c || '';
                    this.firstname = result.First_Name__c || '';
                    this.lastname = result.Last_Name__c || '';
                    this.streetaddress = result.Street_Address__c || '';
                    this.city = result.City__c || '';
                    this.state = result.State_Province__c || '';
                    this.zipcode = result.Zip_code_Postal_code__c || '';
                    this.letterFromOwner = result.Letter_from_the_owner__c || '';
                    this.pdate = result.Date__c || '';

                    this.billingAddress = {
                        street: result.Bill_To__Street__s || '',
                        city: result.Bill_To__City__s || '',
                        province: result.Bill_To__StateCode__s || '',
                        postalCode: result.Bill_To__PostalCode__s || '',
                        country: result.Bill_To__CountryCode__s || ''
                    };

                    this.shippingAddress = {
                        street: result.Ship_To__Street__s || '',
                        city: result.Ship_To__City__s || '',
                        province: result.Ship_To__StateCode__s || '',
                        postalCode: result.Ship_To__PostalCode__s || '',
                        country: result.Ship_To__CountryCode__s || ''
                    };
                }
            })
            .then(() => {
                this.getmasterTemplateRadioGroup();
            })
            .catch(error => {
                console.error(error);
                this.loaded = false;
            });
    }



   getmasterTemplateRadioGroup() {
    this.loaded = true;
    this.options = [];

    getmasterTemplate({ templateName: this.layoutName })
        .then(data => {
            if (data && data.length) {
                const template = data[0];

                this.selectedValue = template.Id;

                this.options = [{
                    value: template.Id,
                    label: template.Layout_Name__c,
                    checked: true
                }];

                this.layoutAvailabel = true;
            }

            this.loaded = false;
        })
        .catch(error => {
            console.error(error);
            this.loaded = false;
        });
}



    // Fetch State/Province Picklist Values based on the selected country for Billing Address
    fetchBillingProvinceOptions(countryCode) {
        getStatePicklistValues({ countryCode })
            .then((result) => {
                this.billingProvinceOptions = result;
                this.billingAddress.province = '';
            })
            .catch((error) => {
                console.error('Error fetching state values: ', error);
                this.billingProvinceOptions = [];
            });
    }

    fetchShippingProvinceOptions(countryCode) {
        getStatePicklistValues({ countryCode })
            .then((result) => {
                this.shippingProvinceOptions = result;
                this.shippingAddress.province = '';
            })
            .catch((error) => {
                console.error('Error fetching shipping state values: ', error);
                this.shippingProvinceOptions = [];
            });
    }


    // Fetch State/Province Picklist Values based on the selected country for Shipping Address
    // handleShipToCountryChange(event) {
    //     const countryValue = event.detail.value;
    //     this.shippingAddress.country = countryValue;

    //     getStatePicklistValues({ country: countryValue })
    //         .then(data => {
    //             this.shippingProvinceOptions = data.map(state => ({
    //                 label: state.label,
    //                 value: state.value
    //             }));
    //         })
    //         .catch(error => {
    //             console.error(error);
    //         });
    // }

    // Update Billing Address on Province Change
    handleBillToProvinceChange(event) {
        this.billingAddress.province = event.detail.value;
    }

    // Update Shipping Address on Province Change
    handleShipToProvinceChange(event) {
        this.shippingAddress.province = event.detail.value;
    }

    handleBillToAddressChange(event) {
        const { street, city, postalCode, province, country } = event.detail;

        // Check if country changed
        const previousCountry = this.billingAddress.country;
        this.billingAddress = { ...this.billingAddress, street, city, postalCode, province, country };

        if (country && country !== previousCountry) {
            this.fetchBillingProvinceOptions(country);
        }
    }

    handleShipToAddressChange(event) {
        const { street, city, postalCode, province, country } = event.detail;

        const previousCountry = this.shippingAddress.country;
        this.shippingAddress = { ...this.shippingAddress, street, city, postalCode, province, country };

        if (country && country !== previousCountry) {
            this.fetchShippingProvinceOptions(country);
        }
    }

    handleInputChange(event) {
        console.log('recordId from Aura:', this.recordId); // Should be defined now
        console.log('objectApiName from Aura:', this.objectApiName);
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    /*saveAndNext() {
        const quoteNameInput = this.template.querySelector('lightning-input[data-field="quoteName"]');
        const expirationDateInput = this.template.querySelector('lightning-input[data-field="expirationDate"]');
        const statusInput = this.template.querySelector('lightning-combobox[data-field="status"]');

        const isQuoteNameValid = quoteNameInput.reportValidity();
        const isExpirationDateValid = expirationDateInput.reportValidity();
        const isStatusValid = statusInput.reportValidity();

        // Proceed only if all required fields are valid
        if (isQuoteNameValid && isExpirationDateValid && isStatusValid) {

            // Check if values have changed
            const hasValuesChanged = !(
                this.quoteName === this.previousValues.quoteName &&
                this.expirationDate === this.previousValues.expirationDate &&
                this.status === this.previousValues.status &&
                this.tax === this.previousValues.tax
            );

            if (!hasValuesChanged) {
                // No changes but still allow navigation
                this.showToast('Info', 'No values were changed. The record is already updated.', 'info');
            } else {
                // Values changed, proceed with save and show success
                this.showToast('Success', 'Record saved successfully!', 'success');

                // Save the current values as the previous values
                this.previousValues = {
                    quoteName: this.quoteName,
                    expirationDate: this.expirationDate,
                    status: this.status,
                    tax: this.tax
                };
            }

            // Move to the second step whether or not values changed
            this.isFirstStep = false;
            this.isSecondStep = true;
            this.currentStep++;

        } else {
            // Show error toast if required fields are missing
            this.showToast('Error', 'Please fill in all required fields.', 'error');
        }
    }*/

    /*saveAndNext(){
        console.log('##-- OUTPUT-- quoteName--: : ',this.quoteName);
        console.log('##-- OUTPUT-- expirationDate--: : ',this.expirationDate);
        console.log('##-- OUTPUT-- status--: : ',this.status);
        console.log('##-- OUTPUT-- tax--: : ',this.tax);
        console.log('##-- OUTPUT-- selectedValue--: : ',this.selectedValue);
        console.log('##-- OUTPUT-- this.billingAddress--: : ',JSON.stringify(this.billingAddress));
        console.log('##-- OUTPUT-- this.billingAddress--: : ',this.billingAddress.street);
        console.log('##-- OUTPUT-- this.billingAddress--: : ',this.billingAddress.city);
        console.log('##-- OUTPUT-- this.billingAddress--: : ',this.billingAddress.province);
        console.log('##-- OUTPUT-- this.shippingAddress--: : ',JSON.stringify(this.shippingAddress));
    }*/

    saveAndNext() {
        this.loaded = true;

        if (!this.invoiceName) {
            this.showToast('Error', 'Invoice Name is required field.', 'error');
            this.loaded = false;
            return;
        } else if (!this.expirationDate) {
            this.showToast('Error', 'Expiration Date is required field.', 'error');
            this.loaded = false;
            return;
        } else if (!this.status) {
            this.showToast('Error', 'Status is required field.', 'error');
            this.loaded = false;
            return;
        }

        this.isEditable = false;
        if (this.recordId == undefined) {
            console.log('if Invoice ID is present : ', this.recordId);
            var invoiceObj = {
                'Name': this.invoiceName,
                'Expiration_Date__c': this.expirationDate,
                'Status__c': this.status,
                'Tax__c': this.tax,
                'Bill_to__Street__s': this.billingAddress.street,
                'Bill_to__City__s': this.billingAddress.city,
                'Bill_to__StateCode__s': this.billingAddress.province,
                'Bill_to__PostalCode__s': this.billingAddress.postalCode,
                'Bill_to__CountryCode__s': this.billingAddress.country,
                'Ship_To__Street__s': this.shippingAddress.street,
                'Ship_To__City__s': this.shippingAddress.city,
                'Ship_To__StateCode__s': this.shippingAddress.province,
                'Ship_To__PostalCode__s': this.shippingAddress.postalCode,
                'Ship_To__CountryCode__s': this.shippingAddress.country,
                'First_Name__c': this.firstname,
                'Last_Name__c': this.lastname,
                'Street_Address__c': this.streetaddress,
                'City__c': this.city,
               'State_Province__c': this.state,
                'Zip_code_Postal_code__c': this.zipcode,
                'Letter_from_the_owner__c': this.letterFromOwner,
                //'Date__c': this.pdate,
                'Quotes__c': this.parentId,
                'Quotes_Name__c': this.parentId
            }
            console.log('invoiceObj if --- ', JSON.stringify(invoiceObj));
            createInvoiceRecord({
                invoiceWrapMap: invoiceObj
            })
                .then(result => {
                    this.createdInvoiceId = result;
                    this.recordId = this.createdInvoiceId;
                    console.log('createdInvoiceId : ', this.createdInvoiceId);
                    this.showToast('Success', 'Invoice record created successfully!', 'success');

                    const openEditor = () => {
                        this.isFirstStep = false;
                        this.isSecondStep = false;
                        this.isThirdStep = true;
                        this.currentStep = 2;
                        this.loaded = false;
                    };

                    if (this.parentId) {
                        createQuoteWithChildren({ quoteId: this.parentId, invoiceId: this.activeInvoiceId })
                            .then(layoutId => {
                                this.currentLayoutId = layoutId || this.currentLayoutId;
                                this.selectedValue = this.currentLayoutId;
                                openEditor();
                            })
                            .catch(error => {
                                console.error(error);
                                this.loaded = false;
                                this.showToast('Error', error.body?.message || 'Failed to sync invoice from quote', 'error');
                            });
                    } else {
                        openEditor();
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.loaded = false;
                    this.showToast('Error', 'Failed to create invoice record.', 'error');
                });

        }
        else {
            this.isEditable = true;
            console.log('else Invoice ID is present : ', this.recordId);
            var invoiceObj = {
                'Name': this.invoiceName,
                'Expiration_Date__c': this.expirationDate,
                'Status__c': this.status,
                'Tax__c': this.tax,
                'Bill_to__Street__s': this.billingAddress.street,
                'Bill_to__City__s': this.billingAddress.city,
                'Bill_to__StateCode__s': this.billingAddress.province,
                'Bill_to__PostalCode__s': this.billingAddress.postalCode,
                'Bill_to__CountryCode__s': this.billingAddress.country,
                'Ship_To__Street__s': this.shippingAddress.street,
                'Ship_To__City__s': this.shippingAddress.city,
                'Ship_To__StateCode__s': this.shippingAddress.province,
                'Ship_To__PostalCode__s': this.shippingAddress.postalCode,
                'Ship_To__CountryCode__s': this.shippingAddress.country,
                'First_Name__c': this.firstname,
                'Last_Name__c': this.lastname,
                'Street_Address__c': this.streetaddress,
                'City__c': this.city,
                'State_Province__c': this.state,
                'Zip_code_Postal_code__c': this.zipcode,
                'Letter_from_the_owner__c': this.letterFromOwner,
                'Date__c': this.pdate,
                'Id': this.recordId,
                'Quotes__c': this.parentId,
                'Quotes_Name__c': this.parentId
            }
            console.log('quoteObj else--- ', JSON.stringify(invoiceObj));
            updateInvoiceRecord({
                invoiceWrapMap: invoiceObj
            })
                .then(result => {
                    this.createdInvoiceId = result;
                    console.log('createdInvoiceId : ', this.createdInvoiceId);
                    this.isFirstStep = false;
                    this.isSecondStep = false;
                    this.isThirdStep = true;
                    this.currentStep = 2;
                    this.showToast('Success', 'Invoice record updated successfully!', 'success');
                    this.loaded = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.showToast('Error', 'Failed to update invoice record.', 'error');
                    this.loaded = false;
                });
        }

    }

    handleSave() {
        this.refs.quoteForm.updateQuote();
    }



    showToast(title, message, variant) {
        // const toastEvent = new ShowToastEvent({
        //     title: title,
        //     message: message,
        //     variant: variant
        // });
        // this.dispatchEvent(toastEvent);

        Toast.show({
            label: title,
            message: message,
            mode: 'dismissible',
            variant: variant
        }, this);
    }

    handleSecondPrevious() {
        this.isFirstStep = true;
        this.isSecondStep = false;
        this.isThirdStep = false;
        this.currentStep = 1;
    }


    // Go back to the first step
    handlePrevious() {
        this.isFirstStep = true;
        this.isSecondStep = false;
        this.isThirdStep = false;
        this.currentStep = 1;
        this.recordId = this.createdInvoiceId;
        console.log('recordId  createdInvoiceId:-  -  - ', this.recordId);
    }

    handleCancel() {
        history.back();
    }

    resetForm() {
        this.invoiceName = '';
        this.expirationDate = '';
        this.status = '';
        this.tax = '';
        this.billingAddress = {
            street: '',
            city: '',
            province: '',
            postalCode: '',
            country: ''
        };
        this.shippingAddress = {
            street: '',
            city: '',
            province: '',
            postalCode: '',
            country: ''
        };
        this.successMessage = '';
        this.errorMessage = '';
        this.currentStep = 1;
        this.isFirstStep = true;
        this.isSecondStep = false;
        this.isThirdStep = false;
    }


    finalizeQuote() {
        this.successMessage = 'Quote has been successfully created!';
        this.errorMessage = '';
        this.resetForm();
    }


    // @track isModalOpen = false;
    // @track recordId;

    handelnextpage() {
        this.isFirstStep = false;
        this.isSecondStep = false;
        this.isThirdStep = true;
        this.currentStep = 2;
        this.loaded = false;
    }

    get activeInvoiceId() {
        return this.createdInvoiceId || this.recordId;
    }





    // handleRadioChange(event) {

    //     this.selectedValue = event.detail.value;
    //     console.log('this.selectedValue---: ', this.selectedValue);
    // }

    openPDF() {
        window.open('/apex/invoicePDFpage?id=' + this.activeInvoiceId);

    }

    //----------EMAIL ----

    @track isEmailModalOpen = false;
    handleOpenModal() {
        this.isEmailModalOpen = true;
    }

    handleCloseModal() {
        this.isEmailModalOpen = false;
    }


    @track isModalVisible = false;
    modalTitle = 'Preview';
    iframeSourceUrl;

    // Open the modal and set iframe source
    handleOpenModalPdf() {
        this.iframeSourceUrl = '/apex/invoicePDFpage?id=' + this.activeInvoiceId; 
        this.isModalVisible = true;
    }

    // Close modal
    handleCloseModalPdf() {
        this.isModalVisible = false;
        this.iframeSourceUrl = null;
    }

}