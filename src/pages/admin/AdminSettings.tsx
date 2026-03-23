import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Store, Phone, Share2, Megaphone, Search, Palette, Settings } from "lucide-react";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { useStoreSettings, type StoreSettings } from "@/hooks/admin/useStoreSettings";
import { MarketingTab } from "@/components/admin/settings/MarketingTab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const settingsSchema = z.object({
  store_name: z.string().min(1, "Nome é obrigatório"),
  store_description: z.string().nullable(),
  store_logo: z.string().url().nullable().or(z.literal("")),
  favicon: z.string().url().nullable().or(z.literal("")),
  phone: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().email().nullable().or(z.literal("")),
  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip_code: z.string().nullable(),
  instagram_url: z.string().url().nullable().or(z.literal("")),
  facebook_url: z.string().url().nullable().or(z.literal("")),
  youtube_url: z.string().url().nullable().or(z.literal("")),
  tiktok_url: z.string().url().nullable().or(z.literal("")),
  twitter_url: z.string().url().nullable().or(z.literal("")),
  free_shipping_threshold: z.coerce.number().min(0),
  max_installments: z.coerce.number().min(1).max(24),
  pix_discount_percent: z.coerce.number().min(0).max(100),
  announcement_text: z.string().nullable(),
  announcement_active: z.boolean(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  ga4_id: z.string().nullable(),
  meta_pixel_id: z.string().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS_VALUES: SettingsFormValues = {
  store_name: "",
  store_description: "",
  store_logo: "",
  favicon: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  tiktok_url: "",
  twitter_url: "",
  free_shipping_threshold: 299,
  max_installments: 12,
  pix_discount_percent: 5,
  announcement_text: "",
  announcement_active: true,
  meta_title: "",
  meta_description: "",
  ga4_id: "",
  meta_pixel_id: "",
};

function toFormValues(settings: StoreSettings): SettingsFormValues {
  return {
    store_name: settings.store_name,
    store_description: settings.store_description || "",
    store_logo: settings.store_logo || "",
    favicon: settings.favicon || "",
    phone: settings.phone || "",
    whatsapp: settings.whatsapp || "",
    email: settings.email || "",
    address: settings.address || "",
    city: settings.city || "",
    state: settings.state || "",
    zip_code: settings.zip_code || "",
    instagram_url: settings.instagram_url || "",
    facebook_url: settings.facebook_url || "",
    youtube_url: settings.youtube_url || "",
    tiktok_url: settings.tiktok_url || "",
    twitter_url: settings.twitter_url || "",
    free_shipping_threshold: Number(settings.free_shipping_threshold) || 299,
    max_installments: settings.max_installments || 12,
    pix_discount_percent: Number(settings.pix_discount_percent) || 5,
    announcement_text: settings.announcement_text || "",
    announcement_active: settings.announcement_active ?? true,
    meta_title: settings.meta_title || "",
    meta_description: settings.meta_description || "",
    ga4_id: settings.ga4_id || "",
    meta_pixel_id: settings.meta_pixel_id || "",
  };
}

export default function AdminSettings() {
  const { settings, isLoading, updateSettings } = useStoreSettings();
  const [activeTab, setActiveTab] = useState("store");

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS_VALUES,
  });

  const { isDirty } = form.formState;

  useEffect(() => {
    if (!settings) return;
    form.reset(toFormValues(settings));
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate(
      {
        ...data,
        store_description: data.store_description || null,
        store_logo: data.store_logo || null,
        favicon: data.favicon || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip_code: data.zip_code || null,
        instagram_url: data.instagram_url || null,
        facebook_url: data.facebook_url || null,
        youtube_url: data.youtube_url || null,
        tiktok_url: data.tiktok_url || null,
        twitter_url: data.twitter_url || null,
        announcement_text: data.announcement_text || null,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        ga4_id: data.ga4_id || null,
        meta_pixel_id: data.meta_pixel_id || null,
      },
      {
        onSuccess: () => {
          form.reset(form.getValues());
        },
      }
    );
  };

  const metaDescValue = form.watch("meta_description") || "";

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader
          title="Configurações"
          description="Gerencie as configurações gerais da sua loja"
          icon={Settings}
        />
        {isDirty && (
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs">
            Alterações não salvas
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="store" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Store className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Loja</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Contato</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Share2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Redes</span>
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Megaphone className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Promoções</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Palette className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Search className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="marketing" className="mt-6">
          <MarketingTab />
        </TabsContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="store" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados da Loja</CardTitle>
                  <CardDescription>Informações básicas que aparecem em todo o site</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="store_name" render={({ field }) => (
                    <FormItem><FormLabel>Nome da Loja</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="store_description" render={({ field }) => (
                    <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} value={field.value || ""} rows={3} /></FormControl>
                    <FormDescription>Texto usado no footer e em páginas institucionais</FormDescription><FormMessage /></FormItem>
                  )} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="store_logo" render={({ field }) => (
                      <FormItem><FormLabel>URL do Logo</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="favicon" render={({ field }) => (
                      <FormItem><FormLabel>URL do Favicon</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contact" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Informações de Contato</CardTitle><CardDescription>Dados exibidos no header e footer do site</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="(11) 99999-9999" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="whatsapp" render={({ field }) => (
                      <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="(11) 99999-9999" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input {...field} value={field.value || ""} type="email" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <FormField control={form.control} name="city" render={({ field }) => (
                      <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="state" render={({ field }) => (
                      <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} value={field.value || ""} maxLength={2} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="zip_code" render={({ field }) => (
                      <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Redes Sociais</CardTitle><CardDescription>Links para suas redes sociais</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="instagram_url" render={({ field }) => (
                    <FormItem><FormLabel>Instagram</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://instagram.com/..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="facebook_url" render={({ field }) => (
                    <FormItem><FormLabel>Facebook</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://facebook.com/..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="youtube_url" render={({ field }) => (
                    <FormItem><FormLabel>YouTube</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://youtube.com/..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="tiktok_url" render={({ field }) => (
                    <FormItem><FormLabel>TikTok</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://tiktok.com/@..." /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="twitter_url" render={({ field }) => (
                    <FormItem><FormLabel>Twitter / X</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="https://twitter.com/..." /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promo" className="mt-6">
              <Card>
                <CardHeader><CardTitle>Promoções e Anúncios</CardTitle><CardDescription>Configure a barra de anúncio e informações promocionais</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="announcement_active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5"><FormLabel className="text-base">Barra de Anúncio</FormLabel><FormDescription>Exibir barra de anúncio no topo do site</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="announcement_text" render={({ field }) => (
                    <FormItem><FormLabel>Texto do Anúncio</FormLabel><FormControl><Input {...field} value={field.value || ""} /></FormControl>
                    <FormDescription>Texto que aparece na barra de anúncio</FormDescription><FormMessage /></FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    <FormField control={form.control} name="free_shipping_threshold" render={({ field }) => (
                      <FormItem><FormLabel>Frete Grátis Acima de (R$)</FormLabel><FormControl><Input {...field} type="number" min={0} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="max_installments" render={({ field }) => (
                      <FormItem><FormLabel>Máximo de Parcelas</FormLabel><FormControl><Input {...field} type="number" min={1} max={24} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="pix_discount_percent" render={({ field }) => (
                      <FormItem><FormLabel>Desconto PIX (%)</FormLabel><FormControl><Input {...field} type="number" min={0} max={100} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <Card>
                <CardHeader><CardTitle>SEO e Analytics</CardTitle><CardDescription>Configurações de metatags e rastreamento</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="meta_title" render={({ field }) => (
                    <FormItem><FormLabel>Título SEO</FormLabel><FormControl><Input {...field} value={field.value || ""} maxLength={60} /></FormControl>
                    <FormDescription>Título que aparece na aba do navegador e resultados de busca ({(field.value || "").length}/60)</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="meta_description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Descrição</FormLabel>
                      <FormControl><Textarea {...field} value={field.value || ""} rows={3} maxLength={160} /></FormControl>
                      <FormDescription className={metaDescValue.length > 155 ? "text-amber-600" : ""}>
                        Descrição para resultados de busca ({metaDescValue.length}/160)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="ga4_id" render={({ field }) => (
                      <FormItem><FormLabel>Google Analytics 4 ID</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="G-XXXXXXXXXX" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="meta_pixel_id" render={({ field }) => (
                      <FormItem><FormLabel>Meta Pixel ID</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="XXXXXXXXXXXXXXXX" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {activeTab !== "marketing" && (
              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending || !isDirty}>
                  <Save className="mr-2 h-4 w-4" />
                  {updateSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
