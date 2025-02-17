import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const PageContainer = styled(motion.div)`
  min-height: 100vh;
  padding: 100px 20px 40px;
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 32px;
  margin-bottom: 40px;
  font-weight: 400;
  text-align: center;
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  margin-bottom: 20px;
  font-weight: 400;
`;

const Paragraph = styled.p`
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 20px;
  color: #333;
`;

const About = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Title>About SLEEVE</Title>
      
      <Section>
        <SectionTitle>Our Philosophy</SectionTitle>
        <Paragraph>
          At SLEEVE, we believe that clothing is more than just fabric – it's an expression of confidence, 
          comfort, and personal style. Our carefully curated collection of minimalist essentials is designed 
          to elevate your everyday wardrobe while maintaining the highest standards of quality and sustainability.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>Quality & Craftsmanship</SectionTitle>
        <Paragraph>
          Each piece in our collection is crafted with meticulous attention to detail, using premium materials 
          that are built to last. We partner with ethical manufacturers who share our commitment to quality 
          and sustainability, ensuring that every garment meets our exacting standards.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>Timeless Style</SectionTitle>
        <Paragraph>
          Our designs embrace simplicity and versatility, creating pieces that transcend seasonal trends. 
          By focusing on clean lines, neutral colors, and classic silhouettes, we ensure that your SLEEVE 
          pieces remain stylish and relevant for years to come.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>Customer Confidence</SectionTitle>
        <Paragraph>
          We stand behind every product we sell, offering our customers peace of mind through superior 
          quality control and customer service. Each item undergoes rigorous testing to ensure durability, 
          comfort, and style, allowing you to shop with complete confidence.
        </Paragraph>
      </Section>
    </PageContainer>
  );
};

export default About; 