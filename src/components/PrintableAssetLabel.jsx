import React from 'react';
import QRCode from 'react-qr-code';

const PrintableAssetLabel = ({ asset }) => {
  if (!asset) return null;

  const assetUrl = `${window.location.origin}/assets/${asset.asset_tag}`;

  return (
    <div id="print-section" className="hidden print:flex flex-col items-center justify-center w-[50mm] h-[25mm] border border-black p-2 bg-white text-black fixed top-0 left-0 z-[9999] overflow-hidden">
      <h1 className="text-[10px] font-bold tracking-tight mb-1">PANASONIC ISD</h1>
      <div className="flex flex-row items-center justify-between w-full gap-2">
        <div className="bg-white p-0.5 border border-gray-200">
          <QRCode value={assetUrl} size={45} level="H" />
        </div>
        <div className="flex flex-col text-right flex-1 min-w-0">
          <span className="text-[7px] text-gray-600 uppercase font-semibold leading-none">Asset Tag</span>
          <span className="text-[11px] font-black truncate leading-tight mb-0.5">{asset.asset_tag}</span>
          <span className="text-[7px] text-gray-600 uppercase font-semibold leading-none">Serial Number</span>
          <span className="text-[9px] font-medium truncate leading-none">{asset.serial_number || 'N/A'}</span>
        </div>
      </div>
      <div className="w-full mt-1 border-t border-gray-100 pt-0.5">
        <p className="text-[6px] text-center text-gray-400">ISD Asset Management System</p>
      </div>
    </div>
  );
};

export default PrintableAssetLabel;
