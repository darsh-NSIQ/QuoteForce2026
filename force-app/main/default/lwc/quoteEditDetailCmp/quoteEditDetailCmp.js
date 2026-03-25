import { LightningElement, api, track } from 'lwc';
import getSectionData from '@salesforce/apex/ProductConfigurationController.getSectionDataQuote';
import getInvoiceSectionData from '@salesforce/apex/ProductConfigurationController.getInvoiceSectionData';
import deleteQuoteLineItem from '@salesforce/apex/ProductConfigurationController.deleteQuoteLineItem';
import deleteInvoiceLineItem from '@salesforce/apex/ProductConfigurationController.deleteInvoiceLineItem';
import deleteSectionRecord from '@salesforce/apex/ProductConfigurationController.deleteSection';
import deleteInvoiceSection from '@salesforce/apex/ProductConfigurationController.deleteInvoiceSection';
import createNewSection from '@salesforce/apex/ProductConfigurationController.createNewSectionQuote';
import createNewSectionInvoice from '@salesforce/apex/ProductConfigurationController.createNewSectionInvoice';
import createNewSectionProduct from '@salesforce/apex/ProductConfigurationController.createNewSectionProductQuote';
import createNewSectionProductInvoice from '@salesforce/apex/ProductConfigurationController.createNewSectionProductInvoice';
import updateProdSection from '@salesforce/apex/ProductConfigurationController.updateProdSection';
import updateProdLineItms from '@salesforce/apex/ProductConfigurationController.updateProdLineItms';
import insertProdLineItms from '@salesforce/apex/ProductConfigurationController.insertProdLineItms';
import updateInvoiceLineItms from '@salesforce/apex/ProductConfigurationController.updateInvoiceLineItms';
import insertInvoiceLineItms from '@salesforce/apex/ProductConfigurationController.insertInvoiceLineItms';
import getProductDetails from '@salesforce/apex/ProductConfigurationController.getProductDetails';
import getProductWithProductBundleForContext from '@salesforce/apex/ProductConfigurationController.getProductWithProductBundleForContext';

export default class QuoteEditDetailCmp extends LightningElement {
    @api recid;
    @api mode;
    @api quoteid;
    @api isinsert;
    @api currency;
    @api recordContext = 'quote';

    @track sectionList = [];
    @track productBundleList = [];
    @track pbListRec = [];
    @track getProductBundleList = [];
    @track getProductLineItemList = [];
    @track selectedProdBundleName;
    @track alredyExistBundleModal = false;
    @track bundleSelectModel = false;
    @track selectedBundleCurrency = '';

    selectedProductBundleId = '';
    dragStartIndex;

    connectedCallback() {
        this.loadSectionData();
        this.getProductWithProductBundleRecord();
    }

    get filter() {
        return {
            criteria: [
                {
                    fieldPath: 'Active__c',
                    operator: 'eq',
                    value: true,
                }
            ]
        };
    }

    get isInvoiceContext() {
        return this.recordContext === 'invoice';
    }

    get pricingQuoteId() {
        return this.quoteid || null;
    }

    get pricingInvoiceId() {
        return this.isInvoiceContext ? this.recid : null;
    }

    async getProductWithProductBundleRecord() {
        try {
            const result = await getProductWithProductBundleForContext({
                quoteId: this.pricingQuoteId,
                invoiceId: this.pricingInvoiceId
            });
            this.pbListRec = result || [];
            this.productBundleList = this.pbListRec.map(element => ({
                value: element.Id,
                label: `${element.Name} (${element.CurrencyType || 'No Currency'})`
            }));
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Bundle load failed', error);
        }
    }

    handleChangeProductBundle(event) {
        const pbId = event.target.value;
        this.alredyExistBundleModal = false;
        this.selectedProductBundleId = pbId;
        this.getProductBundleList = [];
        this.getProductLineItemList = [];

        const selectedBundle = this.pbListRec.find(bundle => bundle.Id === pbId);
        this.selectedBundleCurrency = selectedBundle?.CurrencyType || '';
        this.selectedProdBundleName = selectedBundle?.Name || '';

        if (this.sectionList.some(section => section.title === this.selectedProdBundleName)) {
            this.alredyExistBundleModal = true;
            return;
        }

        if (!selectedBundle) {
            return;
        }

        this.bundleSelectModel = true;
        this.getProductBundleList = [selectedBundle];
        this.getProductLineItemList = (selectedBundle.ProductLineItemWrapperList || []).map(item => ({
            Id: item.Id,
            Name: item.Name,
            UnitOfMeasurement: item.UnitOfMeasurement,
            macProCheck: true,
            Qty: item.Qty,
            productName: item.productName,
            Price: item.unitCost,
            Product_Bundle__c: this.selectedProductBundleId,
        }));
    }

