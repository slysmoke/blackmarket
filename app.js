require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Import routes
const authRoutes = require('./src/routes/auth');
const orderRoutes = require('./src/routes/orders');
const marketRoutes = require('./src/routes/market');

// Import services
const setupEveAuth = require('./src/services/eveAuth');
const OrderCleanupService = require('./src/services/orderCleanup');
//const MarketDataSync = require('./src/services/marketDataSync');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Setup EVE Online authentication
setupEveAuth();

// Initialize order cleanup service (run every hour)
OrderCleanupService.scheduleCleanup(60);

// Initialize market data sync (run every 24 hours)
//MarketDataSync.scheduleSync(24);

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.use('/', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/market', marketRoutes);

app.listen(port, () => {
  console.log(`Eve Black Market running on port ${port}`);
});
