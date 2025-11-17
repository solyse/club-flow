# BC Club Flow

A modern React application for managing golf club member access and booking flow. This application provides a seamless multi-step user experience for member verification, registration, and item management.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Build Instructions](#build-instructions)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Key Features](#key-features)
- [API Integration](#api-integration)
- [Storage & Caching](#storage--caching)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

BC Club Flow is a React-based web application designed for BagCaddie Club members to access their account, verify their identity, register new accounts, and manage their items. The application follows a progressive multi-step flow with OTP verification and QR code scanning capabilities.

## Features

- 🔐 **Multi-Step Authentication Flow**
  - Access step with email/phone input
  - OTP verification
  - User registration for new members
  - Automatic booking redirection

- 📱 **QR Code Scanning**
  - Scan BagCaddie tag codes
  - Quick access for existing members
  - Automatic item enrichment

- 🔄 **Smart Item Management**
  - Automatic item enrichment with product data
  - LocalStorage caching for performance
  - Item ownership tracking

- 📍 **Location Services**
  - IP-based location detection
  - Country code auto-selection
  - Geospatial API integration

- 🎨 **Modern UI/UX**
  - Responsive design with Tailwind CSS
  - Radix UI components
  - Smooth transitions and animations
  - Mobile-first approach

- 🌐 **Environment Configuration**
  - Staging and production environments
  - Environment variable support
  - Dynamic API endpoint switching

## Tech Stack

- **React 18.2.0** - Modern UI framework with hooks
- **TypeScript 4.9.5** - Type-safe development
- **Create React App** - Build tooling and development server
- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form 7.65.0** - Form state management
- **Sonner** - Toast notifications
- **Lucide React** - Icon library
- **Leaflet** - Map integration (if needed)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16.0.0 or higher)
- **npm** (v7.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git** (for version control)

To verify your installation:

```bash
node --version  # Should be v16.0.0 or higher
npm --version   # Should be v7.0.0 or higher
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bc-club-flow
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including React, TypeScript, Tailwind CSS, and other packages listed in `package.json`.

### 3. Verify Installation

After installation, you should see a `node_modules` directory created. You can verify the installation by checking:

```bash
npm list --depth=0
```

## Environment Setup

The application supports multiple environments (staging and production). Configuration is managed through `src/config/env.ts`.

### Environment Variables

Create React App requires environment variables to be prefixed with `REACT_APP_` to be accessible in the browser.

#### Available Environment Variables

- `REACT_APP_ENV` - Environment type: `staging` or `production`
- `REACT_APP_API_BASE_URL` - Base URL for API endpoints
- `REACT_APP_LOC_URL` - Location service URL
- `REACT_APP_WEBSITE_URL` - Website URL for redirects
- `REACT_APP_BAGCADDIE_CODE` - BagCaddie code parameter

### Option 1: Using Environment Files

Create environment files in the project root:

#### `.env.development` (for local development)

```env
REACT_APP_ENV=staging
REACT_APP_API_BASE_URL=https://fc.vsfy.com/vShip/bc-sandbox
REACT_APP_LOC_URL=https://fc.vsfy.com/loc/?bagCaddie2025
REACT_APP_WEBSITE_URL=https://stg.bagcaddie.com
REACT_APP_BAGCADDIE_CODE=BGDLO6F5
```

#### `.env.production` (for production builds)

```env
REACT_APP_ENV=production
REACT_APP_API_BASE_URL=https://fc.vsfy.com/vShip/fc
REACT_APP_LOC_URL=https://fc.vsfy.com/loc/?bagCaddie2025
REACT_APP_WEBSITE_URL=https://bagcaddie.com
REACT_APP_BAGCADDIE_CODE=BGDLO6F5
```

### Option 2: Using Default Configuration

If no environment variables are set, the application uses default configurations defined in `src/config/env.ts`:
- **Staging mode** (default): Uses staging API endpoints
- **Production mode**: Uses production API endpoints

> **Note:** Environment variables are embedded at build time, not runtime. Restart the development server after changing environment variables.

For more details, see [ENV_SETUP.md](./ENV_SETUP.md).

## Development

### Start Development Server

#### Default (Staging Configuration)

```bash
npm start
```

Starts the development server on `http://localhost:3000` with staging configuration.

#### Staging Environment

```bash
npm run start:staging
```

Starts the development server with explicit staging configuration.

#### Production Environment

```bash
npm run start:production
```

Starts the development server with production configuration (useful for testing production API endpoints locally).

### Development Workflow

1. **Start the server**: `npm start`
2. **Make changes**: Edit files in `src/`
3. **See changes**: The browser automatically reloads
4. **Check console**: Monitor for errors and warnings

### Hot Module Replacement (HMR)

The development server supports Hot Module Replacement, so changes to React components update without a full page reload, preserving component state when possible.

## Build Instructions

### Building for Production

#### Build for Staging

```bash
npm run build:staging
```

Creates an optimized production build in the `build/` directory with staging API endpoints.

#### Build for Production

```bash
npm run build:production
```

Creates an optimized production build with production API endpoints.

#### Default Build

```bash
npm run build
```

Creates a build with default configuration (staging).

#### Using Build Script

```bash
npm run build:prod
```

Runs the custom build script (`./build.sh`) for production deployment.

### Build Output

After building, the `build/` directory contains:
- Optimized JavaScript bundles
- Minified CSS files
- Static assets
- `index.html` entry point

### Build Optimization

The build process includes:
- Code minification and tree-shaking
- CSS optimization
- Asset optimization
- Source map generation (disabled by default)

## Project Structure

```
bc-club-flow/
├── public/                 # Static assets
│   └── index.html          # HTML template
├── src/                    # Source code
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components (Radix UI)
│   │   ├── AccessStep.tsx # Access/Login step
│   │   ├── VerifyStep.tsx # OTP verification step
│   │   ├── RegisterStep.tsx # User registration step
│   │   ├── QRScanModal.tsx # QR code scanning modal
│   │   └── ...
│   ├── config/            # Configuration files
│   │   └── env.ts         # Environment configuration
│   ├── services/          # Business logic services
│   │   ├── api.ts         # API service layer
│   │   └── storage.ts     # LocalStorage abstraction
│   ├── App.tsx            # Main application component
│   ├── index.tsx          # Application entry point
│   └── globals.css        # Global styles and Tailwind config
├── build/                 # Production build output (gitignored)
├── node_modules/          # Dependencies (gitignored)
├── .gitignore            # Git ignore rules
├── package.json          # Project dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── README.md             # This file
├── ENV_SETUP.md          # Environment setup guide
└── build.sh              # Custom build script
```

## Available Scripts

### Development

- `npm start` - Start development server (staging)
- `npm run start:staging` - Start dev server with staging config
- `npm run start:production` - Start dev server with production config

### Building

- `npm run build` - Build for production (default/staging)
- `npm run build:staging` - Build for staging environment
- `npm run build:production` - Build for production environment
- `npm run build:prod` - Run custom build script

### Code Quality

- `npm run lint` - Run ESLint on source files
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm test` - Run test suite (if configured)

### Maintenance

- `npm run clean` - Remove build artifacts, node_modules, and lock file
- `npm run eject` - Eject from Create React App (⚠️ irreversible)

## Key Features

### Multi-Step Flow

The application follows a progressive flow:

1. **Access Step** (`AccessStep.tsx`)
   - User enters email or phone number
   - Country code selection for phone numbers
   - QR code scanning option
   - Partner lookup and OTP sending

2. **Verify Step** (`VerifyStep.tsx`)
   - 6-digit OTP verification
   - Resend OTP functionality
   - Partner data retrieval
   - Automatic item enrichment for existing members

3. **Register Step** (`RegisterStep.tsx`)
   - New user registration form
   - Product selection
   - Address and contact information
   - Form validation

4. **Booking Step**
   - Success confirmation
   - Automatic redirect to booking page
   - URL format: `{websiteUrl}/club/?{bagCaddieCode}`

### QR Code Scanning

Users can scan their 8-digit BagCaddie tag code to:
- Skip verification for existing members
- Automatically load their items
- Enrich items with product data
- Proceed directly to booking

### Item Enrichment

When a partner/user has items:
- Items are automatically enriched with product details
- Member information is attached to each item
- Enriched items are stored in localStorage
- Available throughout the application lifecycle

## API Integration

The application integrates with multiple APIs through the `ApiService` class:

### Endpoints

- **Partner API** - User/partner lookup by email or phone
- **OTP API** - Send and verify OTP codes
- **Products API** - Fetch available products
- **QR Code API** - Validate QR codes and retrieve customer data
- **Location API** - IP-based location detection
- **AS Config API** - Country codes and configuration

### API Service

Located in `src/services/api.ts`, the `ApiService` provides:
- Centralized API configuration
- Request/response handling
- Error management
- Data caching
- Item enrichment logic

## Storage & Caching

The application uses localStorage for:
- **Products** - Cached product list
- **Location** - User's location data
- **Country Codes** - AS configuration data
- **Enriched Items** - User's items with product data
- **Items Owner** - Partner/customer data

### Storage Service

The `StorageService` (`src/services/storage.ts`) provides:
- Type-safe storage operations
- Automatic JSON serialization
- Storage validation
- Convenience methods for common operations

## Deployment

### Pre-Deployment Checklist

- [ ] Set environment variables in CI/CD or hosting platform
- [ ] Run `npm run build:production` locally to test
- [ ] Verify all API endpoints are correct
- [ ] Test the complete user flow
- [ ] Check browser console for errors
- [ ] Verify responsive design on mobile devices

### Deployment Options

#### Static Hosting

The build output is a static site that can be deployed to:
- **Netlify** - Automatic deployments from Git
- **Vercel** - Zero-config deployments
- **AWS S3 + CloudFront** - Scalable CDN hosting
- **GitHub Pages** - Free static hosting
- **Apache/Nginx** - Traditional web servers

#### Environment Variables

Set environment variables in your hosting platform:
- Netlify: Site settings → Environment variables
- Vercel: Project settings → Environment variables
- AWS: Use Parameter Store or Secrets Manager

### Build for Deployment

```bash
# For production deployment
npm run build:production

# The build/ directory contains the deployable files
```

## Troubleshooting

### Common Issues

#### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000`

**Solution**: 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

#### Module Not Found Errors

**Problem**: `Cannot find module '...'`

**Solution**:
```bash
# Remove node_modules and reinstall
npm run clean
npm install
```

#### TypeScript Errors

**Problem**: Type errors in development

**Solution**:
```bash
# Check types without building
npm run type-check

# Fix compilation errors (if allowed)
# Edit tsconfig.json if needed
```

#### Build Failures

**Problem**: Build fails with errors

**Solution**:
```bash
# Clean and rebuild
npm run clean
npm install
npm run build:production
```

#### Environment Variables Not Working

**Problem**: Environment variables not accessible

**Solution**:
- Ensure variables are prefixed with `REACT_APP_`
- Restart the development server after changing `.env` files
- Check that `.env` files are in the project root
- Verify variable names match exactly (case-sensitive)

### Getting Help

- Check browser console for errors
- Review Network tab in DevTools
- Check `src/config/env.ts` for configuration
- Review `ENV_SETUP.md` for environment setup issues

## Contributing

### Code Style

- Use TypeScript for all new code
- Follow React best practices and hooks patterns
- Use functional components with hooks
- Maintain component organization in `src/components/`

### Development Guidelines

1. **Type Safety**: Always define types/interfaces
2. **Error Handling**: Implement proper error boundaries
3. **Responsive Design**: Test on multiple screen sizes
4. **Performance**: Use React.memo and useMemo where appropriate
5. **Accessibility**: Use semantic HTML and ARIA attributes

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Test thoroughly
4. Run linting: `npm run lint`
5. Run type checking: `npm run type-check`
6. Submit PR with description of changes

### File Naming Conventions

- Components: PascalCase (e.g., `AccessStep.tsx`)
- Services: camelCase (e.g., `api.ts`)
- Utilities: camelCase (e.g., `utils.ts`)
- Constants: UPPER_SNAKE_CASE (if needed)

## License

[Add your license information here]

## Support

For issues, questions, or contributions, please [add contact information or issue tracker URL].

---

**Built with ❤️ for BagCaddie Club Members**
