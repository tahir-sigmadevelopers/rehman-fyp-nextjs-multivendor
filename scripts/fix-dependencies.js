const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('Starting dependency fix process...');

// Step 1: Backup package.json and package-lock.json
console.log('Backing up package files...');
try {
  const rootDir = path.join(__dirname, '..');
  const packagePath = path.join(rootDir, 'package.json');
  const packageLockPath = path.join(rootDir, 'package-lock.json');
  
  if (fs.existsSync(packagePath)) {
    fs.copyFileSync(packagePath, `${packagePath}.bak`);
    console.log('✅ package.json backed up');
  }
  
  if (fs.existsSync(packageLockPath)) {
    fs.copyFileSync(packageLockPath, `${packageLockPath}.bak`);
    console.log('✅ package-lock.json backed up');
  }
} catch (err) {
  console.error('Error backing up files:', err);
}

// Step 2: Remove node_modules and package-lock.json
console.log('\nCleaning up existing dependencies...');
try {
  // Use OS-specific commands
  const isWindows = os.platform() === 'win32';
  if (isWindows) {
    console.log('Windows detected, using Windows commands...');
    try {
      execSync('if exist node_modules rmdir /s /q node_modules', { stdio: 'inherit' });
      console.log('✅ node_modules removed');
    } catch (e) {
      console.log('Note: Could not remove node_modules folder, it may not exist or may be in use.');
    }
  } else {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('✅ node_modules removed');
  }
  
  if (fs.existsSync(path.join(__dirname, '..', 'package-lock.json'))) {
    fs.unlinkSync(path.join(__dirname, '..', 'package-lock.json'));
    console.log('✅ package-lock.json removed');
  }
} catch (err) {
  console.error('Error cleaning up:', err);
}

// Step 3: Install dependencies with legacy peer deps
console.log('\nInstalling dependencies with --legacy-peer-deps...');
try {
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (err) {
  console.error('Error installing dependencies:', err);
  process.exit(1);
}

console.log('\n✅ Dependency fix process completed!');
console.log('\nNext steps:');
console.log('1. Run "npm run build" to test if the build works');
console.log('2. Push your changes to your repository');
console.log('3. Deploy to Vercel or your preferred hosting platform'); 