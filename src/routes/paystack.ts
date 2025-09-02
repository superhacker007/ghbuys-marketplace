import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { db } from '../database/setup';
import { ghanaConfig, ghanaUtils } from '../config/ghana';

const router = express.Router();

// Paystack API configuration
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';
const PAYSTACK_PUBLIC = process.env.PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json'
  }
});

// Initialize payment
router.post('/initialize', async (req, res) => {
  try {
    const { email, amount, currency = 'GHS', order_id, customer_name, phone, payment_method } = req.body;

    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Email and amount are required'
      });
    }

    // Convert amount to kobo (Paystack uses kobo for GHS)
    const amountInKobo = Math.round(amount * 100);
    
    const reference = `ghbuys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine channels based on payment method
    let channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money'];
    if (payment_method === 'mobile_money') {
      channels = ['mobile_money'];
    } else if (payment_method === 'card') {
      channels = ['card'];
    }

    const paymentData = {
      email,
      amount: amountInKobo,
      currency,
      reference,
      channels,
      metadata: {
        order_id,
        customer_name,
        phone,
        marketplace: 'ghbuys',
        country: 'Ghana'
      }
    };

    // Initialize payment with Paystack
    const response = await paystackAPI.post('/transaction/initialize', paymentData);

    if (response.data.status) {
      // Save payment record
      await db.query(`
        INSERT INTO payments (paystack_reference, amount, currency, payment_method, status, gateway_response)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        reference,
        amount,
        currency,
        payment_method || 'card',
        'pending',
        JSON.stringify(response.data.data)
      ]);

      res.json({
        success: true,
        data: {
          reference,
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          amount: amount,
          currency,
          channels
        }
      });
    } else {
      throw new Error(response.data.message || 'Payment initialization failed');
    }

  } catch (error: any) {
    console.error('Payment initialization error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Payment initialization failed'
    });
  }
});

// Initialize Mobile Money payment
router.post('/mobile-money', async (req, res) => {
  try {
    const { email, amount, phone, provider, currency = 'GHS', order_id, customer_name } = req.body;

    // Validate required fields
    if (!email || !amount || !phone || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Email, amount, phone, and provider are required'
      });
    }

    // Validate phone number
    if (!ghanaUtils.isValidPhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ghana phone number format'
      });
    }

    // Validate provider
    const providerInfo = ghanaUtils.getMobileMoneyProvider(provider);
    if (!providerInfo) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile money provider. Use: mtn, vodafone, or airtel_tigo'
      });
    }

    const amountInKobo = Math.round(amount * 100);
    const reference = `ghbuys_momo_${Date.now()}_${provider}`;

    // Initialize Mobile Money charge
    const chargeData = {
      email,
      amount: amountInKobo,
      currency,
      reference,
      mobile_money: {
        phone: phone.startsWith('+233') ? phone : `+233${phone.replace(/^0/, '')}`,
        provider: provider
      },
      metadata: {
        order_id,
        customer_name,
        payment_type: 'mobile_money',
        provider: provider,
        marketplace: 'ghbuys'
      }
    };

    const response = await paystackAPI.post('/charge', chargeData);

    // Save payment record
    await db.query(`
      INSERT INTO payments (paystack_reference, amount, currency, payment_method, payment_provider, status, gateway_response)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      reference,
      amount,
      currency,
      'mobile_money',
      provider,
      'pending',
      JSON.stringify(response.data.data)
    ]);

    res.json({
      success: true,
      data: {
        reference,
        status: response.data.data.status,
        display_text: response.data.data.display_text || `Complete payment on your ${providerInfo.name} wallet`,
        provider: provider,
        provider_name: providerInfo.name,
        instructions: generateMobileMoneyInstructions(provider, providerInfo),
        amount: ghanaUtils.formatCurrency(amount)
      }
    });

  } catch (error: any) {
    console.error('Mobile Money payment error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Mobile Money payment failed'
    });
  }
});

// Verify payment
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify with Paystack
    const response = await paystackAPI.get(`/transaction/verify/${reference}`);

    if (response.data.status) {
      const transaction = response.data.data;

      // Update payment record
      await db.query(`
        UPDATE payments 
        SET status = $1, paystack_transaction_id = $2, gateway_response = $3, updated_at = CURRENT_TIMESTAMP
        WHERE paystack_reference = $4
      `, [
        transaction.status === 'success' ? 'successful' : 'failed',
        transaction.id,
        JSON.stringify(transaction),
        reference
      ]);

      res.json({
        success: true,
        data: {
          reference: transaction.reference,
          status: transaction.status,
          amount: transaction.amount / 100, // Convert from kobo
          currency: transaction.currency,
          paid_at: transaction.paid_at,
          channel: transaction.channel,
          customer: transaction.customer
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Transaction verification failed'
      });
    }

  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Payment verification failed'
    });
  }
});

// Webhook endpoint for Paystack
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'] as string;
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || 'placeholder')
      .update(body)
      .digest('hex');

    if (!signature || signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    console.log(`📧 Paystack webhook: ${event.event} - ${event.data.reference}`);

    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;
      case 'charge.failed':
        await handleChargeFailed(event.data);
        break;
      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

// Get payment history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0, status } = req.query;

    let query = `
      SELECT p.*, o.order_number, o.customer_name, o.customer_email
      FROM payments p
      LEFT JOIN orders o ON o.id = p.order_id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE p.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      total: result.rowCount,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error: any) {
    console.error('Payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment history'
    });
  }
});

