# Security Testing Data Collection Endpoint

A Cloudflare Pages project for collecting security testing data from various sources like GitHub Actions, CI/CD pipelines, and other automated tools.

## Features

- **Secure API endpoint** with Bearer token authentication
- **Data collection** from arbitrary sources with structured JSON format
- **Storage** using Cloudflare KV for persistent logging
- **CORS support** for cross-origin requests
- **Real client IP detection** using Cloudflare headers
- **Request validation** and error handling

## Setup

### Quick Setup (Recommended)

1. **Configure environment variables** (optional):
   ```bash
   # Copy the example file and customize it
   cp env.example .env
   # Edit .env with your values:
   # AUTH_TOKEN=your-secure-token-here
   # PROJECT_NAME=my-security-endpoint  
   # HOSTNAME=my-site-name
   ```

2. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

The setup script will:
- Install Wrangler CLI if needed
- Install project dependencies
- Load configuration from `.env` if present
- Prompt for missing configuration values
- Create KV namespaces with your project name
- Set up your AUTH_TOKEN securely
- Update `wrangler.toml` automatically

### Manual Setup (Advanced)

If you prefer to set up manually:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Create KV Namespace**:
   ```bash
   # Create production KV namespace
   wrangler kv namespace create "SECURITY_LOGS"
   
   # Create preview KV namespace for development
   wrangler kv namespace create "SECURITY_LOGS" --preview
   ```

3. **Update wrangler.toml**:
   Replace the placeholder KV namespace IDs with the actual IDs from step 2.

4. **Set Environment Variables**:
   ```bash
   # Set production auth token
   wrangler pages secret put AUTH_TOKEN
   ```

### Deploy

```bash
# Deploy to Cloudflare Pages
npm run deploy

# Or connect to GitHub and deploy automatically
```

## API Usage

### Endpoint
```
POST https://your-site.pages.dev/api/collect
```

### Headers
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

### Request Format
```json
{
  "request_details": {
    "client_ip": "192.168.1.1",
    "user_agent": "GitHub-Actions/1.0"
  },
  "payload": {
    "source": "github-actions",
    "summary": "Test data exfiltration",
    "data": {
      "key": "value",
      "sensitive_info": "test data"
    }
  }
}
```

### Example Usage

#### cURL
```bash
curl -X POST https://your-site.pages.dev/api/collect \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "request_details": {
      "client_ip": "1.2.3.4",
      "user_agent": "GitHub-Actions/1.0"
    },
    "payload": {
      "source": "github-actions",
      "summary": "Security test",
      "data": {"test": "data"}
    }
  }'
```

#### GitHub Actions
```yaml
- name: Send test data
  run: |
    curl -X POST https://your-site.pages.dev/api/collect \
      -H "Authorization: Bearer ${{ secrets.SECURITY_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "request_details": {
          "client_ip": "github-actions",
          "user_agent": "GitHub-Actions/1.0"
        },
        "payload": {
          "source": "github-actions",
          "summary": "CI/CD security test",
          "data": {
            "repo": "${{ github.repository }}",
            "ref": "${{ github.ref }}",
            "sha": "${{ github.sha }}"
          }
        }
      }'
```

## Data Storage

Data is stored in Cloudflare KV with the following structure:

- **Key**: `log_YYYY-MM-DDTHH-MM-SS-sssZ_<uuid-prefix>`
- **Value**: Complete log entry with actual and submitted request details
- **Metadata**: Source, summary, and timestamp for easy filtering

## Development

```bash
# Start local development server
npm run dev

# View deployment logs
npm run tail
```

## Security Notes

- This endpoint is designed for **authorized security testing only**
- Always use strong, unique authentication tokens
- Consider IP whitelisting for additional security
- Monitor the KV storage usage and implement retention policies as needed
- Review logs regularly and rotate tokens periodically

## Customization

You can extend the endpoint to:
- Add IP whitelisting
- Implement rate limiting
- Add webhook notifications
- Export data to external systems
- Add more sophisticated logging and analytics

