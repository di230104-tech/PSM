import React from 'react';
import QRCode from 'react-qr-code';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QRCodeModal = ({ asset, isOpen, onClose }) => {
  if (!isOpen) return null;

  const qrCodeUrl = `${window.location.origin}/assets/${asset.asset_tag || asset.id}`;

  const handlePrint = () => {
    window.print();
  };
  
  const handleDownload = () => {
    const svg = document.getElementById("QRCodeSvg");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${asset.asset_tag}_qrcode.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printStyles = `
    @media print {
      /* Hide elements that should not be printed */
      .no-print {
        display: none !important;
      }
      
      /* Reset the layout for the modal content to be printable */
      .printable-modal-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: white;
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      
      {/* The modal container. The dark overlay is marked as no-print */}
      <div className="no-print fixed inset-0 bg-black/50 z-300 flex items-center justify-center p-4">
        
        {/* The actual modal content panel */}
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md printable-modal-content">
          
          {/* Header - marked as no-print */}
          <div className="no-print flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Asset QR Code</h3>
            <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
          </div>

          {/* QR Code and Info - this section will be printed */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6 hidden print:block">Asset Details</h1>
            <div className="bg-white p-4 inline-block rounded-lg border">
              <QRCode value={qrCodeUrl} size={256} id="QRCodeSvg" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="text-xl font-semibold text-foreground">{asset?.product_name}</div>
              <div className="text-lg text-muted-foreground font-mono">{asset?.asset_tag}</div>
              <div className="text-sm text-muted-foreground font-mono pt-2">{qrCodeUrl}</div>
            </div>
          </div>
          
          {/* Action buttons - marked as no-print */}
          <div className="no-print flex space-x-3 mt-6">
            <Button variant="outline" iconName="Printer" onClick={handlePrint} className="flex-1">
              Print
            </Button>
            <Button variant="default" iconName="Download" onClick={handleDownload} className="flex-1">
              Download
            </Button>
          </div>

        </div>
      </div>
    </>
  );
};

export default QRCodeModal;
