const fs = require('fs');
const { execSync } = require('child_process');

const devVars = fs.readFileSync('.dev.vars', 'utf-8');
const match = devVars.match(/FIREBASE_SERVICE_ACCOUNT_JSON='(.*)'/);
if (match) {
  // Replace escaped newlines with actual newlines
  const jsonStr = match[1].replace(/\\n/g, '\n');
  fs.writeFileSync('temp.json', jsonStr);
  console.log('Created temp.json');
  
  try {
    console.log('Uploading secret...');
    execSync('npx wrangler secret put FIREBASE_SERVICE_ACCOUNT_JSON < temp.json', { stdio: 'inherit' });
    console.log('Secret uploaded successfully!');
  } catch (err) {
    console.error('Error uploading secret', err);
  } finally {
    fs.unlinkSync('temp.json');
  }
} else {
  console.log('Secret not found in .dev.vars');
}
