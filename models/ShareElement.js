
class ShareElement {
    constructor(symbol, priorityQueue) {
        this.symbol = symbol;
        this.priorityQueue = priorityQueue;
        this.totalShares = 0;
    }

    addShares(shares) {
        this.totalShares += shares;
    }

    resetTotalShares() {
        this.totalShares = 0;
    }
}

module.exports = ShareElement;