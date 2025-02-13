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
    Order Confirmation

    Thank you for your order, ${name}!

    Order ID: ${orderId}

    Order Details:
    ${items.map(item => 
      `${item.title}
       Quantity: ${item.quantity}
       Price: $${parseFloat(item.price.replace('$', '')).toFixed(2)}
       Subtotal: $${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}`
    ).join('\n\n')}

    Total: $${total.toFixed(2)}

    Questions? Contact us at sleeve.support@gmail.com

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