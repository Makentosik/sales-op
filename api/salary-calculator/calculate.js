export default function handler(req, res) {
  if (req.method === 'GET') {
    // Mock salary calculation with empty data
    const calculationResult = {
      totalParticipants: 0,
      totalSalary: 0,
      calculations: [],
      summary: {
        byGrade: {},
        totalBasePayment: 0,
        totalBonuses: 0,
        totalDeductions: 0
      }
    };

    return res.status(200).json(calculationResult);
  }

  return res.status(405).json({ message: 'Method not allowed' });
}