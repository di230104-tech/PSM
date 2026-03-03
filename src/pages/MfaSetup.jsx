import React, { useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { QRCode } from 'react-qr-code';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

const MfaSetup = () => {
  const [factor, setFactor] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const handleEnroll = async () => {
    setError('');
    setStatus('Enrolling...');
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      setError(error.message);
      setStatus('');
      return;
    }

    setFactor(data);
    // The QR code is provided as an SVG string.
    // We can use a data URL to display it.
    setQrCode(`data:image/svg+xml;utf8,${encodeURIComponent(data.totp.qr_code)}`);
    setStatus('Scan the QR code with your authenticator app.');
  };

  const handleVerify = async () => {
    setError('');
    if (!factor) {
      setError('No factor to verify. Please enroll first.');
      return;
    }
    setStatus('Verifying...');

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: factor.id,
    });

    if (challengeError) {
      setError(challengeError.message);
      setStatus('');
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challengeData.id,
      code: code,
    });

    if (verifyError) {
      setError(verifyError.message);
      setStatus('');
    } else {
      setStatus('MFA setup successful!');
      setFactor(null);
      setQrCode(null);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-2xl font-bold mb-4">MFA Setup</h1>
      <div className="space-y-4">
        {!qrCode ? (
          <Button onClick={handleEnroll}>Enable MFA</Button>
        ) : (
          <div>
            <p className="mb-4">{status}</p>
            <div className="p-4 bg-white rounded-lg inline-block">
                <img src={qrCode} alt="QR Code" />
            </div>
            <div className="mt-4">
              <Input
                type="text"
                placeholder="Enter TOTP code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button onClick={handleVerify} className="mt-2">Verify</Button>
            </div>
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default MfaSetup;
