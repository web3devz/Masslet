// Utility functions for the Masslet wallet

export const formatBalance = (balance) => {
  const num = parseFloat(balance);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toFixed(4);
};

export const formatAddress = (address, length = 10) => {
  if (!address) return '';
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else if (diffInHours < 24 * 7) {
    return `${Math.floor(diffInHours / 24)}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const validateMassaAddress = (address) => {
  try {
    // Massa addresses typically start with AU and are around 50 characters
    if (address && address.startsWith('AU') && address.length >= 45 && address.length <= 55) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const formatAmount = (amount) => {
  const num = parseFloat(amount);
  return isNaN(num) ? '0.0000' : num.toFixed(4);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export const generateWalletName = () => {
  const adjectives = ['Swift', 'Secure', 'Digital', 'Crypto', 'Smart', 'Quick', 'Safe', 'Personal'];
  const nouns = ['Wallet', 'Vault', 'Account', 'Purse', 'Treasury', 'Reserve'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj} ${noun}`;
};

export const getTransactionType = (tx, userAddress) => {
  if (tx.from === userAddress) {
    return { type: 'sent', color: 'red', sign: '-' };
  } else {
    return { type: 'received', color: 'green', sign: '+' };
  }
};

export const downloadBackup = (wallet) => {
  const backupData = {
    name: wallet.name,
    address: wallet.address,
    publicKey: wallet.publicKey,
    mnemonic: wallet.mnemonic,
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `masslet-wallet-backup-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
