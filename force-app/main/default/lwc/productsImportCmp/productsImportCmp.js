import { LightningElement, track } from 'lwc';
import insertProducts from '@salesforce/apex/ProductImporterController.insertProducts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const EXPECTED_HEADERS = [
    'Name',
    'Product_Code__c',
    'Description__c',
    'Default_Price__c',
    'Default_Quantity__c',
    'Currency__c',
    'Active__c'
];

export default class ProductsImportCmp extends LightningElement {

    fileContents = null;
    fileName = '';
    @track previewRows = [];
    @track errorMessage = '';
    @track importResult = '';

    columns = [
        { label: 'Name', fieldName: 'Name' },
        { label: 'Product Code', fieldName: 'Product_Code__c' },
        { label: 'Description', fieldName: 'Description__c' },
        { label: 'Default Price', fieldName: 'Default_Price__c', type: 'number' },
        { label: 'Default Quantity', fieldName: 'Default_Quantity__c', type: 'number' },
        { label: 'Default Currency', fieldName: 'Currency__c' },
        { label: 'Active', fieldName: 'Active__c' }
    ];

    // ------------------------------------
    // DOWNLOAD TEMPLATE (WORKING VERSION)
    // ------------------------------------
    // downloadTemplate() {
    //     const header = EXPECTED_HEADERS.join(',') + '\n';
    //     const sample =
    //         'Sample Product,PRD001,This is a test product.,499.99,1,TRUE';
    //     const csv = header + sample;
    //     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    //     const link = document.createElement('a');
    //     link.href = URL.createObjectURL(blob);
    //     link.download = 'Product_Import_Template.csv';
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    // }

    downloadTemplate() {
        const EXPECTED_HEADERS = [
            'Name',
            'Product_Code__c',
            'Description__c',
            'Default_Price__c',
            'Default_Quantity__c',
            'Currency__c',
            'Active__c'
        ];
        const header = EXPECTED_HEADERS.join(',') + '\n';
        const sample = 'Sample Product,PRD001,This is a test product.,499.99,1,USD,TRUE';
        const csv = header + sample;

        // Convert CSV to data URL
        const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);

        // Create temporary anchor in template
        const link = document.createElement('a');
        link.href = csvData;
        link.download = 'Product_Import_Template.csv';

