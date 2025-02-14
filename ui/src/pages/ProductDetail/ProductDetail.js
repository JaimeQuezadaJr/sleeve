import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { products } from '../../data/products';  // Keep using static data
import { useCart } from '../../context/CartContext';

const ProductContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px 20px;
`;

const ProductCard = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  aspect-ratio: 1;
  background-color: #f5f5f5;
  cursor: default;
  
  @media (min-width: 768px) {
    width: 90%;
    max-width: 600px; // Smaller on tablets
  }
  
  @media (min-width: 1024px) {
    width: 80%;
    max-width: 500px; // Even smaller on laptops
  }
  
  @media (min-width: 1440px) {
    width: 70%;
    max-width: 600px; // Slightly larger on very large screens
  }
`;

const CardSide = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const IconButton = styled(motion.button)`
  position: absolute;
  top: 20px;
  right: 20px;
  left: auto;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 2;
  padding: 8px;
  color: #000;
  
  svg {
    width: 20px;
    height: 20px;
    transform: ${props => props.isBack ? 'rotate(180deg)' : 'none'};
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  color: #000;
  max-width: calc(100% - 80px);
  
  @media (max-width: 768px) {
    bottom: 15px;
    left: 15px;
  }
`;

const ProductTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 6px;
  }
`;

const ProductPrice = styled.p`
  font-size: 16px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const AddToCartButton = styled(motion.button)`
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  
  svg {
    width: 24px;
    height: 24px;
    color: #000;
    stroke: currentColor;
  }
`;

const SuccessIcon = styled(motion.div)`
  position: absolute;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BackContent = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  padding: 40px 20px 30px;
  overflow: hidden;
  position: relative;
`;

const ScrollContainer = styled.div`
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
  max-height: 100%;
  overflow-y: auto;
  
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 480px) {
    gap: 0.7rem;
    padding-right: 25px;
  }
`;

const Section = styled.div`
  min-height: fit-content;
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.3rem;
  color: #333;
  
  @media (max-width: 480px) {
    font-size: 0.8rem;
    margin-bottom: 0.2rem;
  }
`;

const Overview = styled.p`
  font-size: 0.8rem;
  line-height: 1.4;
  color: #444;
  
  @media (max-width: 480px) {
    font-size: 0.7rem;
    line-height: 1.3;
  }
`;

const HighlightsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    margin-bottom: 0.3rem;
    padding-left: 1.2rem;
    position: relative;
    font-size: 0.8rem;
    
    @media (max-width: 480px) {
      font-size: 0.7rem;
      margin-bottom: 0.2rem;
      padding-left: 1rem;
    }

    &:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #666;
    }
  }
`;

const TechSpecsGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem;
  font-size: 0.8rem;
  
  @media (max-width: 480px) {
    font-size: 0.7rem;
    gap: 0.2rem;
  }
  
  dt {
    font-weight: 500;
    color: #666;
  }
  
  dd {
    margin: 0;
  }
`;

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();
  
  const product = products.find(p => p.id === parseInt(id));

  if (!product) {
    navigate('/');
    return null;
  }

  const handleAddToCart = () => {
    try {
      addToCart(product);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 1500);
    } catch (error) {
      // Handle error silently
    }
  };

  return (
    <ProductContainer>
      <ProductCard>
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <CardSide
              key="front"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <ProductImage src={product.image} alt={product.title} />
              <ProductInfo>
                <ProductTitle>{product.title}</ProductTitle>
                <ProductPrice>{product.price}</ProductPrice>
              </ProductInfo>
              <IconButton
                onClick={() => setIsFlipped(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="8" />
                </svg>
              </IconButton>
              <AddToCartButton
                onClick={handleAddToCart}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {!isAdded ? (
                    <motion.svg
                      key="plus"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </motion.svg>
                  ) : (
                    <SuccessIcon
                      key="check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 200 }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </SuccessIcon>
                  )}
                </AnimatePresence>
              </AddToCartButton>
            </CardSide>
          ) : (
            <CardSide
              key="back"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <IconButton
                isBack
                onClick={() => setIsFlipped(false)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
              </IconButton>
              <BackContent>
                <ContentWrapper>
                  <ScrollContainer>
                    <Section>
                      <SectionTitle>Overview</SectionTitle>
                      <Overview>{product.overview}</Overview>
                    </Section>
                    
                    <Section>
                      <SectionTitle>Highlights</SectionTitle>
                      <HighlightsList>
                        {product.highlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </HighlightsList>
                    </Section>
                    
                    <Section>
                      <SectionTitle>Tech Specs</SectionTitle>
                      <TechSpecsGrid>
                        <dt>Dimensions</dt>
                        <dd>{product.techSpecs.dimensions}</dd>
                        <dt>Material</dt>
                        <dd>{product.techSpecs.material}</dd>
                        <dt>Compatibility</dt>
                        <dd>{product.techSpecs.compatibility}</dd>
                        <dt>Weight</dt>
                        <dd>{product.techSpecs.weight}</dd>
                      </TechSpecsGrid>
                    </Section>
                  </ScrollContainer>
                </ContentWrapper>
              </BackContent>
            </CardSide>
          )}
        </AnimatePresence>
      </ProductCard>
    </ProductContainer>
  );
};

export default ProductDetail; 