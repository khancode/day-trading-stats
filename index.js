const fs = require('fs');
const Transaction = require('./models/Transaction');
const NetTransaction = require('./models/NetTransaction');
const PriorityQueue = require('./utilities/PriorityQueue');

readCsvFile()
    .then((transactions) => {
        const netObj = analyzeTransactions(transactions);
        console.log('netTransactions:', netObj.netTransactions);
        console.log('totalNetPercentage:', netObj.totalNetPercentage);
        console.log('totalNetDollars:', netObj.totalNetDollars);
    });

function analyzeTransactions(transactions) {
    const sharesMap = new Map();
    const netTransactions = [];
    let totalNetPercentage = 0;
    let totalNetDollars = 0;

    transactions.forEach((transaction) => {
        const { isBought, symbol, shares, price } = transaction;

        if (isBought) {
            if (!sharesMap.has(symbol)) {
                sharesMap.set(symbol, new PriorityQueue((a, b) => a.price - b.price));
            }
            sharesMap.get(symbol).add({ price, shares });

            netTransactions.push(new NetTransaction(transaction, null, null));
        } else {
            let sharesToSellRemainder = shares;
            let netPercentage = 0;
            let netDollar = 0;
            do {
                const prevBuy = sharesMap.get(symbol).poll();

                let sharesToSell;
                if (shares > prevBuy.shares) {
                    sharesToSell = prevBuy.shares;
                    sharesToSellRemainder -= sharesToSell;
                } else if (shares <= prevBuy.shares) {
                    sharesToSell = shares;
                    sharesToSellRemainder = 0;

                    if (shares < prevBuy.shares) {
                        prevBuy.shares -= shares;
                        sharesMap.get(symbol).add(prevBuy);
                    }
                }

                netPercentage += ((price - prevBuy.price) / prevBuy.price) * (sharesToSell / shares) * 100;
                netDollar += (price * sharesToSell) - (prevBuy.price * sharesToSell);

                totalNetPercentage += netPercentage;
                totalNetDollars += netDollar;
            } while (sharesToSellRemainder > 0);

            netTransactions.push(new NetTransaction(transaction, netPercentage, netDollar));
        }
    });

    return { netTransactions, totalNetPercentage, totalNetDollars };
}

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
