import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5Qrcode } from 'html5-qrcode';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';

const ScannerPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [manualTag, setManualTag] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // We'll use Html5Qrcode for more control than the scanner UI
    const html5QrCode = new Html5Qrcode("reader");
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const config = { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0 
        };
        
        await html5QrCode.start(
          { facingMode: "environment" }, 
          config, 
          onScanSuccess, 
          onScanFailure
        );
        setIsScanning(true);
      } catch (err) {
        console.error("Error starting scanner:", err);
        setError("Could not access camera. Please ensure you have granted camera permissions.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
      }
    };
  }, []);

  const hasScanned = useRef(false);

  const onScanSuccess = (decodedText, decodedResult) => {
    if (hasScanned.current) return;

    if (decodedText) {
      hasScanned.current = true;
      const assetTag = decodedText.trim().toUpperCase();
      
      console.log(`Scanned asset tag: ${assetTag}`);

      if (html5QrCodeRef.current) {
        // Try to stop the scanner before navigating
        html5QrCodeRef.current.stop().then(() => {
          navigate(`/assets/${assetTag}`);
        }).catch(err => {
          // If stopping fails, we still want to navigate
          console.error("Error stopping after success:", err);
          navigate(`/assets/${assetTag}`);
        });
      } else {
        navigate(`/assets/${assetTag}`);
      }
    }
  };

  const onScanFailure = (error) => {
    // Typically we don't need to show every failure (like "no QR code found in this frame")
    // console.warn(`Code scan error = ${error}`);
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (manualTag.trim()) {
      navigate(`/assets/${manualTag.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-16 border-b border-border bg-card shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          iconName="ChevronLeft"
        />
        <h1 className="text-lg font-semibold">Scan Asset QR</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Camera Viewfinder Area */}
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="p-6 text-center text-white z-10">
            <Icon name="CameraOff" size={48} className="mx-auto mb-4 text-red-500" />
            <p className="mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : (
          <>
            <div id="reader" className="w-full h-full"></div>
            
            {/* Custom Overlay (simulating a target) */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
               <div className="relative w-64 h-64 border-2 border-primary/50 rounded-lg">
                  <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {/* Scan line animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-scan"></div>
               </div>
            </div>

            {/* Hint text */}
            <div className="absolute bottom-10 left-0 w-full text-center text-white/80 text-sm font-medium z-10 px-4">
              Center the asset QR code within the box
            </div>
          </>
        )}
      </div>

      {/* Manual Entry Fallback */}
      <div className="p-6 border-t border-border bg-card shrink-0">
        <p className="text-sm text-muted-foreground mb-3">Manual Entry (Asset Tag)</p>
        <form onSubmit={handleManualSearch} className="flex gap-2">
          <Input 
            placeholder="e.g., ISD-LAP-1042"
            value={manualTag}
            onChange={(e) => setManualTag(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>
    </div>
  );
};

export default ScannerPage;
