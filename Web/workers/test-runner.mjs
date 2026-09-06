import { spawn } from 'child_process';
import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting wrangler dev...');
const wrangler = spawn('npx', ['wrangler', 'dev'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: true,
  cwd: __dirname
});

let isReady = false;

wrangler.stdout.on('data', (data) => {
  const output = data.toString();
  // console.log(`[Wrangler]: ${output}`);
  if (!isReady && output.includes('Ready on')) {
    isReady = true;
    console.log('Wrangler is ready. Starting tests...');
    runTests();
  }
});

wrangler.stderr.on('data', (data) => {
  console.error(`[Wrangler Error]: ${data}`);
});

wrangler.on('close', (code) => {
  if (!isReady) {
    console.error(`Wrangler exited early with code ${code}`);
    process.exit(1);
  }
});

async function runTests() {
  const testFiles = fs.readdirSync(path.join(__dirname, 'test'))
    .filter(file => file.endsWith('.test.mjs'))
    .map(file => path.join(__dirname, 'test', file));

  const stream = run({ files: testFiles });
  
  stream.on('test:fail', () => {
    process.exitCode = 1;
  });

  stream.compose(new spec()).pipe(process.stdout);

  stream.on('end', () => {
    console.log('Tests completed. Shutting down wrangler...');
    wrangler.kill();
    process.exit(process.exitCode || 0);
  });
}
