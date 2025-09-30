import { Pool } from 'pg';

// PostgreSQL connection string from Vercel environment
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
}

// Create connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Limit connections for serverless
});

// Database query helper
export async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Initialize database tables if they don't exist
export async function initDB() {
  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Grades table
    await query(`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        plan INTEGER NOT NULL,
        min_revenue INTEGER,
        max_revenue INTEGER,
        performance_levels JSONB,
        color VARCHAR(7) DEFAULT '#808080',
        order_num INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Participants table
    await query(`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255),
        username VARCHAR(255),
        telegram_id VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        revenue INTEGER DEFAULT 0,
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade_id INTEGER REFERENCES grades(id),
        warning_status VARCHAR(50),
        warning_count INTEGER DEFAULT 0,
        warning_periods_left INTEGER,
        warning_last_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Periods table
    await query(`
      CREATE TABLE IF NOT EXISTS periods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        participant_snapshots JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed initial data
export async function seedData() {
  try {
    // Check if grades already exist
    const existingGrades = await query('SELECT COUNT(*) FROM grades');
    if (parseInt(existingGrades.rows[0].count) > 0) {
      console.log('Data already seeded');
      return;
    }

    // Insert default grades
    const grades = [
      {
        name: 'Platinum Elite',
        description: 'Высший уровень для топ-менеджеров',
        plan: 1000000,
        min_revenue: 800000,
        max_revenue: null,
        performance_levels: JSON.stringify({
          excellent: 1200000,
          good: 1000000,
          acceptable: 800000
        }),
        color: '#FFD700',
        order_num: 0
      },
      {
        name: 'Gold Premium',
        description: 'Продвинутый уровень для опытных менеджеров',
        plan: 800000,
        min_revenue: 600000,
        max_revenue: 799999,
        performance_levels: JSON.stringify({
          excellent: 1000000,
          good: 800000,
          acceptable: 600000
        }),
        color: '#FFA500',
        order_num: 1
      },
      {
        name: 'Silver Standard',
        description: 'Стандартный уровень для менеджеров среднего звена',
        plan: 500000,
        min_revenue: 400000,
        max_revenue: 599999,
        performance_levels: JSON.stringify({
          excellent: 700000,
          good: 500000,
          acceptable: 400000
        }),
        color: '#C0C0C0',
        order_num: 2
      },
      {
        name: 'Bronze Basic',
        description: 'Базовый уровень для новых менеджеров',
        plan: 300000,
        min_revenue: 200000,
        max_revenue: 399999,
        performance_levels: JSON.stringify({
          excellent: 450000,
          good: 300000,
          acceptable: 200000
        }),
        color: '#CD7F32',
        order_num: 3
      },
      {
        name: 'Trainee',
        description: 'Стажерский уровень для новичков',
        plan: 150000,
        min_revenue: 0,
        max_revenue: 199999,
        performance_levels: JSON.stringify({
          excellent: 250000,
          good: 150000,
          acceptable: 100000
        }),
        color: '#808080',
        order_num: 4
      }
    ];

    for (const grade of grades) {
      await query(`
        INSERT INTO grades (name, description, plan, min_revenue, max_revenue, performance_levels, color, order_num)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        grade.name,
        grade.description,
        grade.plan,
        grade.min_revenue,
        grade.max_revenue,
        grade.performance_levels,
        grade.color,
        grade.order_num
      ]);
    }

    // Insert admin user
    await query(`
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin@company.com',
      'SecurePass2024!', // In production, this should be hashed
      'Системный Администратор',
      'ADMIN'
    ]);

    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}