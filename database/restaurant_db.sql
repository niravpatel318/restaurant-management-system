CREATE DATABASE IF NOT EXISTS restaurant_db;
USE restaurant_db;

DROP TABLE IF EXISTS foods;

CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(30) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 0
);

INSERT INTO foods (name, price, category, description, quantity) VALUES
('Paneer Pizza', 180.00, 'Veg', 'Cheesy paneer pizza', 10),
('Veg Burger', 120.00, 'Veg', 'Fresh vegetable burger', 15),
('Masala Dosa', 90.00, 'Veg', 'Crispy dosa with masala', 12),
('Chicken Burger', 160.00, 'Non-Veg', 'Chicken burger with fresh vegetables', 10),
('Chicken Pizza', 220.00, 'Non-Veg', 'Chicken pizza with cheese', 8),
('Cold Drink', 50.00, 'Drinks', 'Chilled soft drink', 20),
('Fresh Lime', 60.00, 'Drinks', 'Fresh lime drink', 15);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    table_number VARCHAR(20) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_orders_created_at (created_at),
    INDEX idx_orders_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NULL,
    item_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_items_order_id (order_id)
) ENGINE=InnoDB;
