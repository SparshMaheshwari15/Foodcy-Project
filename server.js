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


// const connectDb = require("./dbConnection.js");
const Order = require("./models/order.js");


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index'); // User enters bill number
});

app.get('/admin', async (req, res) => {
    const orders = await Order.find();
    res.render('admin', { orders });
});

// Create Order - Prevents Duplicates
app.post('/create-order', async (req, res) => {
    const { billNo } = req.body;

    const existingOrder = await Order.findOne({ billNo });
    if (!existingOrder) {
        const newOrder = new Order({ billNo });
        await newOrder.save();
        io.emit('orderUpdate', { billNo, status: 'Pending' });
    }

    res.redirect('/admin');
});

// Update Order Status
// app.post('/update-order', async (req, res) => {
//     const { billNo, status } = req.body;

//     try {
//         const order = await Order.findOne({ billNo });

//         if (!order) {
//             return res.status(404).json({ success: false, message: "Order not found" });
//         }

//         order.status = status;
//         await order.save();

//         // Emit WebSocket event
//         io.emit('orderUpdate', { billNo, status });

//         res.json({ success: true, message: "Order updated successfully", billNo, status });
//     } catch (error) {
//         console.error("Error updating order:", error);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

app.post('/update-order', async (req, res) => {
    const { billNo, status } = req.body;
    const order = await Order.findOne({ billNo });

    if (order) {
        order.status = status;
        await order.save();

        // ✅ Emit WebSocket update to all clients
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
        for (let i = 1; i <= 15; i++) {
            orders.push({ billNo: i.toString(), status: 'Pending' });
        }
        await Order.insertMany(orders);

        res.send('Database cleared and reinitialized with orders 1-15.');
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).send('Error initializing database');
    }
});

// WebSocket Connection
// io.on('connection', (socket) => {
//     console.log('A user connected');

//     // Handle request for current status
//     socket.on('requestStatus', async (data) => {
//         const order = await Order.findOne({ billNo: data.billNo });
//         if (order) {
//             socket.emit('currentStatus', { billNo: order.billNo, status: order.status });
//         } else {
//             socket.emit('currentStatus', { billNo: data.billNo, status: "Not Found" });
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

// io.on('connection', (socket) => {
//     console.log('A user connected');

//     // Listen for order updates from admin
//     socket.on('updateOrder', async (data) => {
//         try {
//             const { billNo, status } = data;
//             const order = await Order.findOne({ billNo });

//             if (order) {
//                 order.status = status;
//                 await order.save();

//                 // ✅ Broadcast update to all clients
//                 io.emit('orderUpdate', { billNo, status });

//                 console.log(`🔄 Order ${billNo} updated to ${status}`);
//             }
//         } catch (error) {
//             console.error("⚠️ Error updating order:", error);
//         }
//     });

//     // Handle status request from users
//     socket.on('requestStatus', async (data) => {
//         const order = await Order.findOne({ billNo: data.billNo });
//         if (order) {
//             socket.emit('currentStatus', { billNo: order.billNo, status: order.status });
//         } else {
//             socket.emit('currentStatus', { billNo: data.billNo, status: "Not Found" });
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

// io.on('connection', (socket) => {
//     console.log('A user connected');

//     // Listen for admin updates
//     socket.on('updateOrder', async (data) => {
//         try {
//             const { billNo, status } = data;
//             const order = await Order.findOne({ billNo });

//             if (order) {
//                 order.status = status;
//                 await order.save();

//                 // ✅ Broadcast update to all clients
//                 io.emit('orderUpdate', { billNo, status });
//                 console.log(`📢 Broadcasted: Order ${billNo} updated to ${status}`);
//             }
//         } catch (error) {
//             console.error("⚠️ Error updating order:", error);
//         }
//     });

//     // User requests status update
//     socket.on('requestStatus', async (data) => {
//         const order = await Order.findOne({ billNo: data.billNo });

//         if (order) {
//             socket.emit('currentStatus', { billNo: order.billNo, status: order.status });
//             console.log(`📨 Sent status for ${order.billNo}: ${order.status}`);
//         } else {
//             socket.emit('currentStatus', { billNo: data.billNo, status: "Not Found" });
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

// io.on('connection', (socket) => {
//     console.log('A user connected');

//     // Listen for admin updates
//     socket.on('updateOrder', async (data) => {
//         try {
//             const { billNo, status } = data;
//             const order = await Order.findOne({ billNo });

//             if (order) {
//                 order.status = status;
//                 await order.save();

//                 // ✅ Log the broadcast event
//                 console.log(`📢 Emitting: Order ${billNo} updated to ${status}`);

//                 // ✅ Send update to all connected clients
//                 io.emit('orderUpdate', { billNo, status });
//             }
//         } catch (error) {
//             console.error("⚠️ Error updating order:", error);
//         }
//     });

//     socket.on('disconnect', () => {
//         console.log('A user disconnected');
//     });
// });

io.on("connection", (socket) => {
    console.log("A user connected");

    // ✅ User requests the current order status
    socket.on("requestStatus", async (data) => {
        try {
            console.log(`🔎 User requested status for Order ${data.billNo}`);
            const order = await Order.findOne({ billNo: data.billNo });

            if (order) {
                console.log(`📢 Sending current status: Order ${order.billNo} -> ${order.status}`);
                socket.emit("currentStatus", { billNo: order.billNo, status: order.status });
            } else {
                console.log(`⚠️ Order ${data.billNo} not found`);
                socket.emit("currentStatus", { billNo: data.billNo, status: "Not Found" });
            }
        } catch (error) {
            console.error("❌ Error fetching order status:", error);
        }
    });

    // ✅ Admin updates the order status
    socket.on("updateOrderStatus", async (data) => {
        try {
            const { billNo, status } = data;

            // ✅ Update the order in the database
            const updatedOrder = await Order.findOneAndUpdate(
                { billNo },
                { status },
                { new: true } // Returns the updated document
            );

            if (!updatedOrder) {
                console.log(`⚠️ Order ${billNo} not found!`);
                socket.emit("updateFailed", { message: "Order not found" });
                return;
            }

            console.log(`📢 Order ${billNo} updated to ${status}`);

            // ✅ Emit the update to all connected users
            io.emit("orderUpdate", { billNo, status });

            // ✅ Confirm update back to the admin
            socket.emit("updateSuccess", { billNo, status });

        } catch (error) {
            console.error("❌ Error updating order:", error);
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
