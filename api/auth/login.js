import { query, initDB, seedData } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Initialize DB on first request
    await initDB();
    await seedData();

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check user in database
    const result = await query(
      'SELECT id, email, password, name, role FROM "User" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // In production, you should hash passwords with bcrypt
    // For now, simple string comparison
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = 'jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const userResponse = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    };

    return res.status(200).json({
      access_token: token,
      user: userResponse
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
