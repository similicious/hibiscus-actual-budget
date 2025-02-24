# Hibiscus-Actual Integration

A Node.js application that syncs your bank transactions to Actual Budget using Hibiscus Server as a FinTS/HBCI gateway.

## Features

- 🔄 Webhook-based transaction syncing from Hibiscus to Actual Budget
- 🎯 Transaction mapping with detailed notes
- 💡 Duplicate detection
- 📦 Support for multiple budgets and accounts
- 📱 Notifications via ntfy.sh for sync reminders

## How it Works

Hibiscus Server implements the FinTS protocol, handling the banking communication and providing this application with a JSON endpoint for fetching transactions. Authorization with the bank usually requires user interaction (e.g. PushTAN). Because of this, the syncing process cannot be fully automatic. This application will send periodic reminders via ntfy.sh with a button triggering the sync. You can keep the notification and trigger the sync when it's convenient to confirm the authorisation prompts.

```mermaid
sequenceDiagram
    participant Scheduler
    participant ntfy
    participant User
    participant Server
    participant Hibiscus
    participant Actual

    Scheduler->>ntfy: Send reminder notification
    ntfy->>User: Display notification with sync button
    User->>Server: Click sync button (GET /sync)
    Server->>Hibiscus: Request sync
    Hibiscus-->>User: Request authorization (banking app)
    User->>Hibiscus: Authorize
    Hibiscus->>Server: Send webhook
    Server->>Actual: Import transactions
```

## Prerequisites

- Node.js
- Hibiscus Server instance with accounts configured
- Actual Budget instance
- ntfy.sh topic for notifications

## Installation

### Standard Installation

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy configuration: `cp config/config.json.example config/config.json`
4. Configure `config/config.json`
5. Start server: `npm start`

### Docker Installation

```bash
docker run -v /path/to/config:/app/config \
          -v /path/to/data:/app/data \
          -p 3000:3000 \
          -e PORT=3000 \
          hibiscus-actual
```

## Configuration

Configure the following in `config/config.json`:

- `server`: Server settings
  - `publicUrl`: Public URL of your server (required for ntfy button)
- `ntfy`: Notification settings
  - `topic`: Your ntfy.sh topic for notifications
  - `schedule`: Cron schedule for reminders (e.g. "0 12 _/2 _ \*" for noon every 2 days)
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

## Hibiscus Setup

1. In Hibiscus, configure a webhook for account synchronization
2. Point it to `http://your-server:3000/webhook`

When an account syncs, the server will automatically:

1. Process the webhook notification
2. Match the budget and account configuration
3. Download budget data
4. Import new transactions
5. Provide an import summary
