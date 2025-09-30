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

// Initialize database tables if they don't exist (using Prisma-like schema)
export async function initDB() {
  try {
    // Create ENUMs first
    await query(`
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "PeriodType" AS ENUM ('MONTHLY', 'TEN_DAYS', 'CUSTOM');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "PeriodStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "LogType" AS ENUM ('PAYMENT', 'PARTICIPANT_JOIN', 'PARTICIPANT_LEAVE', 'GRADE_CHANGE', 'PERIOD_START', 'PERIOD_END', 'SYSTEM', 'ERROR');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "WarningStatus" AS ENUM ('WARNING_90', 'WARNING_80');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await query(`
      DO $$ BEGIN
        CREATE TYPE "TransitionType" AS ENUM ('PROMOTION', 'DEMOTION', 'INITIAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Users table (matching Prisma User model)
    await query(`
      CREATE TABLE IF NOT EXISTS "User" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT,
        role "UserRole" DEFAULT 'USER',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create the legacy users table as a view for compatibility
    await query(`
      CREATE OR REPLACE VIEW users AS
      SELECT 
        ROW_NUMBER() OVER (ORDER BY "createdAt") as id,
        email,
        password,
        name,
        role::TEXT,
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM "User"
    `);

    // Grades table (matching Prisma Grade model)
    await query(`
      CREATE TABLE IF NOT EXISTS "Grade" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        plan DOUBLE PRECISION NOT NULL,
        "minRevenue" DOUBLE PRECISION,
        "maxRevenue" DOUBLE PRECISION,
        "performanceLevels" JSONB,
        color TEXT DEFAULT '#006657',
        "order" INTEGER DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create the legacy grades table as a view for compatibility
    await query(`
      CREATE OR REPLACE VIEW grades AS
      SELECT 
        ROW_NUMBER() OVER (ORDER BY "createdAt") as id,
        name,
        description,
        plan,
        "minRevenue" as min_revenue,
        "maxRevenue" as max_revenue,
        "performanceLevels" as performance_levels,
        color,
        "order" as order_num,
        "isActive" as is_active,
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM "Grade"
    `);

    // Participants table (matching Prisma Participant model)
    await query(`
      CREATE TABLE IF NOT EXISTS "Participant" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        "telegramId" TEXT UNIQUE NOT NULL,
        username TEXT,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT,
        "phoneNumber" TEXT,
        revenue DOUBLE PRECISION DEFAULT 0,
        "isActive" BOOLEAN DEFAULT true,
        "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "gradeId" TEXT,
        "warningStatus" "WarningStatus",
        "warningPeriodsLeft" INTEGER DEFAULT 0,
        "lastPeriodRevenue" DOUBLE PRECISION DEFAULT 0,
        "lastCompletionPercentage" DOUBLE PRECISION DEFAULT 0,
        "userId" TEXT,
        FOREIGN KEY ("gradeId") REFERENCES "Grade"(id) ON DELETE SET NULL,
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE SET NULL
      )
    `);

    // Create the legacy participants table as a view for compatibility
    await query(`
      CREATE OR REPLACE VIEW participants AS
      SELECT 
        ROW_NUMBER() OVER (ORDER BY "createdAt") as id,
        "firstName" as first_name,
        "lastName" as last_name,
        username,
        "telegramId" as telegram_id,
        "isActive" as is_active,
        revenue,
        "joinedAt" as join_date,
        (SELECT ROW_NUMBER() OVER (ORDER BY g."createdAt") FROM "Grade" g WHERE g.id = p."gradeId") as grade_id,
        "warningStatus"::TEXT as warning_status,
        0 as warning_count, -- legacy field
        "warningPeriodsLeft" as warning_periods_left,
        NULL::TIMESTAMP as warning_last_date, -- legacy field
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM "Participant" p
    `);

    // Periods table (matching Prisma Period model)
    await query(`
      CREATE TABLE IF NOT EXISTS "Period" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        name TEXT NOT NULL,
        "startDate" TIMESTAMP(3) NOT NULL,
        "endDate" TIMESTAMP(3) NOT NULL,
        type "PeriodType" DEFAULT 'MONTHLY',
        status "PeriodStatus" DEFAULT 'PENDING',
        "participantSnapshots" JSONB,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create the legacy periods table as a view for compatibility
    await query(`
      CREATE OR REPLACE VIEW periods AS
      SELECT 
        ROW_NUMBER() OVER (ORDER BY "createdAt") as id,
        name,
        "startDate" as start_date,
        "endDate" as end_date,
        type::TEXT,
        status::TEXT,
        "participantSnapshots" as participant_snapshots,
        "createdAt" as created_at,
        "updatedAt" as updated_at
      FROM "Period"
    `);

    console.log('Database tables initialized with Prisma schema');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Seed initial data using Prisma schema
export async function seedData() {
  try {
    // Check if grades already exist
    const existingGrades = await query('SELECT COUNT(*) FROM "Grade"');
    if (parseInt(existingGrades.rows[0].count) > 0) {
      console.log('Data already seeded');
      return;
    }

    // Insert default grades into Prisma Grade table
    const grades = [
      {
        name: 'Platinum Elite',
        description: 'Высший уровень для топ-менеджеров',
        plan: 1000000,
        minRevenue: 800000,
        maxRevenue: null,
        performanceLevels: JSON.stringify({
          excellent: 1200000,
          good: 1000000,
          acceptable: 800000
        }),
        color: '#FFD700',
        order: 0
      },
      {
        name: 'Gold Premium',
        description: 'Продвинутый уровень для опытных менеджеров',
        plan: 800000,
        minRevenue: 600000,
        maxRevenue: 799999,
        performanceLevels: JSON.stringify({
          excellent: 1000000,
          good: 800000,
          acceptable: 600000
        }),
        color: '#FFA500',
        order: 1
      },
      {
        name: 'Silver Standard',
        description: 'Стандартный уровень для менеджеров среднего звена',
        plan: 500000,
        minRevenue: 400000,
        maxRevenue: 599999,
        performanceLevels: JSON.stringify({
          excellent: 700000,
          good: 500000,
          acceptable: 400000
        }),
        color: '#C0C0C0',
        order: 2
      },
      {
        name: 'Bronze Basic',
        description: 'Базовый уровень для новых менеджеров',
        plan: 300000,
        minRevenue: 200000,
        maxRevenue: 399999,
        performanceLevels: JSON.stringify({
          excellent: 450000,
          good: 300000,
          acceptable: 200000
        }),
        color: '#CD7F32',
        order: 3
      },
      {
        name: 'Trainee',
        description: 'Стажерский уровень для новичков',
        plan: 150000,
        minRevenue: 0,
        maxRevenue: 199999,
        performanceLevels: JSON.stringify({
          excellent: 250000,
          good: 150000,
          acceptable: 100000
        }),
        color: '#808080',
        order: 4
      }
    ];

    for (const grade of grades) {
      await query(`
        INSERT INTO "Grade" (name, description, plan, "minRevenue", "maxRevenue", "performanceLevels", color, "order")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        grade.name,
        grade.description,
        grade.plan,
        grade.minRevenue,
        grade.maxRevenue,
        grade.performanceLevels,
        grade.color,
        grade.order
      ]);
    }

    // Insert admin user into Prisma User table
    await query(`
      INSERT INTO "User" (email, password, name, role)
      VALUES ($1, $2, $3, $4::"UserRole")
      ON CONFLICT (email) DO NOTHING
    `, [
      'admin@company.com',
      'SecurePass2024!', // In production, this should be hashed
      'Системный Администратор',
      'ADMIN'
    ]);

    console.log('Initial data seeded successfully with Prisma schema');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
}
