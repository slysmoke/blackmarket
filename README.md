# Eve Black Market

An unofficial marketplace for Eve Online items, allowing players to list and browse items for sale.

## Features

- EVE Online SSO OAuth 2.0 authentication
- Create and view sale orders
- Dark theme UI
- SQLite database (easily replaceable with other databases)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your EVE Online application credentials:
   ```bash
   cp .env.example .env
   ```
4. Register a new application at [EVE Online Developers](https://developers.eveonline.com/) and get your client ID and secret
5. Update the `.env` file with your EVE Online application credentials

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Configuration

Make sure to set up the following environment variables in your `.env` file:

- `EVE_CLIENT_ID`: Your EVE Online application client ID
- `EVE_CLIENT_SECRET`: Your EVE Online application client secret
- `EVE_CALLBACK_URL`: OAuth callback URL (e.g., http://localhost:3000/callback)
- `SESSION_SECRET`: Secret for session management
- `PORT`: (Optional) Port to run the application on (defaults to 3000)

## Database

The application uses SQLite by default. The database file will be created automatically as `blackmarket.db`. To switch to a different database system, modify the database configuration in `app.js`.
