import express from 'express';
import { db } from '../database/setup';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category, vendor_id, search, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT p.*, v.business_name, v.region, v.rating
      FROM products p 
      JOIN vendors v ON p.vendor_id = v.id 
      WHERE p.status = 'published' AND v.is_verified = true
    `;
    const params: any[] = [];
    
    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }
    
    if (vendor_id) {
      params.push(vendor_id);
      query += ` AND p.vendor_id = $${params.length}`;
    }
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }
    
    params.push(limit, offset);
    query += ` ORDER BY p.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
    const result = await db.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get product details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, v.business_name, v.region, v.rating, v.business_phone
      FROM products p 
      JOIN vendors v ON p.vendor_id = v.id 
      WHERE p.id = $1 AND p.status = 'published' AND v.is_verified = true
    `, [req.params.id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;