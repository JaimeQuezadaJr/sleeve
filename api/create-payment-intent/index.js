const { createClient } = require('@libsql/client');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');

// ... rest of the code ...

// Export the handler function
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    // ... rest of the code ...
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}; 