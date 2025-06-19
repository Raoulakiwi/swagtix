const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const walletPath = path.join(__dirname, '../wallet/dist');
const wwwPath = path.join(__dirname, 'www');

// Ensure www directory exists
if (!fs.existsSync(wwwPath)) {
  fs.mkdirSync(wwwPath, { recursive: true });
}

// Function to copy files recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    // Create directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    // Copy each file in the directory
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Copy file
    fs.copyFileSync(src, dest);
  }
}

// Build the wallet
console.log('Building wallet...');
try {
  execSync('cd ../wallet && yarn build:pro', { stdio: 'inherit' });
  console.log('Wallet built successfully.');
} catch (error) {
  console.error('Failed to build wallet:', error);
  process.exit(1);
}

// Copy wallet files to www
console.log('Copying wallet files to mobile app...');
try {
  // Clean www directory
  fs.readdirSync(wwwPath).forEach(file => {
    if (file !== 'assets') { // Preserve assets directory
      const filePath = path.join(wwwPath, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
    }
  });
  
  // Copy wallet files
  copyRecursiveSync(walletPath, wwwPath);
  
  console.log('Wallet files copied successfully.');
} catch (error) {
  console.error('Failed to copy wallet files:', error);
  process.exit(1);
}

// Update capacitor.config.json
console.log('Updating Capacitor configuration...');
try {
  const configPath = path.join(__dirname, 'capacitor.config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Update config for production
  config.server = undefined; // Remove server config for production build
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('Capacitor configuration updated.');
} catch (error) {
  console.error('Failed to update Capacitor configuration:', error);
  process.exit(1);
}

// Copy files to native projects
console.log('Copying files to native projects...');
try {
  execSync('npx cap copy', { stdio: 'inherit' });
  console.log('Files copied to native projects successfully.');
} catch (error) {
  console.error('Failed to copy files to native projects:', error);
  process.exit(1);
}

console.log('Mobile app build completed successfully!');