// Get Mobile Money providers
router.get('/mobile-money/providers', (req, res) => {
  res.json({
    success: true,
    data: ghanaConfig.mobileMoneyProviders.map(provider => ({
      code: provider.code,
      name: provider.name,
      shortCode: provider.shortCode,
      color: provider.color,
      active: provider.active
    }))
  });
});

// Helper functions
async function handleChargeSuccess(data: any) {
  try {
    await db.query(`
      UPDATE payments 
      SET status = 'successful', paystack_transaction_id = $1, gateway_response = $2, updated_at = CURRENT_TIMESTAMP
      WHERE paystack_reference = $3
    `, [data.id, JSON.stringify(data), data.reference]);

    // Update associated order if exists
    await db.query(`
      UPDATE orders 
      SET payment_status = 'paid', status = 'confirmed', updated_at = CURRENT_TIMESTAMP
      FROM payments p
      WHERE orders.id = p.order_id AND p.paystack_reference = $1
    `, [data.reference]);

    console.log(`✅ Payment successful: ${data.reference} - ${data.currency} ${data.amount / 100}`);
  } catch (error) {
    console.error('Error handling charge success:', error);
  }
}

async function handleChargeFailed(data: any) {
  try {
    await db.query(`
      UPDATE payments 
      SET status = 'failed', gateway_response = $1, updated_at = CURRENT_TIMESTAMP
      WHERE paystack_reference = $2
    `, [JSON.stringify(data), data.reference]);

    // Update associated order if exists
    await db.query(`
      UPDATE orders 
      SET payment_status = 'failed', updated_at = CURRENT_TIMESTAMP
      FROM payments p
      WHERE orders.id = p.order_id AND p.paystack_reference = $1
    `, [data.reference]);

    console.log(`❌ Payment failed: ${data.reference} - ${data.gateway_response}`);
  } catch (error) {
    console.error('Error handling charge failure:', error);
  }
}

async function handleTransferSuccess(data: any) {
  console.log(`💸 Transfer successful: ${data.reference}`);
  // Handle vendor payouts here
}

function generateMobileMoneyInstructions(provider: string, providerInfo: any): string {
  const instructions = {
    mtn: `1. Dial ${providerInfo.shortCode} on your MTN line\n2. Select option 1 (Send Money)\n3. Enter Merchant Code when prompted\n4. Enter the amount\n5. Enter your PIN to complete`,
    vodafone: `1. Dial ${providerInfo.shortCode} on your Vodafone line\n2. Select option 1 (Transfer Money)\n3. Select option 3 (To Business)\n4. Enter Merchant Code\n5. Enter amount and PIN`,
    airtel_tigo: `1. Dial ${providerInfo.shortCode} on your AirtelTigo line\n2. Select option 3 (Payments)\n3. Select option 1 (Pay Merchant)\n4. Enter Merchant Code\n5. Enter amount and PIN`
  };

  return instructions[provider as keyof typeof instructions] || 'Follow the prompts on your mobile money app';
}

export default router;