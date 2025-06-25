#!/bin/bash

echo "🚀 Setting up Security Testing Endpoint..."

# Load environment variables from .env file if it exists
if [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "ℹ️  No .env file found. You can create one using env.example as a template."
fi

# Set default values
PROJECT_NAME=${PROJECT_NAME:-"security-testing-endpoint"}
HOSTNAME=${HOSTNAME:-"your-site"}

echo "📋 Configuration:"
echo "   PROJECT_NAME: $PROJECT_NAME"
echo "   HOSTNAME: $HOSTNAME"
echo "   AUTH_TOKEN: $([ -n "$AUTH_TOKEN" ] && echo "✅ Set" || echo "❌ Not set")"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Function to prompt for missing variables
prompt_for_variable() {
    local var_name=$1
    local var_description=$2
    local is_secret=${3:-false}
    
    if [ -z "${!var_name}" ]; then
        if [ "$is_secret" = true ]; then
            read -p "$var_description: " -s var_value
            echo ""
        else
            read -p "$var_description: " var_value
        fi
        
        if [ -n "$var_value" ]; then
            export $var_name="$var_value"
            echo "✅ $var_name set!"
        else
            echo "⚠️  $var_name not provided - using default or skipping"
            return 1
        fi
    fi
    return 0
}

# Prompt for missing variables
echo ""
echo "🔍 Checking for missing configuration..."

if [ -z "$PROJECT_NAME" ]; then
    prompt_for_variable "PROJECT_NAME" "Enter project name (used for namespaces)"
fi

if [ -z "$HOSTNAME" ]; then
    prompt_for_variable "HOSTNAME" "Enter your Cloudflare Pages hostname (without .pages.dev)"
fi

# Create KV namespaces with project name
echo ""
echo "🗄️  Creating KV namespaces..."
NAMESPACE_NAME="${PROJECT_NAME}_SECURITY_LOGS"

echo "Creating production namespace: $NAMESPACE_NAME"
PROD_OUTPUT=$(wrangler kv namespace create "$NAMESPACE_NAME" 2>&1)
echo "$PROD_OUTPUT"

echo "Creating preview namespace: ${NAMESPACE_NAME}_preview"
PREVIEW_OUTPUT=$(wrangler kv namespace create "$NAMESPACE_NAME" --preview 2>&1)
echo "$PREVIEW_OUTPUT"

# Extract namespace IDs
PROD_ID=$(echo "$PROD_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -o 'preview_id = "[^"]*"' | cut -d'"' -f2)

echo ""
echo "📝 Namespace IDs generated:"
echo "   Production ID: $PROD_ID"
echo "   Preview ID: $PREVIEW_ID"

# Set AUTH_TOKEN only if not already set
echo ""
echo "🔐 Setting up AUTH_TOKEN..."
if [ -z "$AUTH_TOKEN" ]; then
    echo "AUTH_TOKEN not found in environment or .env file."
    if prompt_for_variable "AUTH_TOKEN" "Please enter your AUTH_TOKEN" true; then
        echo "Setting AUTH_TOKEN secret..."
        echo "$AUTH_TOKEN" | wrangler pages secret put AUTH_TOKEN
        echo "✅ AUTH_TOKEN set successfully!"
    else
        echo "⚠️  No AUTH_TOKEN provided. You'll need to set it manually later:"
        echo "   wrangler pages secret put AUTH_TOKEN"
    fi
else
    echo "Using AUTH_TOKEN from environment/config..."
    echo "$AUTH_TOKEN" | wrangler pages secret put AUTH_TOKEN
    echo "✅ AUTH_TOKEN set successfully!"
fi

# Update wrangler.toml with the actual IDs if we got them
if [ -n "$PROD_ID" ] && [ -n "$PREVIEW_ID" ]; then
    echo ""
    echo "📝 Updating wrangler.toml with namespace IDs..."
    
    # Update the wrangler.toml file
    sed -i.bak "s/PLACEHOLDER_PROD_ID/$PROD_ID/g" wrangler.toml
    sed -i.bak "s/PLACEHOLDER_PREVIEW_ID/$PREVIEW_ID/g" wrangler.toml
    rm wrangler.toml.bak
    
    echo "✅ wrangler.toml updated with namespace IDs!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Summary:"
echo "   Project: $PROJECT_NAME"
echo "   Hostname: $HOSTNAME.pages.dev"
echo "   Production Namespace ID: $PROD_ID"
echo "   Preview Namespace ID: $PREVIEW_ID"
echo ""
echo "Next steps:"
echo "1. Deploy: npm run deploy"
echo "2. Test locally: npm run dev"
echo ""
echo "Your endpoint will be available at: https://$HOSTNAME.pages.dev/api/collect"
