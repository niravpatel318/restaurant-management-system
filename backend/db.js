const mysql = require("mysql2");

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "restaurant_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection(function (error, connection) {
    if (error) {
        console.log("Database connection failed: " + error.message);
        return;
    }
    console.log("MySQL database connected");
    connection.release();
});

module.exports = db;
