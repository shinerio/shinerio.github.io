#!/bin/bash

# One-click compile and deploy script for Obsidian Blog Generator
# Usage: ./deploy.sh [-c config_file] [-d deploy_method]
# Options:
#   -c, --config: Specify the JSON configuration file (default: ./blog.config.json)
#   -d, --deploy: Specify the deployment method (github, vercel, netlify, docker, local)

set -e  # Exit immediately if a command exits with a non-zero status

# Default values
CONFIG_FILE="./blog.config.json"
DEPLOY_METHOD="local"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--config)
            CONFIG_FILE="$2"
            shift 2
            ;;
        -d|--deploy)
            DEPLOY_METHOD="$2"
            shift 2
            ;;
        -h|--help)
            echo "One-click compile and deploy script for Obsidian Blog Generator"
            echo ""
            echo "Usage: $0 [-c config_file] [-d deploy_method]"
            echo "Options:"
            echo "  -c, --config: Specify the JSON configuration file (default: ./blog.config.json)"
            echo "  -d, --deploy: Specify the deployment method (github, vercel, netlify, docker, local)"
            echo ""
            echo "Examples:"
            echo "  $0                                  # Build and preview locally with default config"
            echo "  $0 -c my-config.json               # Build with custom config and preview locally"
            echo "  $0 -c my-config.json -d github     # Build and deploy to GitHub Pages"
            echo "  $0 -c my-config.json -d vercel     # Build and deploy to Vercel"
            echo "  $0 -c my-config.json -d netlify    # Build and deploy to Netlify"
            echo "  $0 -c my-config.json -d docker     # Build and run in Docker container"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

echo "==========================================="
echo "Obsidian Blog Generator - One-Click Deploy"
echo "Config file: $CONFIG_FILE"
echo "Deploy method: $DEPLOY_METHOD"
echo "==========================================="

# Check if config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo "Error: Config file '$CONFIG_FILE' does not exist!"
    echo "Please create a configuration file first."
    exit 1
fi

echo "✓ Configuration file found: $CONFIG_FILE"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Generate the blog
echo "📝 Generating blog from Obsidian vault..."
npx obsidian-blog generate -c "$CONFIG_FILE" -v

echo "✅ Blog generation completed successfully!"

