const fs = require('fs');
const Transaction = require('./models/Transaction');
const NetTransaction = require('./models/NetTransaction');
const PriorityQueue = require('./utilities/PriorityQueue');
const ShareElement = require('./models/ShareElement');

const BOUGHT_TO_COVER = 'Bought to Cover';
const SOLD_SHORT = 'Sold Short';
const BOUGHT = 'Bought';
const SOLD = 'Sold';

readCsvFile()
    .then((transactions) => {
        const netObj = analyzeTransactions(transactions);
        console.log('netTransactions:', netObj.netTransactions);
        console.log('totalNetPercentage:', netObj.totalNetPercentage);
        console.log('totalNetDollars:', netObj.totalNetDollars);
        console.log(netObj.totalNetDollars >= 0 ? 'GREEN DAY :D' : 'RED DAY :0');
    });

function analyzeTransactions(transactions) {
    console.log('transactions:');
    console.log(transactions);

    const longMap = new Map(); // share -> { price, shares }
    const shortMap = new Map(); // share -> { price, shares }
    const netTransactions = [];

    transactions.forEach((transaction) => {
        const { type, symbol, shares, price } = transaction;

        let netPercentage = 0;
        let netDollar = 0;

        switch (type) {
            case BOUGHT:
                if (!longMap.has(symbol)) {
                    longMap.set(symbol, new ShareElement(symbol, new PriorityQueue((a, b) => a.price - b.price)));
                }
                longMap.get(symbol).priorityQueue.add({ price, shares });
                longMap.get(symbol).addShares(shares);
    
                netTransactions.push(new NetTransaction(transaction, null, null));
                break;
            case SOLD:
                let sharesToSellRemainder = shares;
                do {
                    const prevBuy = longMap.get(symbol).priorityQueue.poll();

                    let sharesToSell;
                    if (shares > prevBuy.shares) {
                        sharesToSell = prevBuy.shares;
                        sharesToSellRemainder -= sharesToSell;
                    } else if (shares <= prevBuy.shares) {
                        sharesToSell = shares;
                        sharesToSellRemainder -= sharesToSell;

                        if (shares < prevBuy.shares) {
                            prevBuy.shares -= shares;
                            longMap.get(symbol).priorityQueue.add(prevBuy);
                        }
                    }

                    const totalShares = longMap.get(symbol).totalShares;
                    netPercentage += ((price - prevBuy.price) / prevBuy.price) * (sharesToSell / totalShares) * 100;
                    netDollar += (price * sharesToSell) - (prevBuy.price * sharesToSell);
                } while (sharesToSellRemainder > 0);

                if (longMap.get(symbol).priorityQueue.length === 0) {
                    longMap.get(symbol).resetTotalShares();
                }

                netTransactions.push(new NetTransaction(transaction, netPercentage, netDollar));
                break;
            case SOLD_SHORT:
                if (!shortMap.has(symbol)) {
                    shortMap.set(symbol, new ShareElement(symbol, new PriorityQueue((a, b) => b.price - a.price)));
                }
                shortMap.get(symbol).priorityQueue.add({ price, shares });
                shortMap.get(symbol).addShares(shares);
    
                netTransactions.push(new NetTransaction(transaction, null, null));
                break;
            case BOUGHT_TO_COVER:
                let sharesToCoverRemainder = shares;
                do {
                    const prevShort = shortMap.get(symbol).priorityQueue.poll();

                    let sharesToCover;
                    if (shares > prevShort.shares) {
                        sharesToCover = prevShort.shares;
                        sharesToCoverRemainder -= sharesToCover;
                    } else if (shares <= prevShort.shares) {
                        sharesToCover = shares;
                        sharesToCoverRemainder = 0;

                        if (shares < prevShort.shares) {
                            prevShort.shares -= shares;
                            shortMap.get(symbol).priorityQueue.add(prevShort);
                        }
                    }

                    const totalShares = shortMap.get(symbol).totalShares;
                    netPercentage += ((prevShort.price - price) / price) * (sharesToCover / totalShares) * 100;
                    netDollar += (prevShort.price * sharesToCover) - (price * sharesToCover);
                } while (sharesToCoverRemainder > 0);

                if (shortMap.get(symbol).priorityQueue.length === 0) {
                    shortMap.get(symbol).resetTotalShares();
                }

                netTransactions.push(new NetTransaction(transaction, netPercentage, netDollar));
                break;
            default:
                throw 'Not implemented';
        }
    });

    const totalNetPercentage = netTransactions.reduce((sum, netTransaction) => sum + (netTransaction.netPercentage || 0), 0);
    const totalNetDollars = netTransactions.reduce((sum, netTransaction) => sum + (netTransaction.netDollar || 0), 0);
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
        determineTradeType(rowArr[2]),
        rowArr[4],
        parseInt(rowArr[3]),
        parseFloat(rowArr[5]),
        parseFloat(rowArr[7]),
        parseFloat(rowArr[8]),
        parseFloat(rowArr[6]),
        rowArr[9] ? parseFloat(rowArr[9]) : null
    );
}

function determineTradeType(description) {
    if (description.search(BOUGHT_TO_COVER) !== -1) {
        return BOUGHT_TO_COVER;
    } else if (description.search(SOLD_SHORT) !== -1) {
        return SOLD_SHORT;
    } else if (description.search(BOUGHT) !== -1) {
        return BOUGHT;
    } else if (description.search(SOLD) !== -1) {
        return SOLD;
    }
}
