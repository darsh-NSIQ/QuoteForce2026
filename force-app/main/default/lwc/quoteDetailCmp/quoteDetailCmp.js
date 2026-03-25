import { LightningElement, api, track } from 'lwc';
import getSectionData from '@salesforce/apex/ProductConfigurationController.getSectionData';
import deleteQuoteLineItem from '@salesforce/apex/ProductConfigurationController.deleteQuoteLineItem';
import deleteSectionRecord from '@salesforce/apex/ProductConfigurationController.deleteSection';
import createNewSection from '@salesforce/apex/ProductConfigurationController.createNewSection';
import createNewSectionProduct from '@salesforce/apex/ProductConfigurationController.createNewSectionProduct';
import updateProdSection from '@salesforce/apex/ProductConfigurationController.updateProdSection';
import updateProdLineItms from '@salesforce/apex/ProductConfigurationController.updateProdLineItms';
import insertProdLineItms from '@salesforce/apex/ProductConfigurationController.insertProdLineItms';
import getProductDetails from '@salesforce/apex/ProductConfigurationController.getProductDetails';
import getProductWithProductBundleForQuote from '@salesforce/apex/ProductConfigurationController.getProductWithProductBundleForQuote';

export default class QuoteDetailCmp extends LightningElement {

    get filter() {
        const criteria = [
            {
                fieldPath: 'Active__c',
                operator: 'eq',
                value: true
            }
        ];

        if (this.currency) {
            criteria.push({
                fieldPath: 'Currency__c',
                operator: 'eq',
                value: this.currency
            });
        }

        return { criteria };
    }

    @api recid;
    @api mode;
    @api quoteid;
    @api isinsert;
    @track sectionList = [];
    selectedProductBundleId = '';
    @track productBundleList = [];
    @track selectedBundleCurrency = '';
    @track pbListRec;
    dragStartIndex;
    @track getProductBundleList = [];
    @track getProductLineItemList = [];
    @track selectedProdBundleName;
    @track alredyExistBundleModal = false;
    @track bundleSelectModel = false;
    @track prodBundleAvailable = false;

    connectedCallback() {
        console.log('[connectedCallback] recid:', this.recid);
        this.loadSectionData();
        this.getProductWithProductBundleRecord();
    }

    get pricingQuoteId() {
        return this.quoteid || null;
    }

    getProductWithProductBundleRecord() {
        getProductWithProductBundleForQuote({ quoteId: this.pricingQuoteId })
            .then(result => {
                this.productBundleList = [];
                result.map(element => {
                    this.productBundleList = [...this.productBundleList, {
                        value: element.Id,
                        label: `${element.Name} (${element.CurrencyType || 'No Currency'})`
                    }]
                });
                this.pbListRec = result;
                console.log('Product with Product Bundle : ', JSON.stringify(result));
            })
            .catch(error => {
                console.log('error=>' + error);
            });
    }

    handleChangeProductBundle(event) {
        let pbId = event.target.value;
        console.log('pbId : ', pbId);
        this.alredyExistBundleModal = false;

        let selectedBundle = this.pbListRec.find(b => b.Id === pbId);
        this.selectedBundleCurrency = selectedBundle?.CurrencyType || '';

        console.log('selectedBundle : ', JSON.stringify(selectedBundle));
        console.log('selectedBundle.Currency : ', selectedBundle?.CurrencyType);
        console.log('this.currency.Currency : ', this.currency);

        if(selectedBundle && this.currency && selectedBundle.CurrencyType !== this.currency){

            this.showCurrencyError = true;
            this.selectedProductBundleId = '';
            return;
        }


        this.selectedProductBundleId = pbId;
        this.getProductBundleList = [];
        this.getProductLineItemList = [];
        this.pbListRec.forEach(element => {
            console.log('element : ', JSON.stringify(element));
            if (this.selectedProductBundleId === element.Id) {
                this.selectedProdBundleName = element.Name;
            }
        })
        this.sectionList.forEach(secName => {
            if (secName.title === this.selectedProdBundleName) {
                this.alredyExistBundleModal = true;
            }
        });
        if (this.alredyExistBundleModal == false) {
            this.bundleSelectModel = true;
            this.pbListRec.forEach(element => {
                if (this.selectedProductBundleId === element.Id) {
                    this.getProductBundleList.push(element);
                    this.selectedProdBundleName = element.Name;
                    element.ProductLineItemWrapperList.forEach(item => {
                        console.log('item > : ', JSON.stringify(item));
                        var productItem = {
                            'Id': item.Id,
                            'Name': item.Name,
                            'UnitOfMeasurement': item.UnitOfMeasurement,
                            'macProCheck': true,
                            'Qty': item.Qty,
                            'productName': item.productName,
                            'Price': item.unitCost,
                            'Product_Bundle__c': this.selectedProductBundleId,
                        }
                        this.getProductLineItemList.push(productItem);
                        console.log('this.getProductLineItemList :', JSON.stringify(this.getProductLineItemList));
                    });
                }
            });
        }

    }

