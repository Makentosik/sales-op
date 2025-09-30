import { query, initDB, seedData } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    // Initialize DB on first request
    await initDB();
    await seedData();

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Participant ID is required' });
    }

    if (req.method === 'GET') {
      // Get specific participant with grade info
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
        WHERE p.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: `Participant with ID ${id} not found` });
      }

      const row = result.rows[0];
      const participant = {
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
      };

      return res.status(200).json(participant);
    }

    if (req.method === 'PATCH') {
      // Update participant fields (e.g., gradeId, names, isActive, revenue, username)
      const { firstName, lastName, username, telegramId, isActive, revenue, gradeId, warningStatus } = req.body || {};

      // If gradeId provided, ensure grade exists
      if (gradeId !== undefined) {
        const gradeCheck = await query('SELECT id FROM "Grade" WHERE id = $1', [gradeId]);
        if (gradeCheck.rows.length === 0) {
          return res.status(400).json({ message: `Grade with ID ${gradeId} does not exist` });
        }
      }

      const updates = [];
      const values = [];
      let param = 1;

      if (firstName !== undefined) { updates.push(`"firstName" = $${param++}`); values.push(firstName); }
      if (lastName !== undefined) { updates.push(`"lastName" = $${param++}`); values.push(lastName); }
      if (username !== undefined) { updates.push(`username = $${param++}`); values.push(username); }
      if (telegramId !== undefined) { updates.push(`"telegramId" = $${param++}`); values.push(telegramId); }
      if (isActive !== undefined) { updates.push(`"isActive" = $${param++}`); values.push(!!isActive); }
      if (revenue !== undefined) { updates.push(`revenue = $${param++}`); values.push(revenue); }
      if (gradeId !== undefined) { updates.push(`"gradeId" = $${param++}`); values.push(gradeId); }
      if (warningStatus !== undefined) { updates.push(`"warningStatus" = $${param++}`); values.push(warningStatus); }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      updates.push('"updatedAt" = CURRENT_TIMESTAMP');

      const updateSql = `UPDATE "Participant" SET ${updates.join(', ')} WHERE id = $${param} RETURNING *`;
      values.push(id);

      // Ensure participant exists
      const exists = await query('SELECT id FROM "Participant" WHERE id = $1', [id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: `Participant with ID ${id} not found` });
      }

      const updateResult = await query(updateSql, values);
      const updated = updateResult.rows[0];

      // Fetch grade info
      let grade = null;
      if (updated.gradeId) {
        const gr = await query('SELECT * FROM "Grade" WHERE id = $1', [updated.gradeId]);
        if (gr.rows[0]) {
          grade = {
            id: gr.rows[0].id.toString(),
            name: gr.rows[0].name,
            plan: gr.rows[0].plan,
            color: gr.rows[0].color
          };
        }
      }

      const response = {
        id: updated.id.toString(),
        firstName: updated.firstName,
        lastName: updated.lastName,
        username: updated.username,
        telegramId: updated.telegramId,
        isActive: updated.isActive,
        revenue: updated.revenue,
        joinDate: updated.joinDate,
        gradeId: updated.gradeId?.toString(),
        warningStatus: updated.warningStatus,
        warningCount: updated.warningCount,
        warningPeriodsLeft: updated.warningPeriodsLeft,
        warningLastDate: updated.warningLastDate,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        grade
      };

      return res.status(200).json(response);
    }

    if (req.method === 'DELETE') {
      // Ensure participant exists
      const exists = await query('SELECT id FROM "Participant" WHERE id = $1', [id]);
      if (exists.rows.length === 0) {
        return res.status(404).json({ message: `Participant with ID ${id} not found` });
      }

      const result = await query('DELETE FROM "Participant" WHERE id = $1 RETURNING *', [id]);
      const deleted = result.rows[0];

      return res.status(200).json({ id: deleted.id.toString() });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
