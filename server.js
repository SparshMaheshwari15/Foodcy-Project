if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    pingInterval: 25000, // Send a ping every 25 seconds
    pingTimeout: 60000,  // Wait 60 seconds before closing connection
});


const connectDb = require("./dbConnection.js");
const Order = require("./models/models.order.js");


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('user'); // User enters bill number
});

app.get('/admin', async (req, res) => {
    const orders = await Order.find();
    res.render('admin', { orders });
});

// Create Order - Prevents Duplicates
// app.post('/create-order', async (req, res) => {
//     const { billNo } = req.body;

//     const existingOrder = await Order.findOne({ billNo });
//     if (!existingOrder) {
//         const newOrder = new Order({ billNo });
//         await newOrder.save();
//         io.emit('orderUpdate', { billNo, status: 'Pending' });
//     }

//     res.redirect('/admin');
// });

// Update Order Status
app.post('/update-order', async (req, res) => {
    const { billNo, status } = req.body;
    const order = await Order.findOne({ billNo });

    if (order) {
        order.status = status;
        await order.save();

        // Emit WebSocket update to all clients
        io.emit('orderUpdate', { billNo, status });
    }

    res.sendStatus(200); // Respond to confirm the update
});


// Route to Initialize DB with 1-999 Orders
app.get('/init', async (req, res) => {
    try {
        await Order.deleteMany({});
        console.log('Database cleared.');

        const orders = [];
        for (let i = 1; i <= 30; i++) {
            orders.push({ billNo: i.toString(), status: 'Pending' });
        }
        await Order.insertMany(orders);

        res.send('Database cleared and reinitialized with orders 1-30.');
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).send('Error initializing database');
    }
});

// WebSocket Connection
io.on("connection", (socket) => {
    console.log("A user connected");

    // User requests the current order status
    socket.on("requestStatus", async (data) => {
        try {
            console.log(`User requested status for Order ${data.billNo}`);
            const order = await Order.findOne({ billNo: data.billNo });

            if (order) {
                console.log(`Sending current status: Order ${order.billNo} -> ${order.status}`);
                socket.emit("currentStatus", { billNo: order.billNo, status: order.status });
            } else {
                console.log(`Order ${data.billNo} not found`);
                socket.emit("currentStatus", { billNo: data.billNo, status: "Not Found" });
            }
        } catch (error) {
            console.error("Error fetching order status:", error);
        }
    });

    // Admin updates the order status
    socket.on("updateOrderStatus", async (data) => {
        try {
            const { billNo, status } = data;

            // Update the order in the database
            const updatedOrder = await Order.findOneAndUpdate(
                { billNo },
                { status },
                { new: true } // Returns the updated document
            );

            if (!updatedOrder) {
                console.log(`Order ${billNo} not found!`);
                socket.emit("updateFailed", { message: "Order not found" });
                return;
            }

            console.log(`Order ${billNo} updated to ${status}`);

            // ✅ Emit the update to all connected users
            io.emit("orderUpdate", { billNo, status });

            // ✅ Confirm update back to the admin
            socket.emit("updateSuccess", { billNo, status });

        } catch (error) {
            console.error("Error updating order:", error);
            socket.emit("updateFailed", { message: "Failed to update order" });
        }
    });


    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
