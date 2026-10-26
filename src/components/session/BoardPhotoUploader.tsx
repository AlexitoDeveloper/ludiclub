import { useState, FC, ChangeEvent } from 'react'
import { Camera, Trash2, Loader2, Image as ImageIcon, ZoomIn, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { supabase } from '../../lib/supabaseClient'
import { ImageLightboxModal } from './ImageLightboxModal'

const MAX_PHOTOS = 4;
const MAX_SIZE_MB = 5;

interface BoardPhotoUploaderProps {
  currentPhotoUrl?: string | null;
  meetupId: string;
  isEditable?: boolean;
  onPhotoUploaded: (url: string | null) => Promise<void>;
}

function parsePhotos(raw?: string | null): string[] {
  if (!raw) return [];
  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
  }
  return [raw];
}

function serializePhotos(list: string[]): string | null {
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return JSON.stringify(list);
}

export const BoardPhotoUploader: FC<BoardPhotoUploaderProps> = ({
  currentPhotoUrl,
  meetupId,
  isEditable = true,
  onPhotoUploaded,
}) => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<string[]>(() => parsePhotos(currentPhotoUrl));
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setErrorMessage(null);

    if (photos.length >= MAX_PHOTOS) {
      setErrorMessage(t('meetup.boardPhotosMaxLimitError', { max: MAX_PHOTOS }));
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setErrorMessage(t('meetup.boardPhotosMaxSizeError', { max: MAX_SIZE_MB }));
      return;
    }

    setIsUploading(true);
    try {
      const compressedDataUrl = await compressImage(file, 1600, 0.82);
      let finalUrl = compressedDataUrl;
      try {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${meetupId}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('meetup-boards')
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('meetup-boards')
            .getPublicUrl(fileName);
          if (publicData?.publicUrl) {
            finalUrl = publicData.publicUrl;
          }
        }
      } catch (storageErr) {
        console.warn('Storage fallback using data URL:', storageErr);
      }

      const nextPhotos = [...photos, finalUrl];
      setPhotos(nextPhotos);
      await onPhotoUploaded(serializePhotos(nextPhotos));
    } catch (err) {
      console.error('Error uploading photo:', err);
      setErrorMessage(t('meetup.boardPhotosErrorProcessing'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async (indexToRemove: number) => {
    const nextPhotos = photos.filter((_, idx) => idx !== indexToRemove);
    setPhotos(nextPhotos);
    await onPhotoUploaded(serializePhotos(nextPhotos));
  };

  const canUploadMore = photos.length < MAX_PHOTOS && isEditable;

  return (
    <div className='bg-card border border-border/40 rounded-3xl p-5 md:p-6 shadow-sm space-y-4'>
      <div className='flex items-center justify-between gap-2 border-b border-border/30 pb-3'>
        <div className='flex items-center gap-2.5'>
          <div className='w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0'>
            <Camera className='w-5 h-5' />
          </div>
          <h3 className='font-extrabold text-sm md:text-base text-foreground tracking-tight'>
            {t('meetup.boardPhotosTitle')}
          </h3>
        </div>

        <Badge variant='secondary' size='sm' className='font-bold text-muted-foreground'>
          {photos.length} / {MAX_PHOTOS}
        </Badge>
      </div>

      {errorMessage && (
        <div className='flex items-center gap-2 p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-xl'>
          <AlertCircle className='w-4 h-4 shrink-0' />
          <span>{errorMessage}</span>
        </div>
      )}

      {photos.length > 0 && (
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {photos.map((url, idx) => (
            <div key={idx} className='relative group rounded-2xl overflow-hidden border border-border/40 aspect-square bg-slate-950'>
              <img
                src={url}
                alt={t('meetup.boardPhotosPhotoAlt', { index: idx + 1 })}
                className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
              />
              <div
                onClick={() => setLightboxIndex(idx)}
                className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-zoom-in text-white gap-1 p-2'
                title={t('meetup.boardPhotosZoom')}
              >
                <ZoomIn className='w-5 h-5 drop-shadow' />
                <span className='text-xs font-bold drop-shadow'>{t('meetup.boardPhotosZoom')}</span>
              </div>
              {isEditable && (
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-xs'
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(idx);
                  }}
                  className='absolute top-1.5 right-1.5 bg-black/70 hover:bg-destructive text-white opacity-90 hover:opacity-100 transition-colors z-10'
                  title={t('meetup.boardPhotosDelete')}
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {canUploadMore && (
        <div className='border border-dashed border-border/50 rounded-2xl p-5 text-center bg-muted/10 hover:bg-muted/20 transition-colors'>
          <div className='w-10 h-10 rounded-xl bg-muted/40 border border-border/40 mx-auto flex items-center justify-center text-muted-foreground mb-2'>
            <ImageIcon className='w-5 h-5' />
          </div>
          <p className='text-xs font-bold text-foreground'>
            {photos.length === 0
              ? t('meetup.boardPhotosEmptyDropzone')
              : t('meetup.boardPhotosAddMore', { remaining: MAX_PHOTOS - photos.length })}
          </p>
          <p className='text-xs text-muted-foreground mt-0.5 mb-3'>
            {t('meetup.boardPhotosLimitHint')}
          </p>

          <label className='inline-flex'>
            <Input
              type='file'
              accept='image/*'
              capture='environment'
              onChange={handleFileChange}
              disabled={isUploading}
              className='hidden'
            />
            <span className='inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm'>
              {isUploading ? (
                <>
                  <Loader2 className='w-3.5 h-3.5 animate-spin' />
                  <span>{t('meetup.boardPhotosProcessing')}</span>
                </>
              ) : (
                <>
                  <Camera className='w-3.5 h-3.5' />
                  <span>{t('meetup.boardPhotosTakeOrUpload')}</span>
                </>
              )}
            </span>
          </label>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={photos}
          initialIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          title={t('meetup.boardPhotosTitle')}
        />
      )}
    </div>
  );
};

function compressImage(file: File, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
