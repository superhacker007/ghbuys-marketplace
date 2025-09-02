import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/setup';
import { ghanaConfig, ghanaUtils } from '../config/ghana';

const router = express.Router();

// Get all verified vendors
router.get('/', async (req, res) => {
  try {
    const { region, category, limit = 20, offset = 0 } = req.query;
    
    let query = `
      SELECT v.*, u.first_name, u.last_name, u.email 
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      WHERE v.is_verified = true AND v.is_active = true
    `;
    const params: any[] = [];
    
    if (region) {
      params.push(region);
      query += ` AND v.region = $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND v.primary_category = $${params.length}`;
    }
    
    params.push(limit, offset);
    query += ` ORDER BY v.rating DESC, v.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
    
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

// Register as vendor
router.post('/register', [
  body('business_name').notEmpty().withMessage('Business name is required'),
  body('business_email').isEmail().withMessage('Valid email is required'),
  body('business_phone').custom(value => ghanaUtils.isValidPhoneNumber(value)).withMessage('Valid Ghana phone number required'),
  body('region').isIn(ghanaConfig.regions.map(r => r.name)).withMessage('Valid Ghana region required'),
  body('primary_category').isIn(ghanaConfig.categories.map(c => c.id)).withMessage('Valid category required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const vendorData = req.body;
    
    // Create vendor
    const result = await db.query(`
      INSERT INTO vendors (
        user_id, business_name, business_description, business_phone, business_email,
        region, city, address, primary_category, ghana_business_registration,
        bank_name, account_number, account_name, mobile_money_number, mobile_money_provider
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      vendorData.user_id,
      vendorData.business_name,
      vendorData.business_description,
      vendorData.business_phone,
      vendorData.business_email,
      vendorData.region,
      vendorData.city,
      vendorData.address,
      vendorData.primary_category,
      vendorData.ghana_business_registration,
      vendorData.bank_name,
      vendorData.account_number,
      vendorData.account_name,
      vendorData.mobile_money_number,
      vendorData.mobile_money_provider
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted. Awaiting approval.',
      vendor: result.rows[0]
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get vendor details
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, u.first_name, u.last_name, u.email,
             COUNT(p.id) as product_count
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      LEFT JOIN products p ON v.id = p.vendor_id AND p.status = 'published'
      WHERE v.id = $1 AND v.is_verified = true
      GROUP BY v.id, u.id
    `, [req.params.id]);
    
    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
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