const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

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

// Get current credits
router.get('/balance', authenticate, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT credits FROM users WHERE id = ?',
            [req.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ credits: users[0].credits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Redeem coupon
router.post('/redeem', authenticate, async (req, res) => {
    try {
        const { code } = req.body;

        // Check if coupon exists and is valid
        const [coupons] = await pool.query(
            `SELECT * FROM coupons 
             WHERE code = ? AND is_used = FALSE 
             AND (expires_at IS NULL OR expires_at > NOW())`,
            [code.toUpperCase()]
        );

        if (coupons.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired coupon' });
        }

        const coupon = coupons[0];

        // Update coupon as used
        await pool.query(
            'UPDATE coupons SET is_used = TRUE, used_by = ? WHERE id = ?',
            [req.userId, coupon.id]
        );

        // Add credits to user
        await pool.query(
            'UPDATE users SET credits = credits + ? WHERE id = ?',
            [coupon.value, req.userId]
        );

        // Get updated credits
        const [users] = await pool.query(
            'SELECT credits FROM users WHERE id = ?',
            [req.userId]
        );

        res.json({
            success: true,
            message: `Coupon redeemed! Added ${coupon.value} credits.`,
            credits: users[0].credits
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate coupon (admin only - you can add admin check)
router.post('/generate', authenticate, async (req, res) => {
    try {
        const { value, expiresInDays } = req.body;

        // Generate random coupon code
        const code = 'CPN-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const expiresAt = expiresInDays
            ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
            : null;

        await pool.query(
            'INSERT INTO coupons (code, value, expires_at) VALUES (?, ?, ?)',
            [code, value, expiresAt]
        );

        res.json({
            success: true,
            code,
            value,
            expiresAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;


