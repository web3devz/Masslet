import React from 'react';
import { formatAddress, formatTimestamp, copyToClipboard } from './utils';

const TransactionModal = ({ transaction, isOpen, onClose, userAddress }) => {
  if (!isOpen || !transaction) return null;

  const isOutgoing = transaction.from === userAddress;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transaction Details</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isOutgoing ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {isOutgoing ? '↗ Sent' : '↙ Received'}
            </div>
            <div className={`text-2xl font-bold mt-2 ${
              isOutgoing ? 'text-red-600' : 'text-green-600'
            }`}>
              {isOutgoing ? '-' : '+'}{transaction.amount} MASSA
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction ID
              </label>
              <div className="flex items-center">
                <span className="font-mono text-sm text-gray-600 flex-1 truncate">
                  {transaction.id}
                </span>
                <button
                  onClick={() => copyToClipboard(transaction.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="flex items-center">
                <span className="font-mono text-sm text-gray-600 flex-1 truncate">
                  {transaction.from}
                </span>
                <button
                  onClick={() => copyToClipboard(transaction.from)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="flex items-center">
                <span className="font-mono text-sm text-gray-600 flex-1 truncate">
                  {transaction.to}
                </span>
                <button
                  onClick={() => copyToClipboard(transaction.to)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <span className={`inline-block px-2 py-1 rounded text-sm ${
                transaction.status === 'success' ? 'bg-green-100 text-green-800' :
                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timestamp
              </label>
              <div>
                <span className="text-sm text-gray-600">
                  {new Date(transaction.timestamp).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({formatTimestamp(transaction.timestamp)})
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={onClose}
              className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
