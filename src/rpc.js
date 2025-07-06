import axios from 'axios';

const MASSA_NODE_URL = 'https://test.massa.net/api'; // Replace with actual RPC node

export async function getWalletBalance(address) {
  try {
    const res = await axios.post(MASSA_NODE_URL, {
      jsonrpc: '2.0',
      method: 'get_addresses',
      params: [[address]],
      id: 1
    });
    return res.data.result[0].candidate_balance;
  } catch (e) {
    console.error('Failed to fetch balance:', e);
    return '0';
  }
}

export async function sendTransaction(publicKey, signature, recipientAddress, amount) {
  try {
    const res = await axios.post(MASSA_NODE_URL, {
      jsonrpc: '2.0',
      method: 'send_transaction',
      params: [{
        sender_public_key: publicKey,
        signature,
        recipient_address: recipientAddress,
        amount
      }],
      id: 2
    });
    return res.data.result;
  } catch (e) {
    console.error('Failed to send transaction:', e);
    return null;
  }
}
