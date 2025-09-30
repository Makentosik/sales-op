import { query, initDB, seedData } from './lib/db.js';

export default async function handler(req, res) {
  try {
    // Initialize DB on first request
    await initDB();
    await seedData();

    if (req.method === 'GET') {
      // Get all periods
      const result = await query(`
        SELECT 
          id,
          name,
          "startDate" as "startDate",
          "endDate" as "endDate",
          type,
          status,
          "participantSnapshots" as "participantSnapshots",
          "createdAt" as "createdAt",
          "updatedAt" as "updatedAt"
        FROM "Period"
        ORDER BY "createdAt" DESC
      `);

      // Transform the result to match expected format
      const periods = result.rows.map(row => ({
        id: row.id.toString(),
        name: row.name,
        startDate: row.startDate,
        endDate: row.endDate,
        type: row.type,
        status: row.status,
        participantSnapshots: row.participantSnapshots,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        _count: {
          payments: 0 // TODO: Add payments table and count
        }
      }));

      return res.status(200).json(periods);
    }

    if (req.method === 'POST') {
      // Create new period
      const { name, startDate, endDate, type } = req.body;
      
      if (!name || !startDate || !endDate || !type) {
        return res.status(400).json({ 
          message: 'name, startDate, endDate, and type are required' 
        });
      }

      const result = await query(`
        INSERT INTO "Period" (name, "startDate", "endDate", type)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [name, startDate, endDate, type]);

      const newPeriod = result.rows[0];
      
      const response = {
        id: newPeriod.id.toString(),
        name: newPeriod.name,
        startDate: newPeriod.startDate,
        endDate: newPeriod.endDate,
        type: newPeriod.type,
        status: newPeriod.status,
        participantSnapshots: newPeriod.participantSnapshots,
        createdAt: newPeriod.createdAt,
        updatedAt: newPeriod.updatedAt,
        _count: {
          payments: 0
        }
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