    handleProductLineItemCheckboxChange(event) {
        var productId = event.currentTarget.dataset.id;
        this.getProductLineItemList.forEach(element => {
            if (productId == element.Id) {
                if (element.macProCheck == false) {
                    element.macProCheck = true;
                } else {
                    element.macProCheck = false;
                }
            }
        });
    }

    closeModal() {
        this.bundleSelectModel = false;
        this.selectedProductBundleId = '';
    }

    alredyExistCloseModal() {
        this.alredyExistBundleModal = false;
    }

    handleCreateProuctListItem() {
        this.newProductLineItems();
    }

    async newProductLineItems() {
        this.bundleSelectModel = false;
        try {
            const result = await createNewSection({ quoteId: this.recid, sectionName: this.selectedProdBundleName });
            const inserts = this.getProductLineItemList
                .filter(element => element.macProCheck === true)
                .map(element => {
                    const prod_sec_obj = {
                        'Master_Template__c': this.recid,
                        'Type__c': 'Master Template Product',
                        'Product_Section__c': result.Id,
                        'Product__c': element.productName,
                        'Quantity__c': element.Qty || 1,
                        'Price__c': element.Price,
                        'Currency__c': this.currency
                    };
                    return insertProdLineItms({ prod_lin_itms_obj: prod_sec_obj });
                });

            await Promise.all(inserts);
            
            setTimeout(() => {
                this.loadSectionData();
            }, 2000);
        } catch (error) {
            console.error('[addSection] Error:', error);
        }
    }


    @api
    loadSectionData() {
        console.log('[loadSectionData] Fetching data for quoteId:', this.recid);

        // getSectionData({ quoteId: this.recid })
        //     .then(data => {
        //         console.log('[loadSectionData] Response:', JSON.stringify(data));
        //         this.sectionList = []; // Initialize empty list
        //         data.forEach(section => {
        //             const sectionObj = {
        //                 id: section.Id,
        //                 title: section.Name,
        //                 notes: section.Notes__c,
        //                 total: 0,
        //                 products: []
        //             };

        //             const items = section.QuoteLineItems__r || [];

        //             items.forEach(item => {
        //                 const quantity = item.Quantity__c || 0;
        //                 const price = item.Price__c || 0;

        //                 const line = {
        //                     id: item.Id,
        //                     prodId: item.Product__c,
        //                     productName: item.Product__r?.Name || '',
        //                     Quantity: quantity,
        //                     Price: price,
        //                     Tax: item.Tax__c,
        //                     MeasurementType: item.Measure_Unit__c,
        //                     lineTotal: (quantity * price).toFixed(2)
        //                 };

        //                 console.log('[Mapped Product]', line);
        //                 sectionObj.products.push(line);
        //             });

        //             this.sectionList.push(sectionObj);
        //         });

        //         this.recalculateTotals();
        //     })
        //     .catch(err => {
        //         console.error('[loadSectionData] Error:', err);
        //     });

        if (this.recid) {
            getSectionData({ quoteId: this.recid })
                .then(data => {
                    console.log('[loadSectionData] Response:', JSON.stringify(data));
                    this.sectionList = []; // Initialize empty list

                    data.forEach(section => {
                        const sectionObj = {
                            id: section.Id,
                            title: section.Name,
                            notes: section.Notes__c,
                            total: 0,
                            products: []
                        };

                        const items = section.QuoteLineItems__r || [];

                        items.forEach(item => {
                            const quantity = item.Quantity__c || 0;
                            const price = item.Price__c || 0;

                            const line = {
                                id: item.Id,
                                prodId: item.Product__c,
                                productName: item.Product__r?.Name || '',
                                Quantity: quantity,
                                Price: price,
                                Tax: item.Tax__c,
                                MeasurementType: item.Measure_Unit__c,
                                lineTotal: (quantity * price).toFixed(2)
                            };

                            console.log('[Mapped Product]', line);
                            sectionObj.products.push(line);
                        });

                        this.sectionList.push(sectionObj);
                    });

                    this.recalculateTotals();
                })
                .catch(err => {
                    console.error('[loadSectionData] Error:', err);
                });
        } else {
            console.warn('[loadSectionData] Skipped — recordId not found.');
        }

    }

