import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseImageUploadOptions {
  bucket: "products" | "banners" | "layout";
  maxSizeMB?: number;
  allowVideo?: boolean;
}

const DEFAULT_MAX_SIZE: Record<string, number> = {
  products: 5,
  banners: 10,
  layout: 10,
};

interface UploadResult {
  url: string;
  path: string;
}

export function useImageUpload({ bucket, maxSizeMB, allowVideo }: UseImageUploadOptions) {
  const maxSize = maxSizeMB ?? DEFAULT_MAX_SIZE[bucket] ?? 5;
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = async (file: File): Promise<UploadResult | null> => {
    // Validate file type
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const videoTypes = ["video/mp4", "video/webm"];
    const allowedTypes = allowVideo ? [...imageTypes, ...videoTypes] : imageTypes;
    if (!allowedTypes.includes(file.type)) {
      toast.error(allowVideo ? "Tipo não permitido. Use JPG, PNG, WebP, GIF ou MP4." : "Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.");
      return null;
    }

    // Validate file size
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Arquivo muito grande. Máximo: ${maxSize}MB`);
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const path = `${filename}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      toast.success("Imagem enviada com sucesso!");

      return {
        url: urlData.publicUrl,
        path: data.path,
      };
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem: " + error.message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadMultiple = async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const result = await upload(files[i]);
      if (result) {
        results.push(result);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    
    return results;
  };

  const deleteImage = async (path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Erro ao excluir imagem: " + error.message);
      return false;
    }
  };

  return {
    upload,
    uploadMultiple,
    deleteImage,
    isUploading,
    progress,
  };
}
