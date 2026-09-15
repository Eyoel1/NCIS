import React, { useState } from 'react';
import { Camera, CheckCircle, ExternalLink, X, Plus, Image as ImageIcon } from 'lucide-react';
import { VehicleCheckpointPhoto, MOCK_VEHICLE_PHOTOS } from '../../services/photoData';

interface VehiclePhotoGalleryProps {
  trackingNumber?: string;
  photos?: VehicleCheckpointPhoto[];
}

export const VehiclePhotoGallery: React.FC<VehiclePhotoGalleryProps> = ({
  trackingNumber = 'ET-SHP-2026-001',
  photos: propPhotos
}) => {
  const [photoList, setPhotoList] = useState<VehicleCheckpointPhoto[]>(
    propPhotos || MOCK_VEHICLE_PHOTOS[trackingNumber] || MOCK_VEHICLE_PHOTOS['ET-SHP-2026-001']
  );
  const [selectedPhoto, setSelectedPhoto] = useState<VehicleCheckpointPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      const newPhoto: VehicleCheckpointPhoto = {
        id: `PH-${Date.now()}`,
        stageName: 'Corridor Transit',
        title: `Uploaded: ${file.name.substring(0, 24)}`,
        timestamp: 'Just now',
        location: 'Inland Checkpoint (Modjo)',
        inspector: 'Transit Consignment Officer',
        imageUrl: URL.createObjectURL(file),
        verified: true
      };
      setPhotoList(prev => [newPhoto, ...prev]);
      setIsUploading(false);
    }, 600);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-500" />
            Vehicle Visual Chain-of-Custody Documentation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Photographic proof captured at each physical border, sea port, and dry terminal checkpoint
          </p>
        </div>

        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition cursor-pointer shadow-xs active:scale-95">
          <Plus className="w-3.5 h-3.5" />
          <span>{isUploading ? 'Uploading...' : 'Add Checkpoint Photo'}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleSimulateUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Grid of photos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {photoList.map(photo => (
          <div
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950/50 card-hover-lift transition-all"
          >
            <div className="relative aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <img
                src={photo.imageUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono text-white font-medium">
                {photo.stageName}
              </span>
              {photo.verified && (
                <span className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                  <CheckCircle className="w-3 h-3" />
                </span>
              )}
            </div>

            <div className="p-3">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {photo.title}
              </h4>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>{photo.location}</span>
                <span className="font-mono text-[10px]">{photo.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl text-white animate-fade-in-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-medium">
                  {selectedPhoto.stageName}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedPhoto.timestamp}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {selectedPhoto.title}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800 text-slate-400">
                <div>
                  <span className="block text-[10px] uppercase text-slate-500">Location</span>
                  <span className="text-slate-200">{selectedPhoto.location}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-slate-500">Inspecting Officer</span>
                  <span className="text-slate-200">{selectedPhoto.inspector}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
