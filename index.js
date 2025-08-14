const express = require('express');
const bodyParser = require('body-parser');
const { Safepay } = require('@sfpy/node-sdk');

const app = express();
app.use(bodyParser.json());

// Safepay credentials (sandbox keys)
const safepay = new Safepay({
  environment: 'sandbox', // Change to 'production' for live
  apiKey: 'sec_fadab700-5fdb-4ba5-98d1-6121fae02d75',
  v1Secret: '1d41c1b08aeed7bad5309988298cfee8b25e3c23dbdbd7bcd86018b7ddcd9782',
  webhookSecret: 'ad06759276342997d734dad33785389ceb5df5dd37f42b854b77c8abd20fb801',
});

// 🔗 Create payment session + checkout URL
app.post('/create-payment', async (req, res) => {
  const { amount, currency, orderId } = req.body;

  try {
    const session = await safepay.payments.create({ amount, currency });

    console.log('✅ Payment session created:', session);

    const checkoutUrl = safepay.checkout.create({
      token: session.token,
      orderId,
      redirectUrl: 'https://www.bigbrainss.com', // Replace with your actual frontend success page
      cancelUrl: 'https://www.google.com',     // Replace with your actual frontend cancel page
      webhooks: true
    });

    console.log('🔗 Checkout URL:', checkoutUrl);

    res.json({ checkoutUrl, orderId });
  } catch (err) {
    console.error('❌ Payment session error:', err);
    res.status(500).json({ error: 'Failed to create payment session' });
  }
});

// 📬 Webhook to capture Safepay status updates
app.post('/webhook', async (req, res) => {
  try {
    // To verify signatures in production, enable the line below
    // const verified = await safepay.verify.webhook(req);
    // if (!verified) return res.status(400).send('Invalid webhook signature');

    const { event, data } = req.body;
    console.log(`📦 Webhook event: ${event}`);
    console.log(data);

    if (event === 'payment_intent.succeeded') {
      console.log(`✅ Payment for order ${data.order_id} succeeded`);
      // Update your database here if needed
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.sendStatus(500);
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('🟢 Safepay backend is running!');
});

// Global error logging
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection:', reason);
});

// Start server
app.listen(8000, () => {
  console.log('🚀 Server running on http://localhost:8000');
});
