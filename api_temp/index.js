const express = require('express');
const bodyParser = require('body-parser');
const { Safepay } = require('@sfpy/node-sdk');
const serverless = require('serverless-http');

const app = express();
app.use(bodyParser.json());

// Safepay credentials (use env vars on Vercel)
const safepay = new Safepay({
  environment: 'sandbox',
  apiKey: process.env.SAFEPAY_API_KEY,
  v1Secret: process.env.SAFEPAY_V1_SECRET,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});

// 🔗 Create payment session + checkout URL
app.post('/create-payment', async (req, res) => {
  const { amount, currency, orderId } = req.body;

  try {
    const session = await safepay.payments.create({ amount, currency });

    const checkoutUrl = safepay.checkout.create({
      token: session.token,
      orderId,
      redirectUrl: 'https://www.bigbrainss.com',
      cancelUrl: 'https://www.google.com',
      webhooks: true
    });

    res.json({ checkoutUrl, orderId });
  } catch (err) {
    console.error('❌ Payment session error:', err);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// 📬 Webhook to capture Safepay status updates
app.post('/webhook', async (req, res) => {
  try {
    const { event, data } = req.body;
    console.log(`📦 Webhook event: ${event}`);
    console.log(data);

    if (event === 'payment_intent.succeeded') {
      console.log(`✅ Payment for order ${data.order_id} succeeded`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.sendStatus(500);
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('🟢 Safepay backend is running on Vercel!');
});

module.exports = serverless(app);
