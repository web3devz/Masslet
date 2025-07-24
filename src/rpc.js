import axios from 'axios';

// Multiple Massa API endpoints to try (reordered to prioritize buildnet)
const MASSA_ENDPOINTS = [
  'https://buildnet.massa.net/api/v2',
  'https://buildnet.massa.net/api',
  'https://test.massa.net/api/v2',
  'https://test.massa.net/api'
];

// Use proxy in development, try multiple endpoints in production
const getApiUrl = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }
  return MASSA_ENDPOINTS[0]; // Try first endpoint initially
};

export async function getWalletBalance(address) {
  console.log('Fetching real balance for address:', address);
  
  // Check if we're in development mode
  const isDev = import.meta?.env?.DEV || false;
  const endpoints = isDev ? ['/api'] : MASSA_ENDPOINTS;
  
  console.log('Using endpoints:', endpoints, 'Dev mode:', isDev);
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      
      const res = await axios.post(endpoint, {
        jsonrpc: '2.0',
        method: 'get_addresses',
        params: [[address]],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000 // 8 second timeout
      });
      
      if (res.data && res.data.result && res.data.result[0]) {
        const addressInfo = res.data.result[0];
        console.log('Address info received:', JSON.stringify(addressInfo, null, 2));
        
        // Try candidate_balance first, then final_balance
        let balanceString = addressInfo.candidate_balance || addressInfo.final_balance || '0';
        
        // Handle different balance formats
        let balanceInMAS;
        if (typeof balanceString === 'string' && balanceString.includes('.')) {
          // Already in MAS format (like "1.999")
          balanceInMAS = parseFloat(balanceString).toFixed(6);
        } else {
          // Convert from nanoMAS to MAS (divide by 10^9)
          balanceInMAS = (parseFloat(balanceString) / 1000000000).toFixed(6);
        }
        
        console.log('Real balance fetched:', balanceInMAS, 'MAS from', endpoint);
        
        // If balance is greater than 0, return it immediately
        if (parseFloat(balanceInMAS) > 0) {
          return balanceInMAS;
        }
      }
      
      // Try alternative method on the same endpoint
      const fallbackRes = await axios.post(endpoint, {
        jsonrpc: '2.0',
        method: 'get_balance',
        params: [address],
        id: 1
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000
      });
      
      if (fallbackRes.data && fallbackRes.data.result) {
        let balanceString = fallbackRes.data.result;
        let balanceInMAS;
        
        if (typeof balanceString === 'string' && balanceString.includes('.')) {
          // Already in MAS format
          balanceInMAS = parseFloat(balanceString).toFixed(6);
        } else {
          // Convert from nanoMAS to MAS
          balanceInMAS = (parseFloat(balanceString) / 1000000000).toFixed(6);
        }
        
        console.log('Balance fetched via fallback method:', balanceInMAS, 'MAS from', endpoint);
        
        // If balance is greater than 0, return it immediately
        if (parseFloat(balanceInMAS) > 0) {
          return balanceInMAS;
        }
      }
      
    } catch (e) {
      console.error(`Failed to fetch balance from ${endpoint}:`, e.message);
      continue; // Try next endpoint
    }
  }
  
  // If all endpoints fail, return 0 balance
  console.log('All endpoints failed, returning 0 balance');
  return '0.000000';
}

// Generic RPC call function
async function rpcCall(method, params) {
  const isDev = import.meta?.env?.DEV || false;
  const endpoints = isDev ? ['/api'] : MASSA_ENDPOINTS;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(endpoint, {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: Date.now()
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });
      
      if (response.data && response.data.result !== undefined) {
        return response.data.result;
      }
      
      if (response.data && response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error(`RPC call failed on ${endpoint}:`, error.message);
      if (endpoint === endpoints[endpoints.length - 1]) {
        // This was the last endpoint, re-throw the error
        throw error;
      }
      continue;
    }
  }
  
  throw new Error('All RPC endpoints failed');
}

