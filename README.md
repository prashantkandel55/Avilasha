# Avilasha-2

Avilasha-2 is an Electron desktop application for cryptocurrency portfolio management and analytics. Built with React, TypeScript, and Vite, it offers a modern, responsive UI for managing crypto assets, wallets, and DeFi investments.

## Features

- **Portfolio Analytics**: Track and analyze your crypto portfolio performance
- **Market Analysis**: Real-time market data and trend analysis
- **Asset Management**: Manage your crypto assets in one place
- **Wallet Integration**: Connect and manage multiple crypto wallets
- **DeFi Dashboard**: Monitor your DeFi investments
- **NFT Gallery**: View and manage your NFT collection
- **Transaction History**: Complete record of your crypto transactions
- **Secure Storage**: Enhanced security for sensitive financial data

## Development

This application is built with:
- Electron
- React
- TypeScript
- Vite
- Radix UI Components
- TailwindCSS

### Getting Started

```sh
# Install dependencies
npm install

# Run in development mode
npm run electron:dev

# Build for production
npm run electron:build

# Preview production build
npm run electron:preview
```

### Development Server

The development server runs on port 3001 (http://localhost:3001/).

### Project Structure

- `/electron`: Electron main process files
- `/src`: React application source code
- `/public`: Static assets

## Security

The application implements several security features:
- Encryption for sensitive data
- Session timeout for inactive users
- Rate limiting for API requests
- Input sanitization to prevent XSS attacks
