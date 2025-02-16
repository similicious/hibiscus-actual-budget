# Hibiscus-Actual Integration

A Node.js application that automatically syncs transactions from Hibiscus Server (a banking interface) to Actual Budget. This integration allows for seamless transaction importing from your bank account to your Actual Budget instance.

## Features

- 🔄 Automatic transaction syncing from Hibiscus to Actual Budget
- 🎯 Smart transaction mapping with detailed notes
- 💡 Intelligent duplicate detection
- 📦 Support for multiple budgets and accounts

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
          "hibiscusEndpoint": "/webadmin/rest/hibiscus/konto/1/umsaetze/days/15"
        }
      ]
    }
  ]
}
```

### Configuration Options

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
    - `hibiscusEndpoint`: The Hibiscus transactions endpoint for this account

## Usage

Run the application:

```bash
npm start
```

The application will:

1. Connect to your Hibiscus instance
2. For each configured budget:
   - Download the budget data
   - For each configured account:
     - Fetch transactions from the specified Hibiscus endpoint
     - Convert them to Actual Budget format
     - Import them into the specified account
3. Provide a summary of imported transactions for each account