    // handleInputValueChange(event) {
    //     const sectionId = event.currentTarget.dataset.sectionid;
    //     const productId = event.currentTarget.dataset.id;
    //     const field = event.target.name;
    //     const value = event.target.value;

    //     console.log(`[InputChange] SectionID: ${sectionId}, ProductID: ${productId}, Field: ${field}, Value: ${value}`);

    //     const section = this.sectionList.find(sec => sec.id === sectionId);
    //     const product = section?.products.find(p => p.id === productId);

    //     if (product) {
    //         if (field === 'prodId') {
    //             product.prodId = value;
    //             console.log(`[Updated Product] prodId = ${value}`);
    //         } else {
    //             product[field] = field === 'Quantity' || field === 'Price' || field === 'Tax' ? parseFloat(value) || 0 : value;
    //         }

    //         // Recalculate line total (if price/quantity changed)
    //         product.lineTotal = (product.Quantity || 0) * (product.Price || 0);

    //         console.log(`[Updated Product Object]`, JSON.stringify(product));
    //     }

    //     this.recalculateTotals();
    // }


    recalculateTotals() {
        this.sectionList.forEach(section => {
            section.total = section.products.reduce((sum, p) => sum + (p.lineTotal || 0), 0);
        });
        console.log('[Recalculated Totals]', JSON.stringify(this.sectionList));
    }

    handleSectionChange(event) {
        const sectionId = event.currentTarget.dataset.id;
        const value = event.target.value;
        const field = event.target.name;

        console.log(`[SectionChange] SectionID: ${sectionId}, Field: ${field}, Value: ${value}`);

        const section = this.sectionList.find(s => s.id === sectionId);
        if (section) {
            section[field === 'productBundle' ? 'title' : 'notes'] = value;
            console.log('[Updated Section]', section);
        }
    }

    // addRow(event) {
    //     const sectionId = event.currentTarget.dataset.id;
    //     const section = this.sectionList.find(s => s.id === sectionId);

    //     if (section) {
    //         const tempId = 'temp_' + Date.now();
    //         const newRow = {
    //             id: tempId,
    //             prodId: null,
    //             productName: '',
    //             Quantity: 1,
    //             Price: 0,
    //             Tax: 0,
    //             MeasurementType: 'EA',
    //             lineTotal: 0
    //         };
    //         section.products.push(newRow);
    //         console.log('[Row Added]', newRow);
    //     }
    // }

    async deleteRow(event) {
        const prodId = event.currentTarget.dataset.id;
        console.log('[DeleteRow] Product ID:', prodId);

        for (let section of this.sectionList) {
            const index = section.products.findIndex(p => p.id === prodId);
            if (index !== -1) {
                if (prodId && !prodId.startsWith('temp_')) {
                    console.log('[DeleteRow] Deleting from server...');
                    await deleteQuoteLineItem({ itemId: prodId });
                }
                console.log('[DeleteRow] Removing from UI...');
                section.products.splice(index, 1);
                break;
            }
        }

        this.recalculateTotals();
    }

    async deleteSection(event) {
        const sectionId = event.currentTarget.dataset.id;
        const secIndex = event.currentTarget.dataset.index;

        console.log(`[DeleteSection] SectionID: ${sectionId}, Index: ${secIndex}`);

        if (sectionId) {
            await deleteSectionRecord({ sectionId });
            console.log('[DeleteSection] Deleted from server');
        }

        this.sectionList.splice(secIndex, 1);
        console.log('[DeleteSection] Removed from UI');
    }

    async handleSaveRecords() {
        try {
            this.loadSectionData();
            alert('Records saved successfully!');
        } catch (error) {
            console.error('[handleSaveRecords] Error:', error);
        }
    }

    DragStart(event) {
        this.dragStartIndex = event.currentTarget.title;
        console.log('[DragStart] index:', this.dragStartIndex);
    }

    DragOver(event) {
        event.preventDefault();
    }

