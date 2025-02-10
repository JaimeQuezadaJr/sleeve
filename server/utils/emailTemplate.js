const createOrderConfirmationEmail = (order, items, shipping) => {
  // Format price to remove $ and convert to number if needed
  const formatPrice = (price) => {
    if (typeof price === 'string') {
      return parseFloat(price.replace('$', ''));
    }
    return price;
  };

  const itemsList = items.map(item => {
    const price = formatPrice(item.price);
    const subtotal = price * item.quantity;
    
    return `<tr>
      <td style="padding: 10px;">${item.title}</td>
      <td style="padding: 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; text-align: right;">$${price.toFixed(2)}</td>
      <td style="padding: 10px; text-align: right;">$${subtotal.toFixed(2)}</td>
    </tr>`;
  }).join('');

  const total = items.reduce((sum, item) => {
    const price = formatPrice(item.price);
    return sum + (price * item.quantity);
  }, 0);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Confirmation</h2>
      <p>Thank you for your order, ${shipping.name}!</p>
      <p>Order ID: ${order.id}</p>
      
      <h3 style="color: #666;">Order Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Quantity</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsList}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8f8f8;">
            <td colspan="3" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 10px; text-align: right;"><strong>$${total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>
      
      <div style="margin-top: 20px; padding: 20px; background-color: #f8f8f8;">
        <h3 style="color: #666;">Shipping Address:</h3>
        <p style="margin: 5px 0;">${shipping.name}</p>
        <p style="margin: 5px 0;">${shipping.address}</p>
        <p style="margin: 5px 0;">${shipping.city}, ${shipping.state} ${shipping.zipCode}</p>
        <p style="margin: 5px 0;">${shipping.country}</p>
      </div>
      
      <p style="margin-top: 20px; color: #666;">
        If you have any questions about your order, please contact our support team at 
        <a href="mailto:sleeve.support@gmail.com" style="color: #000; text-decoration: underline;">
          sleeve.support@gmail.com
        </a>
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>© 2024 SLEEVE. All rights reserved.</p>
      </div>
    </div>
  `;
};

module.exports = { createOrderConfirmationEmail }; 