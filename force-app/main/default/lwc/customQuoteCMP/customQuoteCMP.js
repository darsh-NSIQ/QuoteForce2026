import { LightningElement, track, api, wire } from 'lwc';
import CreateMasterLayout from '@salesforce/apex/createMasterTemplateRecord.CreateMasterLayout';
import CreateCustomPage from '@salesforce/apex/createMasterTemplateRecord.CreateCustomPage';
import updateCustomPage from '@salesforce/apex/createMasterTemplateRecord.updateCustomPage';
import uploadBulkFiles from '@salesforce/apex/createMasterTemplateRecord.uploadBulkFiles';
import getLayoutRecord from '@salesforce/apex/createMasterTemplateRecord.getLayoutRecord';
import updateQuoteDetails from '@salesforce/apex/createMasterTemplateRecord.updateQuoteDetails';
import getCustomPage from '@salesforce/apex/createMasterTemplateRecord.getCustomPage';
import UpdateMasterLayout from '@salesforce/apex/createMasterTemplateRecord.UpdateMasterLayout';
import deleteFile from '@salesforce/apex/createMasterTemplateRecord.deleteFile';
import deleteLayoutPage from '@salesforce/apex/createMasterTemplateRecord.deleteLayoutPage';
import deleteQuoteFile from '@salesforce/apex/createMasterTemplateRecord.deleteQuoteFile';
import uploadFile from '@salesforce/apex/createMasterTemplateRecord.uploadFile';
import getLayouts from '@salesforce/apex/createMasterTemplateRecord.getLayouts';
import getQuoteDetails from '@salesforce/apex/createMasterTemplateRecord.getQuoteDetails';
import attachDocsToQuote from '@salesforce/apex/createMasterTemplateRecord.attachDocsToQuote';
import getQuoteDocumentLinks from '@salesforce/apex/createMasterTemplateRecord.getQuoteDocumentLinks';
import SectionUpdate from '@salesforce/apex/ProductConfigurationController.SectionUpdate';
import SectionDeleteCancel from '@salesforce/apex/ProductConfigurationController.SectionDeleteCancel';
import getAdminConfig from '@salesforce/apex/AdminSettingController.getAdminConfig';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

export default class CustomQuoteCMP extends LightningElement {

    //@api isEditMode = false;

    // to get the uploaded document URL
    @track uploadedDocUrls = {
        primaryDocUrl: undefined,
        secondaryDocUrl: undefined,
        warrantyDocUrl: undefined,
        termConditionDocUrl: undefined,
        customPageDocUrl: undefined
    }

    @track uploadedDocumentList = [];

    @track isDocAvailable = {
        primaryImageAvl: false,
        secondaryImageAvl: false,
        warrantyImageAvl: false,
        termConditionImageAvl: false,
        customPageImageAvl: false
    }

    @track contentDocId = {
        primaryDocId: undefined,
        secondaryDocId: undefined,
        warrantyDocId: undefined,
        termConDocId: undefined,
        customPageDocId: undefined
    }

    @track ElementList = [
        {
            Id: 1,
            Name: 'Title',
            label: 'Title',
            selected: true,
            editMode: false,
            toggle: false
        },
        {
            Id: 2,
            Name: 'Letter from the owner',
            label: 'Letter from the owner',
            selected: false,
            editMode: false,
            toggle: false
        },
        {
            Id: 3,
            Name: 'Quote Details',
            label: 'Quote Details',
            selected: false,
            editMode: false,
            toggle: false
        },
        {
            Id: 4,
            Name: 'Warranty',
            label: 'Warranty',
            selected: false,
            editMode: false,
            toggle: false
        },
        {
            Id: 5,
            Name: 'Terms and Conditions',
            label: 'Terms and Conditions',
            selected: false,
            editMode: false,
            toggle: false
        }
    ];

    editCustomPageName = false;
    titleViewPageModel = false;
    LetterFromTheOwnerModel = false;
    QuoteDetailModel = false;
    clickCount = 0;
    fileDataPrimary;
    currentSelectedCustomPage = {};
    currentCustomPageRecordId = '';
    fileTypes = ['.jpg', '.png', '.jpeg'];

    @track dataPageName = 'Title';
    @api templateId;
    @api recordId;
    @api quoteId;
    @api mode;
    @api isFromQuote = false;
    @track cDate;
    @track pageLabel = '';
    @track loaded = false;
    @track titlePageSelected = true;
    @track latterFormTheOwnerPageSelected = false;
    @track quoteDetailPageSelected = false;
    @track WarrantyPageSelected = false;
    @track TermsAndConditionPageSelected = false;
    @track customePage = false;
    @track fieldValues = {};
    @track letterForm = '';
    @track zipCode = '';
    @track stateProvince = '';
    @track city = '';
    @track streetAddress = '';
    @track lastName = '';
    @track firstName = '';
    @track CreatedDate = '';
    @track secondaryImage = '';
    @track PrimaryUploadedFilesUrl = [];
    @track reportType;
    @track contactId;
    @track FirstName;
    @track LastName;
    @track Street_Address;
    @track City;
    @track State;
    @track Zip;
    @track wiredLayoutsResult;
    @track editBoolPages = false;
    @track valLetterFromTheOwner = 'letter from the owner';
    @track valTitle = 'Title';
    @track myVal = 'Initial rich text content';
    @track valQuoteDetails = 'QuoteDetails';
    @track InspectionImagesList = [];
    @track isInsert = false;


    connectedCallback() {

        console.log('--- connectedCallback START ---');
        console.log('recordId:', this.recordId);
        console.log('quoteId:', this.quoteId);
        console.log('mode:', this.mode);

        console.log('mode : ', this.mode);
        console.log('this.recordId--- : ', this.recordId);
        console.log('this.quoteId : ', this.quoteId);

        if (this.recordId == '') {
            this.isInsert = true;

        }

        if (this.recordId && this.recordId !== '') {
            // if (this.quoteId && this.quoteId !== '' && this.mode == true) {
            //     // Editing an existing quote
            //     this.loadLayouts();
            //     this.fetchQuoteDocumentsOnly();
            // } else {
            this.loadLayouts();
            this.fetchUploadedMasterTemplateDocs();


            // }
        } else {
            this.loadConfig();
        }

        if (this.quoteId && this.quoteId !== '') {
            this.getQuoteDetailsFromApex();
        }
    }
    warrantyUrl = '';
    termAndConditionUrl = '';
    loadConfig() {
            
            console.log('--- loadConfig called ---');
    getAdminConfig()
        .then(result => {

            console.log('Admin Config Result:', JSON.stringify(result));
            console.log('Before filtering ElementList:', JSON.stringify(this.ElementList));
            console.log('Config Result:', result);
            
            //  DEFAULT IMAGES  from HTML PATTERN 
            this.uploadedDocUrls.warrantyDocUrl = result.Default_Warranty__c;
            this.isDocAvailable.warrantyImageAvl = !!result.Default_Warranty__c;
            
            this.uploadedDocUrls.termConditionDocUrl = result.Default_Terms_Conditions__c;
            this.isDocAvailable.termConditionImageAvl = !!result.Default_Terms_Conditions__c;

            // Map ElementList.Name with backend fields
            let fieldMap = {
                'Title': result.Active_Title__c,
                'Letter from the owner': result.Active_Letter_Of_Owner__c,
                'Quote Details': result.Active_Quote_Details__c,
                'Warranty': result.Active_Warranty__c,
                'Terms and Conditions': result.Active_Terms_and_Conditions__c
            };

            console.log('FieldMap:', JSON.stringify(fieldMap));


            // Filter ElementList based on true values only
            this.ElementList = this.ElementList.filter(elm => fieldMap[elm.Name] === true);

            // console.log('Filtered Elements:', JSON.stringify(this.ElementList));
            // console.log('Filtered ElementList:', this.ElementList);
            console.log('After filtering ElementList:', JSON.stringify(this.ElementList));
        })
        .catch(error => {
            this.showToast('Error', error.body.message, 'error');
        });
}


