// No participants data - empty system ready for production use
const mockParticipants = [];

export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(mockParticipants);
  }

  if (req.method === 'POST') {
    // Create new participant
    const { firstName, lastName, username, telegramId, revenue = 0, gradeId = '5' } = req.body;
    
    // Grade mapping
    const gradeMap = {
      '1': { name: 'Platinum Elite', plan: 1000000, color: '#FFD700' },
      '2': { name: 'Gold Premium', plan: 800000, color: '#FFA500' },
      '3': { name: 'Silver Standard', plan: 500000, color: '#C0C0C0' },
      '4': { name: 'Bronze Basic', plan: 300000, color: '#CD7F32' },
      '5': { name: 'Trainee', plan: 150000, color: '#808080' }
    };
    
    const grade = gradeMap[gradeId] || gradeMap['5'];
    
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
        name: grade.name,
        plan: grade.plan,
        color: grade.color
      }
    };

    mockParticipants.push(newParticipant);
    return res.status(201).json(newParticipant);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
