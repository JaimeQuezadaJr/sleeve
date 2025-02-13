import { sendOrderConfirmation } from './emailService';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const orderDetails = req.body;
      await sendOrderConfirmation(orderDetails);
      res.status(200).json({ message: 'Confirmation email sent' });
    } catch (error) {
      console.error('Error sending confirmation:', error);
      res.status(500).json({ error: 'Failed to send confirmation email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 