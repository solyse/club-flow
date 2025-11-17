/**
 * Environment configuration
 * Uses environment variables with REACT_APP_ prefix (required by Create React App)
 * Falls back to default values if not set
 */

export interface EnvConfig {
  env: 'production' | 'staging';
  apiBaseUrl: string;
  locUrl: string;
  websiteUrl: string;
  bagCaddieCode: string;
  itemId: string;
}

// Default configuration (development/staging)
const defaultConfig: EnvConfig = {
  env: 'staging',
  bagCaddieCode: 'BGDLO6F5',
  apiBaseUrl: 'https://fc.vsfy.com/vShip/bc-sandbox',
  websiteUrl: 'https://stg.bagcaddie.com',
  locUrl: 'https://fc.vsfy.com/loc/?bagCaddie2025',
  itemId: '8893764206808'
};

// Production configuration
const productionConfig: EnvConfig = {
  env: 'production',
  bagCaddieCode: 'BGDLO6F5',
  apiBaseUrl: 'https://fc.vsfy.com/vShip/fc',
  websiteUrl: 'https://bagcaddie.com',
  locUrl: 'https://fc.vsfy.com/loc/?bagCaddie2025',
  itemId: '8215434002564'
};

/**
 * Get environment configuration
 * Checks REACT_APP_ENV to determine which config to use
 * Environment variables override config values if provided
 */
export const getEnvConfig = (): EnvConfig => {
  const envFromProcess = process.env.REACT_APP_ENV as 'staging' | 'production';
  
  // Determine which base config to use
  let baseConfig: EnvConfig;
  if (envFromProcess === 'production') {
    baseConfig = productionConfig;
  } else {
    baseConfig = defaultConfig;
  }

  // Override with environment variables if provided
  const config: EnvConfig = {
    env: (process.env.REACT_APP_ENV as EnvConfig['env']) || baseConfig.env,
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || baseConfig.apiBaseUrl,
    locUrl: process.env.REACT_APP_LOC_URL || baseConfig.locUrl,
    websiteUrl: process.env.REACT_APP_WEBSITE_URL || baseConfig.websiteUrl,
    bagCaddieCode: process.env.REACT_APP_BAGCADDIE_CODE || baseConfig.bagCaddieCode,
    itemId: process.env.REACT_APP_ITEM_ID || baseConfig.itemId
  };

  return config;
};

// Export the configuration instance
export const envConfig = getEnvConfig();