    Drop(event) {
        const endIndex = event.currentTarget.title;
        console.log(`[Drop] DragFrom: ${this.dragStartIndex}, DropTo: ${endIndex}`);

        const draggedItem = this.sectionList[parseInt(this.dragStartIndex)];
        this.sectionList.splice(this.dragStartIndex, 1);
        this.sectionList.splice(endIndex, 0, draggedItem);

        console.log('[Drop] New section order:', this.sectionList.map(s => s.title));
        this.dragStartIndex = null;
    }

    addSection() {
        const sectionName = 'Section ' + (this.sectionList.length + 1);
        console.log('[addSection] Creating section:', sectionName);

        createNewSection({ quoteId: this.recid, sectionName })
            .then((result) => {
                const newSec = {
                    id: result.Id,
                    title: result.Name,
                    notes: '',
                    products: [],
                    total: 0
                };
                this.sectionList.push(newSec);
                console.log('[addSection] Created:', newSec);

                const sec_id = result.Id;
                const section = this.sectionList.find(s => s.id === sec_id);
                createNewSectionProduct({ quoteId: this.recid, sectionId: sec_id })
                    .then((result) => {
                        if (section) {
                            const newRow = {
                                id: result.Id,
                                prodId: null,
                                productName: '',
                                Quantity: 1,
                                Price: 0,
                                lineTotal: 0
                            };
                            section.products.push(newRow);
                            console.log('[Row Added]', newRow);
                        }
                        console.log('[addSection] Created:', newSec);
                    })
                    .catch(error => {
                        console.error('[addSection] Error:', error);
                    });
            })
            .catch(error => {
                console.error('[addSection] Error:', error);
            });
    }

    addRowSectionProduct(event) {
        const sec_id = event.currentTarget.dataset.id;
        const section = this.sectionList.find(s => s.id === sec_id);
        createNewSectionProduct({ quoteId: this.recid, sectionId: sec_id })
            .then((result) => {
                if (section) {
                    const newRow = {
                        id: result.Id,
                        prodId: null,
                        productName: '',
                        Quantity: 1,
                        Price: 0,
                        lineTotal: 0
                    };
                    section.products.push(newRow);
                    console.log('[Row Added]', newRow);
                }
                console.log('[addSection] Created:', newSec);
            })
            .catch(error => {
                console.error('[addSection] Error:', error);
            });
    }

    handleSectionTitle(event) {
        const sectionId = event.currentTarget.dataset.id;
        const value = event.target.value;
        var prod_sec_obj = {
            'Id': sectionId,
            'Name': value
        }
        this.updateProductSection(prod_sec_obj);
        // const field = event.target.name;

        // console.log(`[SectionChange] SectionID: ${sectionId}, Field: ${field}, Value: ${value}`);

        // const section = this.sectionList.find(s => s.id === sectionId);
        // if (section) {
        //     section[field === 'productBundle' ? 'title' : 'notes'] = value;
        //     console.log('[Updated Section]', section);
        // }
    }

    handleSectionNote(event) {
        const sectionId = event.currentTarget.dataset.id;
        const value = event.target.value;
        var prod_sec_obj = {
            'Id': sectionId,
            'Notes__c': value
        }
        this.updateProductSection(prod_sec_obj);
        // const field = event.target.name;

        // console.log(`[SectionChange] SectionID: ${sectionId}, Field: ${field}, Value: ${value}`);

        // const section = this.sectionList.find(s => s.id === sectionId);
        // if (section) {
        //     section[field === 'productBundle' ? 'title' : 'notes'] = value;
        //     console.log('[Updated Section]', section);
        // }
    }

