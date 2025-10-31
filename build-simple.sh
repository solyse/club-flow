#!/bin/bash

# Simple build script for BagCaddie Tracking App
# This script builds the React application with minimal TypeScript checking

set -e

echo "🚀 Starting Simple Build Process..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Create a temporary tsconfig for build
print_status "Creating temporary TypeScript configuration..."
cat > tsconfig.build.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "noImplicitAny": false,
    "noImplicitReturns": false,
    "noImplicitThis": false,
    "strictNullChecks": false,
    "suppressImplicitAnyIndexErrors": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build"]
}
EOF

# Set environment variables for build
export SKIP_PREFLIGHT_CHECK=true
export GENERATE_SOURCEMAP=false
export TSC_COMPILE_ON_ERROR=true

# Build the application
print_status "Building the application..."
npm run build

# Clean up temporary file
rm -f tsconfig.build.json

if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_success "Build completed successfully!"
    print_status "Build size: $BUILD_SIZE"
    print_status "Build files are located in the 'build' directory"
else
    print_error "Build failed - no build directory created"
    exit 1
fi
