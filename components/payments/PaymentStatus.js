/**
 * Payment Status Component
 * Displays payment status and progress to customers
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { PAYMENT_STATUS } from '../../utils/monime';

const PaymentStatus = ({ 
  orderId, 
  paymentCodeId, // Legacy support
  checkoutSessionId, // New Checkout Session support
  status, 
  sessionStatus, // New session status
  amount, 
  currency = 'SLE',
  onStatusChange,
  autoRefresh = true,
  refreshInterval = 5000 
}) => {
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentSessionStatus, setCurrentSessionStatus] = useState(sessionStatus);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Determine display status and styling
  const getDisplayStatus = () => {
    // For Checkout Sessions, prioritize session status
    if (checkoutSessionId && currentSessionStatus) {
      switch (currentSessionStatus) {
        case 'completed':
          return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-50', icon: '✓' };
        case 'expired':
          return { status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', icon: '⏰' };
        case 'cancelled':
          return { status: 'cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '✕' };
        case 'pending':
        case 'processing':
        default:
          return { status: 'pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '⏳' };
      }
    }
    
    // Fallback to payment status for legacy support
    switch (currentStatus) {
      case PAYMENT_STATUS.COMPLETED:
        return { status: 'completed', color: 'text-green-600', bgColor: 'bg-green-50', icon: '✓' };
      case PAYMENT_STATUS.FAILED:
        return { status: 'failed', color: 'text-red-600', bgColor: 'bg-red-50', icon: '✕' };
      case PAYMENT_STATUS.CANCELLED:
        return { status: 'cancelled', color: 'text-gray-600', bgColor: 'bg-gray-50', icon: '✕' };
      case PAYMENT_STATUS.EXPIRED:
        return { status: 'expired', color: 'text-red-600', bgColor: 'bg-red-50', icon: '⏰' };
      case PAYMENT_STATUS.PENDING:
      case PAYMENT_STATUS.PROCESSING:
      default:
        return { status: 'pending', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: '⏳' };
    }
  };

  const displayInfo = getDisplayStatus();

  // Status badge component for compact display
  const StatusBadge = () => (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${displayInfo.bgColor} ${displayInfo.color}`}>
      <span className="mr-2">{displayInfo.icon}</span>
      {displayInfo.status.charAt(0).toUpperCase() + displayInfo.status.slice(1)}
    </div>
  );

  // Status configurations
  const statusConfig = {
    [PAYMENT_STATUS.PENDING]: {
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      title: 'Payment Pending',
      description: 'Waiting for payment confirmation',
      showSpinner: true
    },
    [PAYMENT_STATUS.PROCESSING]: {
      icon: ArrowPathIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      title: 'Processing Payment',
      description: 'Your payment is being processed',
      showSpinner: true
    },
    [PAYMENT_STATUS.COMPLETED]: {
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Payment Successful',
      description: 'Your payment has been completed successfully',
      showSpinner: false
    },
    [PAYMENT_STATUS.FAILED]: {
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      title: 'Payment Failed',
      description: 'Your payment could not be processed',
      showSpinner: false
    },
    [PAYMENT_STATUS.CANCELLED]: {
      icon: XCircleIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      title: 'Payment Cancelled',
      description: 'Payment was cancelled by user',
      showSpinner: false
    },
    [PAYMENT_STATUS.EXPIRED]: {
      icon: ExclamationTriangleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      title: 'Payment Expired',
      description: 'Payment link has expired',
      showSpinner: false
    }
  };

  // Auto-refresh payment status
  useEffect(() => {
    if (!autoRefresh || !orderId) return;

    // Determine if we should continue refreshing based on status
    const shouldContinueRefreshing = () => {
      // For Checkout Sessions, check session status
      if (checkoutSessionId) {
        return currentSessionStatus === 'pending' || currentSessionStatus === 'processing';
      }
      // For legacy Payment Codes, check payment status
      return [
        PAYMENT_STATUS.PENDING,
        PAYMENT_STATUS.PROCESSING
      ].includes(currentStatus);
    };

    if (!shouldContinueRefreshing()) return;

    const interval = setInterval(async () => {
      await refreshPaymentStatus();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [currentStatus, currentSessionStatus, orderId, autoRefresh, refreshInterval, checkoutSessionId]);

  // Refresh payment status
  const refreshPaymentStatus = async () => {
    if (!orderId || isRefreshing) return;

    setIsRefreshing(true);
    try {
      // Use appropriate API endpoint based on available IDs
      let apiUrl = `/api/payments/verify-status?orderId=${orderId}`;
      if (checkoutSessionId) {
        apiUrl += `&checkoutSessionId=${checkoutSessionId}`;
      } else if (paymentCodeId) {
        apiUrl += `&paymentCodeId=${paymentCodeId}`;
      }

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success) {
        let statusChanged = false;
        
        // Update payment status if changed
        if (data.paymentStatus && data.paymentStatus !== currentStatus) {
          setCurrentStatus(data.paymentStatus);
          statusChanged = true;
        }
        
        // Update session status if changed
        if (data.sessionStatus && data.sessionStatus !== currentSessionStatus) {
          setCurrentSessionStatus(data.sessionStatus);
          statusChanged = true;
        }
        
        if (statusChanged) {
          setLastUpdated(new Date());
          
          if (onStatusChange) {
            onStatusChange(data.paymentStatus || currentStatus, {
              ...data,
              sessionStatus: data.sessionStatus || currentSessionStatus
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh payment status:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const config = statusConfig[currentStatus] || statusConfig[PAYMENT_STATUS.PENDING];
  const Icon = config.icon;

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-SL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStatus}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className={`
            relative rounded-lg border-2 p-6 text-center
            ${config.bgColor} ${config.borderColor}
          `}
        >
          {/* Status Icon */}
          <div className="flex justify-center mb-4">
            <div className={`
              relative p-3 rounded-full bg-white shadow-sm
              ${config.showSpinner ? 'animate-pulse' : ''}
            `}>
              <Icon className={`h-8 w-8 ${config.color}`} />
              
              {/* Spinner overlay for processing states */}
              {config.showSpinner && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-current opacity-30"
                />
              )}
            </div>
          </div>

          {/* Status Title */}
          <h3 className={`text-lg font-semibold mb-2 ${config.color}`}>
            {config.title}
          </h3>

          {/* Status Description */}
          <p className="text-gray-600 mb-4">
            {config.description}
          </p>

          {/* Amount Display */}
          {amount && (
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-center space-x-2">
                <CreditCardIcon className="h-5 w-5 text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {formatAmount(amount)}
                </span>
              </div>
            </div>
          )}

          {/* Order ID */}
          {orderId && (
            <div className="text-sm text-gray-500 mb-4">
              Order ID: <span className="font-mono">{orderId}</span>
            </div>
          )}

          {/* Refresh Button for Failed/Expired States */}
          {(displayInfo.status === 'failed' || displayInfo.status === 'expired') && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshPaymentStatus}
              disabled={isRefreshing}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check Again'}
            </motion.button>
          )}

          {/* Auto-refresh indicator */}
          {autoRefresh && [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING].includes(currentStatus) && (
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center justify-center space-x-1">
                <ArrowPathIcon className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>
                  Auto-refreshing • Last updated: {formatTime(lastUpdated)}
                </span>
              </div>
            </div>
          )}

          {/* Success Actions */}
          {currentStatus === PAYMENT_STATUS.COMPLETED && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 space-y-2"
            >
              <button
                onClick={() => window.location.href = '/orders'}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View Order Details
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PaymentStatus;