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
  margin-bottom: 40px;
  padding: 30px;
  background: #f9f9f9;
  border-radius: 4px;
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

const Email = styled.a`
  color: #000;
  text-decoration: underline;
  font-weight: 500;
  
  &:hover {
    opacity: 0.8;
  }
`;

const Support = () => {
  return (
    <PageContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Title>Support</Title>

      <Section>
        <SectionTitle>Return Policy</SectionTitle>
        <Paragraph>
          All sales are final. We carefully inspect each item before shipping to ensure 
          the highest quality standards are met. Due to the exclusive nature of our products 
          and our commitment to maintaining their pristine condition, we do not accept returns 
          or exchanges.
        </Paragraph>
      </Section>

      <Section>
        <SectionTitle>Quality Guarantee</SectionTitle>
        <Paragraph>
          While all sales are final, we stand behind the quality of our products. If you 
          receive a defective item, please contact our support team within 48 hours of 
          delivery with detailed photos of the defect.
        </Paragraph>
        <Paragraph>
          For any quality concerns or support inquiries, please contact us at:{' '}
          <Email href="mailto:support@sleeve.com">support@sleeve.com</Email>
        </Paragraph>
      </Section>
    </PageContainer>
  );
};

export default Support; 