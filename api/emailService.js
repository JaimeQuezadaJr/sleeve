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

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background-color: #1a1a1a; color: #000000; padding: 40px;">
      <h1 style="font-size: 24px; margin-bottom: 20px; color: #000000;">Order Confirmation</h1>
      
      <p style="margin-bottom: 10px; color: #000000;">Thank you for your order, ${name}!</p>
      
      <p style="margin-bottom: 20px; color: #000000;">Order ID: ${orderId}</p>
      
      <h2 style="color: #808080; font-size: 16px; margin-bottom: 20px;">Order Details:</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid #333; text-align: left;">
          <th style="padding: 10px 0; color: #000000;">Product</th>
          <th style="padding: 10px 0; color: #000000; text-align: center;">Quantity</th>
          <th style="padding: 10px 0; color: #000000; text-align: right;">Price</th>
          <th style="padding: 10px 0; color: #000000; text-align: right;">Subtotal</th>
        </tr>
        ${items.map(item => `
          <tr style="border-bottom: 1px solid #333;">
            <td style="padding: 10px 0; color: #000000;">${item.title}</td>
            <td style="padding: 10px 0; text-align: center; color: #000000;">${item.quantity}</td>
            <td style="padding: 10px 0; text-align: right; color: #000000;">$${parseFloat(item.price.replace('$', '')).toFixed(2)}</td>
            <td style="padding: 10px 0; text-align: right; color: #000000;">$${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
        <tr>
          <td colspan="3" style="padding: 20px 0; text-align: right; font-weight: bold; color: #000000;">Total:</td>
          <td style="padding: 20px 0; text-align: right; font-weight: bold; color: #000000;">$${total.toFixed(2)}</td>
        </tr>
      </table>
      
      <p style="margin-bottom: 30px; color: #000000;">We'll notify you when your order ships.</p>
      
      <p style="color: #808080; margin-bottom: 30px;">
        If you have any questions about your order, please contact our support team at 
        <a href="mailto:sleeve.support@gmail.com" style="color: white; text-decoration: none;">sleeve.support@gmail.com</a>
      </p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #808080;">
        <p>© 2024 SLEEVE. All rights reserved.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `SLEEVE - Order Confirmation #${orderId}`,
      html: htmlContent
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