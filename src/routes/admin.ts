import express from 'express';
import { db } from '../database/setup';

const router = express.Router();

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [vendors, products, orders, payments] = await Promise.all([
      db.query('SELECT COUNT(*) FROM vendors WHERE is_verified = true'),
      db.query('SELECT COUNT(*) FROM products WHERE status = \'published\''),
      db.query('SELECT COUNT(*) FROM orders'),
      db.query('SELECT SUM(amount) FROM payments WHERE status = \'successful\'')
    ]);
    
    res.json({
      success: true,
      data: {
        total_vendors: vendors.rows[0].count,
        total_products: products.rows[0].count,
        total_orders: orders.rows[0].count,
        total_revenue: payments.rows[0].sum || 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get pending vendors
router.get('/vendors/pending', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.first_name, u.last_name, u.email
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.verification_status = 'pending'
      ORDER BY v.created_at ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Approve/reject vendor
router.post('/vendors/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'
    
    await db.query(`
      UPDATE vendors 
      SET verification_status = $1, is_verified = $2, is_active = $2
      WHERE id = $3
    `, [status, status === 'approved', id]);
    
    res.json({
      success: true,
      message: `Vendor ${status} successfully`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;