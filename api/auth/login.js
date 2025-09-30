export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Production authentication - one working account
  if (email === 'admin@company.com' && password === 'SecurePass2024!') {
    const token = 'jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const user = {
      id: '1',
      email: 'admin@company.com',
      name: 'Системный Администратор',
      role: 'ADMIN'
    };

    return res.status(200).json({
      access_token: token,
      user
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
}