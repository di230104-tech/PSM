import React from 'react';
import QRCode from 'react-qr-code';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import PrintableAssetLabel from '../../../components/PrintableAssetLabel';

const QRCodeModal = ({ asset, onClose }) => {
  if (!asset) return null;

  const qrCodeUrl = `${window.location.origin}/assets/${asset.asset_tag}`;

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

  return (
    <>
      {/* Sticker layout for physical printing - only visible during print */}
      <PrintableAssetLabel asset={asset} />
      
      {/* The modal container - hidden during print */}
      <div className="print:hidden fixed inset-0 bg-black/50 z-300 flex items-center justify-center p-4 overflow-y-auto">
        
        {/* The actual modal content panel */}
        <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-2xl">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Asset QR Code</h3>
            <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
          </div>

          {/* QR Code and Info */}
          <div className="text-center">
            <div className="bg-white p-6 inline-block rounded-xl border border-border shadow-sm mb-6">
              <QRCode value={qrCodeUrl} size={200} id="QRCodeSvg" level="H" />
            </div>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-foreground">{asset?.product_name}</div>
              <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full font-mono font-bold">
                {asset?.asset_tag}
              </div>
              <p className="text-sm text-muted-foreground mt-4 break-all font-mono opacity-60">
                {qrCodeUrl}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 mt-8">
            <Button variant="outline" iconName="Printer" onClick={handlePrint} className="flex-1">
              Print Label
            </Button>
            <Button variant="default" iconName="Download" onClick={handleDownload} className="flex-1">
              Download PNG
            </Button>
          </div>

        </div>
      </div>
    </>
  );
};

export default QRCodeModal;
