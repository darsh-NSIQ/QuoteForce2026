import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import GetProducts from '@salesforce/apex/ProductConfigureController.GetProducts';
import listPriceBooks from '@salesforce/apex/ProductConfigureController.listPriceBooks';
import upsertPriceBook from '@salesforce/apex/ProductConfigureController.upsertPriceBook';
import deletePriceBook from '@salesforce/apex/ProductConfigureController.deletePriceBook';
import listPriceBookEntries from '@salesforce/apex/ProductConfigureController.listPriceBookEntries';
import upsertPriceBookEntry from '@salesforce/apex/ProductConfigureController.upsertPriceBookEntry';
import deletePriceBookEntry from '@salesforce/apex/ProductConfigureController.deletePriceBookEntry';
import clonePriceBookEntries from '@salesforce/apex/ProductConfigureController.clonePriceBookEntries';

const EMPTY_BOOK_FORM = {
    Id: null,
    Name: '',
    Currency__c: 'USD',
    Description__c: '',
    Is_Active__c: true,
    Is_Default__c: false
};

const EMPTY_ENTRY_FORM = {
    Id: null,
    Price_Book__c: '',
    Product__c: '',
    Unit_Price__c: null,
    Currency__c: '',
    Is_Active__c: true
};

export default class PriceBookManager extends LightningElement {
    @api viewMode = 'books';

    @track priceBooks = [];
    @track priceBookEntries = [];
    @track productOptions = [];
    @track priceBookOptions = [];
    @track bookForm = { ...EMPTY_BOOK_FORM };
    @track entryForm = { ...EMPTY_ENTRY_FORM };
    @track cloneForm = {
        sourcePriceBookId: '',
        targetPriceBookId: '',
        overwriteExisting: false
    };

    isLoading = false;
    isPriceBookModalOpen = false;
    isPriceBookEntryModalOpen = false;
    isCloneModalOpen = false;
    isDeleteConfirmOpen = false;
    deleteTargetId;
    deleteTargetType;

    bookSearchKey = '';
    bookCurrencyFilter = '';
    entrySearchKey = '';
    entryCurrencyFilter = '';
    selectedEntryPriceBookId = '';
    selectedEntryProductId = '';

    currencyOptions = [
        { label: 'None', value: '' },
        { label: '($) USD', value: 'USD' },
        { label: '(Rs) INR', value: 'INR' },
        { label: '(EUR) EUR', value: 'EUR' },
        { label: '(GBP) GBP', value: 'GBP' }
    ];

    connectedCallback() {
        this.initialize();
    }

    get isBooksView() {
        return this.viewMode !== 'entries';
    }

    get hasPriceBooks() {
        return this.priceBooks.length > 0;
    }

    get hasPriceBookEntries() {
        return this.priceBookEntries.length > 0;
    }

    get currentEntryProductCode() {
        const selectedProduct = this.productOptions.find(
            (option) => option.value === this.entryForm.Product__c
        );
        return selectedProduct?.productCode || '';
    }

    get deleteModalTitle() {
        return this.deleteTargetType === 'entry' ? 'Delete Price Book Entry' : 'Delete Price Book';
    }

    get deleteModalMessage() {
        return this.deleteTargetType === 'entry'
            ? 'Are you sure you want to delete this custom Price Book Entry?'
            : 'Are you sure you want to delete this Price Book and its custom entries?';
    }

