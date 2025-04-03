if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}
const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");
const server = http.createServer(app);
const io = new Server(server, {
    pingInterval: 25000, // Send a ping every 25 seconds
    pingTimeout: 60000,  // Wait 60 seconds before closing connection
});
const MongoStore = require("connect-mongo");


const connectDb = require("./dbConnection.js");
const Order = require("./models/models.order.js");


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        secret: process.env.SESSION_SECRET_KEY,
        resave: false,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: process.env.LOCALDB_URL, // Use your MongoDB connection string
            collectionName: "sessions",
        }),
        cookie: { maxAge: 1000 * 60 * 60 * 3 }, // 1 day
    })
);

app.use(flash());
// Passport Configuration
require("./config/passport")(app);

// Global Flash Messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});
// Routes
app.get('/', (req, res) => {
    res.render('user'); // User enters bill number
});

app.use("/admin", require("./routes/routes.admin.js"));
app.use("/auth", require("./routes/routes.auth.js"));
app.use("/init", require("./routes/routes.init.js"));

// WebSocket Connection

io.on("connection", (socket) => {
    console.log("A user connected");

    // User requests the current order status
    socket.on("requestStatus", async (data) => {
        try {
            // console.log(`User requested status for Order ${data.billNo}`);
            const order = await Order.findOne({ billNo: data.billNo });

            if (order) {
                // console.log(`Sending current status: Order ${order.billNo} -> ${order.status}`);
                socket.emit("currentStatus", { billNo: order.billNo, status: order.status });
            } else {
                // console.log(`Order ${data.billNo} not found`);
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
                // console.log(`Order ${billNo} not found!`);
                socket.emit("updateFailed", { message: "Order not found" });
                return;
            }

            // console.log(`Order ${billNo} updated to ${status}`);

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
        // console.log("A user disconnected");
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
