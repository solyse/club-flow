import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InternationalAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotifyMe?: (email: string) => void;
}

export function InternationalAddressModal({ 
  isOpen, 
  onClose,
  onNotifyMe 
}: InternationalAddressModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNotifyMe = async () => {
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    
    // Call the optional callback with email
    if (onNotifyMe) {
      await onNotifyMe(email);
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsSubmitting(false);
    setEmail('');
    onClose();
  };

  const handleContinue = () => {
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-[20px] border pointer-events-auto"
              style={{
                width: '100%',
                maxWidth: '570px',
                borderColor: '#E8E2D2',
                boxShadow: '0 8px 28px rgba(0, 0, 0, 0.12)',
                padding: '40px 32px 36px',
                fontFamily: 'Inter, sans-serif'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-[#999999] hover:text-[#D4AF37] transition-colors"
                aria-label="Close modal"
              >
                <X size={20} strokeWidth={2} />
              </button>

              {/* Logo */}
              <div className="flex justify-center mb-4">
                <div 
                  style={{ 
                    fontSize: '28px', 
                    fontWeight: 600, 
                    color: '#D4AF37',
                    letterSpacing: '0.5px',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  BAGCADDIE
                </div>
              </div>

              {/* Headline */}
              <h2 
                className="text-center mb-4"
                style={{
                  fontSize: '26px',
                  fontWeight: 600,
                  color: '#1B1B1B',
                  fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.3
                }}
              >
                International Shipping Not Yet Available
              </h2>

              {/* Body Copy */}
              <p 
                className="text-center mb-8"
                style={{
                  fontSize: '17px',
                  fontWeight: 400,
                  color: '#565656',
                  lineHeight: 1.5,
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                BagCaddie currently offers premium shipping services exclusively within the United States.
                We're expanding globally soon — and we'd be happy to notify you the moment your preferred destination becomes available.
              </p>

              {/* Email Field */}
              <div className="mb-4 hidden">
                <label 
                  htmlFor="international-email"
                  className="block mb-2"
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#1B1B1B',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  Get notified when international routes launch
                </label>
                <input
                  id="international-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-[10px] border-[1.5px] focus:outline-none focus:border-[#c29d2f] transition-colors"
                  style={{
                    height: '52px',
                    borderColor: '#D4AF37',
                    padding: '0 12px',
                    fontSize: '16px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#1B1B1B'
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email.includes('@')) {
                      handleNotifyMe();
                    }
                  }}
                />
              </div>

              {/* Primary CTA */}
              <button
               onClick={handleContinue}
                // onClick={handleNotifyMe}
                // disabled={!email || !email.includes('@') || isSubmitting}
                className="w-full rounded-[12px] transition-all mb-4"
                style={{
                  height: '52px',
                //   backgroundColor: (!email || !email.includes('@') || isSubmitting) ? '#E0D4B8' : '#D4AF37',
                  backgroundColor:  '#D4AF37',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                //   cursor: (!email || !email.includes('@') || isSubmitting) ? 'not-allowed' : 'pointer',
                //   opacity: (!email || !email.includes('@') || isSubmitting) ? 0.6 : 1
                }}
                // onMouseOver={(e) => {
                //   if (email && email.includes('@') && !isSubmitting) {
                //     e.currentTarget.style.backgroundColor = '#c29d2f';
                //   }
                // }}
                // onMouseOut={(e) => {
                //   if (email && email.includes('@') && !isSubmitting) {
                //     e.currentTarget.style.backgroundColor = '#D4AF37';
                //   }
                // }}
              >
                {isSubmitting ? 'Submitting...' : 'Notify Me When Available'}
              </button>

              {/* Secondary CTA */}
              <button
                onClick={handleContinue}
                className="w-full rounded-[12px] border transition-colors"
                style={{
                  height: '52px',
                  borderColor: '#111111',
                  borderWidth: '1px',
                  backgroundColor: 'transparent',
                  color: '#111111',
                  fontSize: '16px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F5F5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Continue
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
