import axios from 'axios';

async function testBalance() {
  const address = 'AU12Zs74kCW3CAASPqKtBrnQdWMNahiB3oCgFhpVBoRGvQ12XmUGA';
  
  console.log('Testing balance for:', address);
  
  try {
    const res = await axios.post('https://buildnet.massa.net/api/v2', {
      jsonrpc: '2.0',
      method: 'get_addresses',
      params: [[address]],
      id: 1
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (res.data && res.data.result && res.data.result[0]) {
      const addressInfo = res.data.result[0];
      console.log('Raw response:', JSON.stringify(addressInfo, null, 2));
      
      let balanceString = addressInfo.candidate_balance || addressInfo.final_balance || '0';
      console.log('Balance string:', balanceString, typeof balanceString);
      
      // Handle different balance formats
      let balanceInMAS;
      if (typeof balanceString === 'string' && balanceString.includes('.')) {
        // Already in MAS format (like "1.999")
        balanceInMAS = parseFloat(balanceString).toFixed(6);
        console.log('Parsed as MAS format:', balanceInMAS);
      } else {
        // Convert from nanoMAS to MAS (divide by 10^9)
        balanceInMAS = (parseFloat(balanceString) / 1000000000).toFixed(6);
        console.log('Converted from nanoMAS:', balanceInMAS);
      }
      
      console.log('Final balance:', balanceInMAS, 'MAS');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBalance();
