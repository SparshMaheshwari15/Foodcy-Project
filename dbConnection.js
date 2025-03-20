const mongoose = require("mongoose");

const dbUrl = "mongodb://127.0.0.1:27017/foodcy_orders";

console.log(dbUrl)
main()
    .then((res) => {
        console.log("Connection Successful to DB");
    })
    .catch((e) => {
        console.log("Error in db");
        console.log(e);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

module.exports = main;
