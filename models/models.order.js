const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    billNo: { type: String, unique: true, required: true },
    status: { type: String, enum: ["Pending", "Arrived", "Delivered"], default: 'Pending' },
});

// Ensure the unique index is applied
// orderSchema.index({ billNo: 1 }, { unique: true });

// Pre-save middleware to validate `status`
orderSchema.pre("save", async function (next) {
    if (!["Pending", "Arrived", "Delivered"].includes(this.status)) {
        return next(new Error("Invalid status value"));
    }
    next();
});
const Order = mongoose.model("Order", orderSchema);


module.exports = Order;