   getQuoteDetailsFromApex() {

    console.log('--- getQuoteDetailsFromApex called ---');
    console.log('QuoteId:', this.quoteId);
    getQuoteDetails({ recordId: this.quoteId })
        .then(result => {

             console.log('Quote Result:', JSON.stringify(result));
            console.log('Quote Pages JSON:', result.Pages_JSON__c);
            console.log('ElementList before Quote JSON:', JSON.stringify(this.ElementList));
            // console.log('Quote details:', JSON.stringify(result));

            if (result) {

                    this.firstName = result.First_Name__c;
                    this.lastName = result.Last_Name__c;
                    this.streetAddress = result.Street_Address__c;
                    this.city = result.City__c;
                    this.stateProvince = result.State_Province__c;
                    this.zipCode = result.Zip_code_Postal_code__c;
                    this.CreatedDate = result.Date__c;
                    this.reportType = this.reportType;
                    this.letterForm = result.Letter_from_the_owner__c;
               try {
    this.ElementList = result.Pages_JSON__c
        ? JSON.parse(result.Pages_JSON__c)
        : this.ElementList;
} catch (e) {
    console.error('Invalid JSON in Pages_JSON__c', e);
}

                //   fetchQuoteDocumentsOnly()
                this.uploadedDocUrls.warrantyDocUrl = result.Warranty__c || null;
                this.isDocAvailable.warrantyImageAvl = !!result.Warranty__c;
                
                this.uploadedDocUrls.termConditionDocUrl = result.Terms_Conditions__c || null;
                this.isDocAvailable.termConditionImageAvl = !!result.Terms_Conditions__c;

                // ... rest unchanged (Title page logic)
            }
        })
        .catch(error => {
            console.error('Error fetching quote details:', error);
        });
}



    @wire(getLayouts)
    wiredLayouts(result) {
        this.wiredLayoutsResult = result;
        if (result.data) {
            this.layouts = result.data;
            this.hasError = false;
        } else if (result.error) {
            this.hasError = true;
            this.showToast('Error', 'Failed to load layouts', 'error');
        }
    }

    @api
    async refreshLayouts() {
        try {
            await refreshApex(this.wiredLayoutsResult);
        } catch (error) {
            this.showToast('Error', 'Failed to refresh layout list', 'error');
        }
    }

    /* handleOnChangeInputFields(event) {
            let label = event.target.label;
            let value = event.target.value;
    
            if (label == 'Layout Name') {
                this.reportType = value;
            } else if (label == 'Letter From The Owner') {
                this.letterForm = value;
    
            } else if (label == 'Zip code/Postal code') {
                this.zipCode = value;
            } else if (label == 'State/Province') {
                this.stateProvince = value;
            } else if (label == 'City') {
                this.city = value;
            } else if (label == 'Street Address') {
                this.streetAddress = value;
            } else if (label == 'Last Name') {
                this.lastName = value;
            } else if (label == 'First Name') {
                this.firstName = value;
            } else if (label == 'Date') {
                this.CreatedDate = value;
            } else if (label == 'Primary Image') {
                this.primaryImage = value;
            } else if (label == 'Secondary Image') {
                this.secondaryImage = value;
            }
        }*/




    loadLayouts() {
        getLayoutRecord({ mtId: this.recordId })
            .then(result => {

                 console.log('--- Layout Record Loaded ---');
                 console.log('Layout Result:', JSON.stringify(result));
                 console.log('Pages_JSON__c:', result.Pages_JSON__c);
                //  console.log('result-- : ', result);
                this.reportType = result.Layout_Name__c;
                console.log('this.reportType : ', this.reportType);
                this.letterForm = result.Letter_from_the_owner__c;
                this.currencyType = result.Currency__c;
                this.zipCode = result.Zip_code_Postal_code__c;
                this.stateProvince = result.State_Province__c;
                this.city = result.City__c;
                this.streetAddress = result.Street_Address__c;
                this.lastName = result.Last_Name__c;
                this.firstName = result.First_Name__c;
                this.CreatedDate = result.Date__c;
                this.primaryImage = result.Primary_Image__c;
                this.secondaryImage = result.Secondary_Image__c;
                this.termAndConditionUrl = result.Terms_Condition_doc__c;
                this.warrantyUrl = result.Warranty_Doc__c;
                this.uploadedDocUrls.warrantyDocUrl = result.Warranty_Doc__c || this.uploadedDocUrls.warrantyDocUrl;
                this.isDocAvailable.warrantyImageAvl = !!this.uploadedDocUrls.warrantyDocUrl;
                this.uploadedDocUrls.termConditionDocUrl = result.Terms_Condition_doc__c || this.uploadedDocUrls.termConditionDocUrl;
                this.isDocAvailable.termConditionImageAvl = !!this.uploadedDocUrls.termConditionDocUrl;
                this.layoutRecord = result;

                if (result.Pages_JSON__c) {
                    console.log('result.Pages_JSON__c : ', result.Pages_JSON__c);
                    this.ElementList = JSON.parse(result.Pages_JSON__c);
                    this.ElementList.forEach(result => {
                        if (result.label == 'Title') {
                            result.selected = true;

                            this.pageLabel = result.label;
                        } else {
                            result.selected = false;
                        }
                    });
                    this.dataPageName = this.ElementList[0].Name;
                }
            })
            .catch(error => {
                console.error('Error loading layouts:', error);
            });

        getCustomPage({ recordId: this.recordId })
            .then(result => {

                console.log('## ALL custom pages from Apex:', JSON.stringify(result));
        console.log('## currentCustomPageRecordId:', this.currentCustomPageRecordId);


                console.log('## 1, custom page result: ', result);

                result.forEach(element => {
                    this.clickCount++;
                    // let newElement = {
                    //     Id: element.Id,
                    //     Name: element.Name,
                    //     label: element.label__c,
                    //     selected: false,
                    //     editMode: element.editMode__c,
                    //     toggle: element.toggle__c,
                    //     contentDocument: element?.ContentDocumentLinks,
                    //     richTextValue: element.Text_Page__c
                    // };
                    // this.ElementList.push(newElement);
                });

            })
            .catch(error => {
                console.error('Error loading layouts:', error);
            });
    }

