#!/bin/bash

# BagCaddie Tracking App Build Script
# This script builds the React TypeScript application for production

set -e  # Exit on any error

echo "🚀 Starting BagCaddie Tracking App Build Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js version check passed: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

print_success "npm version: $(npm -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed, skipping npm install"
fi

# Run TypeScript type checking
print_status "Running TypeScript type checking..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Set environment variables for build
export SKIP_PREFLIGHT_CHECK=true
export GENERATE_SOURCEMAP=false
export TSC_COMPILE_ON_ERROR=true

# Build the application
print_status "Building the application for production..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check if build directory exists
if [ -d "build" ]; then
    BUILD_SIZE=$(du -sh build | cut -f1)
    print_success "Build completed successfully!"
    print_status "Build size: $BUILD_SIZE"
    print_status "Build files are located in the 'build' directory"
    
    # List main build files
    echo ""
    print_status "Main build files:"
    ls -la build/ | grep -E "\.(html|js|css)$" | head -10
    
    echo ""
    print_success "🎉 Build process completed successfully!"
    print_status "You can now deploy the contents of the 'build' directory to your web server."
    
else
    print_error "Build directory not found. Build may have failed."
    exit 1
fi

# Optional: Start a local server to test the build
if [ "$1" = "--serve" ]; then
    print_status "Starting local server to test the build..."
    if command -v serve &> /dev/null; then
        serve -s build -l 3000
    else
        print_warning "Serve package not found. Install it with: npm install -g serve"
        print_status "You can manually serve the build directory using any static file server"
    fi
fi
