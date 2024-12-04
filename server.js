const express = require('express');
const app = express();
const port = 3002; // Try port 3002

app.use(express.static('./'));

app.listen(port, () => {
    console.log(`Nightcore Generator running at http://localhost:${port}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
    } else {
        console.error(err);
    }
});
