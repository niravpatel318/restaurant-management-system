const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

function prepareOrderTables(done) {
    db.query(`CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orders_created_at (created_at),
    INDEX idx_orders_status (status)
    ) ENGINE=InnoDB`, function (error) {
        if (error) return done(error);
        db.query(`CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NULL,
    item_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_items_order_id (order_id)
        ) ENGINE=InnoDB`, done);
    });
}

app.get("/", function (req, res) {
    res.json({ message: "Restaurant Management API is running" });
});

app.get("/api/foods/:id", function (req, res) {
    db.query("SELECT * FROM foods WHERE id=?", [req.params.id], function (error, result) {
        if (error) {
            return res.status(500).json({ message: "Could not get food item" });
        }
        if (result.length === 0) {
            return res.status(404).json({ message: "Food item not found" });
        }
        res.json(result[0]);
    });
});

app.get("/api/foods", function (req, res) {
    db.query("SELECT * FROM foods ORDER BY id DESC", function (error, result) {
        if (error) {
            return res.status(500).json({ message: "Could not get food items" });
        }
        res.json(result);
    });
});

app.post("/api/orders", async function (req, res) {
    const customerName = String(req.body.customerName || "").trim();
    const tableNumber = String(req.body.tableNumber || "").trim();
    const requestedItems = req.body.items;

    if (!customerName || customerName.length > 100 || !tableNumber || tableNumber.length > 20 || !Array.isArray(requestedItems) || requestedItems.length === 0) {
        return res.status(400).json({ message: "Enter your name and table number, then add at least one menu item." });
    }

    const quantities = new Map();
    for (const item of requestedItems) {
        const id = Number(item.id);
        const quantity = Number(item.quantity);
        if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
            return res.status(400).json({ message: "One or more order quantities are invalid." });
        }
        quantities.set(id, (quantities.get(id) || 0) + quantity);
    }

    let connection;
    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();
        const ids = [...quantities.keys()];
        const [foods] = await connection.query("SELECT id, name, price, quantity FROM foods WHERE id IN (?) FOR UPDATE", [ids]);
        if (foods.length !== ids.length) {
            await connection.rollback();
            return res.status(400).json({ message: "A menu item changed. Refresh the menu and try again." });
        }

        const items = foods.map(food => ({ ...food, orderQuantity: quantities.get(food.id) }));
        const outOfStock = items.find(item => item.orderQuantity > Number(item.quantity));
        if (outOfStock) {
            await connection.rollback();
            return res.status(409).json({ message: "A selected item does not have enough stock. Please refresh the menu." });
        }

        const total = items.reduce((sum, item) => sum + Number(item.price) * item.orderQuantity, 0);
        const [orderResult] = await connection.query(
            "INSERT INTO orders (customer_name, table_number, total) VALUES (?, ?, ?)",
            [customerName, tableNumber, total]
        );
        const itemRows = items.map(item => [orderResult.insertId, item.id, item.name, item.price, item.orderQuantity]);
        await connection.query(
            "INSERT INTO order_items (order_id, food_id, item_name, price, quantity) VALUES ?",
            [itemRows]
        );
        for (const item of items) {
            await connection.query("UPDATE foods SET quantity = quantity - ? WHERE id = ?", [item.orderQuantity, item.id]);
        }
        await connection.commit();
        res.status(201).json({ message: "Your order has been sent to the restaurant.", orderId: orderResult.insertId });
    } catch (error) {
        if (connection) {
            try { await connection.rollback(); } catch (_) { /* Transaction may not have started. */ }
        }
        console.error("Could not place customer order:", error.message);
        res.status(500).json({ message: "Could not place the order. Please try again." });
    } finally {
        if (connection) connection.release();
    }
});

app.get("/api/orders", function (req, res) {
    db.query("SELECT id, customer_name AS customerName, table_number AS tableNumber, total, status, created_at AS createdAt FROM orders ORDER BY created_at DESC, id DESC", function (error, orders) {
        if (error) return res.status(500).json({ message: "Could not load customer orders" });
        if (!orders.length) return res.json([]);
        const ids = orders.map(order => order.id);
        db.query("SELECT order_id AS orderId, food_id AS foodId, item_name AS name, price, quantity FROM order_items WHERE order_id IN (?) ORDER BY id", [ids], function (itemError, items) {
            if (itemError) return res.status(500).json({ message: "Could not load order items" });
            const byOrder = new Map();
            items.forEach(item => {
                if (!byOrder.has(item.orderId)) byOrder.set(item.orderId, []);
                byOrder.get(item.orderId).push(item);
            });
            res.json(orders.map(order => ({ ...order, items: byOrder.get(order.id) || [] })));
        });
    });
});

