const fs = require('fs');
const Transaction = require('./models/Transaction');

readCsvFile()
    .then((transactions) => {
        console.log('transactions:', transactions);
    });

function readCsvFile() {
    const promise = new Promise((resolve, reject) => {
        fs.readFile('./test-data/transactions.csv', 'utf8', (err, data) => {
            var dataArray = data.split(/\r?\n/);
    
            const transactions = [];
            for (let i = 1; i < dataArray.length; i++) {
                const transaction = parseCsvDataRow(dataArray[i]);
                if (transaction) {
                    transactions.push(transaction);
                }
            }
            resolve(transactions);
        });
    });

    return promise;
}

function parseCsvDataRow(dataRow) {
    if (dataRow === null || dataRow === undefined || dataRow === '' || dataRow === '***END OF FILE***') {
        return null;
    }

    const rowArr = dataRow.split(',');
    return new Transaction(
        new Date(rowArr[0]),
        rowArr[1],
        rowArr[2].split(' ')[0],
        rowArr[4],
        parseInt(rowArr[3]),
        parseFloat(rowArr[5]),
        parseFloat(rowArr[7]),
        parseFloat(rowArr[8]),
        parseFloat(rowArr[6]),
        rowArr[9] ? parseFloat(rowArr[9]) : null
    );
}
