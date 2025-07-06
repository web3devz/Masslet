import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';

export async function createWallet() {
  const mnemonic = bip39.generateMnemonic();
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const seedBuffer = Buffer.from(seed).slice(0, 32);
  const keypair = nacl.sign.keyPair.fromSeed(seedBuffer);

  return {
    mnemonic,
    publicKey: Buffer.from(keypair.publicKey).toString('hex'),
    privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    address: 'MASSA1_' + Buffer.from(keypair.publicKey).toString('hex').slice(0, 32)
  };
}
