const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { configureHuawei, configureNokia } = require('../utils/routerCommands');

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// ============================================
// CONFIGURE HUAWEI ROUTER
// ============================================
router.post('/huawei', authenticate, async (req, res) => {
    try {
        const {
            ip,
            password,
            ssid24,
            ssid5,
            configType = 'dual',
            multiSSIDs = []
        } = req.body;

        // ✅ CREDIT CHECK DISABLED - Testing mode
        console.log('🔓 Payment check disabled for Huawei configuration');

        // Verify user exists (but don't check credits)
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Execute Telnet configuration
        const result = await configureHuawei({
            ip,
            password,
            ssid24,
            ssid5,
            configType,
            multiSSIDs
        });

        if (result.success) {
            // ✅ No credit deduction

            // Log configuration
            await pool.query(
                `INSERT INTO config_logs (user_id, router_type, router_ip, status, config_details) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.userId, 'Huawei', ip, 'success', JSON.stringify(req.body)]
            );

            res.json({
                success: true,
                message: result.message || 'Huawei router configured successfully!',
                response: result.response || null
            });
        } else {
            // Log failure
            await pool.query(
                `INSERT INTO config_logs (user_id, router_type, router_ip, status, config_details) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.userId, 'Huawei', ip, 'failed', JSON.stringify({ error: result.error })]
            );

            res.status(500).json({
                success: false,
                error: result.error || 'Configuration failed'
            });
        }
    } catch (error) {
        console.error('Huawei route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// CONFIGURE NOKIA ROUTER
// ============================================
router.post('/nokia', authenticate, async (req, res) => {
    try {
        const {
            ip,
            username,
            password,
            ssid24,
            ssid5
        } = req.body;

        // ✅ CREDIT CHECK DISABLED - Testing mode
        console.log('🔓 Payment check disabled for Nokia configuration');

        // Verify user exists (but don't check credits)
        const [users] = await pool.query(
            'SELECT id FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Execute Telnet configuration
        const result = await configureNokia({
            ip,
            username,
            password,
            ssid24,
            ssid5
        });

        if (result.success) {
            // ✅ No credit deduction

            // Log configuration
            await pool.query(
                `INSERT INTO config_logs (user_id, router_type, router_ip, status, config_details) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.userId, 'Nokia', ip, 'success', JSON.stringify(req.body)]
            );

            res.json({
                success: true,
                message: result.message || 'Nokia router configured successfully!',
                response: result.response || null
            });
        } else {
            // Log failure
            await pool.query(
                `INSERT INTO config_logs (user_id, router_type, router_ip, status, config_details) 
                 VALUES (?, ?, ?, ?, ?)`,
                [req.userId, 'Nokia', ip, 'failed', JSON.stringify({ error: result.error })]
            );

            res.status(500).json({
                success: false,
                error: result.error || 'Configuration failed'
            });
        }
    } catch (error) {
        console.error('Nokia route error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// GET CONFIGURATION LOGS
// ============================================
router.get('/logs', authenticate, async (req, res) => {
    try {
        const [logs] = await pool.query(
            `SELECT * FROM config_logs WHERE user_id = ? 
             ORDER BY created_at DESC LIMIT 50`,
            [req.userId]
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


