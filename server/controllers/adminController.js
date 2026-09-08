const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const Registration = require('../models/Registration');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@rudram.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';
const JWT_SECRET = process.env.JWT_SECRET || '84a086f5c41a7301f1503a42d1679a812b94246e54c8ed36c6d0a2ebbc486a31';

// Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid Admin Credentials' });
    }

    const token = jwt.sign(
      { role: 'admin', email: ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.status(200).json({
      message: 'Admin logged in successfully',
      token,
      admin: {
        email: ADMIN_EMAIL,
        name: 'Super Admin'
      }
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// Admin Auth Middleware
exports.verifyAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session token. Please log in again.' });
  }
};

// Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const totalRegistrations = await Registration.count();
    const completedPayments = await Registration.count({ where: { paymentStatus: 'Completed' } });
    const pendingPayments = await Registration.count({ where: { paymentStatus: 'Pending' } });
    const failedPayments = await Registration.count({ where: { paymentStatus: 'Failed' } });

    // Assuming ₹499 registration fee
    const estimatedRevenue = completedPayments * 499;

    res.status(200).json({
      totalRegistrations,
      completedPayments,
      pendingPayments,
      failedPayments,
      estimatedRevenue
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics', error: error.message });
  }
};

// Get All Registrations with Search & Filter
exports.getRegistrations = async (req, res) => {
  try {
    const { search = '', status = 'All', role = 'All', limit = 100, page = 1 } = req.query;

    const where = {};

    if (status && status !== 'All') {
      where.paymentStatus = status;
    }

    if (role && role !== 'All') {
      where.role = role;
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { contactNumber: { [Op.like]: q } },
        { district: { [Op.like]: q } },
        { state: { [Op.like]: q } },
        { role: { [Op.like]: q } }
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Registration.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      registrations: rows
    });
  } catch (error) {
    console.error('Admin Get Registrations Error:', error);
    res.status(500).json({ message: 'Failed to retrieve registrations', error: error.message });
  }
};

// Update Registration Status (e.g. mark payment completed manually)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    if (!['Pending', 'Completed', 'Failed'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const registration = await Registration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    registration.paymentStatus = paymentStatus;
    await registration.save();

    res.status(200).json({
      message: `Registration status updated to ${paymentStatus}`,
      registration
    });
  } catch (error) {
    console.error('Admin Update Status Error:', error);
    res.status(500).json({ message: 'Failed to update registration status', error: error.message });
  }
};

// Delete Registration
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findByPk(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration record not found' });
    }

    await registration.destroy();

    res.status(200).json({ message: 'Registration record deleted successfully' });
  } catch (error) {
    console.error('Admin Delete Registration Error:', error);
    res.status(500).json({ message: 'Failed to delete registration record', error: error.message });
  }
};
