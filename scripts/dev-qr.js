const os = require('os');
const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

function getLocalExternalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    // Usually prefer Wi-Fi or Ethernet
    for (const iface of interfaces[name]) {
      const { address, family, internal } = iface;
      // Filter for IPv4 and not localhost (internal)
      if (family === 'IPv4' && !internal) {
        // Exclude virtual adapters like WSL, Docker, VMware (often start with 172. or 192.168. but name helps)
        // For standard local network it works well to just take the first valid non-internal IP.
        return address;
      }
    }
  }
  return 'localhost';
}

const ip = getLocalExternalIP();
const port = process.env.PORT || 3000;
const localUrl = `http://${ip}:${port}`;

console.log('\n\x1b[36m%s\x1b[0m', `Scan the QR code to view localhost on your mobile device:`);
console.log('\x1b[32m%s\x1b[0m', `Network URL: ${localUrl}\n`);

// Generate QR Code in the terminal (using small layout for better terminal fit)
qrcode.generate(localUrl, { small: true }, (qr) => {
  console.log(qr);
});

console.log('\x1b[33m%s\x1b[0m', `Starting Next.js development server...\n`);

// Start Next.js bound to 0.0.0.0 to allow network access
// We use cross-platform spawn execution
const command = /^win/.test(process.platform) ? 'npx.cmd' : 'npx';
const nextDev = spawn(command, ['next', 'dev', '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Failed to start Next.js dev server.');
  console.error(err);
});

// Propagate kill signals to the child process
['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach((signal) => {
  process.on(signal, () => {
    nextDev.kill(signal);
    process.exit();
  });
});
