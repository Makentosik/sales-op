export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  // Mock authentication
  if (email === 'admin@test.com' && password === 'admin123') {
    const token = 'mock-jwt-token-' + Date.now();
    const user = {
      id: '1',
      email: 'admin@test.com',
      name: 'Администратор',
      role: 'ADMIN'
    };

    return res.status(200).json({
      access_token: token,
      user
    });
  }

  if (email === 'user@test.com' && password === 'user123') {
    const token = 'mock-jwt-token-' + Date.now();
    const user = {
      id: '2',
      email: 'user@test.com',
      name: 'Тестовый Пользователь',
      role: 'USER'
    };

    return res.status(200).json({
      access_token: token,
      user
    });
  }

  return res.status(401).json({ message: 'Invalid credentials' });
}