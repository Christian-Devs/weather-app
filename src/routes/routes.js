import express from 'express';
import pool from '../database.js';
import { geoAddress } from '../services/mapbox.js';
import { getCurrWeather, getHourlyWeather, getSummary } from '../services/openweather.js';

const router = express.Router();

// Render the main page with optional weather data
router.get('/', async (req, res) => {
    const { address } = req.query;
    if (!address) {
        return res.render('index.njk', { initial: null });
    }
    try {
        const { lat, lon, place_name } = await geoAddress(address);
        const [current, hourly] = await Promise.all([getCurrWeather(lat, lon), getHourlyWeather(lat, lon)]);
        const summary = getSummary(current, hourly);
        res.render('index.njk', { initial: { address, lat, lon, place_name, summary, current, hourly } });
    } catch (e) {
        res.render('index.njk', { initial: null, error: e.message });
    }
});

// API endpoint to fetch weather data
router.post('/api/weather', async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }
        const { lat, lon, place_name } = await geoAddress(address);
        const [current, hourly] = await Promise.all([getCurrWeather(lat, lon), getHourlyWeather(lat, lon)]);
        const summary = getSummary(current, hourly);
        res.json({ address, lat, lon, place_name, summary, current, hourly });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API endpoint to save weather search to db
router.post('/api/save', async (req, res) => {
    try {
        const { address, lat, lon, current, hourly } = req.body;
        if (!address || !lat || !lon || !current || !hourly) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        await pool.query(
            'INSERT INTO saved_weather (address, lat, lon, current_forecast, hourly_forecast) VALUES (?, ?, ?, ?, ?)',
            [address, lat, lon, JSON.stringify(current), JSON.stringify(hourly)]
        );
        res.json({ message: 'Search saved successfully' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API endpoint to get saved weather history
router.get('/api/saved', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM saved_weather ORDER BY created_at DESC limit 10');
        res.json({ items: rows });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// API endpoint to get the detailed weather of a specific saved weather record by ID
router.get('/api/saved:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM saved_weather WHERE id = ? limit 1', [id]);
        if (!rows.length) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;