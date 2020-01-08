
class Transaction {
    constructor(date, transactionId, type, symbol, shares, price, amount, netCashBalance, comission, regFee) {
        this.date = date;
        this.transactionId = transactionId;
        this.type = type;
        this.symbol = symbol;
        this.shares = shares;
        this.price = price;
        this.amount = amount;
        this.netCashBalance = netCashBalance;
        this.fees = { comission, reg: regFee};
    }
}

module.exports = Transaction;