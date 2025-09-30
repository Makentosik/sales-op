const mockGrades = [
  {
    id: '1',
    name: 'Platinum Elite',
    description: 'Высший уровень для топ-менеджеров',
    plan: 1000000,
    minRevenue: 800000,
    maxRevenue: null,
    performanceLevels: {
      excellent: 1200000,
      good: 1000000,
      acceptable: 800000
    },
    color: '#FFD700',
    order: 0,
    isActive: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    _count: { participants: 5 }
  },
  {
    id: '2',
    name: 'Gold Premium',
    description: 'Продвинутый уровень для опытных менеджеров',
    plan: 800000,
    minRevenue: 600000,
    maxRevenue: 799999,
    performanceLevels: {
      excellent: 1000000,
      good: 800000,
      acceptable: 600000
    },
    color: '#FFA500',
    order: 1,
    isActive: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    _count: { participants: 8 }
  },
  {
    id: '3',
    name: 'Silver Standard',
    description: 'Стандартный уровень для менеджеров среднего звена',
    plan: 500000,
    minRevenue: 400000,
    maxRevenue: 599999,
    performanceLevels: {
      excellent: 700000,
      good: 500000,
      acceptable: 400000
    },
    color: '#C0C0C0',
    order: 2,
    isActive: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    _count: { participants: 12 }
  },
  {
    id: '4',
    name: 'Bronze Basic',
    description: 'Базовый уровень для новых менеджеров',
    plan: 300000,
    minRevenue: 200000,
    maxRevenue: 399999,
    performanceLevels: {
      excellent: 450000,
      good: 300000,
      acceptable: 200000
    },
    color: '#CD7F32',
    order: 3,
    isActive: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    _count: { participants: 15 }
  },
  {
    id: '5',
    name: 'Trainee',
    description: 'Стажерский уровень для новичков',
    plan: 150000,
    minRevenue: 0,
    maxRevenue: 199999,
    performanceLevels: {
      excellent: 250000,
      good: 150000,
      acceptable: 100000
    },
    color: '#808080',
    order: 4,
    isActive: true,
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    _count: { participants: 8 }
  }
];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(mockGrades);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}