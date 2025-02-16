# Hibiscus-Actual Integration

A Node.js application that automatically syncs transactions from Hibiscus Server (a banking interface) to Actual Budget. This integration allows for seamless transaction importing from your bank account to your Actual Budget instance.

## Features

- 🔄 Automatic transaction syncing from Hibiscus to Actual Budget
- 🎯 Smart transaction mapping with detailed notes
- 💡 Intelligent duplicate detection
- 🚨 Comprehensive error handling and logging
- ⚙️ Flexible configuration through environment variables

## Prerequisites

- Node.js installed on your system
- A Hibiscus instance with accounts set up
- An Actual Budget instance

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Configure your environment variables in the `.env` file

## Configuration

The following environment variables are required:

- `HIBISCUS_URL`: Your Hibiscus server transactions endpoint URL like `https://$HIBISCUS_HOST/webadmin/rest/hibiscus/konto/$ACCOUNT_ID/umsaetze`
- `HIBISCUS_USERNAME`: Your Hibiscus username (defaults to `admin`)
- `HIBISCUS_PASSWORD`: Your Hibiscus password
- `ACTUAL_SERVER_URL`: Your Actual Budget server URL
- `ACTUAL_SYNC_ID`: Your Actual Budget sync ID
- `ACTUAL_PASSWORD`: Your Actual Budget password

## Usage

Run the application:

```bash
npm start
```

The application will:

1. Connect to your Hibiscus instance
2. Fetch recent transactions
3. Convert them to Actual Budget format
4. Import them into your specified account
5. Provide a summary of imported transactions
