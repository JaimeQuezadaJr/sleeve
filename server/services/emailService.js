const nodemailer = require('nodemailer');

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Use an app-specific password
  }
});

const sendOrderConfirmation = async (to, orderDetails) => {
  try {
    await transporter.sendMail({
      from: `"SLEEVE" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'SLEEVE - Order Confirmation',
      html: orderDetails
    });
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

module.exports = { sendOrderConfirmation }; 