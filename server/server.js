const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');

dotenv.config();

const app = express();

// =========================
// CORS
// =========================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// =========================
// HEALTH CHECK ROUTES
// =========================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Rudram Backend Server is running successfully!'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// =========================
// ROUTES
// =========================
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/services', serviceRoutes);
app.use('/services', serviceRoutes);

app.use('/api/registrations', registrationRoutes);
app.use('/registrations', registrationRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

// =========================
// UPLOADS
// =========================
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// =========================
// PORT
// =========================
const PORT = process.env.PORT || 5000;

// =========================
// START SERVER FIRST
// =========================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// =========================
// DATABASE INITIALIZATION
// =========================
const initDatabase = async () => {
  try {
    // Check database connection
    await sequelize.authenticate();

    console.log('MySQL connected via Sequelize successfully.');

    // Sync models
    // Do NOT use alter:true on Hostinger production
    await sequelize.sync();

    console.log('Database models synced successfully.');
  } catch (dbError) {
    console.error(
      'CRITICAL: Database initialization failed:',
      dbError
    );
  }
};

// Start database initialization
initDatabase();