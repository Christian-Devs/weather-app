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
    if (key === "MAPBOX_TOKEN") return process.env.MAPBOX_TOKEN;
    if (key === "OPENWEATHER_KEY") return process.env.OPENWEATHER_KEY;
}

export default pool;