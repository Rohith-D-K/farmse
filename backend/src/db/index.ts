import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://farmse:farmse123@localhost:5432/farmse';

export const pool = new pg.Pool({ connectionString });

// Create Drizzle instance
export const db = drizzle(pool, { schema });

export { schema };
