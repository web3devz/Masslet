import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeComponent = ({ value, size = 200 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        height: size,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [value, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="border rounded-lg" />
      <p className="text-sm text-gray-600 mt-2 text-center break-all max-w-xs">
        {value}
      </p>
    </div>
  );
};

export default QRCodeComponent;
