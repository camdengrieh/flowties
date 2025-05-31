# Environment Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Required: OpenSea API Key
NEXT_PUBLIC_OPENSEA_API_KEY=your_opensea_api_key_here
```

## How to Get OpenSea API Key

1. Visit [OpenSea Developer Portal](https://docs.opensea.io/reference/requesting-api-keys)
2. Sign up for an API key
3. Add the key to your `.env.local` file
4. Restart your development server

## Optional Variables

```env
# Optional: Database URL for Ponder backend
DATABASE_URL=postgresql://user:password@localhost:5432/flowties

# Optional: Webhook secret for additional integrations
OPENSEA_WEBHOOK_SECRET=your_webhook_secret_here
```

## Testing the Integration

Once you have your API key set up:

1. Restart your development server: `npm run dev`
2. Check the browser console for "OpenSea Stream connected" message
3. The Activity Feed should show a "Live" indicator when connected
4. Dashboard stats will update with real OpenSea data

## Troubleshooting

- **No Live indicator**: Check that your API key is valid
- **"Historical" mode only**: Normal when API key is missing
- **Console errors**: Verify the API key format and restart the server 