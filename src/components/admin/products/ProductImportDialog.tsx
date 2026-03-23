import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  Check,
  X,
  ImagePlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImportedProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  variantName: string | null;
  variantCondition: string | null;
  variantPrice: number | null;
  maxInstallments: number | null;
  approved: boolean;
  coverImage: string | null;
  coverFile: File | null;
  status: "pending" | "importing" | "done" | "error";
  error?: string;
}

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_\s]+/g, " ")
    .trim();
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  const normalizedHeaders = headers.map((h) =>
    h ? normalizeColumnName(String(h)) : ""
  );
  const normalizedNames = possibleNames.map(normalizeColumnName);

  for (const name of normalizedNames) {
    const idx = normalizedHeaders.indexOf(name);
    if (idx !== -1) return idx;
  }
  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex((h) => h.startsWith(name));
    if (idx !== -1) return idx;
  }
  for (const name of normalizedNames) {
    const idx = normalizedHeaders.findIndex((h) => h.includes(name));
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseNumericValue(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  let cleaned = value.toString().replace(/\s/g, "").replace(/[R$\u20AC$]/g, "");
  const lastDot = cleaned.lastIndexOf(".");
  const lastComma = cleaned.lastIndexOf(",");
  if (lastDot === -1 && lastComma === -1) return parseFloat(cleaned) || null;
  if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ProductImportDialog({ open, onOpenChange, onImportComplete }: Props) {
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rows.length < 2) {
        toast.error("Planilha vazia ou sem dados.");
        return;
      }

      const headers = rows[0].map(String);
      const nameCol = findColumnIndex(headers, ["nome do produto", "nome", "product name", "name"]);
      const descCol = findColumnIndex(headers, ["descricao do produto", "descricao", "description"]);
      const priceCol = findColumnIndex(headers, ["preco de venda", "preco", "price", "valor"]);
      const compareCol = findColumnIndex(headers, ["preco de quanto estava", "preco comparacao", "compare at price", "de"]);
      const categoryCol = findColumnIndex(headers, ["categoria principal", "categoria", "category"]);
      const variantNameCol = findColumnIndex(headers, ["nome da variante", "variante"]);
      const variantCondCol = findColumnIndex(headers, ["nome da condicao variante", "condicao variante"]);
      const variantPriceCol = findColumnIndex(headers, ["preco da variante", "variante preco"]);
      const installmentsCol = findColumnIndex(headers, ["parcelamento", "parcelas", "parcelamente"]);

      if (nameCol === -1) {
        toast.error("Coluna 'Nome do Produto' não encontrada na planilha.");
        return;
      }

      const imported: ImportedProduct[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const name = row[nameCol] ? String(row[nameCol]).trim() : "";
        if (!name) continue;

        const price = parseNumericValue(row[priceCol]) ?? 0;
        const compareAtPrice = compareCol !== -1 ? parseNumericValue(row[compareCol]) : null;

        imported.push({
          id: `import-${i}-${Date.now()}`,
          name,
          description: descCol !== -1 ? String(row[descCol] || "") : "",
          price,
          compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : null,
          category: categoryCol !== -1 ? String(row[categoryCol] || "") : "",
          variantName: variantNameCol !== -1 && row[variantNameCol] ? String(row[variantNameCol]) : null,
          variantCondition: variantCondCol !== -1 && row[variantCondCol] ? String(row[variantCondCol]) : null,
          variantPrice: variantPriceCol !== -1 ? parseNumericValue(row[variantPriceCol]) : null,
          maxInstallments: installmentsCol !== -1 ? parseNumericValue(row[installmentsCol]) ?? null : null,
          approved: false,
          coverImage: null,
          coverFile: null,
          status: "pending",
        });
      }

      if (imported.length === 0) {
        toast.error("Nenhum produto encontrado na planilha.");
        return;
      }

      setProducts(imported);
      toast.success(`${imported.length} produto(s) encontrado(s) na planilha!`);
    } catch (err: any) {
      console.error("Error parsing spreadsheet:", err);
      toast.error("Erro ao ler a planilha: " + err.message);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const toggleApproval = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, approved: !p.approved } : p))
    );
    console.log("[ProductImportDialog] toggleApproval", { id });
  };

  const toggleAll = (approved: boolean) => {
    setProducts((prev) => prev.map((p) => ({ ...p, approved })));
    console.log("[ProductImportDialog] toggleAll", { approved });
  };

  const handleCoverImage = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, coverImage: url, coverFile: file } : p))
    );
  };

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const { data, error } = await supabase.storage
      .from("products")
      .upload(filename, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("products").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleImport = async () => {
    const approved = products.filter((p) => p.approved);
    console.log("[ProductImportDialog] handleImport", {
      total: products.length,
      approved: approved.length,
    });
    if (approved.length === 0) {
      toast.error("Nenhum produto aprovado para importar.");
      return;
    }

    setIsImporting(true);
    let successCount = 0;

    for (const product of approved) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: "importing" } : p))
      );

      try {
        let imageUrl: string | null = null;
        if (product.coverFile) {
          imageUrl = await uploadCoverImage(product.coverFile);
        }

        const slug = generateSlug(product.name);

        // Check for existing product by slug
        const { data: existing } = await supabase
          .from("products")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();

        // Match category by name (lookalike)
        let categoryId: string | null = null;
        if (product.category) {
          const normalizedCat = product.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
          const { data: categories } = await supabase
            .from("categories")
            .select("id, name")
            .eq("active", true);
          
          if (categories) {
            const match = categories.find((c) => {
              const norm = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              return norm === normalizedCat || norm.includes(normalizedCat) || normalizedCat.includes(norm);
            });
            categoryId = match?.id ?? null;
          }
        }

        const productData: any = {
          name: product.name,
          slug: existing ? `${slug}-${Date.now()}` : slug,
          description: product.description || null,
          price: product.price,
          compare_at_price: product.compareAtPrice,
          images: imageUrl ? [imageUrl] : null,
          main_image_index: 0,
          active: true,
          unlimited_stock: true,
          is_digital: true,
          category_id: categoryId,
          payment_config: product.maxInstallments
            ? { max_installments: product.maxInstallments }
            : null,
        };

        const { data: insertedProduct, error: insertError } = await supabase
          .from("products")
          .insert(productData)
          .select("id")
          .single();

        if (insertError) throw insertError;

        // If variant info exists, create a variant
        if (product.variantName && insertedProduct) {
          const attributes: Record<string, string> = {};
          attributes[product.variantName] = product.variantCondition || "";

          await supabase.from("product_variants").insert({
            product_id: insertedProduct.id,
            attributes,
            price: product.variantPrice ?? product.price,
            stock: 0,
            active: true,
          });

          await supabase
            .from("products")
            .update({ has_variants: true })
            .eq("id", insertedProduct.id);
        }

        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, status: "done" } : p))
        );
        successCount++;
      } catch (err: any) {
        const errorMessage = err?.message || "Erro desconhecido ao importar";
        console.error("Import error for", product.name, err);
        toast.error(`Erro ao importar \"${product.name}\": ${errorMessage}`);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, status: "error", error: errorMessage }
              : p
          )
        );
      }
    }

    setIsImporting(false);
    if (successCount === 0) {
      toast.error("Nenhum produto foi importado. Verifique os erros na lista.");
      return;
    }

    toast.success(`${successCount} de ${approved.length} produto(s) importado(s)!`);
    onImportComplete();
  };

  const approvedCount = products.filter((p) => p.approved).length;
  const formatPrice = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Produtos por Planilha
          </DialogTitle>
        </DialogHeader>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="font-medium">Envie sua planilha de produtos</p>
              <p className="text-sm text-muted-foreground mt-1">
                Aceita arquivos .xlsx, .xls ou .csv
              </p>
            </div>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Selecionar Planilha
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {products.length} encontrado(s)
                </Badge>
                <Badge variant="default">
                  {approvedCount} aprovado(s)
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(true)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Aprovar Todos
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAll(false)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Desmarcar Todos
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 max-h-[55vh] border rounded-lg">
              <div className="divide-y">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-center gap-3 p-3 transition-colors",
                      product.approved && "bg-primary/5",
                      product.status === "done" && "bg-emerald-50 dark:bg-emerald-950/20",
                      product.status === "error" && "bg-destructive/5"
                    )}
                  >
                    {/* Approval checkbox */}
                    <Checkbox
                      checked={product.approved}
                      onCheckedChange={() => toggleApproval(product.id)}
                      disabled={product.status === "done" || isImporting}
                    />

                    {/* Cover image */}
                    <input
                      ref={(el) => { imageInputRefs.current[product.id] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverImage(product.id, file);
                        e.target.value = "";
                      }}
                    />
                    <div
                      className="h-14 w-14 rounded-md bg-muted flex items-center justify-center shrink-0 overflow-hidden cursor-pointer border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.status !== "done" && !isImporting) {
                          imageInputRefs.current[product.id]?.click();
                        }
                      }}
                    >
                      {product.coverImage ? (
                        <img
                          src={product.coverImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-sm font-semibold">
                          {formatPrice(product.price)}
                        </span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                        {product.category && (
                          <Badge variant="outline" className="text-[10px] h-4">
                            {product.category}
                          </Badge>
                        )}
                        {product.variantName && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {product.variantName}: {product.variantCondition}
                          </Badge>
                        )}
                      </div>
                      {product.status === "error" && (
                        <p className="text-xs text-destructive mt-0.5">
                          {product.error}
                        </p>
                      )}
                    </div>

                    {/* Status icon */}
                    <div className="shrink-0">
                      {product.status === "importing" && (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      )}
                      {product.status === "done" && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                      {product.status === "error" && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setProducts([]);
                }}
                disabled={isImporting}
              >
                Nova Planilha
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={approvedCount === 0 || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Importar {approvedCount} Produto(s)
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
