// No participants data - empty system ready for production use
const mockParticipants = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(mockParticipants);
  }

  if (req.method === 'POST') {
    // Create new participant
    const { firstName, lastName, username, telegramId, revenue = 0, gradeId = '5' } = req.body;
    
    const newParticipant = {
      id: Date.now().toString(),
      firstName,
      lastName: lastName || null,
      username: username || null,
      telegramId,
      isActive: true,
      revenue,
      joinDate: new Date().toISOString(),
      gradeId,
      warningStatus: null,
      warningCount: 0,
      warningPeriodsLeft: null,
      warningLastDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      grade: {
        id: gradeId,
        name: gradeId === '5' ? 'Trainee' : 'Unknown',
        plan: gradeId === '5' ? 150000 : 0,
        color: '#808080'
      }
    };

    mockParticipants.push(newParticipant);
    return res.status(201).json(newParticipant);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
