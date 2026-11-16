const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify for async/await
const promisePool = pool.promise();

// Initialize database tables
const initDatabase = async () => {
    try {
        // Users table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                credits DECIMAL(10,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Configuration logs table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS config_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                router_type VARCHAR(20),
                router_ip VARCHAR(50),
                status VARCHAR(20),
                config_details JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Coupons table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                value DECIMAL(10,2) NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                used_by INT NULL,
                expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (used_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Payments table
        await promisePool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(10,2) NOT NULL,
                phone VARCHAR(20),
                merchant_request_id VARCHAR(100),
                checkout_request_id VARCHAR(100),
                status VARCHAR(20) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Database tables initialized');
    } catch (error) {
        console.error('❌ Database initialization error:', error);
    }
};

// Create a default admin user
const createDefaultUser = async () => {
    try {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const [rows] = await promisePool.query(
            'SELECT * FROM users WHERE username = ?',
            ['admin']
        );

        if (rows.length === 0) {
            await promisePool.query(
                'INSERT INTO users (username, password, email, credits) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'admin@telnetpilot.com', 100.00]
            );
            console.log('✅ Default admin user created (username: admin, password: admin123)');
        }
    } catch (error) {
        console.error('❌ Error creating default user:', error);
    }
};

module.exports = { pool: promisePool, initDatabase, createDefaultUser };

