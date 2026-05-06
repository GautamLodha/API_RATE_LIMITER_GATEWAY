const express = require('express');
const { isAllowed } = require('./redisLimiter'); // Assuming your logic is in limiter.js

const app = express();
const PORT = 3000;

app.use(async (req, res, next) => {
    const ip = req.ip;

    try {
        const allowed = await isAllowed(ip);

        if (!allowed) {
            console.log(`[BLOCKED] IP: ${ip}`);
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'You have exceeded your limit. Please try again later.'
            });
        }
        next();
    } catch (error) {
        console.error("Rate Limiter Error:", error);
        next();
    }
});

app.get('/api/data', (req, res) => {
    res.json({
        success: true,
        data: "Here is your protected data!"
    });
});

app.listen(PORT, () => {
    console.log(`Gateway is running on http://localhost:${PORT}`);
});