    handleProduct(event) {
        const productId = event.currentTarget.dataset.id;
        const sectionid = event.currentTarget.dataset.sectionid;
        const value = event.target.value;

        if (value != null) {
            getProductDetails({ productId: value, quoteId: this.pricingQuoteId })
                .then(data => {
                    let dfPrice = data.Default_Price__c;
                    let dfQty = data.Default_Quantity__c || 1;

                    var prod_lin_itms_obj = {
                        'Id': productId,
                        'Product__c': value,
                        'Price__c': dfPrice,
                        'Quantity__c': 1,
                        'Currency__c': this.currency
                    }
                    this.updateProductSectionLineItms(prod_lin_itms_obj);
                    // console.log(`[InputChange] SectionID: ${sectionId}, ProductID: ${productId}, Field: ${field}, Value: ${value}`);

                    const section = this.sectionList.find(sec => sec.id === sectionid);
                    const product = section?.products.find(p => p.id === productId);

                    if (product) {
                        product.prodId = value;
                        product.Quantity = dfQty;
                        product.Price = dfPrice;
                        let total = (product.Quantity || 0) * (product.Price || 0);
                        console.log(`[Updated Product] prodId = ${value}`);
                        // Recalculate line total (if price/quantity changed)
                        product.lineTotal = total.toFixed(2);
                        console.log(`[Updated Product Object]`, JSON.stringify(product));
                    }
                    this.recalculateTotals();
                })
                .catch(error => console.error('Error fetching product details:', error));



        } else {
            var prod_lin_itms_obj = {
                'Id': productId,
                'Quantity__c': 1,
                'Price__c': 0,
                'Product__c': '',
                'Currency__c': this.currency
            }
            this.updateProductSectionLineItms(prod_lin_itms_obj);
            const section = this.sectionList.find(sec => sec.id === sectionid);
            const product = section?.products.find(p => p.id === productId);

            if (product) {
                product.prodId = value;
                product.Quantity = 0;
                product.Price = 0;
                let total = (product.Quantity || 0) * (product.Price || 0);
                // Recalculate line total (if price/quantity changed)
                product.lineTotal = total.toFixed(2);
            }

        }
    }

    handleProductQuantity(event) {
        const productId = event.currentTarget.dataset.id;
        const value = event.target.value;
        const sectionid = event.currentTarget.dataset.sectionid;

        var prod_lin_itms_obj = {
            'Id': productId,
            'Quantity__c': value
        }
        this.updateProductSectionLineItms(prod_lin_itms_obj);
        const section = this.sectionList.find(sec => sec.id === sectionid);
        const product = section?.products.find(p => p.id === productId);

        if (product) {
            product.Quantity = value;
            let total = (product.Quantity || 0) * (product.Price || 0);
            product.lineTotal = total.toFixed(2);
            console.log(`[Updated Product Object]`, JSON.stringify(product));
        }
        this.recalculateTotals();
    }

    handleProductPrice(event) {
        const productId = event.currentTarget.dataset.id;
        const value = event.target.value;
        const sectionid = event.currentTarget.dataset.sectionid;

        var prod_lin_itms_obj = {
            'Id': productId,
            'Price__c': value
        }
        this.updateProductSectionLineItms(prod_lin_itms_obj);
        const section = this.sectionList.find(sec => sec.id === sectionid);
        const product = section?.products.find(p => p.id === productId);

        if (product) {
            product.Price = value;
            let total = (product.Quantity || 0) * (product.Price || 0);
            product.lineTotal = total.toFixed(2);
            console.log(`[Updated Product Object]`, JSON.stringify(product));
        }
        this.recalculateTotals();
    }

    updateProductSection(Object) {
        updateProdSection({ prod_sec_obj: Object })
            .then((result) => {
                console.log('[addSection] Created:', result);
            })
            .catch(error => {
                console.error('[addSection] Error:', error);
            });
    }

    updateProductSectionLineItms(Object) {
        updateProdLineItms({ prod_lin_itms_obj: Object })
            .then((result) => {
                console.log('update', result);
            })
            .catch(error => {
                console.error('[update] Error:', error);
            });
    }

    @api currency;

    @track showCurrencyError = false;

    closeCurrencyModal(){
        this.showCurrencyError = false;
    }



    get bundleSelectionHint() {
        if (this.currency && this.selectedBundleCurrency) {
            return `Only bundles in ${this.currency} can be added. Selected bundle is ${this.selectedBundleCurrency}.`;
        }
        if (this.currency) {
            return `Only bundles in ${this.currency} can be added.`;
        }
        return 'Select a bundle to view its currency.';
    }

    get currencyMismatchMessage() {
        if (this.currency && this.selectedBundleCurrency) {
            return `This bundle uses ${this.selectedBundleCurrency}, but the current quote uses ${this.currency}.`;
        }
        return 'This bundle does not belong to the selected currency.';
    }

    get currencyBadgeLabel() {
        return this.currency ? `Current Quote Currency: ${this.currency}` : 'Current Quote Currency: Not Set';
    }

    get selectedBundleCurrencyLabel() {
        return this.selectedBundleCurrency ? `Selected Bundle Currency: ${this.selectedBundleCurrency}` : '';
    }

}
