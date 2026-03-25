import { LightningElement, track, wire, api } from 'lwc';
import Toast from 'lightning/toast';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';

import QUOTE_OBJECT from '@salesforce/schema/Quotes__c';
import BILL_TO_COUNTRY from '@salesforce/schema/Quotes__c.Bill_To__c';
import BILL_TO_STATE from '@salesforce/schema/Quotes__c.Bill_To__c';
// import getCountryPicklistValues from '@salesforce/apex/customQuoteCreateController.getCountryPicklistValues';
// import getStatePicklistValues from '@salesforce/apex/customQuoteCreateController.getStatePicklistValues';
import getmasterTemplate from '@salesforce/apex/customQuoteCreateController.getmasterTemplate';
import updateQuotesRecord from '@salesforce/apex/customQuoteCreateController.updateQuotesRecord';
import getQuoteDetails from '@salesforce/apex/customQuoteCreateController.getQuoteDetails';
import saveAsNewVersion from '@salesforce/apex/saveAsNewVersion.saveAsNewVersion';

export default class CustomQuoteEditCmp extends LightningElement {
    
    @api parentId;
    @api recordId;
    @api objectApiName;
    @track isEditable
    @track createdQuoteId = '';
    @track quoteName;
    @track expirationDate;
    @track opportunityId;
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
    @track isAvailable = false;
    @track isSecondStep = false;
    @track isThirdStep = false;
    @track layoutAvailabel = false;
    @track selectedValue = '';
    @track options = [];
    isFromQuote = true;
    pageSize = 5;
    currentPage = 1;
    recordTypeId;
allStateValues;



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
    // @wire(getCountryPicklistValues)
    // wiredCountries({ error, data }) {
    //     if (data) {
    //         this.countryOptions = data.map(country => ({
    //             label: country.label,
    //             value: country.value
    //         }));
    //     } else if (error) {
    //         console.error(error);
    //     }
    // }
      @wire(getObjectInfo, { objectApiName: QUOTE_OBJECT })
objectInfo({ data }) {
    if (data) {
        this.recordTypeId = data.defaultRecordTypeId;
    }
}



// @wire(getPicklistValues, {
//     recordTypeId: '$recordTypeId',
//     fieldApiName: BILL_TO_COUNTRY
// })
// countryValues({ data }) {
//     if (data) {
//         this.countryOptions = data.values;
//     }
// }

@wire(getPicklistValues, {
    recordTypeId: '$recordTypeId',
    fieldApiName: BILL_TO_COUNTRY
})
countryValues({ data, error }) {
    if (data) {
        this.countryOptions = data.values;
    } else if (error) {
        console.error(error);
    }
}



@wire(getPicklistValues, {
    recordTypeId: '$recordTypeId',
    fieldApiName: BILL_TO_STATE
})
stateValues({ data }) {
    if (data) {
        this.allStateValues = data;
    }
}


