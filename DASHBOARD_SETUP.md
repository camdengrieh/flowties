# Flowties Dashboard Setup Guide

This is a Next.js dashboard application with Privy authentication integration.

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```env
# Privy Configuration
# Get these values from your Privy dashboard at https://console.privy.io
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
NEXT_PUBLIC_PRIVY_CLIENT_ID=your-privy-client-id-here
```

## Getting Privy App ID and Client ID

1. Go to [Privy Console](https://console.privy.io)
2. Create a new app or select an existing one
3. Copy your App ID from the settings
4. Copy your Client ID from the settings
5. Update your `.env.local` file with these values

## Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Authentication**: Secure login with email, wallet, and Google via Privy
- **Dashboard Layout**: Responsive sidebar navigation and header
- **Stats Cards**: Customizable metric displays
- **User Management**: User session handling and logout
- **Modern UI**: Built with Tailwind CSS and Lucide icons

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Main dashboard page
├── components/
│   ├── providers.tsx       # Privy and Query providers
│   └── dashboard/
│       ├── dashboard-layout.tsx  # Main dashboard layout
│       ├── sidebar.tsx           # Navigation sidebar
│       ├── header.tsx            # Top header bar
│       └── stats-card.tsx        # Reusable stats component
```

## Customization

- Update the navigation items in `src/components/dashboard/sidebar.tsx`
- Modify the Privy configuration in `src/components/providers.tsx`
- Add new dashboard pages by creating new route files in `src/app/`
- Customize the appearance by editing Tailwind classes

## Next Steps

1. Set up your Privy app and add the environment variables
2. Customize the dashboard content for your use case
3. Add additional pages for the navigation items (analytics, users, wallet, settings)
4. Connect to your backend APIs for real data 