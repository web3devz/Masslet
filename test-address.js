import { createWallet } from './src/wallet.js';

async function testWalletAddress() {
  try {
    console.log('Testing new wallet address generation...\n');
    
    const wallet = await createWallet();
    
    console.log('📊 NEW WALLET DETAILS:');
    console.log('Address:', wallet.address);
    console.log('Address Length:', wallet.address.length);
    console.log('Starts with A:', wallet.address.startsWith('A'));
    console.log('Expected format example: AU125EqUooCoopsR9373EbGc9sfz2r95Pr7jRx6SPnJhHAp5n5Uyj');
    console.log('Generated format:        ', wallet.address);
    
    // Test multiple addresses to see pattern
    console.log('\n🔄 Testing multiple addresses:');
    for (let i = 0; i < 3; i++) {
      const testWallet = await createWallet();
      console.log(`${i + 1}. ${testWallet.address} (${testWallet.address.length} chars)`);
    }
    
  } catch (error) {
    console.error('Error testing wallet:', error);
  }
}

testWalletAddress();