        // Must be inside template for LWC
        this.template.appendChild(link);
        link.click();
        this.template.removeChild(link);
    }

    // --------------------------

    handleFileChange(event) {
        this.errorMessage = '';
        const file = event.target.files[0];
        console.log(file);
        if (!file) return;

        this.fileName = file.name;

        const reader = new FileReader();
        reader.onload = () => {
            this.fileContents = reader.result;
        };
        reader.readAsText(file);
    }

    // --------------------------

    handleValidate() {
        this.errorMessage = '';
        this.previewRows = [];
        this.importResult = '';

        if (!this.fileContents) {
            this.errorMessage = 'Please upload a CSV file first.';
            return;
        }

        const rows = this.parseCsv(this.fileContents);

        if (!rows || !rows.length) {
            this.errorMessage = 'CSV is empty or incorrect.';
            return;
        }

        const headers = rows[0].map(h => h.trim());

        if (
            headers.length !== EXPECTED_HEADERS.length ||
            !EXPECTED_HEADERS.every((h, i) => h === headers[i])
        ) {
            this.errorMessage = 'CSV header mismatch. Expected: ' + EXPECTED_HEADERS.join(', ');
            return;
        }

        const dataRows = rows.slice(1).map((cols, i) => {
            const obj = {};
            EXPECTED_HEADERS.forEach((h, j) => (obj[h] = cols[j] || ''));
            obj._rowIndex = i + 1;
            return obj;
        });

        const validationErrors = [];
        const productCodeSet = new Set();

        dataRows.forEach(r => {
            const rowErrors = [];

            if (!r.Name) rowErrors.push('Name required');

            if (!r.Product_Code__c) {
                rowErrors.push('Product_Code__c required');
            } else {
                let code = r.Product_Code__c.trim().toUpperCase();
                if (productCodeSet.has(code)) {
                    rowErrors.push('Duplicate Product_Code__c in CSV');
                } else {
                    productCodeSet.add(code);
                    r.Product_Code__c = code;
                }
            }

            const price = parseFloat(r.Default_Price__c);
            if (isNaN(price)) rowErrors.push('Default_Price__c must be number');
            else r.Default_Price__c = price;

            // const currency = parseFloat(r.Currency__c);
            // if (isNaN(currency)) rowErrors.push('Currency__c must be number');
            // else r.Currency__c = currency;

            let currencyValue = r.Currency__c;
            if (!currencyValue || currencyValue.trim() === '') {
                r.Currency__c = null;   // optional field ✅
            } else {
                currencyValue = currencyValue.trim().toUpperCase();
                // Remove spaces
                currencyValue = currencyValue.replace(/\s+/g, '');

                // Extract symbol or code
                let symbol = currencyValue.match(/[₹$€£]/);
                let code = currencyValue.match(/[A-Z]{3}/);
                let key = symbol ? symbol[0] : (code ? code[0] : null);

                const currencyMap = {
                    '₹': 'INR',
                    '$': 'USD',
                    '€': 'EUR',
                    '£': 'GBP',
                    'INR': 'INR',
                    'USD': 'USD',
                    'EUR': 'EUR',
                    'GBP': 'GBP'
                };

                const allowedCurrencies = ['INR', 'USD', 'EUR', 'GBP'];

                let mappedCurrency = currencyMap[key];
                if (!mappedCurrency || !allowedCurrencies.includes(mappedCurrency)) {
                    rowErrors.push('Currency__c must be USD, INR, EUR, GBP or valid symbol');
                } else {
                    r.Currency__c = mappedCurrency;
                }
            }

            const qty = parseInt(r.Default_Quantity__c);
            if (isNaN(qty)) rowErrors.push('Default_Quantity__c must be integer');
            else r.Default_Quantity__c = qty;

            const act = (r.Active__c || '').toUpperCase();
            if (act === 'TRUE' || act === 'FALSE') r.Active__c = act === 'TRUE';
            else rowErrors.push('Active__c must be TRUE or FALSE');

            if (rowErrors.length) validationErrors.push(`Row ${r._rowIndex}: ${rowErrors.join('; ')}`);
        });

        if (validationErrors.length) {
            this.errorMessage = 'Validation errors:\n' + validationErrors.join('\n');
            this.previewRows = dataRows;
            return;
        }

        this.previewRows = dataRows;

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Validation Success',
                message: 'Preview ready!',
                variant: 'success'
            })
        );
    }

    // --------------------------

    handleClear() {
        this.fileContents = null;
        this.fileName = '';
        this.previewRows = [];
        this.errorMessage = '';
        this.importResult = '';
        // this.template.querySelector('lightning-input[type=file]').value = null;
    }

    // --------------------------

    // handleImport() {
    //     if (!this.previewRows.length) {
    //         this.errorMessage = 'Nothing to import.';
    //         return;
    //     }
    //     const payload = this.previewRows.map(r => ({
    //         Name: r.Name,
    //         Product_Code__c: r.Product_Code__c,
    //         Description__c: r.Description__c,
    //         Default_Price__c: r.Default_Price__c,
    //         Default_Quantity__c: r.Default_Quantity__c,
    //         Currency__c :r.Currency__c,
    //         Active__c: r.Active__c
    //     }));
    //     insertProducts({ productsJson: JSON.stringify(payload) })
    //         .then(res => {
    //             this.dispatchEvent(
    //                 new ShowToastEvent({
    //                     title: 'Import Complete',
    //                     message: `Inserted: ${res.insertedCount}`,
    //                     variant: 'success'
    //                 })
    //             );
    //             this.handleClear();
    //         })
    //         .catch(err => {
    //             console.log('err 1 1 1- - - -- : ', + err);
    //             console.log('err- - - -- : ', + JSON.stringify(err));
    //             this.errorMessage = err.body?.message || err.message;
    //         });
    // }

    // --------------------------

    // parseCsv(content) {
    //     const rows = content
    //         .trim()
    //         .split(/\r?\n/)
    //         .map(line => line.split(','));
    //     return rows;
    // }

    handleImport() {
        if (!this.previewRows.length) {
            this.errorMessage = 'Nothing to import.';
            return;
        }

        const payload = this.previewRows.map(r => ({
            Name: r.Name,
            Product_Code__c: r.Product_Code__c,
            Description__c: r.Description__c,
            Default_Price__c: r.Default_Price__c,
            Default_Quantity__c: r.Default_Quantity__c,
            Currency__c: r.Currency__c,
            Active__c: r.Active__c
        }));

        insertProducts({ productsJson: JSON.stringify(payload) })
            .then(res => {
                console.log('Apex Result:', JSON.stringify(res));

                // 🔥 ❌ If errors exist → show error
                if (res.errors && res.errors.length > 0) {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: res.errors.join('\n'),
                            variant: 'error'
                        })
                    );
                    return; // ❌ STOP
                }

                // ✅ Only if NO errors
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Import Complete',
                        message: `Inserted: ${res.insertedCount}`,
                        variant: 'success'
                    })
                );

                this.handleClear();
            })
            .catch(err => {
                console.log('Error:', JSON.stringify(err));
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: err.body?.message || err.message,
                        variant: 'error'
                    })
                );
            });
    }

        parseCsv(content) {
        const rows = content
            .trim()
            .split(/\r?\n/)
            .map(line => line.split(','));
        return rows;
    }

}