const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const config = require('./config/config');
const authRoutes = require('./routes/auth');

const app = express();
const port = config.PORT;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Database connection
mongoose.connect(config.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Protected route example
app.post('/confirm-booking', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Please login to confirm booking' });
    }

    const { leadUid } = req.body;
    try {
        // Here you will make an API call to Hostfully
        // For now, let's just send a dummy response
        res.json({ message: 'Booking Confirmation Processed' });
    } catch (error) {
        res.status(500).json({ message: 'Error in processing booking', error: error.message });
    }
});

// Serve the main application
app.get('/genie-home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
