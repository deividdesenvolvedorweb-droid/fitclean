import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Package, Save, Plus, Trash2, Monitor, ChevronDown, ChevronUp } from "lucide-react";
import { useProduct, useProducts, ProductFormData } from "@/hooks/admin/useProducts";
import { useCategories } from "@/hooks/admin/useCategories";
import { LoadingState } from "@/components/admin/shared/LoadingState";
import { ImageUpload } from "@/components/admin/shared/ImageUpload";
import { ProductDescriptionEditor } from "@/components/admin/products/ProductDescriptionEditor";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  description: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.coerce.number().min(0, "Preço deve ser positivo"),
  compare_at_price: z.coerce.number().nullable().optional(),
  cost: z.coerce.number().nullable().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  min_stock: z.coerce.number().int().min(0).default(0),
  unlimited_stock: z.boolean().default(false),
  allow_backorder: z.boolean().default(false),
  category_id: z.string().nullable().optional(),
  secondary_category_ids: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  main_image_index: z.number().default(0),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  active: z.boolean().default(true),
  is_digital: z.boolean().default(false),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  // Payment config
  use_global_payment: z.boolean().default(true),
  pix_enabled: z.boolean().default(true),
  boleto_enabled: z.boolean().default(true),
  credit_card_enabled: z.boolean().default(true),
  max_installments: z.coerce.number().int().min(1).max(12).default(12),
  installment_type: z.string().default("sem_juros"),
  installment_interest_rate: z.coerce.number().min(0).default(1.99),
  mp_fee_pix: z.coerce.number().min(0).default(0.99),
  mp_fee_credit: z.coerce.number().min(0).default(4.98),
  mp_fee_boleto: z.coerce.number().min(0).default(3.49),
});

type FormValues = z.infer<typeof formSchema>;

interface VariantPaymentConfig {
  use_global_payment: boolean;
  pix_enabled: boolean;
  boleto_enabled: boolean;
  credit_card_enabled: boolean;
  max_installments: number;
  installment_type: string;
  installment_interest_rate: number;
  mp_fee_pix: number;
  mp_fee_credit: number;
  mp_fee_boleto: number;
}

