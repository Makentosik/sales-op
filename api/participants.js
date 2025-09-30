import { query, initDB, seedData } from './lib/db.js';

export default async function handler(req, res) {
  try {
    // Initialize DB on first request
    await initDB();
    await seedData();

    if (req.method === 'GET') {
      // Get all participants with grade information
      const result = await query(`
        SELECT 
          p.id,
          p."firstName" as "firstName",
          p."lastName" as "lastName",
          p.username,
          p."telegramId" as "telegramId",
          p."isActive" as "isActive",
          p.revenue,
          p."joinDate" as "joinDate",
          p."gradeId" as "gradeId",
          p."warningStatus" as "warningStatus",
          p."warningCount" as "warningCount",
          p."warningPeriodsLeft" as "warningPeriodsLeft",
          p."warningLastDate" as "warningLastDate",
          p."createdAt" as "createdAt",
          p."updatedAt" as "updatedAt",
          g.id as "grade.id",
          g.name as "grade.name",
          g.plan as "grade.plan",
          g.color as "grade.color"
        FROM "Participant" p
        LEFT JOIN "Grade" g ON p."gradeId" = g.id
        ORDER BY p."createdAt" DESC
      `);

      // Transform the result to match expected format
      const participants = result.rows.map(row => ({
        id: row.id.toString(),
        firstName: row.firstName,
        lastName: row.lastName,
        username: row.username,
        telegramId: row.telegramId,
        isActive: row.isActive,
        revenue: row.revenue,
        joinDate: row.joinDate,
        gradeId: row.gradeId?.toString(),
        warningStatus: row.warningStatus,
        warningCount: row.warningCount,
        warningPeriodsLeft: row.warningPeriodsLeft,
        warningLastDate: row.warningLastDate,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        grade: row['grade.id'] ? {
          id: row['grade.id'].toString(),
          name: row['grade.name'],
          plan: row['grade.plan'],
          color: row['grade.color']
        } : null
      }));

      return res.status(200).json(participants);
    }

    if (req.method === 'POST') {
      // Create new participant
      const { firstName, lastName, username, telegramId, revenue = 0, gradeId = 5 } = req.body;
      
      if (!firstName || !telegramId) {
        return res.status(400).json({ message: 'firstName and telegramId are required' });
      }

      const result = await query(`
        INSERT INTO "Participant" ("firstName", "lastName", username, "telegramId", revenue, "gradeId")
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [firstName, lastName, username, telegramId, revenue, gradeId]);

      const newParticipant = result.rows[0];
      
      // Get grade information
      const gradeResult = await query('SELECT * FROM "Grade" WHERE id = $1', [gradeId]);
      const grade = gradeResult.rows[0];

      const response = {
        id: newParticipant.id.toString(),
        firstName: newParticipant.firstName,
        lastName: newParticipant.lastName,
        username: newParticipant.username,
        telegramId: newParticipant.telegramId,
        isActive: newParticipant.isActive,
        revenue: newParticipant.revenue,
        joinDate: newParticipant.joinDate,
        gradeId: newParticipant.gradeId?.toString(),
        warningStatus: newParticipant.warningStatus,
        warningCount: newParticipant.warningCount,
        warningPeriodsLeft: newParticipant.warningPeriodsLeft,
        warningLastDate: newParticipant.warningLastDate,
        createdAt: newParticipant.createdAt,
        updatedAt: newParticipant.updatedAt,
        grade: grade ? {
          id: grade.id.toString(),
          name: grade.name,
          plan: grade.plan,
          color: grade.color
        } : null
      };

      return res.status(201).json(response);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
