import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle } from 'lightning/platformResourceLoader';
import customStyle from '@salesforce/resourceUrl/customStyle';
import insertProduct from '@salesforce/apex/ProductConfigureController.insertProduct';
import selectedUpdateProduct from '@salesforce/apex/ProductConfigureController.selectedUpdateProduct';
import uploadFile from '@salesforce/apex/ProductConfigureController.uploadFile';
import uploadFileToProduct from '@salesforce/apex/ProductConfigureController.uploadFileToProduct';
import deleteFile from '@salesforce/apex/ProductConfigureController.deleteFile';
import insertProductBundle from '@salesforce/apex/ProductConfigureController.insertProductBundle';
import updateProduct from '@salesforce/apex/ProductConfigureController.updateProduct';
import updateProductLineItems from '@salesforce/apex/ProductConfigureController.updateProductLineItems';
import deleteProduct from '@salesforce/apex/ProductConfigureController.deleteProduct';
import deleteProductBundle from '@salesforce/apex/ProductConfigureController.deleteProductBundle';
import deleteProductLineItems from '@salesforce/apex/ProductConfigureController.deleteProductLineItems';
import GetProducts from '@salesforce/apex/ProductConfigureController.GetProducts';
import GetProductsBundle from '@salesforce/apex/ProductConfigureController.GetProductsBundle';
import insertProductLineItm from '@salesforce/apex/ProductConfigureController.insertProductLineItm';
import insertProductLineItmSingle from '@salesforce/apex/ProductConfigureController.insertProductLineItmSingle';
import GetProductLineItm from '@salesforce/apex/ProductConfigureController.GetProductLineItm';
import hasChildRecords from '@salesforce/apex/ProductConfigureController.hasChildRecords';

export default class ProductConfigureCmp extends LightningElement {

    // filter = {
    //     criteria: [
    //         {
    //             fieldPath: 'Active__c',
    //             operator: 'eq',
    //             value: true,
    //         }
    //     ]
    // };

    get filter(){

        let criteria = [
            {
                fieldPath:'Active__c',
                operator:'eq',
                value:true
            }
        ];

        if(this.bundleCurrency){
            criteria.push({
                fieldPath:'Currency__c',
                operator:'eq',
                value:this.bundleCurrency
            });
        }

        return { criteria };
    }

    @track NewProdBool = false;
    @track editProdBool = false;
    @track prodName = '';
    @track unitOfMeas = '';
    @track isactive = false;
    @track productRecords;
    @track productBundleRecords;
    @track searchVal = '';
    @track searchValBundle = '';
    @track productNameValue = '';
    @track ProductCodeValue = '';
    @track productDescriptionValue = '';
    @track UOMValue = '';
    @track productUPCValue = '';
    @track productDQValue = 1;
    @track productActionId = '';
    @track bundleNameValue = '';
    @track bundleDescription = '';
    @track productClear = false;
    @track productDelete = false;
    @track isShowModal = false;
    @track productBundle = false;
    @track productItems = [];
    @track productId = '';
    @track fileData;
    @track previewUrl;
    @track imageAvailable = false;
    @track productImageUrl;
    @track selectedProdId = '';
    @track imageUploaded = false;
    @track showMessage = false;
    @track showMessageProducts = false;
    loaded = false;

    @track productItemList = [{
        'Id': '',
        'Quantity': 0,
        'Price': 0.00,
        'LineTotal': 0,
        'productBundle': '',
        'productId': '',
        'isActive': false,
    }];

    @track productItemListInsert = [{
        'Id': 1,
        'Quantity': 0,
        'Price': 0.00,
        'LineTotal': 0,
        'productBundle': '',
        'productId': '',
        'isActive': false
    }];

    renderedCallback() {

        Promise.all([

            loadStyle(this, customStyle)

        ]);

    }
    connectedCallback() {
        this.getProductRecord(this.searchVal);
        this.getProductRecordBundle(this.searchValBundle);
    }

    // getProductRecord(search) {
    //     GetProducts({ searchKey: search })
    //         .then(result => {
    //             this.showMessageProducts = result.length == 0 ? true : false;;
    //             result.forEach(element => {
    //                 element.Default_Price__c = element.Default_Price__c ? element.Default_Price__c : 0;
    //             });
    //             // this.productRecords = result;

    //             this.productRecords = result.map(prod => {
    //                 return {
    //                     ...prod,
    //                     currencySymbol: this.currencySymbols[prod.Currency__c] || '$'
    //                 };
    //             });

    //         })
    //         .catch(error => {
    //             this.showMessageProducts = true;
    //         });
    // }

    // getProductRecord(search) {
    //     GetProducts({ 
    //         searchKey: search,
    //         currencyFilter: this.currencyFilter
    //     })
    //     .then(result => {

    //         this.showMessageProducts = result.length == 0;

    //         result.forEach(element => {
    //             element.Default_Price__c = element.Default_Price__c ? element.Default_Price__c : 0;
    //         });

