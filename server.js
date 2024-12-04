const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3002;
    app.listen(port, () => {
        console.log(`Nightcore Generator running at http://localhost:${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use`);
        } else {
            console.error(err);
        }
    });
}

// Export the Express app for Vercel
module.exports = app;
