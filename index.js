import express from 'express';
import { supabase } from './config/supabase.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: ['https://wagergenie.ai', 'https://wagergenie-frontend.vercel.app'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No authorization header' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            throw new Error('Not authenticated');
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authenticated' });
    }
};

// Authentication endpoints
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name
                }
            }
        });

        if (signUpError) throw signUpError;

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata.name
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error during registration',
            error: error.message
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (signInError) throw signInError;

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata.name
            }
        });
    } catch (error) {
        res.status(401).json({
            message: 'Invalid credentials',
            error: error.message
        });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error during logout',
            error: error.message
        });
    }
});

// Protected routes
app.post('/api/chat', requireAuth, async (req, res) => {
    try {
        const { message } = req.body;
        res.json({ 
            message: "Message received",
            response: "This feature will be available soon!"
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error processing chat message',
            error: error.message
        });
    }
});

// Serve static files
app.get('/genie-home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'genie-home.html'));
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server if not running in Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

// For Vercel serverless deployment
export default app; 