# Deployment based on method
case $DEPLOY_METHOD in
    "github")
        echo "🚀 Deploying to GitHub Pages..."

        # Check if gh-pages is installed
        if ! command -v gh-pages &> /dev/null; then
            echo "📦 Installing gh-pages..."
            npm install -g gh-pages
        fi

        # First, generate blog normally for main site if backup mode is disabled
        if [[ ! -f "$CONFIG_FILE" ]]; then
            echo "⚠️  Config file not found, creating with default settings"
            npx obsidian-blog init -o "$CONFIG_FILE"
        fi

        # Determine if we should backup the current content first
        if jq -e '.backupMode // false' "$CONFIG_FILE" >/dev/null 2>&1; then
            echo "🔄 Backup mode enabled, generating content to backup subdirectory..."

            # Create temporary config with backup settings
            TEMP_CONFIG=$(mktemp)
            cp "$CONFIG_FILE" "$TEMP_CONFIG"

            # Modify the config to enable backup mode
            jq '.backupMode = true' "$CONFIG_FILE" > "$TEMP_CONFIG" && mv "$TEMP_CONFIG" "$CONFIG_FILE"

            # Generate the content to backup location
            npx obsidian-blog generate -c "$CONFIG_FILE" -v

            # Restore original config
            jq '.backupMode = false' "$CONFIG_FILE" > "$TEMP_CONFIG" && mv "$TEMP_CONFIG" "$CONFIG_FILE"
        else
            # Generate normally
            npx obsidian-blog generate -c "$CONFIG_FILE" -v
        fi

        # Create CNAME file if customDomain is specified in config
        if command -v node >/dev/null 2>&1; then
            CUSTOM_DOMAIN=$(node -p "require('$CONFIG_FILE').customDomain || ''" 2>/dev/null)
            if [[ -n "$CUSTOM_DOMAIN" && "$CUSTOM_DOMAIN" != "null" && "$CUSTOM_DOMAIN" != "undefined" ]]; then
                echo "🌐 Creating CNAME file for custom domain: $CUSTOM_DOMAIN"
                echo "$CUSTOM_DOMAIN" > dist/CNAME
            fi
        else
            echo "⚠️ Node.js not found, skipping CNAME file creation"
        fi

        # Deploy to GitHub Pages
        gh-pages -d dist -b gh-pages -m "Deploy blog [skip ci]"
        echo "✅ Deployed to GitHub Pages!"
        ;;

    "vercel")
        echo "🚀 Deploying to Vercel..."

        # Check if vercel is installed
        if ! command -v vercel &> /dev/null; then
            echo "📦 Installing Vercel CLI..."
            npm install -g vercel
        fi

        # Login to Vercel (optional - you can skip if already logged in)
        # vercel login

        # Deploy to Vercel
        vercel dist --prod
        echo "✅ Deployed to Vercel!"
        ;;

    "netlify")
        echo "🚀 Deploying to Netlify..."

        # Check if netlify-cli is installed
        if ! command -v netlify &> /dev/null; then
            echo "📦 Installing Netlify CLI..."
            npm install -g netlify-cli
        fi

        # Login to Netlify (optional - you can skip if already logged in)
        # netlify login

        # Deploy to Netlify
        netlify deploy --prod --dir=dist
        echo "✅ Deployed to Netlify!"
        ;;

    "docker")
        echo "🐳 Building and deploying with Docker..."

        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi

        # Create a temporary Dockerfile if it doesn't exist
        if [[ ! -f "Dockerfile" ]]; then
            echo "📄 Creating temporary Dockerfile..."
            cat > Dockerfile.temp << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build
RUN npm install -g obsidian-blog-generator

EXPOSE 3000

CMD ["sh", "-c", "obsidian-blog generate -c ${CONFIG_FILE:-./blog.config.json} && cd dist && npx serve -s -l 3000"]
EOF
            DOCKERFILE="Dockerfile.temp"
        else
            DOCKERFILE="Dockerfile"
        fi

        # Build Docker image
        docker build -t obsidian-blog-deploy .

        # Clean up temporary Dockerfile if created
        if [[ "$DOCKERFILE" == "Dockerfile.temp" ]]; then
            rm Dockerfile.temp
        fi

        # Run the container
        echo "🏃 Starting Docker container..."
        docker run -d -p 3000:3000 --name obsidian-blog-container obsidian-blog-deploy
        echo "✅ Docker deployment running on http://localhost:3000"
        echo "Container name: obsidian-blog-container"
        echo "To stop: docker stop obsidian-blog-container"
        ;;

    "local")
        echo "🏠 Setting up local preview..."

        # Check if http-server is installed
        if ! command -v http-server &> /dev/null; then
            echo "📦 Installing http-server..."
            npm install -g http-server
        fi

        echo "✅ Local preview setup completed!"
        echo "Navigate to the dist directory and run 'http-server' to preview:"
        echo "  cd dist && http-server"
        echo "Or visit: http://localhost:8080 (default http-server port)"
        ;;

    *)
        echo "⚠️  Unknown deployment method: $DEPLOY_METHOD"
        echo "Available methods: github, vercel, netlify, docker, local"
        echo "Using local preview..."

        # Fallback to local preview
        if ! command -v http-server &> /dev/null; then
            echo "📦 Installing http-server..."
            npm install -g http-server
        fi

        echo "✅ Local preview setup completed!"
        echo "Navigate to the dist directory and run 'http-server' to preview:"
        echo "  cd dist && http-server"
        ;;
esac

echo "==========================================="
echo "🎉 Deployment process completed!"
echo "Config file used: $CONFIG_FILE"
echo "Deploy method: $DEPLOY_METHOD"
echo "==========================================="