    //         this.productRecords = result.map(prod => {
    //             return {
    //                 ...prod,
    //                 currencySymbol: this.currencySymbols[prod.Currency__c] || '$'
    //             };
    //         });

    //     })
    //     .catch(error => {
    //         this.showMessageProducts = true;
    //     });
    // }

    getProductRecord(search) {
    GetProducts({ 
        searchKey: search,
        currencyFilter: this.currencyFilter
    })
    .then(result => {

        this.showMessageProducts = result.length == 0;

        result.forEach(element => {
            element.Default_Price__c = element.Default_Price__c ? element.Default_Price__c : 0;
        });

        this.productRecords = result.map(prod => {
            return {
                ...prod,
                currencySymbol: this.currencySymbols[prod.Currency__c] || '$',

                // 🔥 ADD THIS LINE
                displayName: prod.Product_Code__c 
                    ? `${prod.Name} (${prod.Product_Code__c})`
                    : prod.Name
            };
        });

    })
    .catch(error => {
        this.showMessageProducts = true;
    });
}

    @track isShow = true;

    // getProductRecordBundle(search) {
    //     GetProductsBundle({ searchKey: search })
    //         .then(result => {
    //             console.log('resusus - - -  -', result);
    //             this.showMessage = result.length == 0 ? true : false;
    //             this.productBundleRecords = result;
    //             this.productBundleRecords[0].selected = true;
    //             this.selectedProdBundleId = this.productBundleRecords[0].bundleId;
    //             this.getProductItems(this.productBundleRecords[0].bundleId);
    //             this.isShow = true;


    //         })
    //         .catch(error => {
    //             this.isShow = false
    //             this.showMessage = true;
    //         });
    // }

    getProductRecordBundle(search) {

        GetProductsBundle({
            searchKey: search,
            currencyFilter: this.bundleCurrencyFilter
        })
        .then(result => {

            this.showMessage = result.length == 0;

            this.productBundleRecords = result;

            if(result.length > 0){
                this.productBundleRecords[0].selected = true;
                this.selectedProdBundleId = this.productBundleRecords[0].bundleId;
                this.getProductItems(this.productBundleRecords[0].bundleId);
            }

            this.isShow = true;

        })
        .catch(error => {
            this.isShow = false;
            this.showMessage = true;
        });
    }

    handleSearchChangeBundle(event) {
        const searchTerm = event.target.value;
        this.searchValBundle = searchTerm;
        this.getProductRecordBundle(this.searchValBundle);
    }

    handleSearchChange(event) {
        const searchTerm = event.target.value;
        this.searchVal = searchTerm;
        this.getProductRecord(this.searchVal);
    }

    handelOnClickNewProd() {
        this.NewProdBool = (this.NewProdBool == true) ? false : true;
    }

    handleOnChangeNewProd(event) {
    let label = event.target.label;

    if (label === 'Product Name:') {
        this.productNameValue = event.target.value;

    } else if (label === 'Product Code:') {
        this.ProductCodeValue = event.target.value;

        // 🔥 FRONTEND DUPLICATE CHECK
        const isDuplicate = this.productRecords?.some(
            rec => rec.Product_Code__c === this.ProductCodeValue && rec.Currency__c === this.selectedCurrency
        );

        if (isDuplicate) {
            event.target.setCustomValidity('Product code already exists for this currency');
        } else {
            event.target.setCustomValidity('');
        }
        event.target.reportValidity();

    } else if (label === 'Product Description:') {
        this.productDescriptionValue = event.target.value;

    } else if (label === 'Unit per Cost:') {
        this.productUPCValue = event.target.value;

    } else if (label === 'Default Quantity:') {
        this.productDQValue = event.target.value;

    } else if (label === 'Active') {
        this.isactive = event.target.checked;
    }
}


    // handleOnChangeNewProd(event) {
    //     let label = event.target.label;
    //     if (label === 'Product Name:') {
    //         this.productNameValue = event.target.value;
    //     } else if (label === 'Product Code:') {
    //         this.ProductCodeValue = event.target.value;
    //     } else if (label === 'Product Description:') {
    //         this.productDescriptionValue = event.target.value;
    //     } else if (label === 'Unit per Cost:') {
    //         this.productUPCValue = event.target.value;
    //     } else if (label === 'Default Quantity:') {
    //         this.productDQValue = event.target.value;
    //     }
    //     else if (label === 'Active') {
    //         this.isactive = event.target.checked;
    //     }
    // }

    handleOnChangeEditProd(event) {
        let label = event.target.label;
        if (label === 'Product Name:') {
            this.productNameValue = event.target.value;
        } else if (label === 'Product Code:') {
            this.ProductCodeValue = event.target.value;
        } else if (label === 'Product Description:') {
            this.productDescriptionValue = event.target.value;
        } else if (label === 'Unit per Cost:') {
            this.productUPCValue = event.target.value;
        } else if (label === 'Default Quantity:') {
            this.productDQValue = event.target.value;
        }
        else if (label === 'Active') {
            this.isactive = event.target.checked;
        }
    }