app.put("/api/orders/:id/status", function (req, res) {
    const allowed = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];
    const status = req.body.status;
    if (!allowed.includes(status)) return res.status(400).json({ message: "Choose a valid order status." });
    (async function () {
        let connection;
        try {
            connection = await db.promise().getConnection();
            await connection.beginTransaction();
            const [orders] = await connection.query("SELECT status FROM orders WHERE id = ? FOR UPDATE", [req.params.id]);
            if (!orders.length) {
                await connection.rollback();
                return res.status(404).json({ message: "Order not found" });
            }
            const currentStatus = orders[0].status;
            const transitions = {
                Pending: ["Preparing", "Cancelled"],
                Preparing: ["Ready", "Cancelled"],
                Ready: ["Completed", "Cancelled"],
                Completed: [],
                Cancelled: []
            };
            if (status !== currentStatus && !transitions[currentStatus].includes(status)) {
                await connection.rollback();
                return res.status(409).json({ message: "This order can no longer move to that status." });
            }
            if (status === "Cancelled" && currentStatus !== "Cancelled") {
                const [items] = await connection.query("SELECT food_id AS foodId, quantity FROM order_items WHERE order_id = ?", [req.params.id]);
                for (const item of items) {
                    if (item.foodId) await connection.query("UPDATE foods SET quantity = quantity + ? WHERE id = ?", [item.quantity, item.foodId]);
                }
            }
            await connection.query("UPDATE orders SET status = ? WHERE id = ?", [status, req.params.id]);
            await connection.commit();
            res.json({ message: "Order status updated", status });
        } catch (error) {
            if (connection) {
                try { await connection.rollback(); } catch (_) { /* Transaction may not have started. */ }
            }
            console.error("Could not update order status:", error.message);
            res.status(500).json({ message: "Could not update order status" });
        } finally {
            if (connection) connection.release();
        }
    })();
});

app.post("/api/foods", function (req, res) {
    const { name, price, category, description, quantity } = req.body;

    if (!name || Number(price) <= 0 || !category || !description || Number(quantity) < 0) {
        return res.status(400).json({ message: "Please enter valid food details" });
    }

    const sql = "INSERT INTO foods (name, price, category, description, quantity) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [name, price, category, description, quantity], function (error, result) {
        if (error) {
            return res.status(500).json({ message: "Could not add food item" });
        }
        res.json({ message: "Food added successfully", id: result.insertId });
    });
});

app.put("/api/foods/:id", function (req, res) {
    const { name, price, category, description, quantity } = req.body;
    const id = req.params.id;

    if (!name || Number(price) <= 0 || !category || !description || Number(quantity) < 0) {
        return res.status(400).json({ message: "Please enter valid food details" });
    }

    const sql = "UPDATE foods SET name=?, price=?, category=?, description=?, quantity=? WHERE id=?";
    db.query(sql, [name, price, category, description, quantity, id], function (error) {
        if (error) {
            return res.status(500).json({ message: "Could not update food item" });
        }
        res.json({ message: "Food updated successfully" });
    });
});

app.delete("/api/foods/:id", function (req, res) {
    db.query("DELETE FROM foods WHERE id=?", [req.params.id], function (error) {
        if (error) {
            return res.status(500).json({ message: "Could not delete food item" });
        }
        res.json({ message: "Food deleted successfully" });
    });
});

prepareOrderTables(function (error) {
    if (error) console.log("Could not prepare customer order tables: " + error.message);
    const server = app.listen(PORT, function () {
        console.log("Server running on http://localhost:" + PORT);
    });
    server.on("error", function (serverError) {
        if (serverError.code === "EADDRINUSE") {
            console.error("Port " + PORT + " is already in use. Stop the other backend process before starting this one.");
            return;
        }
        console.error("Could not start the backend: " + serverError.message);
    });
});
