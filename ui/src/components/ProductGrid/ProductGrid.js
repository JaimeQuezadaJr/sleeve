import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { products } from '../../data/products';  // Keep this for now

const GridSection = styled.section`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  position: sticky;
  top: 0;
  background: #fff;
  
  @media (min-width: 768px) {
    padding: 0 50px;
  }
  
  @media (min-width: 1200px) {
    padding: 0 80px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, minmax(280px, 1fr));
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
`;

const ProductCard = styled(motion.div)`
  position: relative;
  aspect-ratio: 1;
  background-color: #f5f5f5;
  cursor: pointer;
  transform-origin: center;
  backface-visibility: hidden;
  -webkit-font-smoothing: subpixel-antialiased;
  
  @media (min-width: 768px) {
    height: 400px;
  }
  
  @media (min-width: 1200px) {
    height: 280px;
  }
  
  &:hover {
    img {
      opacity: 0.9;
    }
  }
`;

const ProductImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  transform: translateZ(0);
  will-change: transform;
`;

const ProductInfo = styled(motion.div)`
  position: absolute;
  bottom: 10px;
  left: 20px;
  color: #000;
  transform: translateZ(0);
`;

const ProductTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 700;
`;

const ProductPrice = styled.p`  font-size: 16px;
`;

const ProductGrid = () => {
  return (
    <GridSection>
      <Grid>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.1 }}
            transition={{ 
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <Link to={`/product/${product.id}`}>
              <ProductImage src={product.image} alt={product.title} />
              <ProductInfo>
                <ProductTitle>{product.title}</ProductTitle>
                <ProductPrice>{product.price}</ProductPrice>
              </ProductInfo>
            </Link>
          </ProductCard>
        ))}
      </Grid>
    </GridSection>
  );
};

export default ProductGrid; 
