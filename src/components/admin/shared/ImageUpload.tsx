import { useState, useCallback, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useImageUpload } from "@/hooks/useImageUpload";

const MAX_SIZE_BY_BUCKET: Record<string, number> = {
  products: 5,
  banners: 10,
  layout: 10,
};

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  bucket: "products" | "banners" | "layout";
  multiple?: boolean;
  maxFiles?: number;
  aspectRatio?: string;
  className?: string;
  placeholder?: string;
  acceptVideo?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  bucket,
  multiple = false,
  maxFiles = 10,
  aspectRatio = "16/9",
  className,
  placeholder = "Arraste imagens aqui ou clique para selecionar",
  acceptVideo = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, uploadMultiple, isUploading, progress } = useImageUpload({ bucket, allowVideo: acceptVideo });
  const maxSizeMB = MAX_SIZE_BY_BUCKET[bucket] || 5;

  const images = Array.isArray(value) ? value : value ? [value] : [];

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) return;

      if (!multiple) {
        const result = await upload(files[0]);
        if (result) {
          onChange(result.url);
        }
      } else {
        const remainingSlots = maxFiles - images.length;
        const filesToUpload = files.slice(0, remainingSlots);
        const results = await uploadMultiple(filesToUpload);
        if (results.length > 0) {
          onChange([...images, ...results.map((r) => r.url)]);
        }
      }
    },
    [upload, uploadMultiple, onChange, multiple, maxFiles, images]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      if (!multiple) {
        const result = await upload(files[0]);
        if (result) {
          onChange(result.url);
        }
      } else {
        const remainingSlots = maxFiles - images.length;
        const filesToUpload = files.slice(0, remainingSlots);
        const results = await uploadMultiple(filesToUpload);
        if (results.length > 0) {
          onChange([...images, ...results.map((r) => r.url)]);
        }
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [upload, uploadMultiple, onChange, multiple, maxFiles, images]
  );

  const handleRemove = useCallback(
    (index: number) => {
      if (multiple) {
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages);
      } else {
        onChange("");
      }
    },
    [images, multiple, onChange]
  );

  // Drag-and-drop reordering for multiple images
  const handleImageDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const canAddMore = multiple ? images.length < maxFiles : images.length === 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            isUploading && "pointer-events-none opacity-50"
          )}
          style={{ aspectRatio }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptVideo ? "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
          />

          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Enviando... {progress}%
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-center text-muted-foreground">
                {placeholder}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP ou GIF • Máx. {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Image previews */}
      {images.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            multiple ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
          )}
        >
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className={cn(
                "group relative rounded-lg border overflow-hidden bg-muted",
                multiple && "cursor-move"
              )}
              style={{ aspectRatio }}
              draggable={multiple}
              onDragStart={() => multiple && handleImageDragStart(index)}
              onDragOver={(e) => multiple && handleImageDragOver(e, index)}
              onDragEnd={handleImageDragEnd}
            >
              {url ? (
                <img
                  src={url}
                  alt={`Imagem ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
              )}

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {multiple && (
                  <div className="absolute top-2 left-2">
                    <GripVertical className="h-5 w-5 text-white" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Image number badge */}
              {multiple && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
