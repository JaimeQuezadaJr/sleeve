import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const HeroContainer = styled.section`
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  position: relative;
`;

const HeroContent = styled(motion.div)`
  text-align: center;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 120px;
  font-weight: 700;
  letter-spacing: 4px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 60px;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 24px;
  opacity: 0.8;
`;

const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 2px;
`;

const Hero = () => {
  return (
    <HeroContainer>
      <HeroContent>
        <HeroTitle
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          SLEEVE
        </HeroTitle>
        <HeroSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Minimalist Essentials
        </HeroSubtitle>
      </HeroContent>
      <ScrollIndicator
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        Scroll
      </ScrollIndicator>
    </HeroContainer>
  );
};

export default Hero; 