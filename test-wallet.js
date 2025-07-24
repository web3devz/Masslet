import { createWallet } from './src/wallet.js';

async function testWallet() {
  try {
    console.log('Testing wallet generation...');
    const wallet = await createWallet();
    console.log('Generated wallet:');
    console.log('Address:', wallet.address);
    console.log('Address length:', wallet.address.length);
    console.log('Starts with AU:', wallet.address.startsWith('AU'));
    console.log('Public Key:', wallet.publicKey);
    console.log('Private Key:', wallet.privateKey.slice(0, 20) + '...');
    console.log('Mnemonic:', wallet.mnemonic);
  } catch (error) {
    console.error('Error testing wallet:', error);
  }
}

testWallet();
