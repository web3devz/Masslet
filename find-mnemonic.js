import { importWalletFromMnemonic } from './src/wallet.js';

// Test different mnemonics to see which one generates the target address
const targetAddress = 'AU12Zs74kCW3CAASPqKtBrnQdWMNahiB3oCgFhpVBoRGvQ12XmUGA';

// Some test mnemonics (you should replace with the actual mnemonic that generates this address)
const testMnemonics = [
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  'test test test test test test test test test test test test',
  'wallet wallet wallet wallet wallet wallet wallet wallet wallet wallet wallet wallet'
];

async function findMatchingMnemonic() {
  console.log('Looking for mnemonic that generates:', targetAddress);
  
  for (const mnemonic of testMnemonics) {
    try {
      const wallet = await importWalletFromMnemonic(mnemonic);
      console.log(`Mnemonic: ${mnemonic}`);
      console.log(`Generated address: ${wallet.address}`);
      console.log(`Matches target: ${wallet.address === targetAddress}`);
      console.log('---');
      
      if (wallet.address === targetAddress) {
        console.log('✅ FOUND MATCHING MNEMONIC!');
        console.log('Mnemonic:', mnemonic);
        return mnemonic;
      }
    } catch (error) {
      console.error('Error with mnemonic:', mnemonic, error.message);
    }
  }
  
  console.log('❌ No matching mnemonic found in test set');
  console.log('You need to import with the specific mnemonic that generates', targetAddress);
}

findMatchingMnemonic();
