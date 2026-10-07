const localtunnel = require('localtunnel');
const fs = require('fs');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 5000, subdomain: 'skybolt-ai-agora' });
    console.log('TUNNEL_URL:' + tunnel.url);
    fs.writeFileSync('tunnel_url.txt', tunnel.url);

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.log('Tunnel error:', err);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.log('Failed to start tunnel, retrying without subdomain in 3s...');
    try {
      const fallbackTunnel = await localtunnel({ port: 5000 });
      console.log('TUNNEL_URL:' + fallbackTunnel.url);
      fs.writeFileSync('tunnel_url.txt', fallbackTunnel.url);
      fallbackTunnel.on('close', () => setTimeout(startTunnel, 3000));
    } catch (e) {
      setTimeout(startTunnel, 3000);
    }
  }
}

startTunnel();
