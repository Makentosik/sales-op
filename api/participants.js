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
          p.first_name as "firstName",
          p.last_name as "lastName",
          p.username,
          p.telegram_id as "telegramId",
          p.is_active as "isActive",
          p.revenue,
          p.join_date as "joinDate",
          p.grade_id as "gradeId",
          p.warning_status as "warningStatus",
          p.warning_count as "warningCount",
          p.warning_periods_left as "warningPeriodsLeft",
          p.warning_last_date as "warningLastDate",
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
          g.id as "grade.id",
          g.name as "grade.name",
          g.plan as "grade.plan",
          g.color as "grade.color"
        FROM participants p
        LEFT JOIN grades g ON p.grade_id = g.id
        ORDER BY p.created_at DESC
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
        INSERT INTO participants (first_name, last_name, username, telegram_id, revenue, grade_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [firstName, lastName, username, telegramId, revenue, gradeId]);

      const newParticipant = result.rows[0];
      
      // Get grade information
      const gradeResult = await query('SELECT * FROM grades WHERE id = $1', [gradeId]);
      const grade = gradeResult.rows[0];

      const response = {
        id: newParticipant.id.toString(),
        firstName: newParticipant.first_name,
        lastName: newParticipant.last_name,
        username: newParticipant.username,
        telegramId: newParticipant.telegram_id,
        isActive: newParticipant.is_active,
        revenue: newParticipant.revenue,
        joinDate: newParticipant.join_date,
        gradeId: newParticipant.grade_id?.toString(),
        warningStatus: newParticipant.warning_status,
        warningCount: newParticipant.warning_count,
        warningPeriodsLeft: newParticipant.warning_periods_left,
        warningLastDate: newParticipant.warning_last_date,
        createdAt: newParticipant.created_at,
        updatedAt: newParticipant.updated_at,
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