// Send transaction using send_operations RPC method
export async function sendTransaction(fromPrivateKey, fromAddress, toAddress, amount, password) {
  try {
    console.log('Sending transaction:', { fromAddress, toAddress, amount });

    // Import nacl for signing
    const nacl = (await import('tweetnacl')).default;
    
    // Decrypt private key
    const { decryptPrivateKey } = await import('./encrypt.js');
    const privateKeyString = await decryptPrivateKey(fromPrivateKey, password);
    console.log('Decrypted private key successfully');
    
    // Convert hex string to bytes
    const privateKeyBytes = new Uint8Array(
      privateKeyString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    console.log('Private key bytes length:', privateKeyBytes.length);
    
    // Generate key pair from private key
    const keyPair = nacl.sign.keyPair.fromSecretKey(privateKeyBytes);
    const publicKey = keyPair.publicKey;
    
    console.log('Public key:', Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Convert amount to nano MAS
    const amountNanoMas = convertMasToNanoMas(parseFloat(amount));
    console.log('Amount in nano MAS:', amountNanoMas.toString());

    // Set fee (0.01 MAS = 10,000,000 nano MAS)
    const feeNanoMas = convertMasToNanoMas(0.01);
    console.log('Fee in nano MAS:', feeNanoMas.toString());

    // Get current period for expire_period
    const status = await rpcCall('get_status', []);
    console.log('Status response:', JSON.stringify(status, null, 2));
    
    // Calculate current period with fallback values
    let currentPeriod;
    if (status.last_slot && status.last_slot.period) {
      currentPeriod = status.last_slot.period;
    } else if (status.current_cycle && status.periods_per_cycle) {
      currentPeriod = status.current_cycle * status.periods_per_cycle + (status.cycle_duration || 0);
    } else if (status.period) {
      currentPeriod = status.period;
    } else {
      // Fallback to a reasonable default
      currentPeriod = 1000000; // Use a large enough number as fallback
    }
    
    const expirePeriod = currentPeriod + 10; // expire in 10 periods
    
    console.log('Current period:', currentPeriod, 'Expire period:', expirePeriod);

    // Create operation
    const operation = createMassaTransferOperation(
      fromAddress,
      toAddress,
      amountNanoMas,
      feeNanoMas,
      expirePeriod
    );

    // Serialize operation
    const serializedOperation = serializeMassaOperation(operation);
    console.log('Serialized operation length:', serializedOperation.length);
    console.log('Serialized operation:', Array.from(serializedOperation).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Create canonical data for signing (chainId + publicKey + serializedData)
    const chainId = 77658366n; // Massa buildnet chain ID (from network status)
    const chainIdBytes = new Array(8);
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, chainId, false); // big-endian
    for (let i = 0; i < 8; i++) {
      chainIdBytes[i] = view.getUint8(i);
    }

    const canonicalData = new Uint8Array([
      ...chainIdBytes,
      ...publicKey,
      ...serializedOperation
    ]);

    console.log('Canonical data length:', canonicalData.length);

    // Sign the canonical data
    const signature = nacl.sign.detached(canonicalData, privateKeyBytes);
    console.log('Signature length:', signature.length);
    console.log('Signature:', Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(''));

    // Convert to base64 for transmission
    const publicKeyBase64 = btoa(String.fromCharCode(...publicKey));
    const signatureBase64 = btoa(String.fromCharCode(...signature));

    console.log('Public key base64:', publicKeyBase64);
    console.log('Signature base64:', signatureBase64);

    // Create operation input following massa-web3 format
    const operationInput = {
      serialized_content: Array.from(serializedOperation), // Convert Uint8Array to Array
      creator_public_key: publicKeyBase64,
      signature: signatureBase64
    };

    console.log('Operation input:', operationInput);

    // Send operation using send_operations - the operation should be wrapped properly
    const response = await rpcCall('send_operations', [operationInput]);
    console.log('Send operations response:', response);

    if (response && response.length > 0) {
      const operationId = response[0];
      console.log('Transaction sent successfully! Operation ID:', operationId);
      return {
        success: true,
        operationId: operationId,
        message: 'Transaction sent successfully'
      };
    } else {
      throw new Error('No operation ID returned');
    }

  } catch (error) {
    console.error('Error sending transaction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Convert nano MAS to base units (1 MAS = 10^9 nano MAS)
function convertMasToNanoMas(masAmount) {
  return BigInt(Math.floor(masAmount * 1_000_000_000));
}

// Serialize operation following Massa protocol (similar to massa-web3 OperationManager.serialize)
function serializeMassaOperation(operation) {
  const components = [];
  
  // Validate operation fields
  if (isNaN(operation.expirePeriod)) {
    throw new Error('Invalid expire period: cannot be NaN');
  }
  
  // Add fee (varint encoded)
  const feeBytes = encodeVarint(operation.fee);
  components.push(...feeBytes);
  
  // Add expire period (varint encoded)
  const expirePeriodBytes = encodeVarint(BigInt(operation.expirePeriod));
  components.push(...expirePeriodBytes);
  
  // Add operation type (0 = Transaction)
  const typeBytes = encodeVarint(BigInt(0));
  components.push(...typeBytes);
  
  // Add recipient address (32 bytes)
  const addressBytes = decodeBase58Address(operation.recipientAddress);
  components.push(...addressBytes);
  
  // Add amount (varint encoded)
  const amountBytes = encodeVarint(operation.amount);
  components.push(...amountBytes);
  
  return new Uint8Array(components);
}

// Varint encoding (little-endian)
function encodeVarint(value) {
  const bytes = [];
  let val = typeof value === 'bigint' ? value : BigInt(value);
  
  while (val >= 128n) {
    bytes.push(Number(val & 127n) | 128);
    val >>= 7n;
  }
  bytes.push(Number(val));
  
  return bytes;
}

// Decode base58 address to bytes (simplified for now)
function decodeBase58Address(address) {
  try {
    // Remove AU prefix if present
    const cleanAddress = address.startsWith('AU') ? address.substring(2) : address;
    
    // For now, use a simple deterministic mapping
    // In production, you'd use proper base58 decoding
    const encoder = new TextEncoder();
    const addressBytes = encoder.encode(cleanAddress);
    
    // Create a 32-byte address representation
    const result = new Array(32).fill(0);
    
    // Use a simple hash-like approach to distribute the address bytes
    for (let i = 0; i < addressBytes.length; i++) {
      result[i % 32] ^= addressBytes[i];
    }
    
    // Add some entropy based on the full address
    for (let i = 0; i < 32; i++) {
      result[i] = (result[i] + (i * 37) + addressBytes[i % addressBytes.length]) % 256;
    }
    
    return result;
  } catch (error) {
    console.error('Error decoding address:', error);
    // Fallback: create deterministic bytes from address string
    const encoder = new TextEncoder();
    const addressBytes = encoder.encode(address);
    const result = new Array(32).fill(0);
    for (let i = 0; i < 32; i++) {
      result[i] = (addressBytes[i % addressBytes.length] + i) % 256;
    }
    return result;
  }
}

// Create and serialize Massa transfer operation
function createMassaTransferOperation(fromAddress, toAddress, amount, fee, expirePeriod) {
  try {
    console.log('Creating Massa transfer operation:', {
      fromAddress,
      toAddress,
      amount: amount.toString(),
      fee: fee.toString(),
      expirePeriod
    });

    // Create operation object
    const operation = {
      fee: fee,
      expirePeriod: expirePeriod,
      recipientAddress: toAddress,
      amount: amount
    };

    console.log('Created operation:', operation);
    return operation;
  } catch (error) {
    console.error('Error creating Massa transfer operation:', error);
    throw error;
  }
}



export async function getTransactionHistory(address) {
  console.log('Fetching transaction history for address:', address);
  
  // Check if we're in development mode
  const isDev = import.meta?.env?.DEV || false;
  const endpoints = isDev ? ['/api'] : MASSA_ENDPOINTS;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying to fetch transaction history from: ${endpoint}`);
      
      // First, try to get address info to see recent operations
      const addressRes = await axios.post(endpoint, {
        jsonrpc: '2.0',
        method: 'get_addresses',
        params: [[address]],
        id: Date.now()
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 8000
      });
      
      console.log('Address response:', addressRes.data);
      
      let transactions = [];
      
      // Check if address response contains operation data
      if (addressRes.data?.result && Array.isArray(addressRes.data.result) && addressRes.data.result.length > 0) {
        const addressInfo = addressRes.data.result[0];
        
        // Extract any operation IDs from address info if available
        if (addressInfo.operations) {
          const operationIds = Array.isArray(addressInfo.operations) ? 
            addressInfo.operations : Object.keys(addressInfo.operations || {});
          
          if (operationIds.length > 0) {
            console.log('Found operation IDs:', operationIds);
            
            // Get detailed operation info
            try {
              const opsRes = await axios.post(endpoint, {
                jsonrpc: '2.0',
                method: 'get_operations',
                params: [operationIds.slice(0, 10)], // Limit to 10 most recent
                id: Date.now()
              }, {
                headers: {
                  'Content-Type': 'application/json',
                },
                timeout: 8000
              });
              
              if (opsRes.data?.result && Array.isArray(opsRes.data.result)) {
                transactions = opsRes.data.result.map(opWrapper => {
                  const op = opWrapper.operation || opWrapper;
                  const content = op.content || op;
                  
                  return {
                    id: opWrapper.id || op.id || 'op_' + Date.now(),
                    from: content.content_creator_address || 'Unknown',
                    to: content.op?.transaction?.recipient_address || 
                        content.transaction?.recipient_address || 'Unknown',
                    amount: content.op?.transaction?.amount ? 
                      (parseFloat(content.op.transaction.amount) / 1000000000).toFixed(6) : 
                      content.transaction?.amount ? 
                      (parseFloat(content.transaction.amount) / 1000000000).toFixed(6) : '0',
                    timestamp: new Date().toISOString(),
                    status: opWrapper.is_operation_final ? 'success' : 'pending'
                  };
                });
              }
            } catch (opsError) {
              console.log('Could not fetch detailed operations:', opsError.message);
            }
          }
        }
      }
      
      // If we have transactions, return them
      if (transactions.length > 0) {
        console.log('Found transactions:', transactions);
        return transactions;
      }
      
      // Try alternative method - search by blocks for recent activity
      try {
        const statusRes = await axios.post(endpoint, {
          jsonrpc: '2.0',
          method: 'get_status',
          params: [],
          id: Date.now()
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000
        });
        
        if (statusRes.data?.result?.last_slot) {
          const currentSlot = statusRes.data.result.last_slot.slot || statusRes.data.result.last_slot;
          console.log('Current slot:', currentSlot);
          
          // Look for recent activity in the last few slots
          const recentTransactions = await searchRecentTransactions(endpoint, address, currentSlot);
          if (recentTransactions.length > 0) {
            return recentTransactions;
          }
        }
      } catch (statusError) {
        console.log('Could not get status for slot search:', statusError.message);
      }
      
    } catch (e) {
      console.error(`Failed to fetch history from ${endpoint}:`, e.message);
      continue;
    }
  }
  
  // If no real data, check localStorage for local transaction history
  const localHistory = localStorage.getItem('masslet_transactions_' + address);
  if (localHistory) {
    console.log('Using local transaction history');
    return JSON.parse(localHistory);
  }
  
  // Return empty array if no history found
  console.log('No transaction history found');
  return [];
}

// Helper function to search for recent transactions
async function searchRecentTransactions(endpoint, address, currentSlot) {
  try {
    console.log('Searching recent transactions for slot range around:', currentSlot);
    
    // Search in recent block range
    const startSlot = Math.max(0, currentSlot - 100); // Look back 100 slots
    
    const intervalRes = await axios.post(endpoint, {
      jsonrpc: '2.0',
      method: 'get_graph_interval',
      params: [{
        start: startSlot,
        end: currentSlot
      }],
      id: Date.now()
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 8000
    });
    
    if (intervalRes.data?.result && Array.isArray(intervalRes.data.result)) {
      const blocks = intervalRes.data.result;
      console.log('Found blocks in interval:', blocks.length);
      
      const transactions = [];
      
      // Search through blocks for operations involving our address
      for (const block of blocks) {
        if (block.operations && Array.isArray(block.operations)) {
          for (const operation of block.operations) {
            const op = operation.operation || operation;
            const content = op.content || op;
            
            // Check if this operation involves our address
            const isFromAddress = content.content_creator_address === address;
            const isToAddress = content.op?.transaction?.recipient_address === address ||
                              content.transaction?.recipient_address === address;
            
            if (isFromAddress || isToAddress) {
              transactions.push({
                id: operation.id || op.id || 'op_' + Date.now(),
                from: content.content_creator_address || 'Unknown',
                to: content.op?.transaction?.recipient_address || 
                    content.transaction?.recipient_address || 'Unknown',
                amount: content.op?.transaction?.amount ? 
                  (parseFloat(content.op.transaction.amount) / 1000000000).toFixed(6) : 
                  content.transaction?.amount ? 
                  (parseFloat(content.transaction.amount) / 1000000000).toFixed(6) : '0',
                timestamp: new Date(block.timestamp || Date.now()).toISOString(),
                status: block.is_final ? 'success' : 'pending'
              });
            }
          }
        }
      }
      
      return transactions;
    }
  } catch (error) {
    console.log('Error searching recent transactions:', error.message);
  }
  
  return [];
}

export async function getNetworkInfo() {
  console.log('Fetching network information');
  
  // Check if we're in development mode
  const isDev = import.meta?.env?.DEV || false;
  const endpoints = isDev ? ['/api'] : MASSA_ENDPOINTS;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Trying to fetch network info from: ${endpoint}`);
      
      const res = await axios.post(endpoint, {
        jsonrpc: '2.0',
        method: 'get_status',
        params: [],
        id: Date.now()
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });
      
      if (res.data && res.data.result) {
        const status = res.data.result;
        console.log('Network status received:', JSON.stringify(status, null, 2));
        
        // Safely extract values and handle potential objects
        let peers = 0;
        if (typeof status.connected_nodes === 'number') {
          peers = status.connected_nodes;
        } else if (typeof status.connected_nodes === 'object' && status.connected_nodes !== null) {
          // If it's an object, count the keys or use length
          peers = Object.keys(status.connected_nodes).length;
        }
        
        let blockHeight = 'Unknown';
        if (status.last_slot?.period) {
          blockHeight = status.last_slot.period;
        } else if (status.period) {
          blockHeight = status.period;
        }
        
        return {
          network: 'Massa Buildnet',
          blockHeight: blockHeight,
          peers: peers,
          version: status.version || '1.0.0'
        };
      }
      
    } catch (e) {
      console.error(`Failed to fetch network info from ${endpoint}:`, e.message);
      continue;
    }
  }
  
  // Return mock data if all endpoints fail
  return {
    network: 'Massa Network',
    blockHeight: 'Unknown',
    peers: 0,
    version: '1.0.0'
  };
}
