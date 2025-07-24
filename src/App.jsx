import React, { useState, useEffect } from 'react';
import { createWallet, importWalletFromMnemonic } from './wallet';
import { encryptPrivateKey, decryptPrivateKey } from './encrypt';
import { getWalletBalance, sendTransaction, getTransactionHistory, getNetworkInfo } from './rpc';
import QRCodeComponent from './QRCode';
import QRCode from 'qrcode';
import nacl from 'tweetnacl';

function App() {
  const [wallet, setWallet] = useState(null);
  const [password, setPassword] = useState('');
  const [balance, setBalance] = useState('0.000000');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState('wallet');
  const [sendAmount, setSendAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [importMnemonic, setImportMnemonic] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [transactionHistoryLoading, setTransactionHistoryLoading] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [decryptedPrivateKey, setDecryptedPrivateKey] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(null); // 'mnemonic' or 'privateKey'
  const [walletName, setWalletName] = useState('My Wallet');
  const [savedWallets, setSavedWallets] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  
  // New feature states
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [addressBook, setAddressBook] = useState([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactAddress, setNewContactAddress] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showConfirmTransaction, setShowConfirmTransaction] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [estimatedFee, setEstimatedFee] = useState('0.01');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  useEffect(() => {
    loadSavedWallet();
    loadSavedWalletsList();
    loadNetworkInfo();
    loadAddressBook();
    loadDarkMode();
  }, []);

  useEffect(() => {
    if (wallet && isUnlocked) {
      loadTransactionHistory();
    }
  }, [wallet, isUnlocked]);

  const loadNetworkInfo = async () => {
    try {
      const info = await getNetworkInfo();
      console.log('Network info loaded:', info);
      
      // Ensure all values are safe for rendering
      const safeNetworkInfo = {
        network: String(info?.network || 'Unknown'),
        blockHeight: String(info?.blockHeight || 'Unknown'),
        peers: typeof info?.peers === 'number' ? info.peers : 0,
        version: String(info?.version || 'Unknown')
      };
      
      setNetworkInfo(safeNetworkInfo);
    } catch (error) {
      console.error('Error loading network info:', error);
      setNetworkInfo({
        network: 'Unknown',
        blockHeight: 'Unknown',
        peers: 0,
        version: 'Unknown'
      });
    }
  };

  const loadTransactionHistory = async () => {
    if (wallet) {
      try {
        setTransactionHistoryLoading(true);
        console.log('Loading transaction history for:', wallet.address);
        const history = await getTransactionHistory(wallet.address);
        console.log('Transaction history loaded:', history.length, 'transactions');
        setTransactionHistory(history);
      } catch (error) {
        console.error('Error loading transaction history:', error);
        // Try to load from localStorage as fallback
        const localHistory = localStorage.getItem('masslet_transactions_' + wallet.address);
        if (localHistory) {
          setTransactionHistory(JSON.parse(localHistory));
        } else {
          setTransactionHistory([]);
        }
      } finally {
        setTransactionHistoryLoading(false);
      }
    }
  };

  const loadSavedWallet = () => {
    try {
      const savedWallet = localStorage.getItem('masslet_wallet');
      const savedPassword = localStorage.getItem('massa_wallet_password');
      if (savedWallet) {
        const parsedWallet = JSON.parse(savedWallet);
        setWallet(parsedWallet);
        console.log('Wallet loaded from localStorage:', parsedWallet.address);
        if (savedPassword) {
          setPassword(savedPassword);
        }
      } else {
        console.log('No saved wallet found');
      }
    } catch (error) {
      console.error('Error loading saved wallet:', error);
      // Clear corrupted data
      localStorage.removeItem('masslet_wallet');
      localStorage.removeItem('massa_wallet_password');
    }
  };  const loadSavedWalletsList = () => {
    const saved = localStorage.getItem('masslet_wallets_list');
    if (saved) {
      setSavedWallets(JSON.parse(saved));
    }
  };

  const saveWalletToList = (walletData, name) => {
    const walletInfo = {
      name: name || `Wallet ${Date.now()}`,
      address: walletData.address,
      createdAt: new Date().toISOString()
    };
    const updatedList = [...savedWallets, walletInfo];
    setSavedWallets(updatedList);
    localStorage.setItem('masslet_wallets_list', JSON.stringify(updatedList));
  };

  const refreshBalance = async (address) => {
    setBalanceLoading(true);
    try {
      const fetchedBalance = await getWalletBalance(address);
      setBalance(fetchedBalance);
      setLastBalanceUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing balance:', error);
      setBalance('0.000000');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!password) {
      alert('Please enter a password');
      return;
    }

    const newWallet = await createWallet();
    const encrypted = await encryptPrivateKey(newWallet.privateKey, password);

    const secureWallet = {
      mnemonic: newWallet.mnemonic,
      address: newWallet.address,
      encryptedPrivateKey: encrypted,
      name: walletName
      // Note: We don't store the plain private key for security
    };

    localStorage.setItem('masslet_wallet', JSON.stringify(secureWallet));
    setWallet(secureWallet);
    saveWalletToList(secureWallet, walletName);

    await refreshBalance(secureWallet.address);
    setIsUnlocked(true);
  };

  const handleImport = async () => {
    if (!password || !importMnemonic) {
      alert('Please enter both password and mnemonic');
      return;
    }

    try {
      const importedWallet = await importWalletFromMnemonic(importMnemonic);
      const encrypted = await encryptPrivateKey(importedWallet.privateKey, password);

      const secureWallet = {
        mnemonic: importedWallet.mnemonic,
        address: importedWallet.address,
        encryptedPrivateKey: encrypted,
        name: walletName
        // Note: We don't store the plain private key for security
      };

      localStorage.setItem('masslet_wallet', JSON.stringify(secureWallet));
      setWallet(secureWallet);
      saveWalletToList(secureWallet, walletName);

      await refreshBalance(secureWallet.address);
      setIsUnlocked(true);
      setImportMnemonic('');
    } catch (error) {
      alert('Invalid mnemonic phrase');
    }
  };

  const handleUnlock = async () => {
    if (!wallet || !unlockPassword) {
      alert('Please enter your password');
      return;
    }

    try {
      await decryptPrivateKey(wallet.encryptedPrivateKey, unlockPassword);
      setIsUnlocked(true);
      refreshBalance(wallet.address);
    } catch (error) {
      alert('Incorrect password');
    }
  };

  const handleSend = () => {
    if (!unlockPassword) {
      alert('Please enter your password first');
      return;
    }
    
    // Estimate fee when amount changes
    estimateFee(sendAmount);
    
    // Show confirmation dialog
    confirmTransaction();
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setUnlockPassword('');
    setActiveTab('wallet');
    setShowMnemonic(false);
    setShowPrivateKey(false);
    setDecryptedPrivateKey(''); // Clear sensitive data
    setShowPasswordPrompt(null);
    setVerifyPassword('');
  };

  const handleShowSensitiveData = async (type) => {
    if (!verifyPassword) {
      setShowPasswordPrompt(type);
      return;
    }

    try {
      // Verify password by trying to decrypt private key
      const decryptedKey = await decryptPrivateKey(wallet.encryptedPrivateKey, verifyPassword);
      
      if (type === 'mnemonic') {
        setShowMnemonic(true);
      } else if (type === 'privateKey') {
        setDecryptedPrivateKey(decryptedKey);
        setShowPrivateKey(true);
      }
      
      setShowPasswordPrompt(null);
      setVerifyPassword('');
    } catch (error) {
      alert('Incorrect password');
      setVerifyPassword('');
    }
  };

  const hideSensitiveData = (type) => {
    if (type === 'mnemonic') {
      setShowMnemonic(false);
    } else if (type === 'privateKey') {
      setShowPrivateKey(false);
      setDecryptedPrivateKey(''); // Clear decrypted key from memory
    }
    setVerifyPassword('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  // New utility functions for extra features
  const generateQRCode = async (data) => {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeData(qrCodeDataURL);
      setShowQRCode(true);
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code');
    }
  };

  const loadDarkMode = () => {
    const savedDarkMode = localStorage.getItem('masslet_dark_mode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('masslet_dark_mode', JSON.stringify(newDarkMode));
  };

  const loadAddressBook = () => {
    const savedAddressBook = localStorage.getItem('masslet_address_book');
    if (savedAddressBook) {
      setAddressBook(JSON.parse(savedAddressBook));
    }
  };

  const addToAddressBook = (name, address) => {
    if (!name.trim() || !address.trim()) {
      alert('Please enter both name and address');
      return;
    }

    if (!address.startsWith('AU') || address.length < 50) {
      alert('Please enter a valid Massa address');
      return;
    }

    const newContact = {
      id: Date.now(),
      name: name.trim(),
      address: address.trim()
    };

    const updatedAddressBook = [...addressBook, newContact];
    setAddressBook(updatedAddressBook);
    localStorage.setItem('masslet_address_book', JSON.stringify(updatedAddressBook));

    setNewContactName('');
    setNewContactAddress('');
  };

  const removeFromAddressBook = (index) => {
    const updatedAddressBook = addressBook.filter((_, i) => i !== index);
    setAddressBook(updatedAddressBook);
    localStorage.setItem('masslet_address_book', JSON.stringify(updatedAddressBook));
  };

  const selectFromAddressBook = (address) => {
    setRecipientAddress(address);
    setShowAddressBook(false);
  };

  const estimateFee = (amount) => {
    // Simple fee estimation - in reality this might be more complex
    const baselineFee = 0.01;
    const amountNum = parseFloat(amount) || 0;
    const estimatedFee = amountNum > 10 ? baselineFee * 1.1 : baselineFee;
    setEstimatedFee(estimatedFee.toFixed(6));
  };

  const confirmTransaction = () => {
    if (!recipientAddress || !sendAmount) {
      alert('Please fill in all fields');
      return;
    }

    if (!recipientAddress.startsWith('AU') || recipientAddress.length < 50) {
      alert('Please enter a valid recipient address');
      return;
    }

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Check balance including fee
    const currentBalance = parseFloat(balance);
    const totalRequired = amount + parseFloat(estimatedFee);
    if (totalRequired > currentBalance) {
      alert(`Insufficient balance. You need ${totalRequired.toFixed(6)} MAS (including fee), but have ${balance} MAS available.`);
      return;
    }

    setPendingTransaction({
      to: recipientAddress,
      amount: sendAmount,
      fee: estimatedFee
    });
    setShowConfirmTransaction(true);
  };

  const executeTransaction = async () => {
    setSendLoading(true);
    setShowConfirmTransaction(false);
    
    try {
      // Send the transaction with encrypted private key and password
      const result = await sendTransaction(wallet.encryptedPrivateKey, wallet.address, recipientAddress, sendAmount, unlockPassword);
      
      if (result && result.success) {
        // Create transaction record
        const transaction = {
          id: result.operationId || 'tx_' + Date.now(),
          from: wallet.address,
          to: recipientAddress,
          amount: sendAmount,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        
        // Update local transaction history
        const currentHistory = await getTransactionHistory(wallet.address);
        const updatedHistory = [transaction, ...currentHistory];
        setTransactionHistory(updatedHistory);
        
        // Save to localStorage for this address
        localStorage.setItem('masslet_transactions_' + wallet.address, JSON.stringify(updatedHistory));
        
        // Reset form
        setSendAmount('');
        setRecipientAddress('');
        setEstimatedFee('0.01');
        
        // Refresh balance after a short delay
        setTimeout(() => {
          loadBalance();
        }, 2000);
        
        alert('Transaction sent successfully!');
      } else {
        throw new Error(result?.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setSendLoading(false);
      setPendingTransaction(null);
    }
  };

  const exportWallet = () => {
    if (!wallet) return;

    const backupData = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      name: wallet.name || 'My Wallet',
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `masslet-wallet-backup-${wallet.address.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('Wallet backup downloaded successfully!');
  };

  const downloadWalletBackup = () => {
    if (!wallet) return;

    const backupData = {
      address: wallet.address,
      mnemonic: wallet.mnemonic,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `masslet-wallet-backup-${wallet.address.slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setShowExportDialog(false);
    alert('Wallet backup downloaded successfully!');
  };

  const deleteWallet = () => {
    if (confirm('Are you sure you want to delete this wallet? Make sure you have backed up your mnemonic phrase!')) {
      localStorage.removeItem('masslet_wallet');
      localStorage.removeItem('masslet_transactions');
      setWallet(null);
      setIsUnlocked(false);
      setBalance('0.000000');
      setTransactionHistory([]);
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Masslet Wallet</h1>
          
          <div className="mb-6">
            <input
              type="text"
              placeholder="Wallet name"
              className="w-full p-3 border rounded-lg mb-3"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter password"
              className="w-full p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreate}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            Create New Wallet
          </button>

          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">Import Existing Wallet</h3>
            <textarea
              placeholder="Enter your 12-word mnemonic phrase..."
              className="w-full p-3 border rounded-lg mb-3 h-24 resize-none"
              value={importMnemonic}
              onChange={(e) => setImportMnemonic(e.target.value)}
            />
            <button
              onClick={handleImport}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Import Wallet
            </button>
          </div>

          {savedWallets.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Saved Wallets</h3>
              {savedWallets.map((savedWallet, index) => (
                <div key={index} className="p-3 border rounded-lg mb-2 bg-gray-50">
                  <div className="font-medium">{savedWallet.name}</div>
                  <div className="text-sm text-gray-600">{savedWallet.address.slice(0, 20)}...</div>
                  <div className="text-xs text-gray-500">{new Date(savedWallet.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Unlock Wallet</h1>
          
          <div className="text-center mb-6">
            <div className="font-semibold text-gray-700">{wallet.name || 'My Wallet'}</div>
            <div className="text-sm text-gray-500">{wallet.address.slice(0, 20)}...</div>
          </div>

          <input
            type="password"
            placeholder="Enter your password"
            className="w-full p-3 border rounded-lg mb-4"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
          />

          <button
            onClick={handleUnlock}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4"
          >
            Unlock Wallet
          </button>

          <button
            onClick={deleteWallet}
            className="w-full py-2 text-red-600 hover:text-red-800 transition-colors"
          >
            Delete Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 p-4 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Masslet Wallet
              </h1>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {wallet.name || 'My Wallet'}
              </p>
              {networkInfo && (
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {networkInfo.network} - Block #{String(networkInfo.blockHeight)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
                title="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              {/* QR Code button */}
              <button
                onClick={() => generateQRCode(wallet.address)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                title="Show QR Code"
              >
                📱
              </button>
              
              {/* Export wallet button */}
              <button
                onClick={exportWallet}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-green-700 hover:bg-green-600 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title="Export wallet"
              >
                💾
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Lock Wallet
              </button>
              {networkInfo && (
                <div className="text-sm text-gray-500">
                  {String(networkInfo.peers)} peers connected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className="text-center">
            <h2 className={`text-lg font-semibold mb-2 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Total Balance
            </h2>
            <div className="text-4xl font-bold text-blue-600 mb-4">
              {balanceLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-2xl">Loading...</span>
                </div>
              ) : (
                <>
                  {balance} <span className="text-2xl text-gray-500">MAS</span>
                </>
              )}
            </div>
            
            {lastBalanceUpdate && !balanceLoading && (
              <p className="text-sm text-gray-500 mb-4">
                Last updated: {lastBalanceUpdate.toLocaleTimeString()}
              </p>
            )}
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => refreshBalance(wallet.address)}
                disabled={balanceLoading}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  balanceLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {balanceLoading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
              <button
                onClick={() => copyToClipboard(wallet.address)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                {copySuccess || 'Copy Address'}
              </button>
            </div>
            <div className={`mt-4 p-3 rounded-lg ${
              darkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Address:
              </p>
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm break-all flex-1">{wallet.address}</p>
                <button
                  onClick={() => copyToClipboard(wallet.address)}
                  className={`ml-2 p-1 rounded transition-colors ${
                    darkMode 
                      ? 'hover:bg-gray-600 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`rounded-xl shadow-lg p-6 ${
          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
        }`}>
          <div className={`flex space-x-4 mb-6 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {['wallet', 'send', 'receive', 'history', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-4 capitalize font-semibold transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : `${darkMode ? 'text-gray-300 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Private Key</h3>
                  {showPrivateKey ? (
                    <div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded mb-2">
                        <p className="text-xs text-red-600 mb-2">⚠️ Never share your private key!</p>
                        <p className="font-mono text-xs break-all text-gray-800">
                          {decryptedPrivateKey}
                        </p>
                      </div>
                      <button
                        onClick={() => hideSensitiveData('privateKey')}
                        className="text-red-600 hover:text-red-800 mr-2"
                      >
                        Hide
                      </button>
                      <button
                        onClick={() => copyToClipboard(decryptedPrivateKey)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleShowSensitiveData('privateKey')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Reveal Private Key
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">Mnemonic Phrase</h3>
                {showMnemonic ? (
                  <div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-2">
                      <p className="text-xs text-yellow-800 mb-2">
                        ⚠️ Keep this phrase safe and private. Anyone with access to it can control your wallet.
                      </p>
                      <p className="font-mono text-sm text-gray-800 break-all">{wallet.mnemonic}</p>
                    </div>
                    <button
                      onClick={() => hideSensitiveData('mnemonic')}
                      className="text-red-600 hover:text-red-800 mr-2"
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => copyToClipboard(wallet.mnemonic)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleShowSensitiveData('mnemonic')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Reveal Mnemonic
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Send Tab */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                darkMode 
                  ? 'bg-blue-900 border-blue-700 text-blue-100' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                    Available Balance:
                  </span>
                  <span className={`font-semibold ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>
                    {balance} MAS
                  </span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Recipient Address
                  </label>
                  <button
                    onClick={() => setShowAddressBook(true)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    📖 Address Book
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="AU..."
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                  value={recipientAddress}
                  onChange={(e) => {
                    setRecipientAddress(e.target.value);
                    estimateFee(sendAmount);
                  }}
                />
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Enter a valid Massa address starting with AU
                </p>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Amount (MAS)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.000001"
                  min="0"
                  max={balance}
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                  value={sendAmount}
                  onChange={(e) => {
                    setSendAmount(e.target.value);
                    estimateFee(e.target.value);
                  }}
                />
                <div className={`flex justify-between text-xs mt-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <span>Minimum: 0.000001 MAS</span>
                  <button
                    type="button"
                    onClick={() => {
                      const maxAmount = Math.max(0, parseFloat(balance) - parseFloat(estimatedFee)).toFixed(6);
                      setSendAmount(maxAmount);
                      estimateFee(maxAmount);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Send Max
                  </button>
                </div>
              </div>

              {/* Fee estimation */}
              {sendAmount && (
                <div className={`p-3 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Estimated Fee:
                    </span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                      {estimatedFee} MAS
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold mt-1">
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                      Total:
                    </span>
                    <span className={darkMode ? 'text-gray-200' : 'text-gray-800'}>
                      {(parseFloat(sendAmount || 0) + parseFloat(estimatedFee)).toFixed(6)} MAS
                    </span>
                  </div>
                </div>
              )}
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your wallet password"
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300'
                  }`}
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                />
              </div>
              
              <div className={`p-3 rounded-lg border ${
                darkMode 
                  ? 'bg-yellow-900 border-yellow-700 text-yellow-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                  ⚠️ Double-check the recipient address. Transactions cannot be reversed.
                </p>
              </div>
              
              <button
                onClick={handleSend}
                disabled={!sendAmount || !recipientAddress || !unlockPassword}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  !sendAmount || !recipientAddress || !unlockPassword
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Send Transaction
              </button>
            </div>
          )}

          {/* Receive Tab */}
          {activeTab === 'receive' && (
            <div className={`space-y-6 ${darkMode ? 'text-white' : ''}`}>
              <div className="text-center">
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Receive MASSA</h3>
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Share your address or QR code to receive MASSA tokens
                </p>
                <div className="flex justify-center mb-6">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                    <QRCodeComponent value={wallet.address} size={200} />
                  </div>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your Address:</p>
                  <p className={`font-mono text-sm break-all ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{wallet.address}</p>
                  <div className="flex space-x-3 mt-3">
                    <button
                      onClick={() => copyToClipboard(wallet.address)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Copy Address
                    </button>
                    <button
                      onClick={() => setShowQRModal(true)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-white hover:bg-gray-600' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Show QR Code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className={`space-y-4 ${darkMode ? 'text-white' : ''}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>Transaction History</h3>
                <button
                  onClick={loadTransactionHistory}
                  disabled={transactionHistoryLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {transactionHistoryLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
              {transactionHistoryLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading transaction history...</p>
                </div>
              ) : transactionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>No transactions yet</p>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Send or receive MASSA to see your transaction history here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map((tx) => (
                    <div key={tx.id} className={`p-4 border rounded-lg transition-colors ${
                      darkMode 
                        ? 'border-gray-600 hover:bg-gray-800 bg-gray-700' 
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                              tx.from === wallet.address ? 'bg-red-500' : 'bg-green-500'
                            }`}></span>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {tx.from === wallet.address ? 'Sent' : 'Received'}
                            </p>
                            <span className={`ml-2 text-xs px-2 py-1 rounded ${
                              tx.status === 'success' ? 'bg-green-100 text-green-800' :
                              tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                          <p className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            From: {tx.from.slice(0, 20)}...{tx.from.slice(-10)}
                          </p>
                          <p className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            To: {tx.to.slice(0, 20)}...{tx.to.slice(-10)}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {new Date(tx.timestamp).toLocaleString()}
                          </p>
                          {tx.id !== 'Unknown' && (
                            <p className={`text-xs font-mono mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              ID: {tx.id.slice(0, 20)}...
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold text-lg ${
                            tx.from === wallet.address ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {tx.from === wallet.address ? '-' : '+'}{tx.amount} MAS
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className={`space-y-6 ${darkMode ? 'text-white' : ''}`}>
              <div>
                <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : ''}`}>Wallet Settings</h3>
                <div className="space-y-4">
                  {/* Dark Mode Toggle */}
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dark Mode</h4>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Toggle between light and dark themes
                        </p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                          darkMode ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Wallet Name
                    </label>
                    <input
                      type="text"
                      className={`w-full p-3 border rounded-lg ${
                        darkMode 
                          ? 'bg-gray-800 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      value={wallet.name || ''}
                      onChange={(e) => {
                        const updatedWallet = { ...wallet, name: e.target.value };
                        setWallet(updatedWallet);
                        localStorage.setItem('masslet_wallet', JSON.stringify(updatedWallet));
                      }}
                    />
                  </div>
                  
                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Address Book</h4>
                    <button
                      onClick={() => setShowAddressBook(true)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Manage Addresses ({addressBook.length})
                    </button>
                  </div>

                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Export Wallet</h4>
                    <div className="space-y-3">
                      <button
                        onClick={exportWallet}
                        className={`w-full px-4 py-2 rounded-lg transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 text-white hover:bg-gray-600' 
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        Export Backup File
                      </button>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Download an encrypted backup of your wallet
                      </p>
                    </div>
                  </div>
                  
                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Backup & Recovery</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowMnemonic(!showMnemonic)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {showMnemonic ? 'Hide' : 'Show'} Mnemonic Phrase
                      </button>
                      {showMnemonic && (
                        <div className={`p-4 border rounded-lg ${
                          darkMode 
                            ? 'bg-yellow-900 border-yellow-600' 
                            : 'bg-yellow-50 border-yellow-200'
                        }`}>
                          <p className={`text-sm mb-2 ${
                            darkMode ? 'text-yellow-200' : 'text-yellow-800'
                          }`}>
                            ⚠️ Keep this phrase safe and private. Anyone with access to it can control your wallet.
                          </p>
                          <p className={`font-mono text-sm p-3 rounded border break-all ${
                            darkMode 
                              ? 'text-gray-200 bg-gray-800 border-gray-600' 
                              : 'text-gray-800 bg-white border-gray-200'
                          }`}>
                            {wallet.mnemonic}
                          </p>
                          <button
                            onClick={() => copyToClipboard(wallet.mnemonic)}
                            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                          >
                            Copy to Clipboard
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h4 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Network Information</h4>
                    {networkInfo ? (
                      <div className={`p-4 rounded-lg space-y-2 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex justify-between">
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Network:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{String(networkInfo.network)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Block Height:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>#{String(networkInfo.blockHeight)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Connected Peers:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{String(networkInfo.peers)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Version:</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{String(networkInfo.version)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading network information...</p>
                    )}
                  </div>

                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <h4 className="font-semibold text-red-600 mb-2">Danger Zone</h4>
                    <button
                      onClick={deleteWallet}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete Wallet
                    </button>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      This will permanently delete your wallet. Make sure you have backed up your mnemonic phrase!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Verify Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordPrompt(null);
                  setVerifyPassword('');
                }}
                className={`hover:text-gray-700 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Please enter your wallet password to view your {showPasswordPrompt === 'mnemonic' ? 'mnemonic phrase' : 'private key'}.
              </p>
              <div className={`p-3 border rounded mb-4 ${
                darkMode 
                  ? 'bg-yellow-900 border-yellow-600' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className={`text-xs ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-800'
                }`}>
                  ⚠️ This information is highly sensitive. Never share it with anyone!
                </p>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                className={`w-full p-3 border rounded-lg ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={verifyPassword}
                onChange={(e) => setVerifyPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleShowSensitiveData(showPasswordPrompt);
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPasswordPrompt(null);
                  setVerifyPassword('');
                }}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleShowSensitiveData(showPasswordPrompt)}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!verifyPassword}
              >
                Reveal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                QR Code
              </h3>
              <button
                onClick={() => setShowQRModal(false)}
                className={`hover:text-gray-700 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            
            <div className="text-center">
              <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <QRCodeComponent value={wallet.address} size={200} />
              </div>
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Scan this QR code to get your wallet address
              </p>
              <p className={`font-mono text-xs break-all mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {wallet.address}
              </p>
              <button
                onClick={() => copyToClipboard(wallet.address)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Copy Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Address Book Modal */}
      {showAddressBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Address Book
              </h3>
              <button
                onClick={() => setShowAddressBook(false)}
                className={`hover:text-gray-700 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            
            {/* Add new address form */}
            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New Address</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Contact name"
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="MASSA address (AU...)"
                  className={`w-full p-3 border rounded-lg ${
                    darkMode 
                      ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                />
                <button
                  onClick={() => addToAddressBook(newContactName, newContactAddress)}
                  disabled={!newContactName || !newContactAddress}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Add Contact
                </button>
              </div>
            </div>

            {/* Address book list */}
            <div className="space-y-2">
              {addressBook.length === 0 ? (
                <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No contacts yet. Add some addresses to get started!
                </p>
              ) : (
                addressBook.map((contact, index) => (
                  <div key={index} className={`p-3 border rounded-lg ${
                    darkMode 
                      ? 'border-gray-600 bg-gray-700' 
                      : 'border-gray-200 bg-white'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contact.name}</p>
                        <p className={`text-sm font-mono ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {contact.address.slice(0, 20)}...{contact.address.slice(-10)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(contact.address)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            darkMode 
                              ? 'bg-gray-600 text-white hover:bg-gray-500' 
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => removeFromAddressBook(index)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction Confirmation Modal */}
      {showConfirmTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Confirm Transaction
              </h3>
              <button
                onClick={() => setShowConfirmTransaction(false)}
                className={`hover:text-gray-700 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500'}`}
              >
                ✕
              </button>
            </div>
            
            {pendingTransaction && (
              <div className="space-y-4">
                <div className={`p-4 border rounded-lg ${
                  darkMode 
                    ? 'border-gray-600 bg-gray-700' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>To:</span>
                      <span className={`text-sm font-mono ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {pendingTransaction.to.slice(0, 15)}...
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Amount:</span>
                      <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {pendingTransaction.amount} MAS
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Fee:</span>
                      <span className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {estimatedFee} MAS
                      </span>
                    </div>
                    <div className={`border-t pt-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex justify-between">
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</span>
                        <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {(parseFloat(pendingTransaction.amount) + parseFloat(estimatedFee)).toFixed(6)} MAS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-3 border rounded ${
                  darkMode 
                    ? 'border-yellow-600 bg-yellow-900' 
                    : 'border-yellow-200 bg-yellow-50'
                }`}>
                  <p className={`text-sm ${
                    darkMode ? 'text-yellow-200' : 'text-yellow-800'
                  }`}>
                    ⚠️ Please review the transaction details carefully. This action cannot be undone.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowConfirmTransaction(false)}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeTransaction}
                    disabled={sendLoading}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {sendLoading ? 'Sending...' : 'Confirm & Send'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
