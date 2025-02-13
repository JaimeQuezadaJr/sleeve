const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function sendOrderConfirmation(orderDetails) {
  const { email, name, orderId, items, total } = orderDetails;

  const emailContent = `
    SLEEVE - Order Confirmation
    ----------------------------------------

    Thank you for your order, ${name}!

    Order ID: ${orderId}

    Order Details:
    ----------------------------------------
    Product                  Quantity    Price      Subtotal
    ----------------------------------------
    ${items.map(item => 
      `${item.title.padEnd(25)} ${String(item.quantity).padStart(3)}     $${parseFloat(item.price.replace('$', '')).toFixed(2).padStart(8)}   $${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2).padStart(8)}`
    ).join('\n')}
    ----------------------------------------
    ${' '.repeat(37)}Total: $${total.toFixed(2).padStart(8)}

    We'll notify you when your order ships.
    
    If you have any questions about your order, please contact our support team at sleeve.support@gmail.com

    ----------------------------------------
    © 2024 SLEEVE. All rights reserved.
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `SLEEVE - Order Confirmation #${orderId}`,
      text: emailContent
    });
    
    console.log('Order confirmation email sent to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}

module.exports = {
  transporter,
  sendOrderConfirmation
}; 