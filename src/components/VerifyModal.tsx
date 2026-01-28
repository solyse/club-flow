import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { VerifyStep } from './VerifyStep';
import { EventMetaObject } from '../services/api';

interface VerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactInfo: string;
  onSubmit: (code: string, hasPartner: boolean) => void;
  redirectToBooking: () => void | Promise<void>;
  eventData?: EventMetaObject | null;
  onSetCurrentStep: (step: string) => void;
}

export function VerifyModal({
  isOpen,
  onClose,
  contactInfo,
  onSubmit,
  redirectToBooking,
  eventData,
  onSetCurrentStep,
}: VerifyModalProps) {
  const isEmail = contactInfo.includes('@');
  const title = isEmail ? 'Verify your email' : 'Verify your phone number';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <VerifyStep
          contactInfo={contactInfo}
          onSubmit={onSubmit}
          onBack={onClose}
          redirectToBooking={redirectToBooking}
          onSetCurrentStep={onSetCurrentStep}
          eventData={eventData}
        />
      </DialogContent>
    </Dialog>
  );
}
