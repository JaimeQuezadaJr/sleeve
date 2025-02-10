import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const PageContainer = styled(motion.div)`
  min-height: 100vh;
  padding: 100px 20px 40px;
  max-width: 1200px;
  margin: 0 auto;

  @media (min-width: 768px) {
    padding: 100px 50px 40px;
  }
`;

const CartHeader = styled.h2`
  font-size: 14px;
  font-weight: 400;
  margin-bottom: 40px;
  text-transform: uppercase;
`;

const CartItems = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CartItem = styled(motion.div)`
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
  
  @media (min-width: 768px) {
    grid-template-columns: 150px 1fr auto;
  }
`;

const ItemImage = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  background-color: #f5f5f5;
`;

const ItemImageLink = styled(Link)`
  display: block;
  width: 100%;
  height: 100%;
  
  &:hover {
    opacity: 0.9;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ItemTitle = styled.h3`
  font-size: 14px;
  font-weight: 400;
`;

const ItemPrice = styled.p`
  font-size: 14px;
`;

const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const QuantityButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 16px;
  color: #000;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Quantity = styled.span`
  font-size: 14px;
  min-width: 20px;
  text-align: center;
`;

const CartFooter = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f5f5f5;
`;

const Total = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 20px;
`;

const CheckoutButton = styled(motion.button)`
  width: 100%;
  padding: 15px;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  text-transform: uppercase;
  
  @media (min-width: 768px) {
    width: auto;
    padding: 15px 40px;
    float: right;
  }
`;

const EmptyCart = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 14px;
  color: #999;
`;

const CartContent = styled(motion.div)`
  width: 100%;
`;

const Cart = () => {
  const { cartItems, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleCheckout = () => {
    setIsExiting(true);
    setTimeout(() => {
      navigate('/checkout');
    }, 300);
  };

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {cartItems.length === 0 ? (
          <CartContent
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyCart>No Items</EmptyCart>
          </CartContent>
        ) : (
          <CartContent
            key="items"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CartHeader>Cart ({cartItems.length})</CartHeader>
            <CartItems layout>
              <AnimatePresence>
                {cartItems.map((item) => (
                  <CartItem
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ 
                      opacity: 0, 
                      x: -20,
                      transition: { duration: 0.3 }
                    }}
                    transition={{
                      layout: { duration: 0.3 },
                      opacity: { duration: 0.3 }
                    }}
                  >
                    <ItemImageLink to={`/product/${item.id}`}>
                      <ItemImage src={item.image} alt={item.title} />
                    </ItemImageLink>
                    <ItemInfo>
                      <ItemTitle>{item.title}</ItemTitle>
                      <ItemPrice>{item.price}</ItemPrice>
                    </ItemInfo>
                    <QuantityControl>
                      <QuantityButton 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </QuantityButton>
                      <Quantity>{item.quantity}</Quantity>
                      <QuantityButton 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </QuantityButton>
                    </QuantityControl>
                  </CartItem>
                ))}
              </AnimatePresence>
            </CartItems>
            <CartFooter>
              <Total>
                <span>Total</span>
                <span>${cartTotal}</span>
              </Total>
              <CheckoutButton
                onClick={handleCheckout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isExiting}
              >
                Continue
              </CheckoutButton>
            </CartFooter>
          </CartContent>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default Cart; 