    connectedCallback() {
        console.log('parentId from Aura:', this.parentId); // Should be defined now
        console.log('objectApiName from Aura:', this.objectApiName); // Should be defined now
        this.getQuoteDetailsFromApex();
        this.getmasterTemplateRadioGroup();
    }
    getQuoteDetailsFromApex() {
        getQuoteDetails({ recordId: this.recordId })
            .then(result => {
                console.log('Quote details:', result);
                if (result) {
                    this.quoteName = result.Name;
                    this.expirationDate = result.Expiration_Date__c;
                    this.status = result.Status__c;
                    this.tax = result.Tax__c;
                    this.opportunityId = result.Opportunity__c;
                    this.opportunityId = result.Opportunity__c;
                    this.isAvailable = (this.opportunityId !== null && this.opportunityId !== undefined);

                    // Example: Bill To address
                    this.billingAddress.street = result.Bill_To__Street__s;
                    this.billingAddress.city = result.Bill_To__City__s;
                    this.billingAddress.province = result.Bill_To__StateCode__s;
                    this.billingAddress.postalCode = result.Bill_To__PostalCode__s;
                    this.billingAddress.country = result.Bill_To__CountryCode__s;

                    // Example: Ship To address
                    this.shippingAddress.street = result.Ship_To__Street__s;
                    this.shippingAddress.city = result.Ship_To__City__s;
                    this.shippingAddress.province = result.Ship_To__StateCode__s;
                    this.shippingAddress.postalCode = result.Ship_To__PostalCode__s;
                    this.shippingAddress.country = result.Ship_To__CountryCode__s;
                    // Auto load billing provinces if country already present
if (this.billingAddress.country && this.allStateValues) {
    const key = this.allStateValues.controllerValues[this.billingAddress.country];
    this.billingProvinceOptions =
        this.allStateValues.values.filter(
            state => state.validFor.includes(key)
        );
}

// Auto load shipping provinces if country already present
if (this.shippingAddress.country && this.allStateValues) {
    const key = this.allStateValues.controllerValues[this.shippingAddress.country];
    this.shippingProvinceOptions =
        this.allStateValues.values.filter(
            state => state.validFor.includes(key)
        );
}
                    this.selectedValue = result.LayoutId__c;

                    this.options = this.options.map(opt => {
                        return {
                            ...opt,
                            checked: opt.value === this.selectedValue
                        };
                    });

                    if (result.LayoutId__c == '') {
                        this.layoutAvailabel = false;
                    }
                    else {
                        this.layoutAvailabel = true;
                    }

                    console.log('this.options -- - - - : ', JSON.stringify(this.options));
                }
            })
            .catch(error => {
                // console.error('Error fetching quote details:', error);
            });
    }


    getmasterTemplateRadioGroup() {
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

            })
            .catch(error => {
                console.error(error);
            });
    }


    // Fetch State/Province Picklist Values based on the selected country for Billing Address
    // fetchBillingProvinceOptions(countryCode) {
    //     getStatePicklistValues({ countryCode })
    //         .then((result) => {
    //             this.billingProvinceOptions = result;
    //             this.billingAddress.province = '';
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching state values: ', error);
    //             this.billingProvinceOptions = [];
    //         });
    // }

    // fetchShippingProvinceOptions(countryCode) {
    //     getStatePicklistValues({ countryCode })
    //         .then((result) => {
    //             this.shippingProvinceOptions = result;
    //             this.shippingAddress.province = '';
    //         })
    //         .catch((error) => {
    //             console.error('Error fetching shipping state values: ', error);
    //             this.shippingProvinceOptions = [];
    //         });
    // }


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

    // handleBillToAddressChange(event) {
    //     const { street, city, postalCode, province, country } = event.detail;

    //     // Check if country changed
    //     const previousCountry = this.billingAddress.country;
    //     this.billingAddress = { ...this.billingAddress, street, city, postalCode, province, country };

    //     if (country && country !== previousCountry) {
    //         this.fetchBillingProvinceOptions(country);
    //     }
    // }
