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

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