    handleAddCustomPage(event) {
        this.clickCount++;

        // this.titlePageSelected = false;
        // this.latterFormTheOwnerPageSelected = false;
        // this.quoteDetailPageSelected = false;
        // this.WarrantyPageSelected = false;
        // this.TermsAndConditionPageSelected = false;
        // this.customePage = true;

        // this.ElementList.forEach(currentItem => {
        //     currentItem.selected = false;
        // });

        // this.ElementList = this.ElementList.map(item => {
        //     for (let i = 1; i < this.clickCount; i++) {
        //         if (item.label === 'Custom Page ' + i + 1) {
        //             item.selected = true;
        //         } else {
        //             item.selected = false;
        //         }
        //     }
        //     return item;
        // });

        let customObj = {
            'Name': `Custom Page`,
            'label__c': `Custom Page ${this.clickCount}`,
            'selected__c': false,
            'editMode__c': false,
            'toggle__c': false,
            'Master_Template__c': this.recordId
        };

        CreateCustomPage({ customObj: customObj })
            .then(result => {
                let newElement = {
                    Id: result.Id,
                    Name: `Custom Page`,
                    label: `Custom Page ${this.clickCount}`,
                    selected: false,
                    editMode: false,
                    toggle: false
                };
                getCustomPage({ recordId: this.recordId })
                    .then(result => {
                        console.log('## 2. custom page result: ', result);
                        result.forEach(element => {
                            if (element.Id == this.currentCustomPageRecordId) {
                                this.ctmPgType = element.Type__c;
                                console.log('## element type: ', element.Type__c);
                                if (element.Type__c === 'Upload File') {
                                    this.customPageUploadFile = true;
                                    this.customPageTextPage = false;
                                } else if (element.Type__c === 'Text Page') {
                                    this.customPageUploadFile = false;
                                    this.customPageTextPage = true;
                                } else {
                                    this.customPageUploadFile = false;
                                    this.customPageTextPage = false;
                                }
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error loading layouts:', error);
                    });
                this.ElementList.push(newElement);
                // getCustomPage({ recordId: this.recordId })
                //     .then(result => {
                //         console.log('## custom page result: ', result);
                //         result.forEach(element => {
                //             if (element.Id == this.currentCustomPageRecordId) {
                //                 this.ctmPgType = '';

                //                 this.customPageUploadFile = false;
                //                 this.customPageTextPage = false;

                //             }
                //         });
                //     })
                //     .catch(error => {
                //     console.error('Error loading layouts:', error);
                // });
            })
            .catch(error => {
                this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
            });
    }

    handleChangeToggle(event) {
        this.loaded = true;
        var dataLabel = event.currentTarget.dataset.label;
        this.ElementList.forEach(result => {
            if (result.label === dataLabel) {
                result.toggle = event.target.checked;
            }
        })
        this.pageLabel = dataLabel;
    }



handleClickPages(event) {

    let dataLabel = event.currentTarget.dataset.label;

    console.log('Clicked Page:', dataLabel);
    console.log('ElementList at start:', JSON.stringify(this.ElementList));

    this.dataPageName = event.currentTarget.dataset.page;
    this.currentCustomPageRecordId = event.currentTarget.dataset.recid;

    this.toggleLabel = event.currentTarget.dataset.label;
    this.titlePageSelected = (dataLabel == 'Title') ? true : false;
    this.latterFormTheOwnerPageSelected = (dataLabel == 'Letter from the owner') ? true : false;
    this.quoteDetailPageSelected = (dataLabel == 'Quote Details') ? true : false;
    this.WarrantyPageSelected = (dataLabel == 'Warranty') ? true : false;
    this.TermsAndConditionPageSelected = (dataLabel == 'Terms and Conditions') ? true : false;
    this.customePage = dataLabel.includes("Custom Page") ? true : false;

    this.ElementList.forEach(result => {

        console.log('After selection ElementList:', JSON.stringify(this.ElementList));

        if (this.titlePageSelected) {

    const titlePage = this.ElementList.find(ele => ele.label === 'Title');
      console.log('TITLE PAGE FOUND:', JSON.stringify(titlePage));


    if (titlePage) {

         console.log('Primary Image:', titlePage.Primary_Image__c);
        console.log('Secondary Image:', titlePage.Secondary_Image__c);

        this.primaryImageUrl = titlePage.Primary_Image__c;
        this.secondaryImageUrl = titlePage.Secondary_Image__c;

        this.primaryImageAvailable = !!this.primaryImageUrl;
        this.secondaryImageAvailable = !!this.secondaryImageUrl;
    }
}


        if (result.label == dataLabel) {
            result.selected = true;
            this.pageLabel = result.label;
        } else {
            result.selected = false;
        }
    });

    if (this.quoteDetailPageSelected == true) {
        const childCmp = this.template.querySelector('c-quote-detail-cmp');
        if (childCmp) {
            childCmp.loadSectionData();
        }
    }

    console.log('OUTPUT : ', JSON.stringify(dataLabel));

    if (dataLabel.includes("Custom Page")) {

        console.log('Entering Custom Page');
console.log('Before reset:', JSON.stringify(this.currentSelectedCustomPage));

        this.ctmPgType = '';
        this.customPageUploadFile = false;
        this.customPageTextPage = false;
        // this.currentSelectedCustomPage = {};
        this.currentSelectedCustomPage = {};
console.log('After reset:', JSON.stringify(this.currentSelectedCustomPage));

        getCustomPage({ recordId: this.recordId })
            .then(result => {
                result.forEach(element => {
                    if (element.Id == this.currentCustomPageRecordId) {

                        let type = element.Type__c;

                        let freshPage = this.ElementList.find(e => e.Id === this.currentCustomPageRecordId) || {};

                        this.currentSelectedCustomPage = {
                            ...freshPage,
                            Id: element.Id,
                            Name: element.Name,
                            richTextValue: element.Text_Page__c || '',
                            Type__c: type,
                            customPageImageAvl: false,
                            customPageDocUrl: undefined,
                            customPageDocId: undefined
                        };

                        // ---------- IMAGE HANDLING (FIXED) ----------
                        if (element.ContentDocumentLinks && element.ContentDocumentLinks.length > 0) {

                            const lastDoc = element.ContentDocumentLinks[element.ContentDocumentLinks.length - 1];
                            const doc = lastDoc?.ContentDocument;

                            if (doc?.LatestPublishedVersionId) {
                                this.currentSelectedCustomPage.customPageDocUrl =
                                    `/sfc/servlet.shepherd/version/download/${doc.LatestPublishedVersionId}`;
                                this.currentSelectedCustomPage.customPageImageAvl = true;
                                this.currentSelectedCustomPage.customPageDocId = lastDoc.ContentDocumentId;
                            }

                        } else {
                            // fallback to old working logic
                            const fallback = this.ElementList.find(e => e.Id === element.Id);
                            const fallbackDoc = fallback?.ContentDocument;

                            if (fallbackDoc?.LatestPublishedVersionId) {
                                this.currentSelectedCustomPage.customPageDocUrl =
                                    `/sfc/servlet.shepherd/version/download/${fallbackDoc.LatestPublishedVersionId}`;
                                this.currentSelectedCustomPage.customPageImageAvl = true;
                                this.currentSelectedCustomPage.customPageDocId = fallback?.ContentDocumentId;
                            }
                        }
                        // ---------- END FIX ----------

                        if (!type) {
                            this.ctmPgType = '';
                            this.customPageUploadFile = false;
                            this.customPageTextPage = false;
                            return;
                        }

                        this.ctmPgType = type;

                        if (type === 'Upload File') {
                            this.customPageUploadFile = true;
                            this.customPageTextPage = false;
                        } else if (type === 'Text Page') {
                            this.customPageUploadFile = false;
                            this.customPageTextPage = true;
                        }

                        console.log('## currentSelectedCustomPage:', JSON.stringify(this.currentSelectedCustomPage));
                    }
                });
            })
            .catch(error => {
                console.error('Error loading custom page:', error);
            });
    }
}




    handleInputFieldsChange(event) {
        const field = event.target.dataset.field;
        this[field] = event.target.value;
    }

    handleDateFieldsChange(event) {
        this.CreatedDate = event.target.value;
    }

    handleRichInputFieldsChange(event) {
        this.letterForm = event.target.value;
        console.log('letterForm : ', this.letterForm);
    }


    @api updateQuote() {

        console.log('--- Updating Quote ---');
        console.log('QuoteId:', this.quoteId);
        console.log('Pages_JSON:', JSON.stringify(this.ElementList)); 



        updateQuoteDetails({
            quoteId: this.quoteId,
            firstName: this.firstName,
            lastName: this.lastName,
            streetAddress: this.streetAddress,
            city: this.city,
            stateProvince: this.stateProvince,
            zipCode: this.zipCode,
            CreatedDate: this.CreatedDate,
            layoutName: this.reportType,
            letterForm: this.letterForm,
            pagesJSON: JSON.stringify(this.ElementList),
            currencyType: this.currencyType
        })
            .then((result) => {

                console.log('Contact details updated', JSON.stringify(result));
                this.showToast('Success', 'Quotedetails updated successfully!', 'success');
            })
            .catch(error => {
                console.error('Error updating contact details', error);
            });
    }

    handleChangeContact(event) {
        this.contactId = event.target.value;
    }

    handleClickEditIcon() {
        this.editBoolPages = true;
    }

    handleChangePagesName(event) {
        var lab = event.target.label;
        this.dataPageName = event.target.value;
        console.log('Label On Change  - - - - :', lab);
        this.ElementList.forEach(item => {
            if (event.target.label === item.label) {
                item.Name = event.target.value;
            }
        });

        if (event.target.label === 'Letter from the owner') {
            this.valLetterFromTheOwner = event.target.value;
        } else if (event.target.label === 'QuoteDetails') {
            this.valAuthorizationPage = event.target.value;
        } else if (event.target.label === 'QuoteDetails') {
            this.valQuoteDetails = event.target.value;
        } else if (event.target.label === 'Warranty') {
            this.valWarranty = event.target.value;
        } else if (event.target.label === 'Title') {
            this.valTitle = event.target.value;
        }
    }


    handleSavePagesName() {
        this.editBoolPages = false;
        // this.handleSaveAdditionalDocument();
    }



    handleTitleViewPageClick() {
        this.titleViewPageModel = true;
    }
    handleLaterFromOwnerClick() {
        this.LetterFromTheOwnerModel = true;
    }
    handleQuoteDetailsClick() {
        this.QuoteDetailModel = true;
    }

    closeModal() {
        if (this.titleViewPageModel == true) {
            this.titleViewPageModel = false;
        }
        if (this.LetterFromTheOwnerModel == true) {
            this.LetterFromTheOwnerModel = false;
        }
        if (this.QuoteDetailModel == true) {
            this.QuoteDetailModel = false;
        }
        if (this.sqrc == true) {
            this.sqrc = false;
        }
        if (this.warrantyModalBool == true) {
            this.warrantyModalBool = false;
        }
        if (this.GLCertificatePreviewModel == true) {
            this.GLCertificatePreviewModel = false;
        }
        if (this.hearthModePreview == true) {
            this.hearthModePreview = false;
        }
        if (this.HVAC_ModePreview == true) {
            this.HVAC_ModePreview = false;
        }
        this.ConfirmationIsShowModal = false;
        this.isShowViewModal = false;
        this.isShowDeleteModal = false;
        this.isShowViewModalPDF = false;

        SectionDeleteCancel()
            .then(data => {
                console.log('data : ', data);
            })
            .catch(err => {
                console.error('[loadSectionData] Error:', err);
            });
    }


    handleInspectionViewPageClick() {
        this.InspectionModel = true;
    }

    updateInspectionRecord() {
        updateInspectionImage({ imageList: this.InspectionImagesList })
            .then(result => {
                this.inspectionImages(this.estimateId);
            })
            .catch(error => {
            });
    }

    recordName = '';
    optionCount = 3;
    customPageTextPage = false;
    customPageUploadFile = false;
    @track ctmPgType = '';

    radioOptions = [
        { label: 'Upload File', value: 'Upload File' },
        { label: 'Text Page', value: 'Text Page' }
    ];


    handleRadioChange(event) {

    this.ctmPgType = event.detail.value;

    if (this.ctmPgType === 'Upload File') {
        this.customPageUploadFile = true;
        this.customPageTextPage = false;

    } else if (this.ctmPgType === 'Text Page') {
        this.customPageUploadFile = false;
        this.customPageTextPage = true;
    }

    // SAVE IN DB
    var customObj = {
        Id: this.currentCustomPageRecordId,
        Type__c: this.ctmPgType
    };

    updateCustomPage({ customObj: customObj })
        .then(() => {
            console.log('Type updated');
        })
        .catch(error => {
            console.log(JSON.stringify(error));
        });
}

    // handleRadioChange(event) {
    //     var Value = event.detail.value;
    //     this.ctmPgType = Value;
    //     if (Value === 'Upload File') {
    //         this.customPageUploadFile = true;
    //         this.customPageTextPage = false;
    //     } else if (Value === 'Text Page') {
    //         this.customPageUploadFile = false;
    //         this.customPageTextPage = true;
    //     }

    //     var customObj = {
    //         'Id': this.currentCustomPageRecordId,
    //         'Type__c': Value
    //     };

    //     updateCustomPage({ customObj: customObj })
    //         .then(result => {
    //             console.log(result);
    //         })
    //         .catch(error => {
    //             console.log(JSON.stringify(error));
    //             this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
    //         });
    // }

    handleInputChange(event) {
        this.recordName = event.target.value;
    }

    addNewOption() {
        if (this.recordName) {
            this.optionCount += 1;
            const newOption = {
                label: this.recordName,
                value: `option${this.optionCount}`
            };

            this.radioOptions = [...this.radioOptions, newOption];
            this.recordName = '';
        } else {
            console.error('Record name is required.');
        }
    }

    // @api handleSaveTeamplate() {

    //     if (!this.reportType) {
    //         this.showToast('Error', 'Layout Name is required', 'error');
    //         return;
    //     }


    //     console.log('mstTmpObj  : ', mstTmpObj);

    //     if (this.recordId) {

    //         var mstTmpObj = {
    //             'Id': this.recordId,
    //             'Layout_Name__c': this.reportType,
    //             'Letter_from_the_owner__c': this.letterForm,
    //             'Zip_code_Postal_code__c': this.zipCode,
    //             'State_Province__c': this.stateProvince,
    //             'City__c': this.city,
    //             'Street_Address__c': this.streetAddress,
    //             'Last_Name__c': this.lastName,
    //             'First_Name__c': this.firstName,
    //             'Date__c': this.CreatedDate,
    //             'Primary_Image__c': this.primaryImage,
    //             'Secondary_Image__c': this.secondaryImage,
    //             'Pages_JSON__c': JSON.stringify(this.ElementList)
    //         };

    //         UpdateMasterLayout({ mstLayoutObj: mstTmpObj })
    //             .then(result => {
    //                 this.showToast('Success', 'Record Updated Successfully!', 'success');
    //                 this.uploadBulkFilesSF(result.Id);
    //                 this.dispatchEvent(new CustomEvent('save'));
    //                 this.closeModal();
    //                 this.refreshLayouts();
    //                 this.showToast('Success', 'Record Updated Successfully!', 'success');
    //                 this.dispatchEvent(new CustomEvent('closemodal'));
    //             })
    //             .catch(error => {
    //                 this.showToast('Error', 'Failed to update record', 'error');
    //             });

    //     } else {
    //         var mstTmpObj = {
    //             'Layout_Name__c': this.reportType,
    //             'Letter_from_the_owner__c': this.letterForm,
    //             'Zip_code_Postal_code__c': this.zipCode,
    //             'State_Province__c': this.stateProvince,
    //             'City__c': this.city,
    //             'Street_Address__c': this.streetAddress,
    //             'Last_Name__c': this.lastName,
    //             'First_Name__c': this.firstName,
    //             'Date__c': this.CreatedDate,
    //             'Primary_Image__c': this.primaryImage,
    //             'Secondary_Image__c': this.secondaryImage,
    //             'Pages_JSON__c': JSON.stringify(this.ElementList)
    //         };

    //         CreateMasterLayout({ mstLayoutObj: mstTmpObj })
    //             .then(result => {

    //                 this.recordId = result.Id;
    //                 this.uploadBulkFilesSF(result.Id);
    //                 this.showToast('Success', 'Record Created Successfully!', 'success');

    //                 this.dispatchEvent(new CustomEvent('edit', { detail: { recordId: this.recordId } }));
    //                 this.dispatchEvent(new CustomEvent('save'));
    //                 this.dispatchEvent(new CustomEvent('closemodal'));
    //                 this.refreshLayouts();
    //                 this.ElementList.forEach(item => {
    //                     if (item.Name === 'Custom Page') {
    //                         console.log('item - - - - :', JSON.stringify(item));
    //                         var customObj = {
    //                             'Id': item.Id,
    //                             'Master_Template__c': this.recordId
    //                         };

    //                         updateCustomPage({ customObj: customObj })
    //                             .then(result => {
    //                                 console.log(result);
    //                             })
    //                             .catch(error => {
    //                                 console.log(JSON.stringify(error));
    //                                 this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
    //                             });

    //                     }
    //                 });
    //             })
    //             .catch(error => {
    //                 console.log('error while creating record: ', JSON.stringify(error));
    //                 this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
    //             });
    //     }
    // }

    @api
    async handleSaveTeamplate() {

            console.log('--- Saving Template ---');
            console.log('Layout Name:', this.reportType);
            console.log('ElementList being saved:', JSON.stringify(this.ElementList));
        if (!this.reportType) {
            this.showToast('Error', 'Layout Name is required', 'error');
            return;
        }

        try {
            // Fetch existing layouts
            const layouts = await getLayouts();

            // For update: exclude current record from duplicate check
            const isDuplicate = layouts.some(layout =>
                layout.Layout_Name__c === this.reportType &&
                layout.Id !== this.recordId // ignore current record when updating
            );

            if (isDuplicate) {
                this.showToast('Error', `Layout with name "${this.reportType}" already exists. Cannot create duplicate.`, 'error');
                return;
            }
            if (this.recordId) {

                var mstTmpObj = {
                    'Id': this.recordId,
                    'Layout_Name__c': this.reportType,
                    'Letter_from_the_owner__c': this.letterForm,
                    'Currency__c': this.currencyType,
                    'Zip_code_Postal_code__c': this.zipCode,
                    'State_Province__c': this.stateProvince,
                    'City__c': this.city,
                    'Street_Address__c': this.streetAddress,
                    'Last_Name__c': this.lastName,
                    'First_Name__c': this.firstName,
                    'Date__c': this.CreatedDate,
                      'Primary_Image__c': this.uploadedDocUrls.primaryDocUrl,
                'Secondary_Image__c': this.uploadedDocUrls.secondaryDocUrl,
                'Warranty_Doc__c': this.uploadedDocUrls.warrantyDocUrl,
                'Terms_Condition_doc__c': this.uploadedDocUrls.termConditionDocUrl,
                'Pages_JSON__c': JSON.stringify(this.ElementList)
                };

                UpdateMasterLayout({ mstLayoutObj: mstTmpObj })
                    .then(result => {
                        this.showToast('Success', 'Record Updated Successfully!', 'success');
                        this.uploadBulkFilesSF(result.Id);
                        this.dispatchEvent(new CustomEvent('save'));
                        this.closeModal();
                        this.refreshLayouts();
                        this.loadLayouts();
                        this.dispatchEvent(new CustomEvent('closemodal'));
                    })
                    .catch(error => {
                        this.showToast('Error', 'Failed to update record', 'error');
                    });

            } else {
                if(!this.currencyType){
                    this.showToast('Error','Currency is required','error');
                    return;
                }
                var mstTmpObj = {
                    'Layout_Name__c': this.reportType,
                    'Letter_from_the_owner__c': this.letterForm,
                    'Zip_code_Postal_code__c': this.zipCode,
                    'State_Province__c': this.stateProvince,
                    'City__c': this.city,
                    'Street_Address__c': this.streetAddress,
                    'Last_Name__c': this.lastName,
                    'First_Name__c': this.firstName,
                    'Currency__c': this.currencyType,  
                    'Date__c': this.CreatedDate,
                    'Primary_Image__c': this.uploadedDocUrls.primaryDocUrl || null,
                'Secondary_Image__c': this.uploadedDocUrls.secondaryDocUrl || null,
                'Warranty_Doc__c': this.uploadedDocUrls.warrantyDocUrl || null,
                'Terms_Condition_doc__c': this.uploadedDocUrls.termConditionDocUrl || null,
                'Pages_JSON__c': JSON.stringify(this.ElementList)
                };
                CreateMasterLayout({ mstLayoutObj: mstTmpObj })
                    .then(result => {
                        this.recordId = result.Id;
                        this.uploadBulkFilesSF(result.Id);
                        // if (this.PrimaryAvailableBool && this.fileDataPrimary) {
                        //     this.handleClickPrimary(result.Id);
                        // }
                        // if (this.SecondaryAvailableBool && this.fileDataSecondary) {
                        //     this.handleClickSecondary(result.Id);
                        // }
                        this.dispatchEvent(new CustomEvent('edit', { detail: { recordId: this.recordId } }));
                        this.dispatchEvent(new CustomEvent('save'));
                        this.dispatchEvent(new CustomEvent('closemodal'));
                        this.refreshLayouts();
                        this.loadLayouts();
                        SectionUpdate({ quoteId: this.recordId })
                            .then(data => {
                                console.log('data : ', data);
                            })
                            .catch(err => {
                                console.error('[loadSectionData] Error:', err);
                            });
                        this.ElementList.forEach(item => {
                            if (item.Name === 'Custom Page') {
                                console.log('item - - - - :', JSON.stringify(item));
                                var customObj = {
                                    'Id': item.Id,
                                    'Master_Template__c': this.recordId
                                };
                                updateCustomPage({ customObj: customObj })
                                    .then(result => {
                                        console.log(result);
                                    })
                                    .catch(error => {
                                        console.log(JSON.stringify(error));
                                        this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
                                    });
                            }
                        });
                    })
                    .catch(error => {
                        console.log('error while creating record: ', JSON.stringify(error));
                        this.showToast('Error', 'Error Creating Record: ' + error.body.message, 'error');
                    });
            }
        } catch (error) {
            console.error(error);
            this.showToast('Error', 'An unexpected error occurred: ' + (error.body?.message || error.message), 'error');
        }
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
        });
        this.dispatchEvent(event);
    }

    /*
    * Created on Thu Jan 23 2025
    * Description: function to upload file in th master-template object
    * Created by: Shubham Sen
    * Copyright (c) 2025 NSIQ infotech pvt. ltd.
    */


    // function to upload all the images - in working
    fileError = '';

    handleUploadDocuments(event) {
        try {

            this.fileError = '';

            const file = event.target.files[0];
            if (!file) {
                return;
            }

            const fileName = file.name.toLowerCase();

            const isValid = (
                fileName.endsWith('.png') ||
                fileName.endsWith('.jpg') ||
                fileName.endsWith('.jpeg')
            );

            if (!isValid) {
                this.fileError = 'Only PNG, JPG, or JPEG formats are allowed.';
                event.target.value = null;  // Reset input
                return;
            }

            console.log('Valid file:', fileName);


            let docType = event.target.name;

            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                const fileUrl = URL.createObjectURL(file);

                var reader = new FileReader();
                reader.onload = () => {
                    var base64 = reader.result.split(',')[1];

                    let tempObj = {
                        'filename': docType,
                        'base64': base64,
                        'quoteId': ((this.currentCustomPageRecordId)?.length > 15) ? this.currentCustomPageRecordId : this.quoteId
                    };

                    this.uploadedDocumentList.push(tempObj);

                    // Call Apex to actually upload the file
                    uploadFile({
                        base64Data: base64,
                        fileName: docType,
                        parentId: tempObj.quoteId
                    })
                        .then(result => {
                            console.log('File uploaded successfully. ContentDocumentId: ' + result);
                            // You can store ContentDocumentId if needed
                        })
                        .catch(error => {
                            console.error('Error uploading file', error);
                        });

                    // setting preview
                    if (docType == 'primaryDoc') {
                        this.uploadedDocUrls.primaryDocUrl = fileUrl;
                        this.isDocAvailable.primaryImageAvl = true;
                    } else if (docType == 'SecondaryDoc') {
                        this.uploadedDocUrls.secondaryDocUrl = fileUrl;
                        this.isDocAvailable.secondaryImageAvl = true;
                    } else if (docType == 'TermConditionDoc') {
                        this.uploadedDocUrls.termConditionDocUrl = fileUrl;
                        this.isDocAvailable.termConditionImageAvl = true;
                    } else if (docType == 'warrantyDoc') {
                        this.uploadedDocUrls.warrantyDocUrl = fileUrl;
                        this.isDocAvailable.warrantyImageAvl = true;
                    } else if (docType == 'customPageDoc') {
                        if (this.currentCustomPageRecordId?.length > 15) {
                            this.currentSelectedCustomPage.customPageDocUrl = fileUrl;
                            this.currentSelectedCustomPage.customPageImageAvl = true;
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.log('Error while uploading file: ', error);
        }
    }

    // to delete the temp. document  - in working
    handleDeleteTempDocs(event) {
        try {
            let docType = event.target.dataset.doctype;
            let contentDocId = event.target.dataset.contentid;

            switch (docType) {
                case 'primaryDoc':
                    if (contentDocId)
                        this.deleteMasterTemplateDocsSF(contentDocId, 'Primary Image');

                    this.uploadedDocUrls.primaryDocUrl = undefined;
                    this.isDocAvailable.primaryImageAvl = false;
                    this.removeTempDoc(docType);
                    break;
                case 'SecondaryDoc':

                    if (contentDocId)
                        this.deleteMasterTemplateDocsSF(contentDocId, 'Secondary Image');

                    this.uploadedDocUrls.secondaryDocUrl = undefined;
                    this.isDocAvailable.secondaryImageAvl = false;
                    this.removeTempDoc(docType);
                    break;
                case 'warrantyDoc':

                    if (contentDocId)
                        this.deleteMasterTemplateDocsSF(contentDocId, 'Warranty Image');

                    this.uploadedDocUrls.warrantyDocUrl = undefined;
                    this.isDocAvailable.warrantyImageAvl = false;
                    this.removeTempDoc(docType);
                    break;
                case 'TermConditionDoc':

                    if (contentDocId)
                        this.deleteMasterTemplateDocsSF(contentDocId, 'Term & Condition Image');

                    this.uploadedDocUrls.termConditionDocUrl = undefined;
                    this.isDocAvailable.termConditionImageAvl = false;
                    this.removeTempDoc(docType);
                    break;

                case 'customPageDoc':
                    if (contentDocId)
                        this.deleteMasterTemplateDocsSF(contentDocId, 'Custom Page Document');

                    this.currentSelectedCustomPage.customPageDocUrl = undefined;
                    this.currentSelectedCustomPage.customPageImageAvl = false;
                    this.removeTempDoc(docType);
                    break;
            }


        } catch (error) {
            console.log('## in the error delete: ', error);
        }
    }

    // to remove that image from the delete icon - in working
    removeTempDoc(docType) {
        try {
            // removing from the list of uploadedDocumentList 
            const index = this.uploadedDocumentList.findIndex(ele => {
                return ele.filename == docType;
            });
            if (index !== -1) {
                this.uploadedDocumentList.splice(index, 1);
            }
        } catch (error) {
            console.log('## in the delete temp image: ', error);
        }
    }

    // to upload file in the bulk - in working
    async uploadBulkFilesSF(recordId) {
        try {
            const result = await uploadBulkFiles({ filesJson: JSON.stringify(this.uploadedDocumentList), recId: recordId });

        } catch (error) {
            console.error('## in the er: ', error);
        }
    }

    async fetchQuoteDocumentsOnly() {
        console.log('fetchQuoteDocumentsOnly : ',);
        try {
            const result = await getQuoteDocumentLinks({ quoteId: this.quoteId });
            if (result?.ContentDocumentLinks?.length > 0) {
                result.ContentDocumentLinks.forEach(ele => {
                    let imageUrl = `/sfc/servlet.shepherd/version/download/${ele?.ContentDocument?.LatestPublishedVersionId}`;
                    let imageTitle = ele?.ContentDocument?.Title;
                    let conDoctId = ele?.ContentDocumentId;

                    if (imageTitle === 'primaryDoc') {
                        this.uploadedDocUrls.primaryDocUrl = imageUrl;
                        this.isDocAvailable.primaryImageAvl = true;
                        this.contentDocId.primaryDocId = conDoctId;
                    }

                    if (imageTitle === 'SecondaryDoc') {
                        this.uploadedDocUrls.secondaryDocUrl = imageUrl;
                        this.isDocAvailable.secondaryImageAvl = true;
                        this.contentDocId.secondaryDocId = conDoctId;
                    }
                    if (imageTitle == 'warrantyDoc') {
                        this.uploadedDocUrls.warrantyDocUrl = imageUrl;
                        this.isDocAvailable.warrantyImageAvl = true;
                        this.contentDocId.warrantyDocId = conDoctId;

                    }
                    if (imageTitle == 'TermConditionDoc') {
                        this.uploadedDocUrls.termConditionDocUrl = imageUrl;
                        this.isDocAvailable.termConditionImageAvl = true;
                        this.contentDocId.termConDocId = conDoctId;
                    }
                });
            }

        } catch (error) {
            console.error('Error fetching quote documents only:', error);
        }
    }

    // to get the documents from the master template - in working
    async fetchUploadedMasterTemplateDocs() {
        console.log('fetchUploadedMasterTemplateDocs : ');
        try {
            const result = await getLayoutRecord({ mtId: this.recordId });
            console.log('## result: ', JSON.stringify(result));
            if (result) {
                result?.ContentDocumentLinks.forEach(ele => {
                    let imageUrl = `/sfc/servlet.shepherd/version/download/${ele?.ContentDocument?.LatestPublishedVersionId}`;
                    let imageTitle = ele?.ContentDocument?.Title;
                    let conDoctId = ele?.ContentDocumentId;

                    if (imageTitle === 'primaryDoc') {
                        this.uploadedDocUrls.primaryDocUrl = imageUrl;
                        this.isDocAvailable.primaryImageAvl = true;
                        this.contentDocId.primaryDocId = conDoctId;
                    } else if (imageTitle === 'SecondaryDoc') {
                        this.uploadedDocUrls.secondaryDocUrl = imageUrl;
                        this.isDocAvailable.secondaryImageAvl = true;
                        this.contentDocId.secondaryDocId = conDoctId;
                    } else if (imageTitle === 'warrantyDoc') {
                        this.uploadedDocUrls.warrantyDocUrl = imageUrl;
                        this.isDocAvailable.warrantyImageAvl = true;
                        this.contentDocId.warrantyDocId = conDoctId;
                    } else if (imageTitle === 'TermConditionDoc') {
                        this.uploadedDocUrls.termConditionDocUrl = imageUrl;
                        this.isDocAvailable.termConditionImageAvl = true;
                        this.contentDocId.termConDocId = conDoctId;
                    }
                });

                if (
                    this.contentDocId.primaryDocId || this.contentDocId.secondaryDocId ||
                    this.contentDocId.warrantyDocId || this.contentDocId.termConDocId
                ) {
                    await attachDocsToQuote({
                        quoteId: this.quoteId,
                        primaryDocId: this.contentDocId.primaryDocId,
                        secondaryDocId: this.contentDocId.secondaryDocId,
                        warrantyDocId: this.contentDocId.warrantyDocId,
                        termConDocId: this.contentDocId.termConDocId
                    });
                }
            }
        } catch (error) {
            console.error('## error in fetchUploadedMasterTemplateDocs: ', JSON.stringify(error));
        }
    }


    // to delete the doucument from the master template object - in working
    async deleteMasterTemplateDocsSF(contentId, fileName) {
        try {
            console.log('## contentId: ', contentId);
            // await deleteQuoteFile({ contentDocumentId: contentId, quoteId: this.quoteId });

            await deleteFile({ contentDocumentId: contentId });

            this.showToast('Success', `${fileName} Deleted successfully`, 'success');
        } catch (error) {
            this.showToast('Error', 'Failed to delete The Document: ' + error?.body?.message, 'error');
        }
    }

    handleEditCustomPageName() {
        this.editCustomPageName = true;
    }

    handleChangeCustomPageName(event) {
        this.currentSelectedCustomPage.Name = event.target.value;
    }

    async handleSaveCustomPageName(event) {
        try {
            this.editCustomPageName = false;
            let recId = event.target.dataset.recid;

            let tempCustomObj = {
                'Id': recId,
                'Name': this.currentSelectedCustomPage.Name
            };
            await updateCustomPage({ customObj: tempCustomObj });

        } catch (error) {
            this.showToast('Unexpected Error!', 'Unable to update the Custom Page Name.', 'error');
        }
    }

    handleTextValueChange(event) {
        console.log('## mine: ', event.target.dataset.recid);
        this.currentSelectedCustomPage.richTextValue = event.target.value;
    }

    async handleUpdateCustomTextFieldValue(event) {
        try {
            let recId = event.target.dataset.recid;

            let tempCustomObj = {
                'Id': recId,
                'Text_Page__c': this.currentSelectedCustomPage.richTextValue
            };
            await updateCustomPage({ customObj: tempCustomObj });

        } catch (error) {
            this.showToast('Unexpected Error!', 'Unable to update the Text Field Value.', 'error');
        }
    }

    // handleClickPrimary(layoutId) {

    //     this.fileDataPrimary.recordId = layoutId;
    //     const { base64, filename, recordId } = this.fileDataPrimary;
    //     console.log('Primary image submitted:', this.PrimaryUploadedFilesUrl);
    //     uploadFile({ base64, filename, recordId, fieldName: 'Primary_Image__c' }).then(result => {
    //         this.fileData = null
    //         console.log('Primary Image File Name ' + this.fileDataPrimary.filename);
    //     })
    //         .catch(error => {
    //             console.log(JSON.stringify(error));
    //         });
    // }

    // handleClickDeletePrimaryImage(event) {
    //     const fileId = event.target.dataset.id;

    //     if (this.primaryContentDocumentId) {
    //         const contentDocumentId = this.primaryContentDocumentId;
    //         console.log('Deleting primary image with ID:', contentDocumentId);

    //         deleteFile({ contentDocumentId: contentDocumentId })
    //             .then(() => {
    //                 this.primaryImageUrl = '';
    //                 this.primaryContentDocumentId = '';
    //                 this.PrimaryUploadedFilesUrl = [];
    //                 this.PrimaryAvailableBool = false;
    //                 this.showToast('Success', 'Primary image deleted successfully', 'success');
    //             })
    //             .catch(error => {
    //                 console.error('Error deleting primary image:', error);
    //                 this.showToast('Error', 'Failed to delete primary image: ' + error.body.message, 'error');
    //             });
    //     } else {
    //         this.PrimaryUploadedFilesUrl = this.PrimaryUploadedFilesUrl.filter(file => file.id !== fileId);
    //         if (this.PrimaryUploadedFilesUrl.length === 0) {
    //             this.PrimaryAvailableBool = false;
    //             this.noImageAvail = true;
    //         }
    //     }
    // }

    // SecondaryOpenfileUpload(event) {
    //     if (event.target.files.length > 0) {
    //         const file = event.target.files[0];
    //         const fileUrl = URL.createObjectURL(file);
    //         this.SecondaryUploadedFilesUrl = [...this.SecondaryUploadedFilesUrl, { id: fileUrl }];
    //         var reader = new FileReader()
    //         reader.onload = () => {
    //             var base64 = reader.result.split(',')[1]
    //             this.fileDataSecondary = {
    //                 'filename': file.name,
    //                 'base64': base64,
    //                 'recordId': ''
    //             }
    //             console.log(this.fileData);
    //         }
    //         reader.readAsDataURL(file)

    //         this.SecondaryAvailableBool = true;
    //         this.noImageAvail = false;
    //     }
    // }

    // handleClickSecondary(layoutId) {
    //     this.fileDataSecondary.recordId = layoutId;
    //     const { base64, filename, recordId } = this.fileDataSecondary;
    //     console.log('Secondary image submitted:', this.SecondaryUploadedFilesUrl);
    //     uploadFile({ base64, filename, recordId, fieldName: 'Secondary_Image__c' }).then(result => {
    //         this.fileData = null
    //         console.log('Secondary Image File Name ' + this.fileDataSecondary.filename);
    //     })
    //         .catch(error => {
    //             console.log(JSON.stringify(error));
    //         });
    // }

    // handleClickDeleteSecondaryImage(event) {
    //     const fileId = event.target.dataset.id;
    //     if (this.secondaryContentDocumentId) {
    //         const contentDocumentId = this.secondaryContentDocumentId;
    //         console.log('Deleting secondary image with ID:', contentDocumentId);

    //         deleteFile({ contentDocumentId: contentDocumentId })
    //             .then(() => {
    //                 this.secondaryImageUrl = '';
    //                 this.secondaryContentDocumentId = '';
    //                 this.SecondaryUploadedFilesUrl = [];
    //                 this.SecondaryAvailableBool = false;
    //                 this.showToast('Success', 'Secondary image deleted successfully', 'success');
    //             })
    //             .catch(error => {
    //                 console.error('Error deleting secondary image:', error);
    //                 this.showToast('Error', 'Failed to delete secondary image: ' + error.body.message, 'error');
    //             });
    //     } else {
    //         this.SecondaryUploadedFilesUrl = this.SecondaryUploadedFilesUrl.filter(file => file.id !== fileId);
    //         if (this.SecondaryUploadedFilesUrl.length === 0) {
    //             this.SecondaryAvailableBool = false;
    //             this.noImageAvail = true;
    //         }
    //     }
    // }

    /*
        loadLayouts() {
    
        getLayoutRecord({ mtId: this.recordId })
            .then(result => {
                this.reportType = result.Layout_Name__c;
                this.letterForm = result.Letter_from_the_owner__c;
                this.zipCode = result.Zip_code_Postal_code__c;
                this.stateProvince = result.State_Province__c;
                this.city = result.City__c;
                this.streetAddress = result.Street_Address__c;
                this.lastName = result.Last_Name__c;
                this.firstName = result.First_Name__c;
                this.CreatedDate = result.Date__c;
                this.primaryImage = result.Primary_Image__c;
                this.secondaryImage = result.Secondary_Image__c;
                this.layoutRecord = result;
                /*
                if (result.ContentDocumentLinks && result.ContentDocumentLinks.length > 0) {
                    let primaryImageId = null;
                    let secondaryImageId = null;
                    let warrantyImageId = null;
                    result.ContentDocumentLinks.forEach((docLink, index) => {
                        const documentId = docLink.ContentDocumentId;
    
                        if (index === 0) {
                            primaryImageId = documentId;
                            console.log('Primary Image ID: ' + primaryImageId);
                        } else if (index === 1) {
                            secondaryImageId = documentId;
                            console.log('Secondary Image ID: ' + secondaryImageId);
                        } else if (index === 2) {
                            warrantyImageId = documentId
                            this.warrantyImageId = documentId;
                        }
                    });
    
                    if (primaryImageId) {
                        const primaryContentVersionId = result.ContentDocumentLinks[0].ContentDocument.LatestPublishedVersionId;
                        this.primaryImageUrl = `/sfc/servlet.shepherd/version/download/${primaryContentVersionId}`;
                        this.primaryContentDocumentId = primaryImageId;
                        this.PrimaryAvailableBool = true;
                    }
    
                    if (secondaryImageId) {
                        const secondaryContentVersionId = result.ContentDocumentLinks[1].ContentDocument.LatestPublishedVersionId;
                        this.secondaryImageUrl = `/sfc/servlet.shepherd/version/download/${secondaryContentVersionId}`;
                        this.secondaryContentDocumentId = secondaryImageId;
                        this.SecondaryAvailableBool = true;
                    }
    
                    if (warrantyImageId) {
                        console.log('## thirdimage: ', thirdDocumentId);
                        console.log('## url: ', `/sfc/servlet.shepherd/version/download/${thirdDocumentId}`);
                        // this.isWarrantyDocAvl = true;
                        // const thirdDocumentId = result.ContentDocumentLinks[2].ContentDocument.LatestPublishedVersionId;
                        // this.warrantyImageUrlMain = `/sfc/servlet.shepherd/version/download/${thirdDocumentId}`;
                        // this.secondaryContentDocumentId = secondaryImageId;
                    }
    
    
                }
                })
                .catch(error => {
                    console.error('Error loading layouts:', error);
                });
    
            getCustomPage({ recordId: this.recordId })
                .then(result => {
                    console.log('Record ID2.......' + JSON.stringify(result));
    
                    result.forEach(element => {
                        this.clickCount++;
                        var newElement = {
                            Id: this.ElementList.length,
                            Name: element.Name,
                            label: element.label__c,
                            selected: false,
                            editMode: element.editMode__c,
                            toggle: element.toggle__c
                        };
                        console.log('newElement --- ' + JSON.stringify(newElement));
                        this.ElementList.push(newElement);
                    });
    
                })
                .catch(error => {
                    console.error('Error loading layouts:', error);
                });
        }
    */

    // openfileUpload(event) {
    //     if (event.target.files.length > 0) {
    //         const file = event.target.files[0];
    //         const fileUrl = URL.createObjectURL(file);
    //         this.uploadedFilesUrl = [...this.uploadedFilesUrl, { id: fileUrl }];
    //         this.secondaryAvailableBool = true;
    //         this.noImageAvailCertification = false;
    //     }
    // }

    // handleClick() {
    //     console.log('Certification/secondary logo submitted:', this.uploadedFilesUrl);
    // }

    // handleClickDeleteCertification(event) {
    //     const fileId = event.target.dataset.id;
    //     this.uploadedFilesUrl = this.uploadedFilesUrl.filter(file => file.id !== fileId);
    //     if (this.uploadedFilesUrl.length === 0) {
    //         this.secondaryAvailableBool = false;
    //         this.noImageAvailCertification = true;
    //     }
    // }

    /*
    handlImageDescriptionChange(event) {
    
        var imageId = event.currentTarget.dataset.id;
        var dataval = event.target.value;
        this.InspectionImagesList.forEach(element => {
            if (imageId === element.Id) {
                element.Image_Description__c = dataval;
            }
        });
    }
    
    handlImageDescriptionChange(event) {
    
        var imageId = event.currentTarget.dataset.id;
        var dataval = event.target.value;
        this.InspectionImagesList.forEach(element => {
            if (imageId === element.Id) {
                element.Image_Description__c = dataval;
            }
        });
    }
    */


    // imageUrl;
    // warrantyImageUrlMain;
    // termConditionImageUrlMain;
    // warrantyImageid;
    // termConditionDocId = '';
    // warrantyDocPreviewUrl = '';
    // TCDocPreviewUrl;
    // isTCDocAvl = false;
    // isWarrantyDocAvl = false;
    // selectedRecordId = '';
    // @track reportType = '';
    // @track PrimaryAvailableBool = false;
    // @track showInspectionImages = false;
    // @track noImageAvail = false;
    // @track SecondaryAvailableBool = false;
    // @track SecondaryUploadedFilesUrl = [];
    // fileDataSecondary;
    // @track primaryImageUrl = '';
    // @track secondaryImageUrl = '';
    // @track primaryContentDocumentId;
    // @track secondaryContentDocumentId;
    // @track QDR = '';
    // @track uploadedFilesUrl = [];
    // @track noImageAvailCertification = false;
    // @track IICRC = '';
    // @track primaryImageUrl = '';
    // @track secondaryImageUrl = '';
    // @track LetterFromTheOwnerBool = false;
    // @track InspectionBool = false;


    /*
        // to upload the primary image
        PrimaryOpenfileUpload(event) {
    
            if (event.target.files.length > 0) {
                const file = event.target.files[0];
                const fileUrl = URL.createObjectURL(file);
                this.PrimaryUploadedFilesUrl = [...this.PrimaryUploadedFilesUrl, { id: fileUrl }];
                var reader = new FileReader()
                reader.onload = () => {
                    var base64 = reader.result.split(',')[1]
                    this.fileDataPrimary = {
                        'filename': file.name,
                        'base64': base64,
                        'recordId': ''
                    }
                    console.log(this.fileData);
    
                }
                reader.readAsDataURL(file)
                // this.PrimaryAvailableBool = true;
                // this.noImageAvail = false;
            }
        }
    */

    @track deleteCustomPageModal = false;
    @track selectedDeletPageRecord;

    handleClickOnDeleteCustomPage(event) {
        this.deleteCustomPageModal = true
        this.selectedDeletPageRecord = event.currentTarget.dataset.recid;
        console.log('selectedDeletPageRecord : ', this.selectedDeletPageRecord);
    }

    handleClickOnCancelDeleteCustomPage() {
        this.deleteCustomPageModal = false;
    }

    handleDeleteCustomPage() {
        const layoutId = this.selectedDeletPageRecord;
        this.ElementList = this.ElementList.filter(item => item.Id !== layoutId);

        deleteLayoutPage({ layoutId })
            .then(() => {
                this.showToast('Success', 'Record successfully deleted!', 'success');
                // Remove the deleted layout from the list
                const mstTmpObj = {
                    'Id': this.recordId,
                    'Pages_JSON__c': JSON.stringify(this.ElementList)
                };
                UpdateMasterLayout({ mstLayoutObj: mstTmpObj })
                    .then(() => {
                        this.handleClickOnCancelDeleteCustomPage();
                        this.ElementList.forEach(result => {
                            if (result.label == 'Title') {
                                result.selected = true;
                                this.titlePageSelected = true;
                                this.pageLabel = result.label;
                            } else {
                                result.selected = false;
                            }
                        });
                    })
                    .catch(error => {
                    });
            })
            .catch(error => {
                console.log('error : ', JSON.stringify(error));
                this.showToast('Error', 'Failed to delete layout or associated files', 'error');
                this.isLoading = false; // Stop loading state in case of error
            });
    }

//     handleWarrantyUpload(event) {
//     const file = event.target.files[0];
//     if (!file || !file.name.match(/\.(png|jpg|jpeg)$/i)) {
//         this.fileError = 'Only PNG, JPG, JPEG allowed';
//         return;
//     }

//     const reader = new FileReader();
//     reader.onload = () => {
//         const base64 = reader.result.split(',')[1];
//         const tempUrl = reader.result; // Instant preview
        
//         // ✅ Upload to Salesforce Files (matches your other docs pattern)
//         uploadFile({
//             base64Data: base64,
//             fileName: 'warrantyDoc',
//             parentId: this.recordId // Master Template record
//         }).then(contentDocId => {
//             const permanentUrl = `/sfc/servlet.shepherd/version/download/?asPdf=false&id=${contentDocId}`;
            
//             // Store PERMANENT SF URL in ElementList (survives save/reload)
//             this.ElementList = this.ElementList.map(page => {
//                 if (page.label === 'Warranty') {
//                     return { 
//                         ...page, 
//                         warrantyImage: permanentUrl,
//                         warrantyContentDocId: contentDocId
//                     };
//                 }
//                 return page;
//             });
//             this.warrantyUrl = permanentUrl;
//             this.contentDocId.warrantyDocId = contentDocId; // Track for delete
//             this.isDocAvailable.warrantyImageAvl = true;
//         }).catch(error => {
//             console.error('Warranty upload failed:', error);
//             this.showToast('Error', 'Warranty image upload failed', 'error');
//         });
//     };
//     reader.readAsDataURL(file);
// }

// handleDeleteWarranty() {
//     // Delete from SF if saved (matches your other delete pattern)
//     if (this.ElementList[0]?.warrantyContentDocId) {
//         this.deleteMasterTemplateDocsSF(this.ElementList[0].warrantyContentDocId, 'Warranty Image');
//     }
    
//     this.warrantyUrl = null;
//     this.isDocAvailable.warrantyImageAvl = false;
    
//     this.ElementList = this.ElementList.map(page => {
//         if (page.label === 'Warranty') {
//             return { ...page, warrantyImage: null, warrantyContentDocId: null };
//         }
//         return page;
//     });
    
//     this.removeTempDoc('warrantyDoc'); // Clean temp list
// }

// handleTermConditionUpload(event) {
//     const file = event.target.files[0];
//     if (!file || !file.name.match(/\.(png|jpg|jpeg)$/i)) {
//         this.fileError = 'Only PNG, JPG, JPEG allowed';
//         return;
//     }

//     const reader = new FileReader();
//     reader.onload = () => {
//         const base64 = reader.result.split(',')[1];
//         const tempUrl = reader.result;
        
//         uploadFile({
//             base64Data: base64,
//             fileName: 'TermConditionDoc',
//             parentId: this.recordId
//         }).then(contentDocId => {
//             const permanentUrl = `/sfc/servlet.shepherd/version/download/?asPdf=false&id=${contentDocId}`;
            
//             this.ElementList = this.ElementList.map(page => {
//                 if (page.label === 'Terms and Conditions') {
//                     return { 
//                         ...page, 
//                         termConditionImage: permanentUrl,
//                         termConditionContentDocId: contentDocId
//                     };
//                 }
//                 return page;
//             });
//             this.termAndConditionUrl = permanentUrl;
//             this.contentDocId.termConDocId = contentDocId;
//             this.isDocAvailable.termConditionImageAvl = true;
//         }).catch(error => {
//             console.error('Terms upload failed:', error);
//             this.showToast('Error', 'Terms image upload failed', 'error');
//         });
//     };
//     reader.readAsDataURL(file);
// }

// handleDeleteTermCondition() {
//     if (this.ElementList[0]?.termConditionContentDocId) {
//         this.deleteMasterTemplateDocsSF(this.ElementList[0].termConditionContentDocId, 'Terms & Condition Image');
//     }
    
//     this.termAndConditionUrl = null;
//     this.isDocAvailable.termConditionImageAvl = false;
    
//     this.ElementList = this.ElementList.map(page => {
//         if (page.label === 'Terms and Conditions') {
//             return { ...page, termConditionImage: null, termConditionContentDocId: null };
//         }
//         return page;
//     });
    
//     this.removeTempDoc('TermConditionDoc');
// }

    @track currencyType = '';


    currencyOptions = [
        { label: 'USD ($)', value: 'USD' },
        { label: 'INR (₹)', value: 'INR' },
        { label: 'EUR (€)', value: 'EUR' },
        { label: 'GBP (£)', value: 'GBP' }
    ];

    handleCurrencyChange(event){
        this.currencyType = event.detail.value;
    }

}