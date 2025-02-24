# SLEEVE

A premium e-commerce platform specializing in minimalist protective sleeves for high-end devices like MacBooks and iPads. The application focuses on delivering a clean, intuitive shopping experience that matches the sophistication of the products it showcases.

Visit the live site: [sleeve-min.vercel.app](https://sleeve-min.vercel.app)

## Features

- **Immersive Product Showcase**
  - Interactive product cards with smooth flip animations
  - Detailed product specifications and highlights
  - High-resolution product imagery
  - Responsive grid layout

- **Seamless Shopping Experience**
  - Persistent shopping cart
  - Real-time inventory tracking
  - Secure Stripe payment integration
  - Automated order confirmation emails

- **Intuitive Navigation**
  - Clean, minimalist interface
  - Smooth page transitions
  - Mobile-responsive design
  - Easy access to product information

## Tech Stack & Architecture

### Frontend
- **React** - Provides a robust foundation for building a dynamic single-page application
- **Styled Components** - Enables maintainable, component-scoped styling with dynamic theming
- **Framer Motion** - Powers smooth animations and transitions for an engaging user experience
- **React Router** - Handles client-side routing with seamless page transitions

### Backend
- **Node.js/Express** - Lightweight and efficient server implementation
- **Turso (SQLite)** - Edge-deployed SQL database offering fast global access
- **Stripe** - Secure payment processing with robust API integration
- **Nodemailer** - Reliable email service for order confirmations

The tech stack was chosen to prioritize:
- Performance and fast page loads
- Smooth animations and transitions
- Secure payment processing
- Reliable data persistence
- Global availability

## Deployment & Services

The application is deployed using a modern stack of cloud services:

- **Vercel** - Hosts the frontend and serverless API functions
- **Turso** - Provides globally distributed database storage
- **Stripe** - Handles secure payment processing
- **Gmail SMTP** - Manages transactional emails

This infrastructure ensures:
- Global availability with edge computing
- Secure and reliable payment processing
- Automated order management
- Scalable database operations
