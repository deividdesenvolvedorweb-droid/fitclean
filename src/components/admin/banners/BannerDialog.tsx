import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBanners, Banner, BannerInsert } from "@/hooks/admin/useBanners";
import { useCategories } from "@/hooks/admin/useCategories";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const bannerSchema = z.object({
  type: z.enum(["home_slider", "category", "promo_bar", "topbar"]),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  image_desktop: z.string().min(1, "Imagem desktop é obrigatória"),
  image_mobile: z.string().optional(),
  button_text: z.string().optional(),
  button_link: z.string().optional(),
  button_bg_color: z.string().optional(),
  button_text_color: z.string().optional(),
  button_variant: z.enum(["primary", "outline", "secondary"]).optional(),
  category_id: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  sort_order: z.number().default(0),
  active: z.boolean().default(true),
});

type FormData = z.infer<typeof bannerSchema>;

interface BannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner: Banner | null;
}

export function BannerDialog({ open, onOpenChange, banner }: BannerDialogProps) {
  const { createBanner, updateBanner } = useBanners();
  const { categories } = useCategories();

  const form = useForm<FormData>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      type: "home_slider",
      title: "",
      subtitle: "",
      image_desktop: "",
      image_mobile: "",
      button_text: "",
      button_link: "",
      button_bg_color: "#f97316",
      button_text_color: "#ffffff",
      button_variant: "primary",
      category_id: "",
      start_at: "",
      end_at: "",
      utm_source: "",
      utm_medium: "",
      utm_campaign: "",
      sort_order: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (banner) {
      form.reset({
        type: banner.type as FormData["type"],
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        image_desktop: banner.image_desktop,
        image_mobile: banner.image_mobile || "",
        button_text: banner.button_text || "",
        button_link: banner.button_link || "",
        button_bg_color: banner.button_bg_color || "#f97316",
        button_text_color: banner.button_text_color || "#ffffff",
        button_variant: (banner.button_variant as FormData["button_variant"]) || "primary",
        category_id: banner.category_id || "",
        start_at: banner.start_at ? new Date(banner.start_at).toISOString().slice(0, 16) : "",
        end_at: banner.end_at ? new Date(banner.end_at).toISOString().slice(0, 16) : "",
        utm_source: banner.utm_source || "",
        utm_medium: banner.utm_medium || "",
        utm_campaign: banner.utm_campaign || "",
        sort_order: banner.sort_order,
        active: banner.active,
      });
    } else {
      form.reset({
        type: "home_slider",
        title: "",
        subtitle: "",
        image_desktop: "",
        image_mobile: "",
        button_text: "",
        button_link: "",
        button_bg_color: "#f97316",
        button_text_color: "#ffffff",
        button_variant: "primary",
        category_id: "",
        start_at: "",
        end_at: "",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        sort_order: 0,
        active: true,
      });
    }
  }, [banner, form]);

  const onSubmit = async (data: FormData) => {
    const bannerData: BannerInsert = {
      type: data.type,
      title: data.title || null,
      subtitle: data.subtitle || null,
      image_desktop: data.image_desktop,
      image_mobile: data.image_mobile || null,
      button_text: data.button_text || null,
      button_link: data.button_link || null,
      button_bg_color: data.button_bg_color || null,
      button_text_color: data.button_text_color || null,
      button_variant: data.button_variant || null,
      category_id: data.category_id || null,
      start_at: data.start_at ? new Date(data.start_at).toISOString() : null,
      end_at: data.end_at ? new Date(data.end_at).toISOString() : null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      sort_order: data.sort_order,
      active: data.active,
    };

    if (banner) {
      await updateBanner.mutateAsync({ id: banner.id, ...bannerData });
    } else {
      await createBanner.mutateAsync(bannerData);
    }
    onOpenChange(false);
  };

  const isLoading = createBanner.isPending || updateBanner.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="button">Botão</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home_slider">Slider Home</SelectItem>
                          <SelectItem value="category">Categoria</SelectItem>
                          <SelectItem value="promo_bar">Barra Promo</SelectItem>
                          <SelectItem value="topbar">Topbar</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Título do banner" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtítulo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Subtítulo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="image_desktop"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem Desktop *</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={(url) => field.onChange(Array.isArray(url) ? url[0] : url)}
                          bucket="banners"
                          aspectRatio="16/8"
                          placeholder="Arraste a imagem desktop ou clique para selecionar"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image_mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem Mobile (opcional)</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value || ""}
                          onChange={(url) => field.onChange(Array.isArray(url) ? url[0] : url)}
                          bucket="banners"
                          aspectRatio="4/3"
                          placeholder="Arraste a imagem mobile ou clique para selecionar"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "category" && (
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="button" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="button_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto do Botão</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ver ofertas" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="button_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link do Botão</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="/ofertas" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="button_variant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estilo do Botão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estilo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="primary">Primário</SelectItem>
                          <SelectItem value="secondary">Secundário</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="button_bg_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor de Fundo</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1" />
                          </FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#f97316"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="button_text_color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor do Texto</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input type="color" {...field} className="w-12 h-10 p-1" />
                          </FormControl>
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="#ffffff"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="utm_source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Source</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="google" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_medium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Medium</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="cpc" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="utm_campaign"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTM Campaign</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="blackfriday" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : banner ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
