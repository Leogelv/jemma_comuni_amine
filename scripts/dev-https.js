#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');
const path = require('path');
const net = require('net');
const next = require('next');

// ---------------------- helpers ----------------------
/**
 * Возвращает первый внешний IPv4 адрес из сетевых интерфейсов.
 */
function getLocalIPv4() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

/**
 * Возвращает все IPv4 адреса из сетевых интерфейсов.
 */
function getAllLocalIPv4() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : ['127.0.0.1'];
}

function ensureCertificatesDir() {
  const dir = path.join(process.cwd(), 'certificates');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function execQuiet(cmd) {
  execSync(cmd, { stdio: 'ignore', shell: true });
}

function execLoud(cmd) {
  execSync(cmd, { stdio: 'inherit', shell: true });
}

function getMkcertCARoot() {
  try {
    return execSync('mkcert -CAROOT', { encoding: 'utf8', shell: true }).trim();
  } catch (e) {
    console.warn('⚠️  Не удалось определить mkcert -CAROOT:', e.message);
    return null;
  }
}

function exportRootCertificate(certDir) {
  const caRoot = getMkcertCARoot();
  if (!caRoot) {
    console.warn('⚠️  Пропускаю экспорт корневого сертификата mkcert.');
    return;
  }

  const sourcePath = path.join(caRoot, 'rootCA.pem');
  if (!fs.existsSync(sourcePath)) {
    console.warn(`⚠️  В каталоге mkcert отсутствует rootCA.pem (${sourcePath})`);
    return;
  }

  const iosDir = path.join(certDir, 'ios');
  const androidDir = path.join(certDir, 'android');
  fs.mkdirSync(iosDir, { recursive: true });
  fs.mkdirSync(androidDir, { recursive: true });

  const iosTarget = path.join(iosDir, 'mkcert-root.cer');
  const androidTarget = path.join(androidDir, 'mkcert-root.crt');

  fs.copyFileSync(sourcePath, iosTarget);
  fs.copyFileSync(sourcePath, androidTarget);

  console.log(`\n📁 Корневой сертификат mkcert скопирован в:`);
  console.log(`   ${iosTarget}`);
  console.log(`   ${androidTarget}`);
}

function ensureMkcert() {
  try {
    execQuiet('which mkcert');
    return;
  } catch {
    console.log('ℹ️  mkcert не найден. Пробую установить через Homebrew...');
    if (process.platform === 'darwin') {
      try {
        execLoud('brew install mkcert');
        return;
      } catch (e) {
        console.error('❌ Не удалось установить mkcert автоматически. Установи вручную: brew install mkcert');
        process.exit(1);
      }
    }
    console.error('❌ mkcert не установлен. Поставь вручную: https://github.com/FiloSottile/mkcert');
    process.exit(1);
  }
}

function installMkcertRoot() {
  try {
    execLoud('mkcert -install');
  } catch (e) {
    console.error('❌ mkcert -install завершился с ошибкой');
    process.exit(1);
  }
}

function generateCertificates(certPath, keyPath, names) {
  const uniqueNames = Array.from(new Set(names.filter(Boolean)));
  console.log(`✓ Генерирую сертификаты для: ${uniqueNames.join(' ')}`);
  try {
    execLoud(`mkcert -cert-file "${certPath}" -key-file "${keyPath}" ${uniqueNames.join(' ')}`);
  } catch (e) {
    console.error('❌ Не удалось создать сертификаты mkcert');
    process.exit(1);
  }
}

function freePort(port) {
  try {
    if (process.platform === 'darwin' || process.platform === 'linux') {
      execQuiet(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    } else if (process.platform === 'win32') {
      execQuiet(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F 2>nul || true`);
    }
    console.log(`✓ Порт ${port} освобожден`);
  } catch (e) {
    // Ничего не делаем, если не получилось - сервер свалится с понятной ошибкой.
  }
}

// ---------------------- cloudflared / tunnel ----------------------
function killTunnel() {
  try {
    execQuiet('pkill -9 cloudflared 2>/dev/null || true');
    execQuiet('pkill -9 ngrok 2>/dev/null || true');
  } catch (e) {
    // Ignore
  }
}

function checkCloudflaredInstalled() {
  try {
    execQuiet('which cloudflared');
    return true;
  } catch {
    return false;
  }
}

async function startCloudflared(port) {
  if (!checkCloudflaredInstalled()) {
    console.log('\n⚠️  cloudflared не установлен.');
    console.log('   Установи: brew install cloudflared');
    return null;
  }

  // Убиваем старые процессы
  killTunnel();
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\n🌐 Запускаю Cloudflare Tunnel...');

  return new Promise((resolve) => {
    // cloudflared выводит URL в stderr
    const cfProcess = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let tunnelUrl = null;
    let resolved = false;

    const handleOutput = (data) => {
      const output = data.toString();
      // Ищем URL вида https://xxx.trycloudflare.com
      const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (match && !resolved) {
        tunnelUrl = match[0];
        resolved = true;
        console.log(`✅ Cloudflare Tunnel создан!`);
        resolve(tunnelUrl);
      }
    };

    cfProcess.stdout.on('data', handleOutput);
    cfProcess.stderr.on('data', handleOutput);

    cfProcess.unref();

    // Таймаут 30 секунд
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.log('⚠️  Не удалось получить Cloudflare URL за 30 секунд.');
        resolve(null);
      }
    }, 30000);
  });
}

function checkPortAvailable(port, hostname) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve(true));
      })
      .listen(port, hostname);
  });
}

async function findAvailablePort({ startPort, hostname }) {
  const maxAttempts = 100;
  for (let idx = 0; idx < maxAttempts; idx += 1) {
    const port = startPort + idx;
    try {
      const available = await checkPortAvailable(port, hostname);
      if (available) {
        return port;
      }
    } catch (err) {
      console.warn(`⚠️  Проблема при проверке порта ${port}:`, err.message);
    }
  }
  throw new Error(`Не удалось найти свободный порт, начиная с ${startPort}`);
}

async function startServer({ certPath, keyPath, hostname, port }) {
  const app = next({ dev: true, hostname, port });

  await app.prepare();

  const handle = app.getRequestHandler();
  const upgrade = app.getUpgradeHandler();

  const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
  };

  // HTTPS сервер для локальной разработки
  const server = https.createServer(httpsOptions, (req, res) => handle(req, res));

  server.on('upgrade', (req, socket, head) => {
    upgrade(req, socket, head);
  });

  // HTTP сервер для Cloudflare Tunnel (внутренний, только localhost)
  const httpPort = port + 1000; // 3001 -> 4001
  const httpServer = http.createServer((req, res) => handle(req, res));

  httpServer.on('upgrade', (req, socket, head) => {
    upgrade(req, socket, head);
  });

  console.log('\n🚀 Стартую Next dev-сервер (HTTPS + HTTP для tunnel) ...');

  // Запускаем оба сервера
  await Promise.all([
    new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, hostname, () => {
        server.removeListener('error', reject);
        resolve();
      });
    }),
    new Promise((resolve, reject) => {
      httpServer.once('error', reject);
      httpServer.listen(httpPort, '127.0.0.1', () => {
        httpServer.removeListener('error', reject);
        resolve();
      });
    }),
  ]);

  const devUrl = `https://localhost:${port}`;
  console.log(`\n➡️  Локально: ${devUrl}`);
  console.log(`   (HTTP для tunnel: http://127.0.0.1:${httpPort})`);

  const allIPs = getAllLocalIPv4();
  console.log(`\n🌐 Доступен в сети по адресам:`);
  allIPs.forEach(ip => {
    console.log(`   https://${ip}:${port}`);
  });

  // Запускаем Cloudflare Tunnel (можно отключить через SKIP_TUNNEL=1)
  // Используем HTTP порт (4001) для tunnel, т.к. cloudflared не любит self-signed certs
  const skipTunnel = process.env.SKIP_TUNNEL === '1' || process.env.SKIP_TUNNEL === 'true';
  const tunnelUrl = skipTunnel ? null : await startCloudflared(httpPort);

  console.log('\n' + '═'.repeat(60));
  console.log('📱 TELEGRAM MINI APP READY');
  console.log('═'.repeat(60));

  if (skipTunnel) {
    console.log('\n⏭️  Tunnel отключён (SKIP_TUNNEL=1)');
  } else if (tunnelUrl) {
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│  🌍 CLOUDFLARE URL (используй в BotFather):             │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  ${tunnelUrl.padEnd(55)} │`);
    console.log('└─────────────────────────────────────────────────────────┘');
    console.log('\n   ✅ Без warnings — прямой доступ!');
  } else {
    console.log('\n⚠️  Не удалось запустить Cloudflare Tunnel');
  }

  console.log(`\n🏠 Локальная сеть: https://${allIPs[0]}:${port}`);

  console.log('\n' + '═'.repeat(60));

  const shutdown = () => {
    console.log('\n⏹️  Завершаю dev-сервер...');
    killTunnel(); // Убиваем cloudflared при завершении
    httpServer.close();
    server.close(() => {
      const maybeClose = app && typeof app.close === 'function' ? app.close() : null;
      if (maybeClose && typeof maybeClose.then === 'function') {
        maybeClose.finally(() => process.exit(0));
      } else {
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// ---------------------- main ----------------------
(async () => {
  const port = Number(process.env.DEV_HTTPS_PORT || 3001);
  const hostname = '0.0.0.0';
  const ip = getLocalIPv4();
  const allIPs = getAllLocalIPv4();
  const altHosts = (process.env.DEV_HTTPS_EXTRA_HOSTS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  console.log(`\n✓ Основной локальный IP: ${ip}`);
  console.log(`✓ Все найденные IP адреса: ${allIPs.join(', ')}`);

  const certDir = ensureCertificatesDir();
  const certPath = path.join(certDir, 'cert.pem');
  const keyPath = path.join(certDir, 'key.pem');

  ensureMkcert();
  installMkcertRoot();

  exportRootCertificate(certDir);

  // Включаем все найденные IP адреса в сертификат
  generateCertificates(certPath, keyPath, [
    'localhost',
    '127.0.0.1',
    '::1',
    ...allIPs,
    ...altHosts,
  ]);

  // Очищаем кэш Next.js
  console.log(`\n🧹 Очищаю кэш Next.js...`);
  const cacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmSync(cacheDir, { recursive: true, force: true });
      console.log(`✓ Кэш .next удалён`);
    } catch (e) {
      console.warn(`⚠️  Не удалось удалить кэш .next:`, e.message);
    }
  } else {
    console.log(`✓ Кэш .next не найден (чистый запуск)`);
  }

  // Сначала убиваем все процессы на порту 3001
  console.log(`\n🔄 Освобождаю порт ${port}...`);
  freePort(port);

  // Небольшая задержка, чтобы порт точно освободился
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    await startServer({ certPath, keyPath, hostname, port });
  } catch (err) {
    console.error('❌ Не удалось запустить dev-сервер:', err);
    process.exit(1);
  }
})();
