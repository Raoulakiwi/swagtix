const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function reencryptWallet() {
  const currentPassword = process.argv[2];
  const newPassword = 'password'; // The new, simpler password

  if (!currentPassword) {
    console.error('Usage: node reencrypt-wallet.js <current_wallet_password>');
    console.error('Please provide the current wallet password as a command-line argument.');
    process.exit(1);
  }

  const walletPath =
    process.env.WALLET_PATH ||
    path.join(__dirname, '..', 'secure', 'encrypted-wallet.json');

  console.log(`Attempting to re-encrypt wallet at: ${walletPath}`);

  try {
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Encrypted wallet file not found at ${walletPath}`);
    }

    const encryptedWalletJson = fs.readFileSync(walletPath, 'utf8');

    console.log('Decrypting wallet with current password...');
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedWalletJson, currentPassword);
    console.log(`Wallet decrypted successfully! Address: ${wallet.address}`);

    console.log(`Re-encrypting wallet with new password: "${newPassword}"`);
    const newEncryptedWalletJson = await wallet.encrypt(newPassword);

    // Overwrite the original encrypted wallet file with the new one
    fs.writeFileSync(walletPath, newEncryptedWalletJson);
    console.log(`New encrypted wallet saved to: ${walletPath}`);

    console.log('\n--- RE-ENCRYPTION COMPLETE ---\n');
    console.log('Your wallet has been successfully re-encrypted with the new password.');
    console.log(`New password: "${newPassword}"`);
    console.log(`Wallet file: ${walletPath}`);
    console.log('\n--- NEXT STEPS ---');
    console.log('1. Update your /opt/swagtix/app/start.sh script with the new password:');
    console.log(`   WALLET_PASSWORD="${newPassword}"`);
    console.log('2. Restart your SwagTix Admin Interface:');
    console.log('   cd /opt/swagtix/app');
    console.log('   ./start.sh');
    console.log('3. Verify the wallet connection in your admin dashboard.');

  } catch (error) {
    console.error(`\n❌ Re-encryption failed: ${error.message}`);
    if (error.message.includes('invalid password')) {
      console.error('Please ensure the current wallet password provided is correct.');
    }
    process.exit(1);
  }
}

reencryptWallet();
