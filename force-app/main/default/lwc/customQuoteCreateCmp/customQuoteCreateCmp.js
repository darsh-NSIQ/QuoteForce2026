import { LightningElement, track, wire, api } from 'lwc';
import customQuoteCMP from 'c/customQuoteCMP';
import Toast from 'lightning/toast';
import getCountryPicklistValues from '@salesforce/apex/customQuoteCreateController.getCountryPicklistValues';
import getStatePicklistValues from '@salesforce/apex/customQuoteCreateController.getStatePicklistValues';
import getmasterTemplate from '@salesforce/apex/customQuoteCreateController.getmasterTemplate';
import getAdminConfig from '@salesforce/apex/AdminSettingController.getAdminConfig';
import createQuotesRecord from '@salesforce/apex/customQuoteCreateController.createQuotesRecord';
import getAddressFromAccount from '@salesforce/apex/customQuoteCreateController.getAddressFromAccount';
import updateQuotesRecord from '@salesforce/apex/customQuoteCreateController.updateQuotesRecord';
import getQuoteDetails from '@salesforce/apex/customQuoteCreateController.getQuoteDetails';
import createQuoteWithChildren from '@salesforce/apex/customQuoteCreateController.createQuoteWithChildren';

export default class CustomQuoteCreateCmp extends LightningElement {
    @api parentId;
    @api recordId;
    @api objectApiName;
    @track isEditable
    @track createdQuoteId = '';
    @track quoteName;
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
        quoteName: '',
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
        this.loaded = true;
        console.log('parentId from Aura:', this.parentId);
        console.log('objectApiName from Aura:', this.objectApiName);
        this.getQuoteDetailsFromApex()
            .then(() => this.getmasterTemplateRadioGroup())
            .finally(() => {
                console.log('templetid....', this.templateId);
                this.loadConfig();
            });
    }
    @track linkOpportunity = false;

    loadConfig() {
        getAdminConfig()
            .then(adminResult => {
                console.log('Admin Config:', adminResult);

                // Checkbox values direct Boolean hoti hain
                this.linkOpportunity = adminResult.Link_With_Opportunity__c === true;
                if (!this.currencyType && adminResult.Currency__c) {
                    this.currencyType = adminResult.Currency__c;
                }
                console.log('Link_With_Opportunity__c:', this.linkOpportunity);

                console.log('ParentId:', this.parentId);

                if (adminResult.Fecth_Address_From_Account__c === true && this.parentId) {
                    getAddressFromAccount({ recordId: this.parentId })
                        .then(parentResult => {
                            this.billingAddress.street = parentResult.Account.BillingAddress.street;
                            this.billingAddress.city = parentResult.Account.BillingAddress.city;
                            this.billingAddress.province = parentResult.Account.BillingAddress.state;
                            this.billingAddress.postalCode = parentResult.Account.BillingAddress.postalCode;
                            this.billingAddress.country = parentResult.Account.BillingAddress.country;

                            // Example: Ship To address
                            this.shippingAddress.street = parentResult.Account.ShippingAddress.street;
                            this.shippingAddress.city = parentResult.Account.ShippingAddress.city;
                            this.shippingAddress.province = parentResult.Account.ShippingAddress.state;
                            this.shippingAddress.postalCode = parentResult.Account.ShippingAddress.postalCode;
                            this.shippingAddress.country = parentResult.Account.ShippingAddress.country;
                            console.log('Parent Config:', parentResult);
                            // yaha aapko parent ki values handle karni hain
                        })
                        .catch(error => {
                            console.log('Error fetching parent config:', JSON.stringify(error));

                            // this.showToast('Error', error.body.message, 'error');
                        });
                }
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            });
    }





    getQuoteDetailsFromApex() {
        if (!this.recordId) {
            return Promise.resolve();
        }

        return getQuoteDetails({ recordId: this.recordId })
            .then(result => {
                console.log('Quote details:', result);
                if (result) {
                    this.quoteName = result.Name;
                    this.expirationDate = result.Expiration_Date__c;
                    this.status = result.Status__c;
                    this.tax = result.Tax__c;

                    // Example: Bill To address
                    this.billingAddress.street = result.Bill_To__Street__s;
                    this.billingAddress.city = result.Bill_To__City__s;
                    this.billingAddress.province = result.Bill_To__StateCode__s;
                    this.billingAddress.postalCode = result.Bill_To__PostalCode__s;
                    this.billingAddress.country = result.Bill_To__CountryCode__s;
                    this.currencyType = result.Currency__c;

                    // Example: Ship To address
                    this.shippingAddress.street = result.Ship_To__Street__s;
                    this.shippingAddress.city = result.Ship_To__City__s;
                    this.shippingAddress.province = result.Ship_To__StateCode__s;
                    this.shippingAddress.postalCode = result.Ship_To__PostalCode__s;
                    this.shippingAddress.country = result.Ship_To__CountryCode__s;
                    this.currentLayoutId = result.LayoutId__c || '';
                    this.selectedValue = result.LayoutId__c || result.Layout_Name__c;

                    this.options = this.options.map(opt => {
                        return {
                            ...opt,
                            checked: opt.value === this.selectedValue
                        };
                    });

                    if (result.Layout_Name__c == '') {
                        this.layoutAvailabel = false;
                    }
                    else {
                        this.layoutAvailabel = true;
                    }
                    this.loaded = false;
                }
                this.loaded = false;
            })
            .catch(error => {
                // console.error('Error fetching quote details:', error);
                this.loaded = false;
            });
    }


    getmasterTemplateRadioGroup() {
        this.loaded = true;
        getmasterTemplate()
            .then(data => {
                console.log('Data - - - -:', data);
                data.map(element => {
                    this.options = [...this.options, {
                        value: element.Id,
                        label: element.Layout_Name__c,
                        checked: (element.Id === this.selectedValue)
                    }]

                });
                console.log('this.options ======: ', JSON.stringify(this.options));
                // data.forEach(element => {
                //     const targetQuoteId = this.activeQuoteId;
                const shouldApplyTemplate = !this.currentLayoutId || this.currentLayoutId !== this.selectedValue;

                if (shouldApplyTemplate) {

                    //         if (element.IsDefault__c == true) {
                    //             this.selectedValue = element.Id;
                    //         }
                    //     }
                    // });
                    // console.log('this.selectedValue : ', this.selectedValue);
                    if (this.layoutAvailabel === false) {
                        let defaultOption = data.find(el => el.IsDefault__c === true);
                        if (defaultOption) {
                            this.selectedValue = defaultOption.Id;
                            this.options = this.options.map(opt => {
                                return {
                                    ...opt,
                                    checked: opt.value === this.selectedValue
                                };
                            });
                        }
                    }
                    this.loaded = false;
                }

            })
            .catch(error => {
                this.loaded = false;
                console.error(error);
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

        if (!this.quoteName) {
            this.showToast('Error', 'Quote Name is required field.', 'error');
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
        } else if (!this.currencyType) {
            this.showToast('Error', 'Currency is required field.', 'error');
            this.loaded = false;
            return;
        }

        this.isEditable = false;
        if (this.recordId == undefined) {
            console.log('if Quote ID is present : ', this.recordId);
            var quoteObj = {
                'Name': this.quoteName,
                'Expiration_Date__c': this.expirationDate,
                'Status__c': this.status,
                'Tax__c': this.tax,
                'Currency__c': this.currencyType,
                'Bill_To__Street__s': this.billingAddress.street,
                'Bill_To__City__s': this.billingAddress.city,
                'Bill_To__StateCode__s': this.billingAddress.province,
                'Bill_To__PostalCode__s': this.billingAddress.postalCode,
                'Bill_To__CountryCode__s': this.billingAddress.country,
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
                'Opportunity__c': (this.linkOpportunity == true) ? this.parentId : ''
            }
            console.log('quoteObj if --- ', JSON.stringify(quoteObj));
            createQuotesRecord({
                quoteWrapMap: quoteObj
            })
                .then(result => {
                    this.createdQuoteId = result;
                    this.recordId = this.createdQuoteId;
                    console.log('createdQuoteId : ', this.createdQuoteId);
                    this.showToast('Success', 'Quote record created successfully!', 'success');

                    // move to next step
                    this.isFirstStep = false;
                    this.isSecondStep = true;
                    this.currentStep++;
                    this.loaded = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.loaded = false;
                    this.showToast('Error', 'Failed to create quote record.', 'error');
                });

        }
        else {
            this.isEditable = true;
            console.log('else Quote ID is present : ', this.recordId);
            var quoteObj = {
                'Name': this.quoteName,
                'Expiration_Date__c': this.expirationDate,
                'Status__c': this.status,
                'Tax__c': this.tax,
                'Currency__c': this.currencyType,
                'Bill_To__Street__s': this.billingAddress.street,
                'Bill_To__City__s': this.billingAddress.city,
                'Bill_To__StateCode__s': this.billingAddress.province,
                'Bill_To__PostalCode__s': this.billingAddress.postalCode,
                'Bill_To__CountryCode__s': this.billingAddress.country,
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
                'Id': this.recordId
            }
            console.log('quoteObj else--- ', JSON.stringify(quoteObj));
            updateQuotesRecord({
                quoteWrapMap: quoteObj
            })
                .then(result => {
                    this.createdQuoteId = result;
                    console.log('createdQuoteId : ', this.createdQuoteId);
                    // move to next step
                    this.isFirstStep = false;
                    this.isSecondStep = true;
                    this.currentStep++;
                    this.showToast('Success', 'Quote record updated successfully!', 'success');
                    this.loaded = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.showToast('Error', 'Failed to update quote record.', 'error');
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
        this.isSecondStep = true;
        this.isThirdStep = false;
        this.isFirstStep = false;
    }


    // Go back to the first step
    handlePrevious() {
        this.isFirstStep = true;
        this.isSecondStep = false;
        this.currentStep--;
        this.recordId = this.createdQuoteId;
        console.log('recordId  createdQuoteId:-  -  - ', this.recordId);
    }

    handleCancel() {
        history.back();
    }

    resetForm() {
        this.quoteName = '';
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
        this.loaded = true;

        if (this.selectedValue == '') {
            this.showToast('Quote Template Is Required', 'Please Choose a Quote Template', 'error');
            this.loaded = false;
            return;
        }

        const targetQuoteId = this.activeQuoteId;
        const shouldApplyTemplate = !this.currentLayoutId || this.currentLayoutId !== this.selectedValue;

        if (shouldApplyTemplate) {
            createQuoteWithChildren({
                mtId: this.selectedValue, quoteId: targetQuoteId
            })
                .then(result => {
                    this.layoutAvailabel = true;
                    this.currentLayoutId = this.selectedValue;
                    console.error('result:', result);
                    this.loaded = false;
                })
                .catch(error => {
                    console.error('Error:', error);
                    this.loaded = false;
                    this.showToast('Error', 'Failed to create quote record.', 'error');
                });
        }



        // var quoteObj = {
        //     'Layout_Name__c': this.selectedValue,
        //     'Id': this.recordId
        // }
        // console.log('quoteObj else--- ', JSON.stringify(quoteObj));
        // updateQuotesRecord({
        //     quoteWrapMap: quoteObj
        // })
        //     .then(result => {
        this.isThirdStep = true;
        this.isSecondStep = false;
        // this.getQuoteDetailsFromApex();
        //         this.showToast('Success', 'Quote record updated successfully!', 'success');
        //     })
        //     .catch(error => {
        //         console.error('Error:', error);
        //         this.showToast('Error', 'Failed to create quote record.', 'error');
        //     });

    }



    // handleRadioChange(event) {

    //     this.selectedValue = event.detail.value;
    //     console.log('this.selectedValue---: ', this.selectedValue);
    // }

    openPDF() {
        window.open('/apex/quotePDFpage?id=' + this.activeQuoteId);

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
        this.iframeSourceUrl = '/apex/quotePDFpage?id=' + this.activeQuoteId;
        this.isModalVisible = true;
    }

    // Close modal
    handleCloseModalPdf() {
        this.isModalVisible = false;
        this.iframeSourceUrl = null;
    }

    @track currencyType = '';

    currencyOptions = [
        { label: 'USD ($)', value: 'USD' },
        { label: 'INR (???)', value: 'INR' },
        { label: 'EUR (???)', value: 'EUR' },
        { label: 'GBP (??)', value: 'GBP' }
    ];

    get activeQuoteId() {
        return this.createdQuoteId || this.recordId;
    }
}