'use client'

import { useRouter } from 'next/navigation'

interface LimitExceededModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LimitExceededModal({ isOpen, onClose }: LimitExceededModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const handleUpgrade = () => {
    router.push('/#pricing')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Icon */}
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Free Plan Limit Reached
            </h3>
            <p className="text-gray-600">
              You&apos;ve used all <span className="font-semibold">3 free NDAs</span>. Upgrade to Pro for unlimited NDAs and more features!
            </p>
          </div>

          {/* Features list */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Pro Plan Includes:</p>
            <ul className="space-y-2">
              <li className="flex items-start text-sm text-gray-700">
                <svg className="h-5 w-5 text-teal-700 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Unlimited NDAs</strong></span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <svg className="h-5 w-5 text-teal-700 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Custom templates</span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <svg className="h-5 w-5 text-teal-700 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Priority support</span>
              </li>
              <li className="flex items-start text-sm text-gray-700">
                <svg className="h-5 w-5 text-teal-700 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Only $19.99/month</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 px-4 py-2.5 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
