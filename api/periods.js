// No periods data - empty system ready for production use
const mockPeriods = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(mockPeriods);
  }

  if (req.method === 'POST') {
    // Mock period creation
    const { name, startDate, endDate, type } = req.body;
    
    const newPeriod = {
      id: Date.now().toString(),
      name,
      startDate,
      endDate,
      type,
      status: 'PENDING',
      participantSnapshots: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _count: {
        payments: 0
      }
    };

    mockPeriods.push(newPeriod);
    return res.status(201).json(newPeriod);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}