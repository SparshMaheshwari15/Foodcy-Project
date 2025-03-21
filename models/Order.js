const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    billNo: { type: String, unique: true, required: true }, 
    status: { type: String, default: 'Pending' },
});

// Ensure the unique index is applied
// orderSchema.index({ billNo: 1 }, { unique: true });

const Order = mongoose.model("Order", orderSchema);


module.exports = Order;