    handleProductLineItemCheckboxChange(event) {
        const productId = event.currentTarget.dataset.id;
        this.getProductLineItemList = this.getProductLineItemList.map(element => (
            element.Id === productId
                ? { ...element, macProCheck: !element.macProCheck }
                : element
        ));
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
            const sectionResult = this.isInvoiceContext
                ? await createNewSectionInvoice({ invoiceId: this.recid, sectionName: this.selectedProdBundleName })
                : await createNewSection({ quoteId: this.quoteid, sectionName: this.selectedProdBundleName });

            const inserts = this.getProductLineItemList
                .filter(element => element.macProCheck)
                .map(element => {
                    if (this.isInvoiceContext) {
                        return insertInvoiceLineItms({
                            invoiceLineItemObj: {
                                Invoice__c: this.recid,
                                Section_Id__c: sectionResult.Id,
                                Product__c: element.productName,
                                Quantity__c: Number(element.Qty) || 1,
                                Price__c: Number(element.Price) || 0,
                                Currency__c: this.currency,
                                Type__c: 'Invoice Product'
                            }
                        });
                    }

                    return insertProdLineItms({
                        prod_lin_itms_obj: {
                            Quotes__c: this.quoteid,
                            Type__c: 'Quote Product',
                            Product_Section__c: sectionResult.Id,
                            Product__c: element.productName,
                            Quantity__c: Number(element.Qty) || 1,
                            Price__c: Number(element.Price) || 0,
                            Currency__c: this.currency
                        }
                    });
                });

            await Promise.all(inserts);
            await this.loadSectionData();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Bundle add failed', error);
        }
    }

    @api
    async loadSectionData() {
        try {
            const data = this.isInvoiceContext
                ? await getInvoiceSectionData({ invoiceId: this.recid })
                : await getSectionData({ quoteId: this.quoteid });

            this.sectionList = (data || []).map(section => {
                const sectionId = this.isInvoiceContext ? section.sectionId : section.Id;
                const items = this.isInvoiceContext ? (section.lineItems || []) : (section.QuoteLineItems__r || []);
                const products = items.map(item => {
                    const quantity = Number(this.isInvoiceContext ? item.quantity : item.Quantity__c) || 0;
                    const price = Number(this.isInvoiceContext ? item.price : item.Price__c) || 0;
                    return {
                        id: this.isInvoiceContext ? item.itemId : item.Id,
                        prodId: this.isInvoiceContext ? item.productId : item.Product__c,
                        productName: this.isInvoiceContext ? (item.productName || '') : (item.Product__r?.Name || ''),
                        Quantity: quantity,
                        Price: price,
                        MeasurementType: this.isInvoiceContext ? item.unitOfMeasurement : item.Unit_Of_Measurement__c,
                        lineTotal: quantity * price
                    };
                });

                return {
                    id: sectionId,
                    title: this.isInvoiceContext ? section.sectionName : section.Name,
                    notes: this.isInvoiceContext ? section.notes : section.Notes__c,
                    total: products.reduce((sum, product) => sum + Number(product.lineTotal || 0), 0),
                    products
                };
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Section load failed', error);
        }
    }

    recalculateTotals() {
        this.sectionList = this.sectionList.map(section => ({
            ...section,
            total: section.products.reduce((sum, product) => sum + Number(product.lineTotal || 0), 0)
        }));
    }

    async deleteRow(event) {
        const prodId = event.currentTarget.dataset.id;

        for (const section of this.sectionList) {
            const index = section.products.findIndex(product => product.id === prodId);
            if (index === -1) {
                continue;
            }

            if (prodId && !prodId.startsWith('temp_')) {
                if (this.isInvoiceContext) {
                    await deleteInvoiceLineItem({ itemId: prodId });
                } else {
                    await deleteQuoteLineItem({ itemId: prodId });
                }
            }

            section.products.splice(index, 1);
            break;
        }

        this.recalculateTotals();
    }

    async deleteSection(event) {
        const sectionId = event.currentTarget.dataset.id;
        const secIndex = Number(event.currentTarget.dataset.index);

        if (sectionId) {
            if (this.isInvoiceContext) {
                await deleteInvoiceSection({ sectionId });
            } else {
                await deleteSectionRecord({ sectionId });
            }
        }

        this.sectionList.splice(secIndex, 1);
        this.recalculateTotals();
    }

    DragStart(event) {
        this.dragStartIndex = event.currentTarget.title;
    }

    DragOver(event) {
        event.preventDefault();
    }

    Drop(event) {
        const endIndex = Number(event.currentTarget.title);
        const startIndex = Number(this.dragStartIndex);
        const draggedItem = this.sectionList[startIndex];
        this.sectionList.splice(startIndex, 1);
        this.sectionList.splice(endIndex, 0, draggedItem);
        this.dragStartIndex = null;
    }

    addSection() {
        const sectionName = `Section ${this.sectionList.length + 1}`;
        const sectionPromise = this.isInvoiceContext
            ? createNewSectionInvoice({ invoiceId: this.recid, sectionName })
            : createNewSection({ quoteId: this.quoteid, sectionName });

        sectionPromise
            .then(result => {
                this.sectionList = [
                    ...this.sectionList,
                    {
                        id: result.Id,
                        title: result.Name,
                        notes: '',
                        products: [],
                        total: 0
                    }
                ];
                return this.addRowToSection(result.Id);
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error('Section create failed', error);
            });
    }

    addRowSectionProduct(event) {
        this.addRowToSection(event.currentTarget.dataset.id);
    }

    addRowToSection(sectionId) {
        const section = this.sectionList.find(current => current.id === sectionId);
        const itemPromise = this.isInvoiceContext
            ? createNewSectionProductInvoice({ invoiceId: this.recid, sectionId })
            : createNewSectionProduct({ quoteId: this.quoteid, sectionId });

        return itemPromise
            .then(result => {
                if (!section) {
                    return;
                }
                section.products.push({
                    id: result.Id,
                    prodId: null,
                    productName: '',
                    Quantity: 1,
                    Price: 0,
                    lineTotal: 0
                });
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error('Row create failed', error);
            });
    }

    handleSectionTitle(event) {
        this.updateProductSection({
            Id: event.currentTarget.dataset.id,
            Name: event.target.value
        });
    }

    handleSectionNote(event) {
        this.updateProductSection({
            Id: event.currentTarget.dataset.id,
            Notes__c: event.target.value
        });
    }

    handleProduct(event) {
        const rowId = event.currentTarget.dataset.id;
        const sectionId = event.currentTarget.dataset.sectionid;
        const productId = event.target.value;

        if (!productId) {
            this.updateProductSectionLineItms({
                Id: rowId,
                Product__c: null,
                Quantity__c: 1,
                Price__c: 0,
                Currency__c: this.currency
            });
            this.updateLocalProduct(sectionId, rowId, {
                prodId: null,
                Quantity: 0,
                Price: 0,
                lineTotal: 0
            });
            return;
        }

        getProductDetails({
            productId,
            quoteId: this.pricingQuoteId,
            invoiceId: this.pricingInvoiceId
        })
            .then(data => {
                const price = Number(data.Default_Price__c) || 0;
                const quantity = Number(data.Default_Quantity__c) || 1;
                this.updateProductSectionLineItms({
                    Id: rowId,
                    Product__c: productId,
                    Price__c: price,
                    Quantity__c: quantity,
                    Currency__c: this.currency
                });
                this.updateLocalProduct(sectionId, rowId, {
                    prodId: productId,
                    productName: data.Name,
                    Quantity: quantity,
                    Price: price,
                    lineTotal: quantity * price
                });
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.error('Product pricing load failed', error);
            });
    }

    handleProductQuantity(event) {
        const rowId = event.currentTarget.dataset.id;
        const sectionId = event.currentTarget.dataset.sectionid;
        const quantity = Number(event.target.value) || 0;
        this.updateProductSectionLineItms({
            Id: rowId,
            Quantity__c: quantity
        });
        this.updateLocalProduct(sectionId, rowId, product => ({
            Quantity: quantity,
            lineTotal: quantity * Number(product.Price || 0)
        }));
    }

    handleProductPrice(event) {
        const rowId = event.currentTarget.dataset.id;
        const sectionId = event.currentTarget.dataset.sectionid;
        const price = Number(event.target.value) || 0;
        this.updateProductSectionLineItms({
            Id: rowId,
            Price__c: price
        });
        this.updateLocalProduct(sectionId, rowId, product => ({
            Price: price,
            lineTotal: Number(product.Quantity || 0) * price
        }));
    }

    updateProductSection(payload) {
        updateProdSection({ prod_sec_obj: payload }).catch(error => {
            // eslint-disable-next-line no-console
            console.error('Section update failed', error);
        });
    }

    updateProductSectionLineItms(payload) {
        const normalizedPayload = this.isInvoiceContext
            ? {
                ...payload,
                Invoice__c: payload.Invoice__c || this.recid,
                Currency__c: payload.Currency__c || this.currency
            }
            : {
                ...payload,
                Quotes__c: payload.Quotes__c || this.quoteid,
                Currency__c: payload.Currency__c || this.currency
            };

        const savePromise = this.isInvoiceContext
            ? updateInvoiceLineItms({ invoiceLineItemObj: normalizedPayload })
            : updateProdLineItms({ prod_lin_itms_obj: normalizedPayload });

        savePromise.catch(error => {
            // eslint-disable-next-line no-console
            console.error('Line update failed', error);
        });
    }

    updateLocalProduct(sectionId, rowId, update) {
        const section = this.sectionList.find(current => current.id === sectionId);
        const product = section?.products.find(current => current.id === rowId);
        if (!product) {
            return;
        }

        const patch = typeof update === 'function' ? update(product) : update;
        Object.assign(product, patch);
        this.recalculateTotals();
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