    // handleOnClickSaveNewProd() {
    //     let num = 0;
    //     if (this.productDQValue < 1) {
    //         this.showToast('Error', 'Default Quantity must be greater than or equal to 1', 'error');
    //         return;
    //     }

    //     this.productRecords.forEach(element => {
    //         if (element.Name === this.productNameValue) {
    //             this.showToast('Error', 'This Product is alredy exist', 'error');
    //             num = 1;
    //             return;
    //         }
    //     });
    //     if (num != 1) {
    //         if (this.productNameValue != '') {
    //             var productObj = {
    //                 'Name': this.productNameValue,
    //                 'Product_Code__c': this.ProductCodeValue,
    //                 'Description__c': this.productDescriptionValue,
    //                 'Default_Price__c': this.productUPCValue,
    //                 'Default_Quantity__c': this.productDQValue,
    //                 'Active__c': this.isactive
    //             }



    //             insertProduct({ prod_Obj: productObj })
    //                 .then(result => {
    //                     if (this.fileData) {
    //                         this.handleClickFileUpload(result.Id);
    //                     }
    //                     this.showToast('Success', 'Product created successfully!', 'success');
    //                     this.resetForm();
    //                     this.NewProdBool = false;

    //                     this.loaded = true;
    //                     setTimeout(() => {
    //                         this.getProductRecord(this.searchVal);
    //                         this.loaded = false;
    //                     }, 3000);
    //                 })
    //                 .catch(error => {
    //                     this.showToast('Error', error.body ? error.body.message : '', 'error');
    //                 });
    //         } else {
    //             this.showToast('Error', 'Please Enter Product Name', 'error');
    //         }
    //     }


    // }

        // handleOnClickSaveNewProd() {
        //     // Validate quantity
        //     if (!this.productDQValue || this.productDQValue < 1) {
        //         this.showToast('Error', 'Default Quantity must be greater than or equal to 1', 'error');
        //         return;
        //     }

        //     // Validate product name
        //     if (!this.productNameValue || this.productNameValue.trim() === '') {
        //         this.showToast('Error', 'Please enter a product name', 'error');
        //         return;
        //     }

        //     // Check for duplicate
        //     const isDuplicate = this.productRecords.some(
        //         record => record.Name?.trim().toLowerCase() === this.productNameValue.trim().toLowerCase()
        //     );

        //     if (isDuplicate) {
        //         this.showToast('Error', 'This product already exists', 'error');
        //         return;
        //     }

        //     // Prepare product object
        //     const productObj = {
        //         Name: this.productNameValue.trim(),
        //         Product_Code__c: this.ProductCodeValue,
        //         Description__c: this.productDescriptionValue,
        //         Default_Price__c: this.productUPCValue,
        //         Default_Quantity__c: this.productDQValue,
        //         Currency__c: this.selectedCurrency,
        //         Active__c: this.isactive
        //     };

        //     // Call Apex to insert product
        //     insertProduct({ prod_Obj: productObj })
        //         .then(result => {
        //             if (this.fileData) {
        //                 this.handleClickFileUpload(result.Id);
        //             }

        //             this.showToast('Success', 'Product created successfully!', 'success');
        //             this.resetForm();
        //             this.NewProdBool = false;

        //             // Refresh products after insert

        //             this.loaded = true;
        //             setTimeout(() => {
        //                 this.getProductRecord(this.searchVal);
        //                 this.loaded = false;
        //             }, 1000);
        //         })
        //         .catch(error => {
        //             this.showToast(
        //                 'Error',
        //                 error?.body?.message || 'An unexpected error occurred while creating product.',
        //                 'error'
        //             );
        //         });
        // }

        handleOnClickSaveNewProd() {

    // Quantity validation
    if (!this.productDQValue || this.productDQValue < 1) {
        this.showToast('Error', 'Default Quantity must be greater than or equal to 1', 'error');
        return;
    }

    // Name validation
    if (!this.productNameValue || this.productNameValue.trim() === '') {
        this.showToast('Error', 'Please enter a product name', 'error');
        return;
    }

    // 🔥 FRONTEND DUPLICATE CHECK (Product Code)
    const isDuplicate = this.productRecords?.some(
        rec => rec.Product_Code__c === this.ProductCodeValue && rec.Currency__c === this.selectedCurrency
    );

    if (isDuplicate) {
        this.showToast('Error', 'Product with same code and currency already exists', 'error');
        return;
    }

    const productObj = {
        Name: this.productNameValue.trim(),
        Product_Code__c: this.ProductCodeValue,
        Description__c: this.productDescriptionValue,
        Default_Price__c: this.productUPCValue,
        Default_Quantity__c: this.productDQValue,
        Currency__c: this.selectedCurrency,
        Active__c: this.isactive
    };

    insertProduct({ prod_Obj: productObj })
        .then(result => {

            if (this.fileData) {
                this.handleClickFileUpload(result.Id);
            }

            this.showToast('Success', 'Product created successfully!', 'success');
            this.resetForm();
            this.NewProdBool = false;

            // 🔥 instant refresh
            this.getProductRecord(this.searchVal);

        })
.catch(error => {
    console.log('FULL ERROR:', JSON.stringify(error));
    console.log('ERROR BODY:', error.body);
    console.log('ERROR MESSAGE:', error.body?.message);
    console.log('RAW ERROR:', error);

    let message = 'Something went wrong';

    if (error?.body?.message) {
        message = error.body.message;
    } else if (error?.body?.pageErrors && error.body.pageErrors.length > 0) {
        message = error.body.pageErrors[0].message;
    } else if (error?.body?.fieldErrors) {
        const fieldErrors = Object.values(error.body.fieldErrors);
        if (fieldErrors.length > 0 && fieldErrors[0].length > 0) {
            message = fieldErrors[0][0].message;
        }
    } else if (error?.message) {
        message = error.message;
    }

    this.showToast('Error', message, 'error');
});
}