interface VariantRow {
  id?: string;
  attributes: Record<string, string>;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  sku: string;
  active: boolean;
  isOpen: boolean;
  payment_config: VariantPaymentConfig | null;
}

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingProduct } = useProduct(id);
  const { createProduct, updateProduct, isCreating, isUpdating } = useProducts();
  const { categories } = useCategories();

  const [descriptionBlocks, setDescriptionBlocks] = useState<any[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [variantAttrNames, setVariantAttrNames] = useState<string[]>([]);
  const [newAttrName, setNewAttrName] = useState("");

  useEffect(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const { data: existingVariants } = useQuery({
    queryKey: ["admin-variants", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (existingVariants && existingVariants.length > 0) {
      const rows: VariantRow[] = existingVariants.map(v => ({
        id: v.id,
        attributes: v.attributes as Record<string, string>,
        price: v.price,
        compare_at_price: v.compare_at_price,
        stock: v.stock,
        sku: v.sku || "",
        active: v.active,
        isOpen: false,
        payment_config: (v as any).payment_config as VariantPaymentConfig | null,
      }));
      setVariants(rows);
      const names = Object.keys(rows[0].attributes);
      setVariantAttrNames(names);
    }
  }, [existingVariants]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", slug: "", description: "", sku: "", barcode: "",
      price: 0, compare_at_price: null, cost: null,
      stock: 0, min_stock: 0, unlimited_stock: false, allow_backorder: false,
      category_id: null, secondary_category_ids: [], images: [], main_image_index: 0,
      featured: false, bestseller: false, active: true,
      is_digital: false, seo_title: "", seo_description: "",
      use_global_payment: true, pix_enabled: true, boleto_enabled: true,
      credit_card_enabled: true, max_installments: 12,
      installment_type: "sem_juros", installment_interest_rate: 1.99,
      mp_fee_pix: 0.99, mp_fee_credit: 4.98, mp_fee_boleto: 3.49,
    },
  });

  useEffect(() => {
    if (product) {
      const pc = product.payment_config as Record<string, any> | null;
      form.reset({
        name: product.name, slug: product.slug,
        description: product.description || "", sku: product.sku || "", barcode: product.barcode || "",
        price: product.price, compare_at_price: product.compare_at_price, cost: product.cost,
        stock: product.stock, min_stock: product.min_stock,
        unlimited_stock: product.unlimited_stock || false,
        allow_backorder: product.allow_backorder,
        category_id: product.category_id,
        secondary_category_ids: product.secondary_category_ids || [],
        images: product.images || [],
        main_image_index: product.main_image_index || 0,
        featured: product.featured, bestseller: product.bestseller,
        active: product.active,
        is_digital: product.is_digital || false,
        seo_title: product.seo_title || "", seo_description: product.seo_description || "",
        use_global_payment: !pc,
        pix_enabled: pc?.pix_enabled ?? true,
        boleto_enabled: pc?.boleto_enabled ?? true,
        credit_card_enabled: pc?.credit_card_enabled ?? true,
        max_installments: pc?.max_installments ?? 12,
        installment_type: pc?.installment_type ?? "sem_juros",
        installment_interest_rate: pc?.installment_interest_rate ?? 1.99,
        mp_fee_pix: pc?.mp_fee_pix ?? 0.99,
        mp_fee_credit: pc?.mp_fee_credit ?? 4.98,
        mp_fee_boleto: pc?.mp_fee_boleto ?? 3.49,
      });
      const dbBlocks = product.description_blocks;
      if (Array.isArray(dbBlocks)) setDescriptionBlocks(dbBlocks);
    }
  }, [product, form]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!isEditing) form.setValue("slug", generateSlug(name));
  };

  const addVariantAttr = () => {
    if (newAttrName.trim() && !variantAttrNames.includes(newAttrName.trim())) {
      setVariantAttrNames([...variantAttrNames, newAttrName.trim()]);
      setVariants(variants.map(v => ({ ...v, attributes: { ...v.attributes, [newAttrName.trim()]: "" } })));
      setNewAttrName("");
    }
  };

  const addVariantRow = () => {
    const attrs: Record<string, string> = {};
    variantAttrNames.forEach(n => attrs[n] = "");
    setVariants([...variants, { attributes: attrs, price: null, compare_at_price: null, stock: 0, sku: "", active: true, isOpen: true, payment_config: null }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantField = (index: number, field: string, value: any) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const updateVariantAttr = (index: number, attrName: string, value: string) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, attributes: { ...v.attributes, [attrName]: value } } : v));
  };

  const toggleVariant = (index: number) => {
    setVariants(variants.map((v, i) => i === index ? { ...v, isOpen: !v.isOpen } : v));
  };

  const saveVariants = async (productId: string) => {
    if (existingVariants) {
      const keepIds = variants.filter(v => v.id).map(v => v.id!);
      const toDelete = existingVariants.filter(v => !keepIds.includes(v.id));
      for (const v of toDelete) {
        await supabase.from("product_variants").delete().eq("id", v.id);
      }
    }

    for (const variant of variants) {
      const data: any = {
        product_id: productId,
        attributes: variant.attributes,
        price: variant.price,
        compare_at_price: variant.compare_at_price,
        stock: variant.stock,
        sku: variant.sku || null,
        active: variant.active,
        payment_config: variant.payment_config?.use_global_payment === false ? {
          pix_enabled: variant.payment_config.pix_enabled,
          boleto_enabled: variant.payment_config.boleto_enabled,
          credit_card_enabled: variant.payment_config.credit_card_enabled,
          max_installments: variant.payment_config.max_installments,
          installment_type: variant.payment_config.installment_type,
          installment_interest_rate: variant.payment_config.installment_interest_rate,
          mp_fee_pix: variant.payment_config.mp_fee_pix,
          mp_fee_credit: variant.payment_config.mp_fee_credit,
          mp_fee_boleto: variant.payment_config.mp_fee_boleto,
        } : null,
      };
      if (variant.id) {
        await supabase.from("product_variants").update(data).eq("id", variant.id);
      } else {
        await supabase.from("product_variants").insert(data);
      }
    }

    // Update product with variant price range
    if (variants.length > 0) {
      const prices = variants.filter(v => v.price != null && v.active).map(v => v.price!);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        await supabase.from("products").update({
          min_variant_price: minPrice,
          max_variant_price: maxPrice,
          has_variants: true,
          price: minPrice, // Sync main price to min variant price
        }).eq("id", productId);
      }
    } else {
      // No variants - clear variant price fields
      await supabase.from("products").update({
        min_variant_price: null,
        max_variant_price: null,
        has_variants: false,
      }).eq("id", productId);
    }

    queryClient.invalidateQueries({ queryKey: ["admin-variants"] });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const isDigital = values.is_digital;
      const paymentConfig = values.use_global_payment ? null : {
        pix_enabled: values.pix_enabled,
        boleto_enabled: values.boleto_enabled,
        credit_card_enabled: values.credit_card_enabled,
        max_installments: values.max_installments,
        installment_type: values.installment_type,
        installment_interest_rate: values.installment_interest_rate,
        mp_fee_pix: values.mp_fee_pix,
        mp_fee_credit: values.mp_fee_credit,
        mp_fee_boleto: values.mp_fee_boleto,
      };

      const data: ProductFormData = {
        name: values.name, slug: values.slug,
        description: values.description || undefined,
        sku: values.sku || undefined, barcode: values.barcode || undefined,
        price: values.price, compare_at_price: values.compare_at_price || null,
        cost: values.cost || null,
        stock: isDigital ? 9999999 : (values.unlimited_stock ? 9999999 : values.stock),
        min_stock: values.min_stock,
        unlimited_stock: isDigital ? true : values.unlimited_stock,
        allow_backorder: isDigital ? true : (values.unlimited_stock ? true : values.allow_backorder),
        weight: null,
        category_id: values.category_id || null,
        secondary_category_ids: values.secondary_category_ids.length > 0 ? values.secondary_category_ids : null,
        images: values.images, main_image_index: values.main_image_index,
        featured: values.featured, bestseller: values.bestseller,
        free_shipping: false,
        active: values.active,
        seo_title: values.seo_title || null, seo_description: values.seo_description || null,
        is_digital: isDigital,
        description_blocks: descriptionBlocks.length > 0 ? descriptionBlocks : null,
        payment_config: paymentConfig,
      };

      let productId: string;
      if (isEditing && id) {
        await updateProduct({ id, ...data });
        productId = id;
      } else {
        const result = await createProduct(data);
        productId = result.id;
      }

      await saveVariants(productId);
      navigate("/admin/produtos");
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  if (isEditing && isLoadingProduct) {
    return <LoadingState message="Carregando produto..." />;
  }

  const isDigital = form.watch("is_digital");
  const price = form.watch("price");
  const comparePrice = form.watch("compare_at_price");
  const discount = comparePrice && comparePrice > price ? Math.round((1 - price / comparePrice) * 100) : 0;
  const useGlobalPayment = form.watch("use_global_payment");
  const selectedCategoryId = form.watch("category_id");

  // Parent categories for multi-select (exclude current primary)
  const availableSecondaryCategories = categories.filter(c => c.id !== selectedCategoryId);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-4 shrink-0 pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{isEditing ? "Editar Produto" : "Novo Produto"}</h1>
            {isEditing && product && <p className="text-sm text-muted-foreground">{product.name}</p>}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <div className="space-y-6 lg:min-w-0 lg:flex-1">
              {/* Basic Info */}
              <Card>
                <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Nome do Produto</FormLabel><FormControl>
                      <Input {...field} onChange={handleNameChange} placeholder="Ex: Smartphone Galaxy S24" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug (URL)</FormLabel><FormControl>
                      <Input {...field} placeholder="smartphone-galaxy-s24" />
                    </FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <Tabs defaultValue={descriptionBlocks.length > 0 ? "blocks" : "text"} className="mt-1">
                        <TabsList className="h-8">
                          <TabsTrigger value="text" className="text-xs">Texto</TabsTrigger>
                          <TabsTrigger value="blocks" className="text-xs">Blocos (Layout)</TabsTrigger>
                        </TabsList>
                        <TabsContent value="text" className="mt-2">
                          <FormControl>
                            <Textarea {...field} placeholder="Descreva o produto..." rows={5} />
                          </FormControl>
                        </TabsContent>
                        <TabsContent value="blocks" className="mt-2">
                          <div className="max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh] overflow-y-auto border rounded-lg p-2">
                            <ProductDescriptionEditor value={descriptionBlocks} onChange={setDescriptionBlocks} />
                          </div>
                        </TabsContent>
                      </Tabs>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="images" render={({ field }) => (
                    <FormItem><FormLabel>Imagens do Produto</FormLabel><FormControl>
                      <ImageUpload value={field.value} onChange={(urls) => field.onChange(urls)} bucket="products" multiple maxFiles={10} aspectRatio="4/1" placeholder="Arraste imagens ou clique para adicionar (máx. 10)" />
                    </FormControl><FormDescription>A primeira imagem será a principal.</FormDescription><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>

              {/* Prices - hidden when product has variants */}
              {variants.length === 0 && (
                <Card>
                  <CardHeader><CardTitle>Preços</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Preço de Venda</FormLabel><FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="compare_at_price" render={({ field }) => (
                        <FormItem><FormLabel>Preço "De"</FormLabel><FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                        </FormControl><FormDescription>{discount > 0 && <span className="text-success">{discount}% de desconto</span>}</FormDescription><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="cost" render={({ field }) => (
                        <FormItem><FormLabel>Custo</FormLabel><FormControl>
                          <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)} />
                        </FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
              )}
              {variants.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Preços</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Os preços são definidos individualmente em cada variante abaixo.</p>
                    {(() => {
                      const vPrices = variants.filter(v => v.price != null && v.active).map(v => v.price!);
                      if (vPrices.length === 0) return null;
                      const min = Math.min(...vPrices);
                      const max = Math.max(...vPrices);
                      return (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {min === max ? `R$ ${min.toFixed(2)}` : `R$ ${min.toFixed(2)} — R$ ${max.toFixed(2)}`}
                          </Badge>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Stock */}
              {!isDigital && (
                <Card>
                  <CardHeader><CardTitle>Estoque</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="unlimited_stock" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                        <div><FormLabel className="text-primary font-medium">Estoque Ilimitado</FormLabel><FormDescription>Produto sempre disponível</FormDescription></div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    {!form.watch("unlimited_stock") && (
                      <>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <FormField control={form.control} name="sku" render={({ field }) => (
                            <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} placeholder="ABC-123" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="stock" render={({ field }) => (
                            <FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name="min_stock" render={({ field }) => (
                            <FormItem><FormLabel>Estoque Mínimo</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="allow_backorder" render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div><FormLabel>Permitir Backorder</FormLabel><FormDescription>Vender mesmo sem estoque</FormDescription></div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                      </>
                    )}
                    {form.watch("unlimited_stock") && (
                      <FormField control={form.control} name="sku" render={({ field }) => (
                        <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} placeholder="ABC-123" /></FormControl><FormMessage /></FormItem>
                      )} />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Variants */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">Variantes <Badge variant="secondary">{variants.length}</Badge></CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Cada variante pode ter preço, estoque e SKU próprios.</p>

                  <div className="flex gap-2">
                    <Input placeholder="Nome do atributo (ex: Cor, Tamanho)" value={newAttrName} onChange={e => setNewAttrName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addVariantAttr(); }}} />
                    <Button type="button" variant="outline" onClick={addVariantAttr}>Adicionar Atributo</Button>
                  </div>

                  {variantAttrNames.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {variantAttrNames.map(name => (
                        <Badge key={name} variant="secondary" className="flex items-center gap-1">
                          {name}
                          <button type="button" className="ml-1 text-xs hover:text-destructive" onClick={() => {
                            setVariantAttrNames(variantAttrNames.filter(n => n !== name));
                            setVariants(variants.map(v => {
                              const attrs = { ...v.attributes };
                              delete attrs[name];
                              return { ...v, attributes: attrs };
                            }));
                          }}>×</button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {variants.map((variant, index) => (
                    <Collapsible key={index} open={variant.isOpen} onOpenChange={() => toggleVariant(index)}>
                      <div className="border rounded-lg">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50">
                            <div className="flex items-center gap-2">
                              {variant.isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              <span className="text-sm font-medium">
                                {`Variante ${index + 1}`}
                                {Object.values(variant.attributes).filter(Boolean).length > 0 && (
                                  <span className="text-muted-foreground ml-2">
                                    ({Object.entries(variant.attributes).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(", ")})
                                  </span>
                                )}
                              </span>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeVariantRow(index); }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="p-4 pt-0 space-y-4 border-t">
                            {/* Attributes & fields */}
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                              {variantAttrNames.map(attrName => (
                                <div key={attrName}>
                                  <Label className="text-xs">{attrName}</Label>
                                  <Input value={variant.attributes[attrName] || ""} onChange={e => updateVariantAttr(index, attrName, e.target.value)} placeholder={`Ex: Azul`} />
                                </div>
                              ))}
                              <div>
                                <Label className="text-xs">SKU</Label>
                                <Input value={variant.sku} onChange={e => updateVariantField(index, "sku", e.target.value)} placeholder="SKU-001" />
                              </div>
                              <div>
                                <Label className="text-xs">Preço de Venda *</Label>
                                <Input type="number" step="0.01" value={variant.price ?? ""} onChange={e => updateVariantField(index, "price", e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.00" />
                              </div>
                              <div>
                                <Label className="text-xs">Preço "De" (opcional)</Label>
                                <Input type="number" step="0.01" value={variant.compare_at_price ?? ""} onChange={e => updateVariantField(index, "compare_at_price", e.target.value ? parseFloat(e.target.value) : null)} placeholder="0.00" />
                              </div>
                              {!isDigital && (
                                <div>
                                  <Label className="text-xs">Estoque</Label>
                                  <Input type="number" min="0" value={variant.stock} onChange={e => updateVariantField(index, "stock", parseInt(e.target.value) || 0)} />
                                </div>
                              )}
                            </div>

                            {/* Variant Payment Config */}
                            <div className="border-t pt-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold">Pagamento da Variante</Label>
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs text-muted-foreground">Configuração própria</Label>
                                  <Switch
                                    checked={variant.payment_config?.use_global_payment === false}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        updateVariantField(index, "payment_config", {
                                          use_global_payment: false,
                                          pix_enabled: true, boleto_enabled: true, credit_card_enabled: true,
                                          max_installments: 12, installment_type: "sem_juros", installment_interest_rate: 1.99,
                                          mp_fee_pix: 0.99, mp_fee_credit: 4.98, mp_fee_boleto: 3.49,
                                        });
                                      } else {
                                        updateVariantField(index, "payment_config", null);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              {variant.payment_config?.use_global_payment === false && (
                                <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                                  <div className="grid gap-2 sm:grid-cols-3">
                                    <div className="flex items-center justify-between rounded border p-2">
                                      <Label className="text-xs">PIX</Label>
                                      <Switch checked={variant.payment_config.pix_enabled} onCheckedChange={(v) => updateVariantField(index, "payment_config", { ...variant.payment_config!, pix_enabled: v })} />
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-2">
                                      <Label className="text-xs">Cartão</Label>
                                      <Switch checked={variant.payment_config.credit_card_enabled} onCheckedChange={(v) => updateVariantField(index, "payment_config", { ...variant.payment_config!, credit_card_enabled: v })} />
                                    </div>
                                    <div className="flex items-center justify-between rounded border p-2">
                                      <Label className="text-xs">Boleto</Label>
                                      <Switch checked={variant.payment_config.boleto_enabled} onCheckedChange={(v) => updateVariantField(index, "payment_config", { ...variant.payment_config!, boleto_enabled: v })} />
                                    </div>
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-4">
                                    <div>
                                      <Label className="text-[10px]">Máx. Parcelas</Label>
                                      <Input type="number" min={1} max={12} value={variant.payment_config.max_installments} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, max_installments: parseInt(e.target.value) || 12 })} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px]">Parcelamento</Label>
                                      <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs" value={variant.payment_config.installment_type || "sem_juros"} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, installment_type: e.target.value })}>
                                        <option value="sem_juros">Sem Juros</option>
                                        <option value="com_juros">Com Juros</option>
                                      </select>
                                    </div>
                                    {(variant.payment_config.installment_type === "com_juros") && (
                                      <div>
                                        <Label className="text-[10px]">Juros Mensal (%)</Label>
                                        <Input type="number" step="0.01" value={variant.payment_config.installment_interest_rate ?? 1.99} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, installment_interest_rate: parseFloat(e.target.value) || 0 })} />
                                      </div>
                                    )}
                                    <div>
                                      <Label className="text-[10px]">Taxa PIX (%)</Label>
                                      <Input type="number" step="0.01" value={variant.payment_config.mp_fee_pix} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, mp_fee_pix: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px]">Taxa Cartão (%)</Label>
                                      <Input type="number" step="0.01" value={variant.payment_config.mp_fee_credit} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, mp_fee_credit: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div>
                                      <Label className="text-[10px]">Taxa Boleto (R$)</Label>
                                      <Input type="number" step="0.01" value={variant.payment_config.mp_fee_boleto} onChange={e => updateVariantField(index, "payment_config", { ...variant.payment_config!, mp_fee_boleto: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}

                  {variantAttrNames.length > 0 && (
                    <Button type="button" variant="outline" onClick={addVariantRow} className="w-full">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Variante
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Payment Config */}
              <Card>
                <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="use_global_payment" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div><FormLabel>Usar configurações globais</FormLabel><FormDescription>Herda as configurações de pagamento da loja</FormDescription></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />

                  {!useGlobalPayment && (
                    <div className="space-y-4 border rounded-lg p-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <FormField control={form.control} name="pix_enabled" render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <FormLabel className="text-sm">PIX</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="credit_card_enabled" render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <FormLabel className="text-sm">Cartão</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="boleto_enabled" render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <FormLabel className="text-sm">Boleto</FormLabel>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="max_installments" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo de Parcelas</FormLabel>
                          <Select value={String(field.value)} onValueChange={(v) => field.onChange(parseInt(v))}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                                <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="installment_type" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Parcelamento</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="sem_juros">Sem Juros</SelectItem>
                              <SelectItem value="com_juros">Com Juros</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />

                      {form.watch("installment_type") === "com_juros" && (
                        <FormField control={form.control} name="installment_interest_rate" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Taxa de Juros Mensal (%)</FormLabel>
                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                            <FormDescription>Ex: 1.99% ao mês (Tabela Price)</FormDescription>
                          </FormItem>
                        )} />
                      )}

                      <p className="text-sm font-medium text-muted-foreground">Taxas do Mercado Pago</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <FormField control={form.control} name="mp_fee_pix" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Taxa PIX (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="mp_fee_credit" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Taxa Cartão (%)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="mp_fee_boleto" render={({ field }) => (
                          <FormItem><FormLabel className="text-xs">Taxa Boleto (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl></FormItem>
                        )} />
                      </div>

                      {Number(price) > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                          <p className="font-medium text-sm mb-2">Preview de Líquido (preço: R$ {Number(price).toFixed(2)})</p>
                          <p>PIX: R$ {(Number(price) * (1 - Number(form.watch("mp_fee_pix")) / 100)).toFixed(2)}</p>
                          <p>Cartão: R$ {(Number(price) * (1 - Number(form.watch("mp_fee_credit")) / 100)).toFixed(2)}</p>
                          <p>Boleto: R$ {(Number(price) - Number(form.watch("mp_fee_boleto"))).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SEO */}
              <Card>
                <CardHeader><CardTitle>SEO</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="seo_title" render={({ field }) => (
                    <FormItem><FormLabel>Título SEO</FormLabel><FormControl><Input {...field} placeholder="Título para buscadores" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="seo_description" render={({ field }) => (
                    <FormItem><FormLabel>Meta Description</FormLabel><FormControl><Textarea {...field} placeholder="Descrição para buscadores..." rows={3} /></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:w-80 lg:shrink-0">
              {/* Digital Product Toggle */}
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Monitor className="h-5 w-5" /> Tipo de Produto</CardTitle></CardHeader>
                <CardContent>
                  <FormField control={form.control} name="is_digital" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-sky-500/30 bg-sky-500/5 p-3">
                      <div>
                        <FormLabel className="text-sky-600 font-medium">Produto Digital</FormLabel>
                        <FormDescription>Sem estoque físico</FormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Organização</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="category_id" render={({ field }) => (
                    <FormItem><FormLabel>Categoria Principal</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sem categoria</SelectItem>
                          {categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    <FormMessage /></FormItem>
                  )} />

                  {/* Secondary Categories */}
                  <FormField control={form.control} name="secondary_category_ids" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categorias Secundárias</FormLabel>
                      <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                        {availableSecondaryCategories.map((cat) => (
                          <div key={cat.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={field.value?.includes(cat.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...(field.value || []), cat.id]);
                                } else {
                                  field.onChange((field.value || []).filter((id: string) => id !== cat.id));
                                }
                              }}
                            />
                            <Label className="text-sm cursor-pointer">{cat.icon} {cat.name}</Label>
                          </div>
                        ))}
                        {availableSecondaryCategories.length === 0 && (
                          <p className="text-xs text-muted-foreground">Nenhuma categoria disponível</p>
                        )}
                      </div>
                      <FormDescription>Produto aparecerá nessas categorias também</FormDescription>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Configurações</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="active" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Ativo</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="featured" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Destaque</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bestseller" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel>Mais Vendido</FormLabel>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </CardContent>
              </Card>

              <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
                <Save className="mr-2 h-4 w-4" />
                {isCreating || isUpdating ? "Salvando..." : "Salvar Produto"}
              </Button>
            </div>
          </div>

          {/* Fixed save button for mobile */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden z-40">
            <Button type="submit" className="w-full" disabled={isCreating || isUpdating}>
              <Save className="mr-2 h-4 w-4" />
              {isCreating || isUpdating ? "Salvando..." : "Salvar Produto"}
            </Button>
          </div>
          <div className="h-16 lg:hidden" />
        </form>
      </Form>
    </div>
  );
}
