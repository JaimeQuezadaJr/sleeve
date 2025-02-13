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
    <div style="background-color: #1a1a1a; color: #ffffff; padding: 30px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ffffff; margin-bottom: 30px;">Order Confirmation</h1>
      
      <p style="margin-bottom: 20px;">Thank you for your order, ${name}!</p>
      
      <p style="color: #808080; margin-bottom: 10px;">Order ID: ${orderId}</p>
      
      <div style="margin: 30px 0;">
        <h2 style="color: #808080; font-size: 16px; margin-bottom: 20px;">Order Details:</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #333;">
            <th style="text-align: left; padding: 10px 0; color: #ffffff;">Product</th>
            <th style="text-align: center; padding: 10px 0; color: #ffffff;">Quantity</th>
            <th style="text-align: right; padding: 10px 0; color: #ffffff;">Price</th>
            <th style="text-align: right; padding: 10px 0; color: #ffffff;">Subtotal</th>
          </tr>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #333;">
              <td style="padding: 10px 0; color: #ffffff;">${item.title}</td>
              <td style="text-align: center; padding: 10px 0; color: #ffffff;">${item.quantity}</td>
              <td style="text-align: right; padding: 10px 0; color: #ffffff;">$${parseFloat(item.price.replace('$', '')).toFixed(2)}</td>
              <td style="text-align: right; padding: 10px 0; color: #ffffff;">$${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="text-align: right; padding: 20px 0; color: #ffffff; font-weight: bold;">Total:</td>
            <td style="text-align: right; padding: 20px 0; color: #ffffff; font-weight: bold;">$${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #333;">
        <h2 style="color: #808080; font-size: 16px; margin-bottom: 10px;">Shipping Address:</h2>
        <p style="color: #ffffff; margin: 5px 0;">${name}</p>
        <p style="color: #ffffff; margin: 5px 0;">${orderDetails.shipping.address}</p>
        <p style="color: #ffffff; margin: 5px 0;">${orderDetails.shipping.city}, ${orderDetails.shipping.state} ${orderDetails.shipping.zipCode}</p>
        <p style="color: #ffffff; margin: 5px 0;">${orderDetails.shipping.country}</p>
      </div>
      
      <p style="color: #808080; margin-top: 30px;">If you have any questions about your order, please contact our support team at <a href="mailto:sleeve.support@gmail.com" style="color: #ffffff;">sleeve.support@gmail.com</a></p>
      
      <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #333; text-align: center; color: #808080;">
        <p>&copy; 2024 SLEEVE. All rights reserved.</p>
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