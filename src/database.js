import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10
});

//get the API keys from the database
export async function getApiKeys(name) {
    const [rows] = await pool.query('SELECT key_val FROM apikeys where key_name = ? limit 1', [name]);
    if (!rows.length) {
        throw new Error('No API keys found');
    }
    return rows[0].key_val;
}

export default pool;