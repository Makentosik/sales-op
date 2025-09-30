import { query, initDB, seedData } from './lib/db.js';

export default async function handler(req, res) {
  try {
    // Initialize DB on first request
    await initDB();
    await seedData();

    if (req.method === 'GET') {
      // Get all grades with participant count
      const gradesResult = await query(`
        SELECT 
          g.id,
          g.name,
          g.description,
          g.plan,
          g."minRevenue" as "minRevenue",
          g."maxRevenue" as "maxRevenue",
          g."performanceLevels" as "performanceLevels",
          g.color,
          g."order" as "order",
          g."isActive" as "isActive",
          g."createdAt" as "createdAt",
          g."updatedAt" as "updatedAt",
          COUNT(p.id) as participant_count
        FROM "Grade" g
        LEFT JOIN "Participant" p ON g.id = p."gradeId" AND p."isActive" = true
        GROUP BY g.id, g.name, g.description, g.plan, g."minRevenue", g."maxRevenue", g."performanceLevels", g.color, g."order", g."isActive", g."createdAt", g."updatedAt"
        ORDER BY g."order" ASC
      `);

      // Transform the result to match expected format
      const grades = gradesResult.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        description: row.description,
        plan: row.plan,
        minRevenue: row.minRevenue,
        maxRevenue: row.maxRevenue,
        performanceLevels: row.performanceLevels,
        color: row.color,
        order: row.order,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        _count: { participants: parseInt(row.participant_count) }
      }));

      return res.status(200).json(grades);
    }

    if (req.method === 'POST') {
      // Create new grade
      const { name, description, plan, minRevenue, maxRevenue, performanceLevels, color, order } = req.body;
      
      if (!name || !plan) {
        return res.status(400).json({ message: 'name and plan are required' });
      }

      // Check if grade with this name already exists
      const existingGrade = await query('SELECT id FROM "Grade" WHERE name = $1', [name]);
      if (existingGrade.rows.length > 0) {
        return res.status(409).json({ message: 'Grade with this name already exists' });
      }

      const result = await query(`
        INSERT INTO "Grade" (name, description, plan, "minRevenue", "maxRevenue", "performanceLevels", color, "order")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        name,
        description || null,
        plan,
        minRevenue || null,
        maxRevenue || null,
        JSON.stringify(performanceLevels || {}),
        color || '#808080',
        order || 0
      ]);

      const newGrade = result.rows[0];
      
      const response = {
        id: newGrade.id.toString(),
        name: newGrade.name,
        description: newGrade.description,
        plan: newGrade.plan,
        minRevenue: newGrade.minRevenue,
        maxRevenue: newGrade.maxRevenue,
        performanceLevels: newGrade.performanceLevels,
        color: newGrade.color,
        order: newGrade.order,
        isActive: newGrade.isActive,
        createdAt: newGrade.createdAt,
        updatedAt: newGrade.updatedAt,
        _count: { participants: 0 }
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
