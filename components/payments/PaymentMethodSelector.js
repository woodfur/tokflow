/**
 * Payment Method Selector Component
 * Allows customers to select their preferred payment method
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
  WalletIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PAYMENT_METHODS } from '../../utils/monime';

const PaymentMethodSelector = ({ 
  selectedMethod, 
  onMethodSelect, 
  disabled = false,
  className = '' 
}) => {
  const [hoveredMethod, setHoveredMethod] = useState(null);

  const paymentMethods = [
    {
      id: PAYMENT_METHODS.MOBILE_MONEY,
      name: 'Mobile Money',
      description: 'Pay with Orange Money, Africell Money, or other mobile wallets',
      icon: DevicePhoneMobileIcon,
      popular: true,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      hoverColor: 'hover:bg-orange-100',
      selectedColor: 'bg-orange-100 border-orange-400'
    },
    {
      id: PAYMENT_METHODS.CARD,
      name: 'Credit/Debit Card',
      description: 'Pay securely with Visa, Mastercard, or other cards',
      icon: CreditCardIcon,
      popular: false,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      hoverColor: 'hover:bg-blue-100',
      selectedColor: 'bg-blue-100 border-blue-400'
    },
    {
      id: PAYMENT_METHODS.BANK,
      name: 'Bank Transfer',
      description: 'Direct transfer from your bank account',
      icon: BanknotesIcon,
      popular: false,
      color: 'bg-green-50 border-green-200 text-green-800',
      hoverColor: 'hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400'
    },
    {
      id: PAYMENT_METHODS.DIGITAL_WALLET,
      name: 'Digital Wallet',
      description: 'Pay with other digital wallet services',
      icon: WalletIcon,
      popular: false,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      hoverColor: 'hover:bg-purple-100',
      selectedColor: 'bg-purple-100 border-purple-400'
    }
  ];

  const handleMethodSelect = (method) => {
    if (!disabled) {
      onMethodSelect(method.id);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Payment Method
        </h3>
        <span className="text-sm text-gray-500">
          Select your preferred option
        </span>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isHovered = hoveredMethod === method.id;
          const Icon = method.icon;

          return (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected 
                  ? `${method.selectedColor} ring-2 ring-offset-2 ring-blue-500` 
                  : `${method.color} ${method.hoverColor}`
                }
              `}
              onClick={() => handleMethodSelect(method)}
              onMouseEnter={() => setHoveredMethod(method.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              {/* Popular badge */}
              {method.popular && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Popular
                </div>
              )}

              <div className="flex items-start space-x-4">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${isSelected ? 'bg-white shadow-sm' : 'bg-white/50'}
                `}>
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-gray-900">
                      {method.name}
                    </h4>
                    {isSelected && (
                      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {method.description}
                  </p>
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 rounded-lg border-2 border-blue-500 pointer-events-none"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Secure payments:</span> All transactions are encrypted and processed securely through Monime.
        </p>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;