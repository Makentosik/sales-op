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
          g.min_revenue as "minRevenue",
          g.max_revenue as "maxRevenue",
          g.performance_levels as "performanceLevels",
          g.color,
          g.order_num as "order",
          g.is_active as "isActive",
          g.created_at as "createdAt",
          g.updated_at as "updatedAt",
          COUNT(p.id) as participant_count
        FROM grades g
        LEFT JOIN participants p ON g.id = p.grade_id AND p.is_active = true
        GROUP BY g.id
        ORDER BY g.order_num ASC
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
      const existingGrade = await query('SELECT id FROM grades WHERE name = $1', [name]);
      if (existingGrade.rows.length > 0) {
        return res.status(409).json({ message: 'Grade with this name already exists' });
      }

      const result = await query(`
        INSERT INTO grades (name, description, plan, min_revenue, max_revenue, performance_levels, color, order_num)
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
        minRevenue: newGrade.min_revenue,
        maxRevenue: newGrade.max_revenue,
        performanceLevels: newGrade.performance_levels,
        color: newGrade.color,
        order: newGrade.order_num,
        isActive: newGrade.is_active,
        createdAt: newGrade.created_at,
        updatedAt: newGrade.updated_at,
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
