const mockParticipants = [
  {
    id: '1',
    firstName: 'Иван',
    lastName: 'Петров',
    username: 'ivan_petrov',
    telegramId: '123456789',
    isActive: true,
    revenue: 850000,
    joinDate: '2024-01-15T00:00:00.000Z',
    gradeId: '1',
    warningStatus: null,
    warningCount: 0,
    warningPeriodsLeft: null,
    warningLastDate: null,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-09-30T10:30:00.000Z',
    grade: {
      id: '1',
      name: 'Platinum Elite',
      plan: 1000000,
      color: '#FFD700'
    }
  },
  {
    id: '2',
    firstName: 'Мария',
    lastName: 'Сидорова',
    username: 'maria_s',
    telegramId: '987654321',
    isActive: true,
    revenue: 750000,
    joinDate: '2024-02-01T00:00:00.000Z',
    gradeId: '2',
    warningStatus: null,
    warningCount: 0,
    warningPeriodsLeft: null,
    warningLastDate: null,
    createdAt: '2024-02-01T10:30:00.000Z',
    updatedAt: '2024-09-30T10:30:00.000Z',
    grade: {
      id: '2',
      name: 'Gold Premium',
      plan: 800000,
      color: '#FFA500'
    }
  },
  {
    id: '3',
    firstName: 'Алексей',
    lastName: 'Козлов',
    username: 'alex_kozlov',
    telegramId: '456789123',
    isActive: true,
    revenue: 420000,
    joinDate: '2024-03-10T00:00:00.000Z',
    gradeId: '3',
    warningStatus: 'PERFORMANCE_WARNING',
    warningCount: 1,
    warningPeriodsLeft: 2,
    warningLastDate: '2024-09-15T00:00:00.000Z',
    createdAt: '2024-03-10T10:30:00.000Z',
    updatedAt: '2024-09-30T10:30:00.000Z',
    grade: {
      id: '3',
      name: 'Silver Standard',
      plan: 500000,
      color: '#C0C0C0'
    }
  }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(mockParticipants);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}