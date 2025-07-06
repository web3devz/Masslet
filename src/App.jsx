import React, { useState } from 'react';
import { createWallet } from './wallet';
import { encryptPrivateKey } from './encrypt';
import { getWalletBalance } from './rpc';

function App() {
  const [wallet, setWallet] = useState(null);
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState('0');

  const handleCreate = async () => {
    const newWallet = await createWallet();
    const encrypted = await encryptPrivateKey(newWallet.privateKey, password);

    const secureWallet = {
      mnemonic: newWallet.mnemonic,
      publicKey: newWallet.publicKey,
      address: newWallet.address,
      encryptedPrivateKey: encrypted
    };

    localStorage.setItem('masslet_wallet', JSON.stringify(secureWallet));
    setWallet(secureWallet);

    const fetchedBalance = await getWalletBalance(secureWallet.address);
    setBalance(fetchedBalance);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Masslet Wallet</h1>
      <input
        type="password"
        placeholder="Enter password"
        className="mt-2 p-2 border rounded w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        onClick={handleCreate}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Create Wallet
      </button>

      {wallet && (
        <div className="mt-4">
          <p><strong>Address:</strong> {wallet.address}</p>
          <p><strong>Mnemonic:</strong> {wallet.mnemonic}</p>
          <p><strong>Balance:</strong> {balance} MASSA</p>
        </div>
      )}
    </div>
  );
}

export default App;
