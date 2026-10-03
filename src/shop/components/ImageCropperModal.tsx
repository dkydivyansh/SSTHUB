import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

export default function ImageCropperModal({ image, onCrop, onCancel }: { image: string, onCrop: (file: File) => void, onCancel: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback((_ca: any, cap: any) => {
    setCroppedAreaPixels(cap);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    try {
      const img = new Image();
      img.src = image;
      await new Promise(r => img.onload = r);
      
      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, croppedAreaPixels.width, croppedAreaPixels.height
      );
      
      canvas.toBlob(blob => {
        if (!blob) return;
        const file = new File([blob], "cropped.png", { type: 'image/png' });
        onCrop(file);
      }, 'image/png');
    } catch (e) {
      console.error(e);
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black w-full max-w-xl flex flex-col h-[80vh]">
        <div className="p-4 border-b-4 border-black flex justify-between items-center bg-[#FFF5E1]">
          <h3 className="font-black uppercase text-xl">Crop Image (1:1)</h3>
          <button onClick={onCancel} className="hover:bg-red-500 hover:text-white p-1 border-2 border-transparent hover:border-black transition-all"><X /></button>
        </div>
        <div className="relative flex-1 bg-gray-200">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>
        <div className="p-4 border-t-4 border-black flex justify-between items-center bg-white gap-4">
          <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(Number(e.target.value))} className="flex-1 accent-black" />
          <button onClick={handleDone} className="bg-[#3B82F6] text-white px-6 py-2 border-4 border-black font-black uppercase shadow-[4px_4px_0_0_#000] hover:-translate-y-1 transition-all flex gap-2"><Check /> Done</button>
        </div>
      </div>
    </div>
  );
}