handleBillToAddressChange(event) {

    const { street, city, postalCode, province, country } = event.detail;

    const previousCountry = this.billingAddress.country;

    this.billingAddress = { ...this.billingAddress, street, city, postalCode, province, country };

    if (country && country !== previousCountry && this.allStateValues) {

        const key = this.allStateValues.controllerValues[country];

        this.billingProvinceOptions =
            this.allStateValues.values.filter(
                state => state.validFor.includes(key)
            );
    }
}

      
        handleShipToAddressChange(event) {

    const { street, city, postalCode, province, country } = event.detail;

    const previousCountry = this.shippingAddress.country;

    this.shippingAddress = { ...this.shippingAddress, street, city, postalCode, province, country };

    if (country && country !== previousCountry && this.allStateValues) {

        const key = this.allStateValues.controllerValues[country];

        this.shippingProvinceOptions =
            this.allStateValues.values.filter(
                state => state.validFor.includes(key)
            );
    }
}



    // handleShipToAddressChange(event) {
    //     const { street, city, postalCode, province, country } = event.detail;

    //     const previousCountry = this.shippingAddress.country;
    //     this.shippingAddress = { ...this.shippingAddress, street, city, postalCode, province, country };

    //     if (country && country !== previousCountry) {
    //         this.fetchShippingProvinceOptions(country);
    //     }
    // }

    handleInputChange(event) {
        console.log('recordId from Aura:', this.recordId); // Should be defined now
        console.log('objectApiName from Aura:', this.objectApiName);
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    saveAndNext() {

        if (!this.quoteName) {
            this.showToast('Error', 'Quote Name is required field.', 'error');
            return;
        } else if (!this.expirationDate) {
            this.showToast('Error', 'Expiration Date is required field.', 'error');
            return;
        } else if (!this.status) {
            this.showToast('Error', 'Status is required field.', 'error');
            return;
        }
        this.isEditable = true;
        console.log('else Quote ID is present : ', this.recordId);
        // var quoteObj = {
        //     'Name': this.quoteName,
        //     'Expiration_Date__c': this.expirationDate,
        //     'Status__c': this.status,
        //     'Tax__c': this.tax,
        //     'Bill_To__Street__s': this.billingAddress.street,
        //     'Bill_To__City__s': this.billingAddress.city,
        //     'Bill_To__StateCode__s': this.billingAddress.province,
        //     'Bill_To__PostalCode__s': this.billingAddress.postalCode,
        //     'Bill_To__CountryCode__s': this.billingAddress.country,
        //     'Ship_To__Street__s': this.shippingAddress.street,
        //     'Ship_To__City__s': this.shippingAddress.city,
        //     'Ship_To__StateCode__s': this.shippingAddress.province,
        //     'Ship_To__PostalCode__s': this.shippingAddress.postalCode,
        //     'Ship_To__CountryCode__s': this.shippingAddress.country,
        //     'First_Name__c': this.firstname,
        //     'Last_Name__c': this.lastname,
        //     'Street_Address__c': this.streetaddress,
        //     'City__c': this.city,
        //     'State_Province__c': this.state,
        //     'Zip_code_Postal_code__c': this.zipcode,
        //     'Letter_from_the_owner__c': this.letterFromOwner,
        //     'Date__c': this.pdate,
        //     'Id': this.recordId
        // }

        var quoteObj = {
            'Name': this.quoteName,
            'Expiration_Date__c': this.expirationDate,
            'Status__c': this.status,
            'Tax__c': this.tax,
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
            })
            .catch(error => {
                console.error('Error:', error);
                this.showToast('Error', 'Failed to update quote record.', 'error');
            });


    }

    handleSave() {
        this.refs.quoteForm.updateQuote();
    }
handleSaveAsNewVersion() {

    const targetId = this.recordId; 

    if (!targetId) {
        alert('Error: Quotes__c Record ID missing.');
        return;
    }

    saveAsNewVersion({ currentQuoteId: targetId })
        .then((newId) => {
            console.log('Clone Success. New Quotes__c ID:', newId);
            // Child logic call
            if (this.refs.quoteForm) {
                this.refs.quoteForm.updateQuote(newId); 
            }
        })
        .catch((error) => {
            const msg = error.body ? error.body.message : error.message;
            alert('Clone failed: ' + msg);
        });
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

        if (this.selectedValue == '') {
            this.showToast('Quote Template Is Required', 'Please Choose a Quote Template', 'error');
            return;
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
        window.open("/apex/quotePDFpage?id=" + this.recordId);

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
        this.iframeSourceUrl = '/apex/quotePDFpage?id='+this.recordId; 
        this.isModalVisible = true;
    }

    // Close modal
    handleCloseModalPdf() {
        this.isModalVisible = false;
        this.iframeSourceUrl = null;
    }

}