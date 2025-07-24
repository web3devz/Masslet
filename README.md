# 🚀 Masslet - Advanced Massa Blockchain Wallet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.5.14-purple.svg)](https://vitejs.dev/)
[![Massa](https://img.shields.io/badge/Massa-Buildnet-green.svg)](https://massa.net/)

**Masslet** is a modern, feature-rich web wallet for the Massa blockchain network. Built with React and modern web technologies, it provides a secure, user-friendly interface for managing MASSA tokens with advanced features like dark mode, address book, QR codes, and comprehensive transaction management.

![Masslet Wallet Interface](https://via.placeholder.com/800x400/1e293b/ffffff?text=Masslet+Wallet+Interface)

## ✨ Features

### 🔐 Core Wallet Functionality
- **Secure Wallet Creation**: Generate new wallets with BIP39 mnemonic phrases
- **Wallet Import**: Import existing wallets using mnemonic phrases
- **Private Key Management**: Encrypted private key storage with password protection
- **Balance Display**: Real-time balance fetching from Massa buildnet
- **Transaction History**: Complete transaction history with multiple API fallbacks

### 💸 Advanced Transaction Features
- **Send Transactions**: Secure transaction sending with validation
- **Transaction Confirmation**: Beautiful confirmation modal with detailed preview
- **Fee Estimation**: Smart fee calculation and display
- **Address Validation**: Comprehensive Massa address format validation
- **Balance Verification**: Prevents overdraft with fee calculations

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Complete theme switching with persistence
- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Professional loading indicators
- **Success Feedback**: Copy-to-clipboard notifications
- **Smooth Transitions**: Elegant animations and transitions

### 📱 Enhanced Features
- **QR Code Support**: Generate and display QR codes for addresses
- **Address Book**: Save and manage frequently used addresses
- **Wallet Export**: Download encrypted wallet backup files
- **Network Information**: Real-time network status display
- **Multiple Wallet Support**: Manage multiple wallets with ease

### 🛡️ Security Features
- **AES-GCM Encryption**: Industry-standard encryption for private keys
- **Password Protection**: Secure access to sensitive information
- **Mnemonic Backup**: BIP39 compliant mnemonic phrase generation
- **Local Storage**: All data stored locally for maximum privacy

## 🚀 Quick Start

### Prerequisites
- Node.js (v14.0.0 or higher)
- npm or yarn package manager
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/masslet.git
   cd masslet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 Usage Guide

### Creating a New Wallet

1. Click **"Create New Wallet"** on the welcome screen
2. Set a secure password for wallet encryption
3. **Important**: Write down and securely store your mnemonic phrase
4. Confirm your password to create the wallet

### Importing an Existing Wallet

1. Click **"Import Wallet"** on the welcome screen
2. Enter your 12-word mnemonic phrase
3. Set a password for local encryption
4. Click **"Import Wallet"** to restore your wallet

### Sending Transactions

1. Navigate to the **Send** tab
2. Enter the recipient's Massa address (starts with "AU")
3. Enter the amount to send
4. Review the estimated fee
5. Click **"Send Transaction"**
6. Confirm the transaction details in the modal
7. Transaction will be broadcast to the network

### Managing Your Address Book

1. Go to **Settings** → **Address Book**
2. Add contacts with names and Massa addresses
3. Use saved addresses when sending transactions
4. Edit or remove contacts as needed

### Viewing Transaction History

1. Navigate to the **History** tab
2. View all incoming and outgoing transactions
3. Click **"Refresh"** to update with latest transactions
4. Transaction status indicators show pending/confirmed/failed states

### Backup and Security

1. **Mnemonic Phrase**: Go to Settings → Show Mnemonic Phrase
2. **Wallet Export**: Use Settings → Export Backup File
3. **Password Protection**: All sensitive data requires password confirmation

## 🔧 Configuration

### Network Settings

The wallet is pre-configured for Massa buildnet:
- **Network**: Massa Buildnet
- **Chain ID**: 77658366
- **RPC Endpoints**: Multiple fallback endpoints for reliability

### Customization

You can modify the configuration in:
- `vite.config.js` - Build and proxy settings
- `tailwind.config.js` - Styling and theme configuration
- `src/rpc.js` - Network endpoints and API settings

## 🏗️ Architecture

### Project Structure

```
masslet/
├── public/                 # Static assets
├── src/
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   ├── index.css          # Global styles and Tailwind
│   ├── wallet.js          # Wallet creation and management
│   ├── encrypt.js         # Encryption/decryption utilities
│   ├── rpc.js             # Massa blockchain API interactions
│   └── QRCode.jsx         # QR code generation component
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── postcss.config.js      # PostCSS configuration
```

### Key Technologies

- **React 18**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **TweetNaCl**: Cryptographic library for key generation and signing
- **QRCode.js**: QR code generation
- **Massa RPC**: Direct integration with Massa blockchain APIs

### State Management

The application uses React's built-in state management with:
- `useState` for component state
- `useEffect` for side effects and lifecycle management
- `localStorage` for data persistence
- Custom hooks for wallet operations

## 🔒 Security Considerations

### Encryption
- Private keys are encrypted using AES-GCM with user passwords
- Encryption keys are derived using PBKDF2 with random salts
- No private keys are stored in plain text

### Data Storage
- All sensitive data is stored locally in the browser
- No data is transmitted to external servers except Massa RPC calls
- Users maintain full control of their private keys

### Best Practices
- Always backup your mnemonic phrase securely
- Use strong, unique passwords for wallet encryption
- Verify addresses before sending transactions
- Keep your browser and system updated

## 🛠️ Development

### Development Setup

1. **Fork and clone the repository**
2. **Install dependencies**: `npm install`
3. **Start development server**: `npm run dev`
4. **Make your changes**
5. **Test thoroughly**
6. **Submit a pull request**

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style

- ESLint configuration for code quality
- Prettier for code formatting
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling

### Testing

Currently, the project focuses on manual testing. Contributions for automated testing are welcome:
- Unit tests for utility functions
- Integration tests for wallet operations
- E2E tests for user workflows

## 🌐 API Integration

### Massa Buildnet APIs

The wallet integrates with multiple Massa buildnet endpoints:

```javascript
// Primary endpoints
const endpoints = [
  'https://buildnet.massa.net/api/v2',
  'https://test.massa.net/api/v2',
  // Additional fallback endpoints
];
```

### Supported Operations

- **Balance Queries**: Real-time balance fetching
- **Transaction Sending**: Secure transaction broadcasting
- **Transaction History**: Complete transaction retrieval
- **Network Status**: Network information and status
- **Address Validation**: Massa address format validation

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Add tests** if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Contribution Areas

- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🧪 Testing and quality assurance
- 🎨 UI/UX improvements
- 🔧 Performance optimizations

### Code Guidelines

- Follow existing code style and patterns
- Add comments for complex logic
- Ensure responsive design
- Test on multiple browsers
- Maintain security best practices

## 📊 Roadmap

### Upcoming Features

- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **Hardware Wallet Integration**: Ledger and Trezor support
- [ ] **DApp Browser**: Integrated DApp interaction
- [ ] **Staking Interface**: Massa staking operations
- [ ] **Smart Contract Interaction**: Deploy and interact with contracts
- [ ] **Advanced Analytics**: Portfolio tracking and analytics
- [ ] **Mobile App**: React Native mobile application
- [ ] **Desktop App**: Electron desktop application

### Technical Improvements

- [ ] **Automated Testing**: Comprehensive test suite
- [ ] **Performance Optimization**: Lazy loading and code splitting
- [ ] **Offline Support**: Service worker for offline functionality
- [ ] **Enhanced Security**: Hardware security module support
- [ ] **Better Error Handling**: User-friendly error messages
- [ ] **Accessibility**: WCAG compliance improvements

## ❓ FAQ

### General Questions

**Q: Is Masslet safe to use?**
A: Yes, Masslet prioritizes security with local key storage, encryption, and no server-side data transmission. However, always backup your mnemonic phrase and use strong passwords.

**Q: Which networks does Masslet support?**
A: Currently, Masslet supports Massa buildnet. Mainnet support will be added when Massa mainnet launches.

**Q: Can I use Masslet offline?**
A: Partial offline functionality is available for viewing wallet information. Internet connection is required for balance updates and transactions.

### Technical Questions

**Q: How are private keys stored?**
A: Private keys are encrypted using AES-GCM with your password and stored locally in your browser. They never leave your device.

**Q: Can I import wallets from other Massa wallets?**
A: Yes, you can import any Massa wallet using its BIP39 mnemonic phrase.

**Q: What happens if I forget my password?**
A: You can restore your wallet using your mnemonic phrase and set a new password. Always keep your mnemonic phrase secure.

### Troubleshooting

**Q: Why is my balance not updating?**
A: Try refreshing the balance manually or check your internet connection. The wallet uses multiple API endpoints for reliability.

**Q: My transaction is stuck as "pending"**
A: Massa buildnet transactions typically confirm within minutes. If stuck, check the network status or contact support.

**Q: The wallet won't load**
A: Clear your browser cache and cookies, then reload. Ensure you're using a modern browser with JavaScript enabled.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Masslet Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions
- **Discord**: Join the Massa Discord community

### Community

- **GitHub**: [Masslet Repository](https://github.com/web3devzz/masslet)
- **Massa Website**: [massa.net](https://massa.net/)
- **Massa Discord**: [Official Massa Discord](https://discord.gg/massa)
- **Massa Documentation**: [docs.massa.net](https://docs.massa.net/)

---

## 🙏 Acknowledgments

- **Massa Team**: For creating an innovative blockchain platform
- **React Team**: For the excellent React framework
- **Vite Team**: For the fast and modern build tool
- **Tailwind CSS**: For the utility-first CSS framework
- **Open Source Community**: For the amazing libraries and tools

---

**Made with ❤️ for the Massa ecosystem**

*Masslet - Your gateway to the Massa blockchain*
