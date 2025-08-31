import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Building2, Hash, Calendar, MessageSquare } from 'lucide-react';

interface CreditRequestFormProps {
  producerAddress: string;
  producerState: string;
  producerCity: string;
  onSubmit: (request: CreditRequest) => void;
  isSubmitting: boolean;
}

export interface CreditRequest {
  producerAddress: string;
  buyerAddress: string;
  requestedAmount: number;
  purpose: string;
  deliveryDate: string;
  contactInfo: string;
  message: string;
}

const CreditRequestForm: React.FC<CreditRequestFormProps> = ({
  producerAddress,
  producerState,
  producerCity,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<CreditRequest>({
    producerAddress,
    buyerAddress: '',
    requestedAmount: 1,
    purpose: '',
    deliveryDate: '',
    contactInfo: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof CreditRequest, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl border border-gray-600 bg-gray-800/50"
    >
      <div className="flex items-center space-x-3 mb-6">
        <Building2 className="h-6 w-6 text-brand" />
        <h3 className="text-lg font-semibold">Request Credits from Producer</h3>
      </div>

      {/* Producer Info */}
      <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <h4 className="font-semibold text-blue-400 mb-2">Producer Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Address:</span>
            <code className="block bg-gray-900 px-2 py-1 rounded mt-1 font-mono text-xs">
              {producerAddress}
            </code>
          </div>
          <div>
            <span className="text-gray-400">Location:</span>
            <p className="mt-1">{producerCity}, {producerState}</p>
          </div>
        </div>
      </div>

      {/* Request Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Hash className="h-4 w-4 inline mr-2" />
              Your Wallet Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={formData.buyerAddress}
              onChange={(e) => handleInputChange('buyerAddress', e.target.value)}
              className="input w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Hash className="h-4 w-4 inline mr-2" />
              Credits Requested
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={formData.requestedAmount}
              onChange={(e) => handleInputChange('requestedAmount', parseInt(e.target.value))}
              className="input w-full"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Building2 className="h-4 w-4 inline mr-2" />
            Intended Use/Purpose
          </label>
          <select
            value={formData.purpose}
            onChange={(e) => handleInputChange('purpose', e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select purpose...</option>
            <option value="steel-production">Steel Production</option>
            <option value="ammonia-production">Ammonia Production</option>
            <option value="transport-fuel">Transport Fuel</option>
            <option value="power-generation">Power Generation</option>
            <option value="industrial-processes">Industrial Processes</option>
            <option value="carbon-offset">Carbon Offset</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <Calendar className="h-4 w-4 inline mr-2" />
            Preferred Delivery Date
          </label>
          <input
            type="date"
            value={formData.deliveryDate}
            onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Contact Information
          </label>
          <input
            type="text"
            placeholder="Email, phone, or preferred contact method"
            value={formData.contactInfo}
            onChange={(e) => handleInputChange('contactInfo', e.target.value)}
            className="input w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Additional Message
          </label>
          <textarea
            placeholder="Describe your specific requirements, pricing expectations, or any other details..."
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={4}
            className="input w-full resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Submitting Request...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit Credit Request</span>
            </>
          )}
        </button>
      </form>

      {/* Information */}
      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
        <h4 className="font-semibold text-yellow-400 mb-2">How This Works</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Submit your request with all required details</li>
          <li>Producer will review and respond with pricing/terms</li>
          <li>Negotiate final terms and payment method</li>
          <li>Producer transfers credits to your wallet</li>
          <li>You can then use or retire the credits as needed</li>
        </ol>
      </div>
    </motion.div>
  );
};

export default CreditRequestForm;