    handelOnClickCancelNewProd() {
        this.productNameValue = '';
        this.ProductCodeValue = '';
        this.productDescriptionValue = '';
        this.NewProdBool = false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    updateDefaultPrice(event) {
        let value = event.target.value;
        let prodId = event.currentTarget.dataset.id;
        this.productRecords.forEach(element => {
            if (element.Id == prodId) {
                element.Default_Price__c = value;

            }
        });
        var prodObj = {
            'Id': prodId,
            'Default_Price__c': value
        };
        this.updateProductFunction(prodObj);

    }

    onchangeNumber(event) {
        event.target.value = event.target.value.replace(/[^0-9\-]/g, '');
    }

    preventDecimal(event) {
        if (event.key === '.' || event.key === 'e') {
            event.preventDefault(); // Prevent typing decimals or exponential notation
        }
    }

    updateDefaultQuantity(event) {


        let value = event.target.value;
        let prodId = event.currentTarget.dataset.id;
        if (value < 1) {
            this.showToast('Error', 'Default Quantity must be greater than or equal to 1', 'error');
            return;
        }
        this.productRecords.forEach(element => {
            if (element.Id == prodId) {
                element.Default_Quantity__c = value;

            }
        });
        var prodObj = {
            'Id': prodId,
            'Default_Quantity__c': value
        };
        this.updateProductFunction(prodObj);


    }


    /*
    * Created on Tue Jan 21 2025
    * Create by: Shubham Sen
    * Description: This function will update the  price for product line item
    * Copyright (c) 2025 NSIQ
    */

    updateProductLineItemPrice(event) {

        let value = event.target.value;
        let plItemId = event.currentTarget.dataset.id;
        let tempPLIObj = {
            'Id': plItemId,
            'Price__c': value
        };
        this.updateProductLineRecords(tempPLIObj);

    }

    /*
   * Created on Tue Jan 21 2025
   * Create by: Shubham Sen
   * Description: This function will update the  quantity for product line item
   * Copyright (c) 2025 NSIQ
   */
    updateProductLineItemQuantity(event) {
        let value = event.target.value;
        let plItemId = event.currentTarget.dataset.id;
        let tempPLIObj = {
            'Id': plItemId,
            'Quantity__c': value
        };
        this.updateProductLineRecords(tempPLIObj);
    }
    /*
   * Created on Tue Jan 21 2025
   * Create by: Shubham Sen
   * Description: This function will update the  product for product line item
   * Copyright (c) 2025 NSIQ
   */
    updateProductLineItemProduct(event) {
        let value = event.target.value;
        let plItemId = event.currentTarget.dataset.id;

        console.log('value- - - : ', value);
        console.log('plItemId- - -  : ', plItemId);

        if (value == null) {
            let tempPLIObj = {
                'Id': plItemId,
                'Product__c': value,
                'Quantity__c': 0,
                'Price__c': 0
            };
            this.updateProductLineRecords(tempPLIObj);

        } else {
            let Quantity = 0;
            let Price = 0;
            this.productRecords.forEach(element => {
                if (element.Id == value) {
                    Quantity = 1;
                    Price = element.Default_Price__c;
                }
            });

            let tempPLIObj = {
                'Id': plItemId,
                'Product__c': value,
                'Quantity__c': Quantity,
                'Price__c': Price
            };
            this.updateProductLineRecords(tempPLIObj);
        }
    }


    /*
  * Created on Tue Jan 21 2025
  * Create by: Shubham Sen
  * Description: Generic function to update the product line items records
  * Copyright (c) 2025 NSIQ
  */

    async updateProductLineRecords(obj) {
        try {
            await updateProductLineItems({ plitem_Obj: obj });
        } catch (error) {
            console.log('Error: ', error);
        }
    }





    @track isShowModalNotDelete = false;


    async handleOnProductAction(event) {
        let label = event.currentTarget.dataset.label;
        this.productActionId = event.currentTarget.dataset.id;
        console.log('label - --  - -', label);
        this.productDelete = (label == 'Delete') ? true : false;
        this.productClear = (label == 'Clear') ? true : false;

        let hasChild = await hasChildRecords({ parentId: this.productActionId });

        if (hasChild) {
            this.isShowModalNotDelete = true;
        } else {
            this.isShowModal = true;
        }
    }
    hideModalBox() {
        this.isShowModal = false;
    }
    hidNotDeleteModalBox() {
        this.isShowModalNotDelete = false;
    }

    handleClickDelete() {
        deleteProduct({ Id: this.productActionId })
            .then(result => {
                this.getProductRecord(this.searchVal);
                this.hideModalBox();
                this.showToast('Success', 'Product Delete Successfully!', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : '', 'error');
            });
    }

    handleClickClear() {
        var prodObj = {
            'Id': this.productActionId,
            'Default_Quantity__c': 1,
            'Default_Price__c': 0
        };
        this.productRecords.forEach(element => {
            if (element.Id == this.productActionId) {
                element.Default_Quantity__c = 1;
                element.Default_Price__c = 0;
            }
        });
        this.updateProductFunction(prodObj);
        this.hideModalBox();
    }

    updateProductFunction(Object) {
        updateProduct({ prod_Obj: Object })
            .then(result => {
                this.showToast('Success', 'Product Update Successfully!', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : '', 'error');
            });
    }

    handleChangeBundle(event) {
        let label = event.target.label;

        if (label === 'Bundle Name') {
            this.bundleNameValue = event.target.value;
        } else if (label === 'Description') {
            this.bundleDescriptionValue = event.target.value;
        }
    }

    handleClickCancelProductBundle() {
        this.productBundle = false;
    }

    handleClickNewProductBundle() {
        this.productBundle = true;
        this.bundleNameValue = '';
        this.bundleDescriptionValue = '';
        this.bundleCurrency = '';
        this.currencyLocked = false;
        this.productItemListInsert = [{
            'Id': '',
            'Quantity': 0,
            'Price': 0.00,
            'LineTotal': 0,
            'productBundle': '',
            'productId': ''
        }];
    }

    handleClickInsertProductBundle() {
        if(!this.bundleCurrency){
            this.showToast('Error','Please select bundle currency','error');
            return;
        }
        if (this.bundleNameValue != '') {
            var productObj = {
                'Name': this.bundleNameValue,
                'Description__c': this.bundleDescriptionValue,
                'Currency__c': this.bundleCurrency
            }
            insertProductBundle({ prod_Bundle_Obj: productObj })
                .then(result => {
                    console.log('result - - -', result);

                    this.productItemListInsert.forEach(element => {
                        element.productBundle = result.Id;

                        let prodObj = {
                            'Product_Bundle__c': element.productBundle,
                            'Quantity__c': element.Quantity,
                            'Product__c': element.productId,
                            'Price__c': element.Price
                        }
                        console.log('prodObj - - -', JSON.stringify(prodObj));
                        this.productItems.push(prodObj);
                    });



                    insertProductLineItm({ prod_itm_Lst: this.productItems })
                        .then(result => {
                            this.productItems = [];
                            this.productItemListInsert = [{
                                'Id': '',
                                'Quantity': 0,
                                'Price': 0.00,
                                'LineTotal': 0,
                                'productBundle': '',
                                'productId': ''
                            }];
                            this.getProductRecordBundle(this.searchValBundle);
                        })
                        .catch(error => {
                            this.showToast('Error', error.body ? error.body.message : '', 'error');
                        });

                    this.showToast('Success', 'Product Bundle Insert Successfully!', 'success');
                    this.productBundle = false;
                    this.getProductRecordBundle(this.searchValBundle);
                })
                .catch(error => {
                    this.showToast('Error', error.body ? error.body.message : '', 'error');
                });
        } else {
            this.showToast('Error', 'Please Enter Product Bundle Name', 'error');
        }
    }

    @track selectedProdBundleId = '';

    handleClickTab(event) {
        let id = event.currentTarget.dataset.id;
        this.selectedProdBundleId = id;
        this.productItemList = [];
        this.productBundleRecords.forEach(element => {
            if (element.bundleId === id) {
                element.selected = true;
                this.bundleCurrency = element.currencyCode;
                this.currencyLocked = true;
                this.getProductItems(id);
            } else {
                element.selected = false;
            }
        });
    }

    getProductItems(Id) {
        this.productItemList = [];
        GetProductLineItm({ Id: Id })
            .then(result => {
                console.log('GetProductLineItm result - - -', result);
                if (result.length > 0) {
                    result.forEach(element => {
                        var items = {
                            'Id': element.Id,
                            'Quantity': (element.Quantity__c) ? element.Quantity__c : 0,
                            'Price': (element.Price__c) ? element.Price__c : 0,
                            'LineTotal': (element.Price__c * element.Quantity__c).toFixed(2),
                            'productBundle': element.Product_Bundle__c,
                            'productId': element.Product__c
                        }

                        items.LineTotal = (items.LineTotal) ? items.LineTotal : 0;

                        this.productItemList.push(items);
                    });
                } else {
                    this.productItemList = [{
                        'Id': '',
                        'Quantity': 0,
                        'Price': 0.00,
                        'LineTotal': 0,
                        'productBundle': '',
                        'productId': ''
                    }];
                }

            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : '', 'error');
            })
    }

