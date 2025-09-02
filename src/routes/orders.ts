import express from 'express';
import { db } from '../database/setup';
import { ghanaUtils } from '../config/ghana';

const router = express.Router();

// Create order
router.post('/', async (req, res) => {
  try {
    const { 
      customer_email, 
      customer_phone, 
      customer_name, 
      items, 
      delivery_address, 
      delivery_region 
    } = req.body;
    
    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.unit_price * item.quantity;
    }
    
    const delivery_fee = ghanaUtils.getRegionByCode(delivery_region)?.deliveryFee || 5.00;
    const tax_amount = ghanaUtils.calculateTotalTax(subtotal);
    const total = subtotal + delivery_fee + tax_amount;
    
    // Generate order number
    const order_number = `GHB${Date.now()}`;
    
    // Create order
    const orderResult = await db.query(`
      INSERT INTO orders (
        order_number, customer_email, customer_phone, customer_name,
        subtotal, tax_amount, delivery_fee, total, delivery_address, delivery_region
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      order_number, customer_email, customer_phone, customer_name,
      subtotal, tax_amount, delivery_fee, total, 
      JSON.stringify(delivery_address), delivery_region
    ]);
    
    const order = orderResult.rows[0];
    
    // Add order items
    for (const item of items) {
      await db.query(`
        INSERT INTO order_items (
          order_id, product_id, vendor_id, product_name, 
          quantity, unit_price, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        order.id, item.product_id, item.vendor_id, item.product_name,
        item.quantity, item.unit_price, item.unit_price * item.quantity
      ]);
    }
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;