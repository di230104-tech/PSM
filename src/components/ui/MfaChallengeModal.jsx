import React, { useState } from 'react';
import Button from './Button';
import Input from './Input';
import { supabase } from '../../lib/supabaseClient';
import { AlertCircle } from 'lucide-react';

const MfaChallengeModal = ({ onCancel, onSuccess, factorId }) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    setIsVerifying(true);
    setError('');

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });
  
      if (challengeError) {
        setError(challengeError.message);
        setIsVerifying(false);
        return;
      }
  
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: code,
      });

    if (verifyError) {
      setError(verifyError.message);
    } else {
      onSuccess();
    }
    setIsVerifying(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-foreground">MFA Verification</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the code from your authenticator app to proceed.
            </p>
          </div>
          <Button variant="ghost" size="sm" iconName="X" onClick={onCancel} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            <Input
                type="text"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength="6"
            />
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-border gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isVerifying}>
            Cancel
          </Button>
          <Button variant="primary" loading={isVerifying} disabled={isVerifying} onClick={handleVerify}>
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MfaChallengeModal;
