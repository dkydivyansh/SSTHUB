import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { X, Check } from 'lucide-react';

interface ImageCropperModalProps {
  imageSrc: string;
  onCropDone: (croppedFile: File) => void;
  onCancel: () => void;
}

export default function ImageCropperModal({ imageSrc, onCropDone, onCancel }: ImageCropperModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedBlob) {
        const file = new File([croppedBlob], 'cropped_logo.jpg', { type: 'image/jpeg' });
        onCropDone(file);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center p-4">
      <div className="bg-white border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-[#f4f4f5]">
          <h2 className="font-black uppercase tracking-widest text-lg">Crop Logo</h2>
          <button onClick={onCancel} className="hover:-translate-y-1 transition-transform">
            <X size={24} />
          </button>
        </div>
        
        <div className="relative w-full h-[400px] bg-gray-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 border-t-4 border-black flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-black uppercase tracking-widest text-xs">Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-black"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-white border-4 border-black py-3 font-black uppercase text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              disabled={isCropping}
              className="flex-1 bg-emerald-500 border-4 border-black py-3 font-black uppercase text-sm hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCropping ? 'Cropping...' : <><Check size={18} /> Apply Crop</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
