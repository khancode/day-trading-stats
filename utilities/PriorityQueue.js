/* Priority Queue implementation using Heap below */
class Heap {
    constructor(compare) {
        this.compare = compare; // compares priority between 2 elements
        this.arr = [null]; // array represents heap
    }

    add(val) {
        this.arr.push(val);

        // Bubble up
        let curIndex = this.arr.length - 1;
        let parentIndex = Math.trunc(curIndex / 2);
        while (parentIndex > 0 && this.compare(this.arr[curIndex], this.arr[parentIndex]) < 0) {
            // Swap child with parent
            const child = this.arr[curIndex];
            this.arr[curIndex] = this.arr[parentIndex];
            this.arr[parentIndex] = child;
            // Update indices
            curIndex = parentIndex;
            parentIndex = Math.trunc(curIndex / 2);
        }
    }

    poll() {
        const result = this.arr[1];

        // Bubble down
        if (this.arr.length === 2) {
            this.arr.pop();
        } else if (this.arr.length > 2) {
            // set last element to front of heap
            this.arr[1] = this.arr.pop();

            let curIndex = 1;
            let leftChildIndex = curIndex*2;
            let rightChildIndex = curIndex*2 + 1;
            while (leftChildIndex < this.arr.length || rightChildIndex < this.arr.length) {
                // Find potential child to compare with cur
                let potentialChild;
                if (leftChildIndex >= this.arr.length) { // if leftChildIndex out of bounds, use rightChildIndex
                    potentialChild = rightChildIndex;
                } else if (rightChildIndex >= this.arr.length) { // if rightChildIndex out of bounds, use leftChildIndex
                    potentialChild = leftChildIndex;
                } else { // if both children indices are within bounds, use the one with highest priority
                    const childrenCompare = this.compare(this.arr[leftChildIndex], this.arr[rightChildIndex]);
                    if (childrenCompare <= 0) {
                        potentialChild = leftChildIndex;
                    } else {
                        potentialChild = rightChildIndex;
                    }
                }

                if (this.compare(this.arr[curIndex], this.arr[potentialChild]) > 0) {
                    // Swap
                    const cur = this.arr[curIndex];
                    this.arr[curIndex] = this.arr[potentialChild];
                    this.arr[potentialChild] = cur;
                    // Update indices
                    curIndex = potentialChild;
                    leftChildIndex = curIndex * 2;
                    rightChildIndex = curIndex * 2 + 1;
                } else {
                    break;
                }
            }
        }

        return result;
    }

    peek() {
        return this.arr[1];
    }

    get length() {
        return this.arr.length - 1;
    }
}

module.exports = Heap;