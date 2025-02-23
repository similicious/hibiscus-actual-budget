# Hibiscus-Actual Integration

A Node.js application that syncs transactions from Hibiscus Server (a banking interface) to Actual Budget. This integration allows for seamless transaction importing from your bank account to your Actual Budget instance.

Hibiscus Server does the heavy lifting and fetches the transactions from the bank(s) via FinTS / HBCI. When an account is synced in Hibiscus, it notifies this application via a webhook, which then imports the new transactions into Actual Budget.

## Features

- 🔄 Webhook-based transaction syncing from Hibiscus to Actual Budget
- 🎯 Smart transaction mapping with detailed notes
- 💡 Intelligent duplicate detection
- 📦 Support for multiple budgets and accounts
- 🚀 Real-time updates when accounts are synced in Hibiscus

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
3. Copy the example configuration file:
   ```bash
   cp config.json.example config.json
   ```
4. Configure your settings in `config.json`

## Configuration

The configuration file (`config.json`) has the following structure:

```json
{
  "server": {
    "port": 3000
  },
  "actual": {
    "serverUrl": "http://localhost:5006",
    "password": "your-password"
  },
  "hibiscus": {
    "url": "https://hibiscus.example.com",
    "username": "user",
    "password": "pass"
  },
  "dataDir": "data",
  "budgets": [
    {
      "syncId": "sync-id-1",
      "accounts": [
        {
          "accountId": "account-id-1",
          "hibiscusAccountId": 1
        }
      ]
    }
  ]
}
```

### Configuration Options

- `server`: Server settings
  - `port`: Port number for the webhook server (default: 3000)
- `actual`: Global Actual Budget settings
  - `serverUrl`: Your Actual Budget server URL
  - `password`: Your Actual Budget password
- `hibiscus`: Global Hibiscus settings
  - `url`: Base URL of your Hibiscus server
  - `username`: Your Hibiscus username
  - `password`: Your Hibiscus password
- `dataDir`: Directory for storing Actual Budget data
- `budgets`: Array of budgets to sync
  - `syncId`: The Actual Budget sync ID
  - `accounts`: Array of account mappings
    - `accountId`: The Actual Budget account ID
    - `hibiscusAccountId`: The Hibiscus account ID

## Usage

1. Start the server:

   ```bash
   npm start
   ```

2. Configure Hibiscus to send webhook notifications to this application when accounts are synced:

   - In Hibiscus, set up a webhook for account synchronization
   - Point it to `http://your-server:3000/webhook`
     When an account is synced in Hibiscus, the server will:

3. Receive the webhook notification
4. Find the corresponding budget and account configuration
5. Download the budget data
6. Fetch and import new transactions for that account
7. Provide a summary of imported transactions
