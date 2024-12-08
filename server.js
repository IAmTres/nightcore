const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const os = require('os');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Routes for static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

const execAsync = promisify(exec);

// Endpoint to fetch songs from YouTube/SoundCloud
app.post('/fetch-song', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    const tempDir = path.join(os.tmpdir(), 'nightcore-downloads');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const outputPath = path.join(tempDir, `${Date.now()}.%(ext)s`);
    
    try {
        // Download audio using yt-dlp
        const command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputPath}" ${url}`;
        await execAsync(command);

        // Find the downloaded file
        const files = fs.readdirSync(tempDir);
        const downloadedFile = files.find(file => file.includes(path.basename(outputPath, '.%(ext)s')));
        
        if (!downloadedFile) {
            throw new Error('Downloaded file not found');
        }

        const filePath = path.join(tempDir, downloadedFile);
        
        // Send the file
        res.sendFile(filePath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Clean up the file after sending
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Error deleting temporary file:', unlinkErr);
                }
            });
        });
    } catch (error) {
        console.error('Error downloading song:', error);
        res.status(500).json({ error: 'Failed to download song' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// For local development
const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.log(`Nightcore Generator running at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
    } else {
        console.error(err);
    }
});

// Export the Express app for Vercel
module.exports = app;
