import React, { useState } from 'react';
import styled from 'styled-components';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutContainer = styled(motion.div)`
  min-height: 100vh;
  padding: 100px 20px 40px;
  max-width: 600px;
  margin: 0 auto;
`;

const CheckoutForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 400;
  margin-bottom: 10px;
`;

const InputGroup = styled.div`
  display: grid;
  grid-template-columns: ${props => props.half ? '1fr 1fr' : '1fr'};
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #666;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #000;
  }
`;

const CardContainer = styled.div`
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 15px;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-transform: uppercase;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #ff0000;
  font-size: 14px;
  margin-top: 10px;
`;

const SuccessOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SuccessIcon = styled(motion.div)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  
  svg {
    width: 30px;
    height: 30px;
    color: white;
  }
`;

const SuccessMessage = styled(motion.h2)`
  font-size: 24px;
  font-weight: 400;
  margin: 0;
`;

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const { cartTotal, cartItems, clearCart } = useCart();
  const [shippingDetails, setShippingDetails] = useState({
    email: '',
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setProcessing(true);
    console.log('Starting payment process...');

    if (!stripe || !elements) {
      console.log('Stripe not initialized');
      return;
    }

    try {
      console.log('Creating payment intent:', {
        amount: cartTotal * 100,
        items: cartItems,
        shipping: shippingDetails
      });

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          amount: cartTotal * 100,
          items: cartItems,
          shipping: shippingDetails
        })
      });

      const data = await response.json();
      console.log('Payment intent response:', data);

      if (data.error) {
        console.error('Server error:', data.error);
        setError(data.error.message);
      } else if (data.clientSecret) {
        console.log('Payment intent created:', data.clientSecret);
        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          data.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: shippingDetails.name,
                email: shippingDetails.email,
                address: {
                  line1: shippingDetails.address,
                  city: shippingDetails.city,
                  state: shippingDetails.state,
                  postal_code: shippingDetails.zipCode,
                  country: shippingDetails.country
                }
              }
            }
          }
        );

        if (stripeError) {
          console.error('Stripe error:', stripeError);
          setError(stripeError.message);
        } else if (paymentIntent.status === 'succeeded') {
          console.log('Payment successful:', paymentIntent);
          clearCart();
          setSuccess(true);
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred while processing your payment.');
    }

    setProcessing(false);
  };

  return (
    <>
      <CheckoutForm onSubmit={handleSubmit}>
        <Section>
          <SectionTitle>Shipping Information</SectionTitle>
          <InputGroup>
            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={shippingDetails.email}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Full Name</Label>
              <Input
                type="text"
                name="name"
                value={shippingDetails.name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </InputGroup>
          <FormGroup>
            <Label>Address</Label>
            <Input
              type="text"
              name="address"
              value={shippingDetails.address}
              onChange={handleInputChange}
              required
            />
          </FormGroup>
          <InputGroup half>
            <FormGroup>
              <Label>City</Label>
              <Input
                type="text"
                name="city"
                value={shippingDetails.city}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>State</Label>
              <Input
                type="text"
                name="state"
                value={shippingDetails.state}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </InputGroup>
          <InputGroup half>
            <FormGroup>
              <Label>ZIP Code</Label>
              <Input
                type="text"
                name="zipCode"
                value={shippingDetails.zipCode}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Country</Label>
              <Input
                type="text"
                name="country"
                value={shippingDetails.country}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
          </InputGroup>
        </Section>

        <Section>
          <SectionTitle>Payment Information</SectionTitle>
          <CardContainer>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </CardContainer>
        </Section>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay $${cartTotal}`}
        </Button>
      </CheckoutForm>

      <AnimatePresence>
        {success && (
          <SuccessOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <SuccessIcon
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: 0.2
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </SuccessIcon>
            <SuccessMessage
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Payment Successful
            </SuccessMessage>
          </SuccessOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PaymentForm />
      </CheckoutContainer>
    </Elements>
  );
};

export default Checkout; 