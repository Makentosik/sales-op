import { query, initDB, seedData } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    // Initialize DB on first request
    await initDB();
    await seedData();

    const { id } = req.query;

    if (req.method === 'GET') {
      // Get specific grade
      const result = await query(`
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
        WHERE g.id = $1
        GROUP BY g.id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: `Grade with ID ${id} not found` });
      }

      const row = result.rows[0];
      const grade = {
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
      };

      return res.status(200).json(grade);
    }

    if (req.method === 'PATCH') {
      // Update existing grade
      const { name, description, plan, minRevenue, maxRevenue, performanceLevels, color, order } = req.body;
      
      // Check if grade exists
      const existingGrade = await query('SELECT * FROM grades WHERE id = $1', [id]);
      if (existingGrade.rows.length === 0) {
        return res.status(404).json({ message: `Grade with ID ${id} not found` });
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      let paramCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramCount}`);
        values.push(name);
        paramCount++;
      }
      if (description !== undefined) {
        updates.push(`description = $${paramCount}`);
        values.push(description);
        paramCount++;
      }
      if (plan !== undefined) {
        updates.push(`plan = $${paramCount}`);
        values.push(plan);
        paramCount++;
      }
      if (minRevenue !== undefined) {
        updates.push(`min_revenue = $${paramCount}`);
        values.push(minRevenue);
        paramCount++;
      }
      if (maxRevenue !== undefined) {
        updates.push(`max_revenue = $${paramCount}`);
        values.push(maxRevenue);
        paramCount++;
      }
      if (performanceLevels !== undefined) {
        updates.push(`performance_levels = $${paramCount}`);
        values.push(JSON.stringify(performanceLevels));
        paramCount++;
      }
      if (color !== undefined) {
        updates.push(`color = $${paramCount}`);
        values.push(color);
        paramCount++;
      }
      if (order !== undefined) {
        updates.push(`order_num = $${paramCount}`);
        values.push(order);
        paramCount++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'No fields to update' });
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const updateQuery = `
        UPDATE grades 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await query(updateQuery, values);
      const updatedGrade = result.rows[0];
      
      // Get participant count
      const countResult = await query(
        'SELECT COUNT(*) as participant_count FROM participants WHERE grade_id = $1 AND is_active = true',
        [id]
      );
      
      const response = {
        id: updatedGrade.id.toString(),
        name: updatedGrade.name,
        description: updatedGrade.description,
        plan: updatedGrade.plan,
        minRevenue: updatedGrade.min_revenue,
        maxRevenue: updatedGrade.max_revenue,
        performanceLevels: updatedGrade.performance_levels,
        color: updatedGrade.color,
        order: updatedGrade.order_num,
        isActive: updatedGrade.is_active,
        createdAt: updatedGrade.created_at,
        updatedAt: updatedGrade.updated_at,
        _count: { participants: parseInt(countResult.rows[0].participant_count) }
      };

      return res.status(200).json(response);
    }

    if (req.method === 'DELETE') {
      // Delete grade
      
      // Check if grade exists
      const existingGrade = await query('SELECT * FROM grades WHERE id = $1', [id]);
      if (existingGrade.rows.length === 0) {
        return res.status(404).json({ message: `Grade with ID ${id} not found` });
      }

      // Check if grade has participants
      const participantCount = await query(
        'SELECT COUNT(*) as count FROM participants WHERE grade_id = $1',
        [id]
      );
      
      if (parseInt(participantCount.rows[0].count) > 0) {
        return res.status(409).json({ 
          message: `Cannot delete grade. It has ${participantCount.rows[0].count} participants assigned to it`
        });
      }

      // Delete the grade
      const result = await query('DELETE FROM grades WHERE id = $1 RETURNING *', [id]);
      const deletedGrade = result.rows[0];
      
      const response = {
        id: deletedGrade.id.toString(),
        name: deletedGrade.name,
        description: deletedGrade.description,
        plan: deletedGrade.plan,
        minRevenue: deletedGrade.min_revenue,
        maxRevenue: deletedGrade.max_revenue,
        performanceLevels: deletedGrade.performance_levels,
        color: deletedGrade.color,
        order: deletedGrade.order_num,
        isActive: deletedGrade.is_active,
        createdAt: deletedGrade.created_at,
        updatedAt: deletedGrade.updated_at,
        _count: { participants: 0 }
      };

      return res.status(200).json(response);
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