# Environment Configuration Setup

This project supports environment-based configuration to switch between staging and production APIs.

## Environment Variables

Create React App requires environment variables to be prefixed with `REACT_APP_` to be accessible in the browser.

### Available Environment Variables

- `REACT_APP_ENV` - Environment type: `staging` or `production`
- `REACT_APP_API_BASE_URL` - Base URL for the main API endpoints
- `REACT_APP_LOC_URL` - Location service URL

## Setup Instructions

### Option 1: Using .env Files (Recommended)

Create environment files in the project root:

#### `.env.development` (for development/staging)
```bash
REACT_APP_ENV=development
REACT_APP_API_BASE_URL=https://fc.vsfy.com/vShip/bc-sandbox
REACT_APP_LOC_URL=https://fc.vsfy.com/loc/?bagCaddie2025
REACT_APP_AS_CONFIG_URL=https://fc.vsfy.com/vShip/fc/fetch-as-config
```

#### `.env.production` (for production)
```bash
REACT_APP_ENV=production
REACT_APP_API_BASE_URL=https://fc.vsfy.com/vShip/bc-prod
REACT_APP_LOC_URL=https://fc.vsfy.com/loc/?bagCaddie2025
REACT_APP_AS_CONFIG_URL=https://fc.vsfy.com/vShip/fc/fetch-as-config
```

### Option 2: Using Default Configuration

If no environment variables are set, the application will use default configurations:

- **Staging mode** (`npm start`): Uses staging/development URLs
- **Production mode** (`npm run build`): Uses production URLs (unless overridden by `.env.production`)

## How It Works

The environment configuration is managed through `src/config/env.ts`, which:

1. Checks `REACT_APP_ENV` to determine which base configuration to use
2. Allows environment variables to override any default values
3. Falls back to sensible defaults if environment variables are not set

## Usage

### Running Development Server

#### With Staging Configuration
```bash
npm run start:staging
```
Starts the development server with staging API endpoints.

#### With Production Configuration
```bash
npm run start:production
```
Starts the development server with production API endpoints.

#### Default (Uses Staging)
```bash
npm start
```
Uses staging configuration by default.

### Building for Production

#### Build for Staging
```bash
npm run build:staging
```
Builds the application with staging API endpoints for staging deployment.

#### Build for Production
```bash
npm run build:production
```
Builds the application with production API endpoints for production deployment.

#### Default Build
```bash
npm run build
```
Uses default configuration (staging).

### Available NPM Scripts

- `npm run start:staging` - Run dev server with staging config
- `npm run start:production` - Run dev server with production config
- `npm run build:staging` - Build for staging environment
- `npm run build:production` - Build for production environment

## Important Notes

1. **Do NOT commit `.env.development` or `.env.production`** if they contain sensitive information
2. **DO commit `.env.example`** as a template for other developers
3. Environment variables are embedded at build time, not runtime
4. After changing environment variables, restart the development server or rebuild the application

## Configuration Location

The environment configuration is defined in:
- `src/config/env.ts` - Configuration logic and default values

API services automatically use this configuration:
- `src/services/api.ts` - Uses `envConfig` for all API endpoints

