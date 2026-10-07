const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'SkyBolt Atmospheric Nowcasting Intelligence',
    version: '2.4.0',
    target: 'Severe Thunderstorm & Lightning Nowcasting'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ SkyBolt AI Server is live on http://localhost:${PORT}`);
  console.log(`📡 Ready for Thunderstorm Nowcasting and global tunneling.`);
});
