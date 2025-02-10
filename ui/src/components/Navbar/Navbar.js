import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #FFFFFF;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  
  @media (min-width: 768px) {
    padding: 0 50px;
  }
`;

const Logo = styled(Link)`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  white-space: nowrap;
  
  @media (min-width: 768px) {
    font-size: 24px;
  }
`;

const CartIcon = styled(motion.div)`
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px;
  
  svg {
    width: 18px;
    height: 18px;
    
    @media (min-width: 768px) {
      width: 20px;
      height: 20px;
    }
  }
`;

const CartIconWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const CartCount = styled(motion.span)`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #000;
  color: #fff;
  font-size: 11px;
  height: 16px;
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
`;

const MenuIcon = styled(motion.div)`
  cursor: pointer;
  padding: 8px;
  margin-right: 20px;
  
  svg {
    width: 18px;
    height: 18px;
    
    @media (min-width: 768px) {
      width: 20px;
      height: 20px;
    }
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
`;

const MenuOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  z-index: 999;
`;

const MenuDropdown = styled(motion.div)`
  position: fixed;
  top: 60px;
  right: 0;
  background: white;
  width: 200px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  padding: 20px;
  z-index: 1000;
`;

const MenuItem = styled(motion.div)`
  padding: 10px 0;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartItems } = useCart();
  const menuRef = useRef();
  const menuButtonRef = useRef();
  
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !menuButtonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const menuVariants = {
    hidden: { 
      opacity: 0,
      y: -20
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <Nav>
      <Logo to="/">SLEEVE</Logo>
      <RightSection>
        <MenuIcon 
          ref={menuButtonRef}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.1 }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </MenuIcon>
        <Link to="/cart">
          <CartIconWrapper>
            <CartIcon whileHover={{ scale: 1.1 }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </CartIcon>
            <AnimatePresence>
              {cartItemCount > 0 && (
                <CartCount
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  {cartItemCount}
                </CartCount>
              )}
            </AnimatePresence>
          </CartIconWrapper>
        </Link>
      </RightSection>
      
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <MenuOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <MenuDropdown
              ref={menuRef}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={menuVariants}
            >
              <MenuItem whileHover={{ x: 10 }}>
                <Link to="/about">ABOUT</Link>
              </MenuItem>
              <MenuItem whileHover={{ x: 10 }}>
                <Link to="/support">SUPPORT</Link>
              </MenuItem>
            </MenuDropdown>
          </>
        )}
      </AnimatePresence>
    </Nav>
  );
};

export default Navbar; 