    async initialize() {
        this.isLoading = true;
        try {
            await Promise.all([
                this.loadProducts(),
                this.loadPriceBooks(),
                this.loadPriceBookEntries()
            ]);
        } catch (error) {
            this.showToast('Error', this.normalizeError(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    async loadProducts() {
        const result = await GetProducts({ searchKey: '', currencyFilter: '' });
        this.productOptions = (result || []).map((product) => ({
            label: product.Product_Code__c
                ? `${product.Name} (${product.Product_Code__c})`
                : product.Name,
            value: product.Id,
            productCode: product.Product_Code__c,
            currencyCode: product.Currency__c
        }));
    }

    async loadPriceBooks() {
        const result = await listPriceBooks({
            searchKey: this.bookSearchKey,
            currencyFilter: this.bookCurrencyFilter,
            activeOnly: false
        });

        this.priceBooks = (result || []).map((priceBook) => ({
            ...priceBook,
            statusLabel: priceBook.Is_Active__c ? 'Active' : 'Inactive',
            defaultLabel: priceBook.Is_Default__c ? 'Default' : ''
        }));

        this.priceBookOptions = this.priceBooks.map((priceBook) => ({
            label: priceBook.Currency__c
                ? `${priceBook.Name} (${priceBook.Currency__c})`
                : priceBook.Name,
            value: priceBook.Id,
            currencyCode: priceBook.Currency__c
        }));
    }

    async loadPriceBookEntries() {
        const result = await listPriceBookEntries({
            searchKey: this.entrySearchKey,
            priceBookId: this.selectedEntryPriceBookId || null,
            productId: this.selectedEntryProductId || null,
            currencyFilter: this.entryCurrencyFilter,
            activeOnly: false
        });

        this.priceBookEntries = (result || []).map((entry) => ({
            ...entry,
            priceBookName: entry.Price_Book__r?.Name,
            productName: entry.Product__r?.Name,
            productCode: entry.Product_Code__c || entry.Product__r?.Product_Code__c,
            activeLabel: entry.Is_Active__c ? 'Yes' : 'No'
        }));
    }

    async refreshPriceBooksAndEntries() {
        this.isLoading = true;
        try {
            await Promise.all([this.loadPriceBooks(), this.loadPriceBookEntries()]);
        } finally {
            this.isLoading = false;
        }
    }

    handleBookSearchChange(event) {
        this.bookSearchKey = event.target.value;
        this.loadPriceBooks().catch((error) => {
            this.showToast('Error', this.normalizeError(error), 'error');
        });
    }

    handleBookCurrencyChange(event) {
        this.bookCurrencyFilter = event.detail.value;
        this.loadPriceBooks().catch((error) => {
            this.showToast('Error', this.normalizeError(error), 'error');
        });
    }

    handleEntrySearchChange(event) {
        this.entrySearchKey = event.target.value;
        this.loadPriceBookEntries().catch((error) => {
            this.showToast('Error', this.normalizeError(error), 'error');
        });
    }

    handleEntryFilterChange(event) {
        const { name, value } = event.target;
        if (name === 'priceBookFilter') {
            this.selectedEntryPriceBookId = value;
        } else if (name === 'productFilter') {
            this.selectedEntryProductId = value;
        } else if (name === 'currencyFilter') {
            this.entryCurrencyFilter = value;
        }

        this.loadPriceBookEntries().catch((error) => {
            this.showToast('Error', this.normalizeError(error), 'error');
        });
    }

    openNewPriceBookModal() {
        this.bookForm = { ...EMPTY_BOOK_FORM };
        this.isPriceBookModalOpen = true;
    }

    openEditPriceBookModal(event) {
        const recordId = event.currentTarget.dataset.id;
        const selectedRecord = this.priceBooks.find((priceBook) => priceBook.Id === recordId);
        if (!selectedRecord) {
            return;
        }

        this.bookForm = {
            Id: selectedRecord.Id,
            Name: selectedRecord.Name,
            Currency__c: selectedRecord.Currency__c || 'USD',
            Description__c: selectedRecord.Description__c || '',
            Is_Active__c: selectedRecord.Is_Active__c,
            Is_Default__c: selectedRecord.Is_Default__c
        };
        this.isPriceBookModalOpen = true;
    }

    closePriceBookModal() {
        this.isPriceBookModalOpen = false;
        this.bookForm = { ...EMPTY_BOOK_FORM };
    }

    handleBookFormChange(event) {
        const fieldName = event.target.dataset.field;
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : (event.detail?.value ?? event.target.value);
        this.bookForm = {
            ...this.bookForm,
            [fieldName]: value
        };
    }

    async savePriceBook() {
        if (!this.bookForm.Name?.trim()) {
            this.showToast('Error', 'Price Book name is required.', 'error');
            return;
        }

        this.isLoading = true;
        try {
            await upsertPriceBook({
                priceBookRecord: {
                    Id: this.bookForm.Id,
                    Name: this.bookForm.Name.trim(),
                    Currency__c: this.bookForm.Currency__c || null,
                    Description__c: this.bookForm.Description__c,
                    Is_Active__c: this.bookForm.Is_Active__c,
                    Is_Default__c: this.bookForm.Is_Default__c
                }
            });

            this.closePriceBookModal();
            await this.refreshPriceBooksAndEntries();
            this.showToast('Success', 'Price Book saved successfully.', 'success');
        } catch (error) {
            this.showToast('Error', this.normalizeError(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    confirmDeletePriceBook(event) {
        this.deleteTargetId = event.currentTarget.dataset.id;
        this.deleteTargetType = 'book';
        this.isDeleteConfirmOpen = true;
    }

    openNewPriceBookEntryModal() {
        this.entryForm = {
            ...EMPTY_ENTRY_FORM,
            Price_Book__c: this.selectedEntryPriceBookId || ''
        };

        const selectedPriceBook = this.priceBookOptions.find(
            (option) => option.value === this.entryForm.Price_Book__c
        );
        if (selectedPriceBook?.currencyCode) {
            this.entryForm.Currency__c = selectedPriceBook.currencyCode;
        }
        this.isPriceBookEntryModalOpen = true;
    }

    openEditPriceBookEntryModal(event) {
        const recordId = event.currentTarget.dataset.id;
        const selectedRecord = this.priceBookEntries.find((entry) => entry.Id === recordId);
        if (!selectedRecord) {
            return;
        }

        this.entryForm = {
            Id: selectedRecord.Id,
            Price_Book__c: selectedRecord.Price_Book__c,
            Product__c: selectedRecord.Product__c,
            Unit_Price__c: selectedRecord.Unit_Price__c,
            Currency__c: selectedRecord.Currency__c || '',
            Is_Active__c: selectedRecord.Is_Active__c
        };
        this.isPriceBookEntryModalOpen = true;
    }

    closePriceBookEntryModal() {
        this.isPriceBookEntryModalOpen = false;
        this.entryForm = { ...EMPTY_ENTRY_FORM };
    }

    handleEntryFormChange(event) {
        const fieldName = event.target.dataset.field;
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : (event.detail?.value ?? event.target.value);

        this.entryForm = {
            ...this.entryForm,
            [fieldName]: value
        };

        if (fieldName === 'Price_Book__c') {
            const selectedPriceBook = this.priceBookOptions.find(
                (option) => option.value === value
            );
            if (selectedPriceBook?.currencyCode) {
                this.entryForm = {
                    ...this.entryForm,
                    Price_Book__c: value,
                    Currency__c: selectedPriceBook.currencyCode
                };
            }
        }
    }

    async savePriceBookEntry() {
        if (!this.entryForm.Price_Book__c || !this.entryForm.Product__c) {
            this.showToast('Error', 'Price Book and Product are required.', 'error');
            return;
        }

        this.isLoading = true;
        try {
            await upsertPriceBookEntry({
                entryRecord: {
                    Id: this.entryForm.Id,
                    Price_Book__c: this.entryForm.Price_Book__c,
                    Product__c: this.entryForm.Product__c,
                    Unit_Price__c:
                        this.entryForm.Unit_Price__c === null || this.entryForm.Unit_Price__c === ''
                            ? null
                            : Number(this.entryForm.Unit_Price__c),
                    Currency__c: this.entryForm.Currency__c || null,
                    Is_Active__c: this.entryForm.Is_Active__c
                }
            });

            this.closePriceBookEntryModal();
            await this.refreshPriceBooksAndEntries();
            this.showToast('Success', 'Price Book Entry saved successfully.', 'success');
        } catch (error) {
            this.showToast('Error', this.normalizeError(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    confirmDeletePriceBookEntry(event) {
        this.deleteTargetId = event.currentTarget.dataset.id;
        this.deleteTargetType = 'entry';
        this.isDeleteConfirmOpen = true;
    }

    closeDeleteConfirm() {
        this.isDeleteConfirmOpen = false;
        this.deleteTargetId = null;
        this.deleteTargetType = null;
    }

    async handleDeleteConfirmed() {
        if (!this.deleteTargetId || !this.deleteTargetType) {
            return;
        }

        this.isLoading = true;
        try {
            if (this.deleteTargetType === 'entry') {
                await deletePriceBookEntry({ entryId: this.deleteTargetId });
                this.showToast('Success', 'Price Book Entry deleted.', 'success');
            } else {
                await deletePriceBook({ priceBookId: this.deleteTargetId });
                this.showToast('Success', 'Price Book deleted.', 'success');
            }

            this.closeDeleteConfirm();
            await this.refreshPriceBooksAndEntries();
        } catch (error) {
            this.showToast('Error', this.normalizeError(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    openCloneModal() {
        this.cloneForm = {
            sourcePriceBookId: this.selectedEntryPriceBookId || '',
            targetPriceBookId: '',
            overwriteExisting: false
        };
        this.isCloneModalOpen = true;
    }

    closeCloneModal() {
        this.isCloneModalOpen = false;
        this.cloneForm = {
            sourcePriceBookId: '',
            targetPriceBookId: '',
            overwriteExisting: false
        };
    }

    handleCloneFormChange(event) {
        const fieldName = event.target.dataset.field;
        const value = event.target.type === 'checkbox'
            ? event.target.checked
            : (event.detail?.value ?? event.target.value);
        this.cloneForm = {
            ...this.cloneForm,
            [fieldName]: value
        };
    }

    async handleCloneEntries() {
        if (!this.cloneForm.sourcePriceBookId || !this.cloneForm.targetPriceBookId) {
            this.showToast('Error', 'Source and target Price Books are required.', 'error');
            return;
        }

        this.isLoading = true;
        try {
            const clonedCount = await clonePriceBookEntries({
                sourcePriceBookId: this.cloneForm.sourcePriceBookId,
                targetPriceBookId: this.cloneForm.targetPriceBookId,
                overwriteExisting: this.cloneForm.overwriteExisting
            });

            this.closeCloneModal();
            await this.refreshPriceBooksAndEntries();
            this.showToast('Success', `${clonedCount} entries copied successfully.`, 'success');
        } catch (error) {
            this.showToast('Error', this.normalizeError(error), 'error');
        } finally {
            this.isLoading = false;
        }
    }

    normalizeError(error) {
        if (error?.body?.message) {
            return error.body.message;
        }
        if (Array.isArray(error?.body)) {
            return error.body.map((item) => item.message).join(', ');
        }
        return error?.message || 'Unexpected error';
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
}





