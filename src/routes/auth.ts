import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/setup';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role = 'customer' } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role`,
      [email, hashedPassword, first_name, last_name, phone, role]
    );
    
    const token = jwt.sign({ userId: result.rows[0].id }, process.env.JWT_SECRET || 'secret');
    
    res.status(201).json({
      success: true,
      token,
      user: result.rows[0]
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');
    
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;