    addItem() {

        let prodObj = {
            'Product_Bundle__c': this.selectedProdBundleId
        }

        insertProductLineItmSingle({ plObj: prodObj })
            .then(result => {
                this.productItemList.push({
                    'Id': result.Id,
                    'Quantity': 0,
                    'Price': 0.00,
                    'LineTotal': 0,
                    'productBundle': result.Product_Bundle__c,
                    'productId': ''
                });
            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : '', 'error');
            });


    }

    addItemInsert() {
        this.productItemListInsert.push(
            {
                'Id': this.productItemListInsert.length + 1,
                'Quantity': 0,
                'Price': 0.00,
                'LineTotal': 0,
                'productBundle': '',
                'productId': ''
            }
        );
        this.updateCurrencyLock();
    }

    deleteItemInsert(event) {
        var rowIndex = event.currentTarget.dataset.index;
        if (this.productItemListInsert.length > 1) {
            this.productItemListInsert.splice(rowIndex, 1);
            this.updateCurrencyLock();
        }
    }


    async deleteItem(event) {

        try {
            console.log('this.productItemList.length : ', this.productItemList.length);
            if (this.productItemList.length > 1) {
                let rowIndex = event.currentTarget.dataset.index;
                let productLineItemId = this.productItemList[rowIndex]?.Id;
                if (productLineItemId) {
                    const result = await deleteProductLineItems({ Id: productLineItemId });
                    if (result) {
                        this.productItemList.splice(rowIndex, 1);
                    }
                }
            } else {
                this.showToast('Error', 'Minimum One Product required!', 'error');
                return;
            }
        } catch (error) {
            console.log('## in the error: ', JSON.stringify(error));
        }
    }

    handleChangeProductItem(event) {
        var rowIndex = event.currentTarget.dataset.index;
        if (event.target.label === 'product') {
            this.productItemListInsert[rowIndex].productId = event.detail.recordId;
            console.log('product - - -' + event.detail.recordId);
            this.updateCurrencyLock();
            this.productRecords.forEach(element => {
                if (element.Id == event.detail.recordId) {
                    this.productItemListInsert[rowIndex].Quantity = 1;
                    this.productItemListInsert[rowIndex].Price = element.Default_Price__c;
                    this.productItemListInsert[rowIndex].LineTotal = (element.Default_Price__c) ? (element.Default_Price__c * element.Default_Quantity__c).toFixed(2) : 0;
                }
            });

        } else if (event.target.label === 'Quantity') {
            this.productItemListInsert[rowIndex].Quantity = event.target.value;
            this.updateCurrencyLock();
            this.productItemListInsert[rowIndex].LineTotal = (this.productItemListInsert[rowIndex].Price * this.productItemListInsert[rowIndex].Quantity).toFixed(2);
        } else if (event.target.label === 'Price') {
            this.productItemListInsert[rowIndex].Price = event.target.value;
            this.updateCurrencyLock();
            this.productItemListInsert[rowIndex].LineTotal = (this.productItemListInsert[rowIndex].Price * this.productItemListInsert[rowIndex].Quantity).toFixed(2);
        }
    }

    handleChangeProductLineItem(event) {
        var rowIndex = event.currentTarget.dataset.index;
        if (event.target.label === 'product') {
            this.productItemList[rowIndex].productId = event.detail.recordId;
            console.log('product - - -' + event.detail.recordId);
            this.productRecords.forEach(element => {
                if (element.Id == event.detail.recordId) {
                    this.productItemList[rowIndex].Quantity = 1;
                    this.productItemList[rowIndex].Price = element.Default_Price__c;
                    this.productItemList[rowIndex].LineTotal = (element.Default_Price__c) ? (element.Default_Price__c * element.Default_Quantity__c).toFixed(2) : 0;
                }
            });

        } else if (event.target.label === 'Quantity') {
            this.productItemList[rowIndex].Quantity = event.target.value;
            this.productItemList[rowIndex].LineTotal = (this.productItemList[rowIndex].Price * this.productItemList[rowIndex].Quantity).toFixed(2);
        } else if (event.target.label === 'Price') {
            this.productItemList[rowIndex].Price = event.target.value;
            this.productItemList[rowIndex].LineTotal = (this.productItemList[rowIndex].Price * this.productItemList[rowIndex].Quantity).toFixed(2);
        }
    }

    // Product File Upload Code Here

    get isImage() {
        if (this.fileData && this.fileData.filename) {
            const extension = this.fileData.filename.split('.').pop().toLowerCase();
            return ['png', 'jpg', 'jpeg', 'gif', 'bmp'].includes(extension);
        }
        return false;
    }

    openfileUpload(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            this.previewUrl = reader.result;
            this.fileData = {
                filename: file.name,
                base64: base64,
                recordId: ''
            };
        };

        reader.readAsDataURL(file);
    }

    handleImageRemove() {
        this.previewUrl = '';
    }

    handleClickFileUpload(recordId) {
        if (!this.fileData) return;

        this.fileData.recordId = recordId;
        const { base64, filename, recordId: rid } = this.fileData;

        uploadFile({ base64, filename, recordId: rid })
            .then((result) => {
                this.fileData = null;
                this.imageAvailable = true;
                this.imageUploaded = true;
                this.previewUrl = `/sfc/servlet.shepherd/version/download/${result}`;
                this.productImageUrl = this.previewUrl;
                // this.showToast('Success', 'Product image uploaded successfully!', 'success');
            })
            .catch((error) => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    handleClickDeleteImage() {
        deleteFile({ recordId: this.selectedProdId })
            .then(() => {
                this.previewUrl = null;
                this.productImageUrl = null;
                this.imageAvailable = false;
                this.fileData = null;
                // this.showToast('Success', 'Image deleted successfully!', 'success');
            })
            .catch((error) => {
                this.showToast('Error', error.body.message, 'error');
            });
    }

    handelOnClickEditProd(event) {
        this.selectedProdId = event.currentTarget.dataset.id;
        this.editProdBool = true;
       
        this.getProductRecord(this.searchVal);
        console.log('selectedProdId : ', this.selectedProdId);
        console.log('this.editProdBool : ', this.editProdBool);

        const selectedProduct = this.productRecords.find(prod => prod.Id === this.selectedProdId);

        if (selectedProduct) {
            this.productNameValue = selectedProduct.Name;
            this.ProductCodeValue = selectedProduct.Product_Code__c;
            this.productDescriptionValue = selectedProduct.Description__c;
            this.productUPCValue = selectedProduct.Default_Price__c;
            this.selectedCurrency = selectedProduct.Currency__c;
            this.productDQValue = selectedProduct.Default_Quantity__c;
            this.isactive = selectedProduct.Active__c ? true : false;

            if (selectedProduct.ContentDocumentLink_Id__c) {
                this.imageAvailable = true;
                this.previewUrl = `/sfc/servlet.shepherd/version/download/${selectedProduct.ContentDocumentLink_Id__c}`;
                this.productImageUrl = this.previewUrl;
            } else {
                this.imageAvailable = false;
                this.previewUrl = null;
                this.productImageUrl = null;
            }

            this.fileData = null;
            this.imageUploaded = false;
        }
    }

    handleOnClickSaveEditProd() {

        if (this.productDQValue < 1) {
            this.showToast('Error', 'Default Quantity must be greater than or equal to 1', 'error');
            return;
        }

        if (this.productNameValue !== '') {
            const productObj = {
                Id: this.selectedProdId,
                Name: this.productNameValue,
                Product_Code__c: this.ProductCodeValue,
                Description__c: this.productDescriptionValue,
                Default_Price__c: this.productUPCValue,
                Default_Quantity__c: this.productDQValue,
                Currency__c: this.selectedCurrency,
                Active__c: this.isactive
            };

            selectedUpdateProduct({ prod_Obj: productObj })
                .then(result => {
                    this.showToast('Success', 'Product updated successfully!', 'success');
                    this.resetForm();
                    this.editProdBool = false;
                    this.loaded = true;
                    setTimeout(() => {
                        this.getProductRecord(this.searchVal);
                        this.loaded = false;
                    }, 3000);
                })
                .catch(error => {
                    this.showToast('Error', error.body?.message || 'Unknown error', 'error');
                });
        } else {
            this.showToast('Error', 'Please Enter Product Name', 'error');
        }
    }

    handelOnClickCancelEditProd() {
        this.editProdBool = false;
        this.loaded = true;
        setTimeout(() => {
            this.resetForm();
            this.loaded = false;
        }, 3000);

    }

    handelOnClickCancelNewProd() {

        this.NewProdBool = false;
        this.loaded = true;
        setTimeout(() => {
            this.resetForm();
            this.loaded = false;
        }, 3000)
    }

    resetForm() {
        this.productNameValue = '';
        this.ProductCodeValue = '';
        this.productDescriptionValue = '';
        this.productUPCValue = '';
        this.isactive = false;
        this.fileData = null;
        this.previewUrl = null;
        this.imageAvailable = false;
        this.productImageUrl = null;
        this.selectedProdId = '';
        this.imageUploaded = false;
        this.productDQValue = 1
    }

    handleImageDelete() {
        this.previewUrl = null;
        this.fileData = null;
        this.imageUploaded = false;
        this.productImageUrl = null;
        this.imageAvailable = false;

        // optionally call Apex to delete ContentDocumentLink from record in edit mode
        if (this.selectedProdId) {
            deleteFile({ recordId: this.selectedProdId })
                .then(() => {
                    // this.showToast('Success', 'Image deleted successfully!', 'success');
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        }
    }

    handleFileChange(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            let base64 = reader.result.split(',')[1]; // get Base64 string
            uploadFileToProduct({
                productId: this.selectedProdId,  // make sure this is set earlier
                base64Data: base64,
                fileName: file.name
            })
                .then(result => {
                    // this.showToast('Success', 'Image uploaded successfully', 'success');
                    this.imageAvailable = true;
                    const servletUrl = '/sfc/servlet.shepherd/version/download/' + result; // result is ContentVersionId or DocumentId
                    this.productImageUrl = servletUrl;
                    this.imageAvailable = true;
                })
                .catch(error => {
                    console.error(error);
                    this.showToast('Error', error, 'error');
                });
        };

        reader.readAsDataURL(file);
    }

    @track deleteProductBundleModal = false;
    @track selectedProdBundleId

    deleteProductBundle(event) {
        let Id = event.currentTarget.dataset.id;
        this.selectedProdBundleId = Id
        this.deleteProductBundleModal = true;
    }

    deleteProductBundleCancel() {
        this.deleteProductBundleModal = false;
    }

    handleClickOnDeleteProductBundle() {
        deleteProductBundle({ Id: this.selectedProdBundleId })
            .then(result => {
                this.getProductRecordBundle(this.searchValBundle);
                this.deleteProductBundleCancel();
                this.showToast('Success', 'Product Bundle Delete Successfully!', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body ? error.body.message : '', 'error');
            });
    }

    handlePriceInput(event) {
        let value = event.target.value;

        if (value && value.replace('.', '').length >= 6) {
            event.target.setCustomValidity('Only 6 digits are allowed');
            if (value && value.replace('.', '').length > 6) {
                value = value.slice(0, 6 + (value.includes('.') ? 1 : 0));
                event.target.value = value;
            }
        } else {
            event.target.setCustomValidity('');
        }

        event.target.reportValidity();
    }




    //----------IMPORT MODAL


    @track isImportProductsModalOpen = false;
    @track isImportProductsBundleModalOpen = false;

    // Open Modal
    openImportProductsModal() {
        this.isImportProductsModalOpen = true;
    }

    // Close Modal
    closeImportProductsModal() {
        this.isImportProductsModalOpen = false;
        this.getProductRecord(this.searchVal);
        
    }

    openImportProductsBundleModal() {
        this.isImportProductsBundleModalOpen = true;
        this.getProductRecordBundle(this.searchValBundle);
    }

    // Close Modal
    closeImportProductsBundleModal() {
        this.isImportProductsBundleModalOpen = false;
    }


    //********************************************************** */

    @track selectedCurrency = 'USD';

    currencyOptions = [
        { label: '($) USD', value: 'USD' },
        { label: '(₹) INR', value: 'INR' },
        { label: '(€) EUR', value: 'EUR' },
        { label: '(£) GBP', value: 'GBP' }
    ];

    handleCurrencyChange(event) {
        this.selectedCurrency = event.detail.value;
    }

    currencySymbols = {
        USD: '$',
        INR: '₹',
        EUR: '€',
        GBP: '£'
    };

    get currencySymbol() {
        return this.currencySymbols[this.selectedCurrency] || '$';
    }

    @track currencyFilter = '';

    handleCurrencyFilter(event) {
        this.currencyFilter = event.detail.value;
        this.getProductRecord(this.searchVal);
    }

    @track bundleCurrencyFilter = '';

    handleBundleCurrencyFilter(event) {
        this.bundleCurrencyFilter = event.detail.value;
        this.getProductRecordBundle(this.searchValBundle);
    }

    currencyOptionsSearch = [
        { label: 'None', value: '' },
        { label: '($) USD', value: 'USD' },
        { label: '(₹) INR', value: 'INR' },
        { label: '(€) EUR', value: 'EUR' },
        { label: '(£) GBP', value: 'GBP' }
    ];

    @track bundleCurrency = '';
    @track currencyLocked = false;

    handleBundleCurrencyChange(event){

        this.bundleCurrency = event.detail.value;

        // reset product rows only if no products are selected yet
        if (!this.hasSelectedInsertProducts) {
            this.productItemListInsert = [{
                'Id': 1,
                'Quantity': 0,
                'Price': 0.00,
                'LineTotal': 0,
                'productBundle': '',
                'productId': ''
            }];
        }

        this.updateCurrencyLock();
    }

    get hasSelectedInsertProducts() {
        return (this.productItemListInsert || []).some(item => !!item.productId);
    }

    updateCurrencyLock() {
        this.currencyLocked = this.hasSelectedInsertProducts;
    }


    get bundleTotal(){

        let total = 0;

        this.productItemList.forEach(item => {
            total += Number(item.LineTotal || 0);
        });

        return total.toFixed(2);
    }
}
