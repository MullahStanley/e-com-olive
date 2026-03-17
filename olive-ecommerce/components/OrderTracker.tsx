'use client';

import { Check, Package, Truck, Home, FileText, XCircle } from 'lucide-react';
import type { OrderStatus, TrackingUpdate } from '../types';

interface OrderTrackerProps {
  status: OrderStatus;
  trackingHistory: TrackingUpdate[];
}

export default function OrderTracker({ status, trackingHistory }: OrderTrackerProps) {
  const isCancelled = status === 'cancelled';

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: FileText },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home },
  ];

  // Safely find the index. If cancelled (not in the array), this returns -1
  const currentStepIndex = steps.findIndex((step) => step.key === status);

  return (
    <div className="space-y-10">
      
      {/* 1. Gracefully handle cancelled orders */}
      {isCancelled ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-4">
          <XCircle className="text-red-500 flex-shrink-0" size={32} />
          <div>
            <h3 className="text-red-800 font-bold text-lg">Order Cancelled</h3>
            <p className="text-red-600 text-sm">
              This order has been cancelled and will not be fulfilled.
            </p>
          </div>
        </div>
      ) : (
        /* Progress Bar (Only visible if not cancelled) */
        <div className="relative pt-4">
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="flex flex-col items-center flex-1">
                  <div
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-sm
                      ${isCompleted ? 'bg-green-500' : 'bg-white border-2 border-gray-200'}
                      ${isCurrent ? 'ring-4 ring-green-100' : ''}
                      transition-all duration-300
                    `}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {isCompleted && !isCurrent ? (
                      <Check className="text-white" size={20} aria-hidden="true" />
                    ) : (
                      <Icon
                        className={isCompleted ? 'text-white' : 'text-gray-400'}
                        size={20}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {/* Added text-center and leading-tight for better mobile display */}
                  <p
                    className={`mt-3 text-xs sm:text-sm font-medium text-center leading-tight px-1
                      ${isCompleted ? 'text-green-700' : 'text-gray-500'}
                    `}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Connecting Line */}
          <div className="absolute top-9 sm:top-10 left-0 right-0 h-1 bg-gray-200 z-0 mx-[10%] sm:mx-[12%]">
            <div
              className="h-full bg-green-500 transition-all duration-700 ease-in-out"
              style={{
                width: `${currentStepIndex > 0 ? (currentStepIndex / (steps.length - 1)) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Upgraded Tracking History (True Vertical Timeline) */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-lg mb-6 text-gray-900">Tracking History</h3>
        
        {trackingHistory.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No tracking updates available yet.</p>
        ) : (
          <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
            {/* Reverse the array so the newest update is at the top */}
            {[...trackingHistory].reverse().map((update) => (
              <div key={`${update.timestamp}-${update.status}`} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm" />
                
                <div>
                  <p className="font-medium text-gray-900 leading-tight">
                    {update.message}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(update.timestamp).toLocaleString('en-KE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}