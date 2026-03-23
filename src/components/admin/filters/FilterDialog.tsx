import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SearchFilter, FilterFormData } from "@/hooks/admin/useFilters";
import type { Category } from "@/hooks/admin/useCategories";
import type { FilterType } from "@/types/admin";

const FILTER_TYPES: { value: FilterType; label: string }[] = [
  { value: "checkbox", label: "Múltipla escolha (checkbox)" },
  { value: "radio", label: "Escolha única (radio)" },
  { value: "slider", label: "Slider" },
  { value: "range", label: "Intervalo (range)" },
  { value: "boolean", label: "Sim/Não (boolean)" },
];

const FILTER_SOURCES = [
  { value: "attribute", label: "Atributo do produto" },
  { value: "tag", label: "Tag" },
  { value: "field", label: "Campo do produto" },
];

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  slug: z.string().min(1, "Slug é obrigatório"),
  type: z.enum(["checkbox", "radio", "slider", "range", "boolean"] as const),
  source: z.string().min(1, "Fonte é obrigatória"),
  source_key: z.string().optional(),
  category_ids: z.array(z.string()).optional(),
  sort_order: z.number().default(0),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: SearchFilter | null;
  categories: Category[];
  onSave: (data: FilterFormData) => Promise<void>;
  isLoading?: boolean;
}

export function FilterDialog({
  open,
  onOpenChange,
  filter,
  categories,
  onSave,
  isLoading,
}: FilterDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      type: "checkbox",
      source: "attribute",
      source_key: "",
      category_ids: [],
      sort_order: 0,
      active: true,
    },
  });

  useEffect(() => {
    if (filter) {
      form.reset({
        name: filter.name,
        slug: filter.slug,
        type: filter.type,
        source: filter.source,
        source_key: filter.source_key || "",
        category_ids: filter.category_ids || [],
        sort_order: filter.sort_order,
        active: filter.active,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        type: "checkbox",
        source: "attribute",
        source_key: "",
        category_ids: [],
        sort_order: 0,
        active: true,
      });
    }
  }, [filter, form]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!filter) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const onSubmit = async (values: FormValues) => {
    await onSave({
      name: values.name,
      slug: values.slug,
      type: values.type,
      source: values.source,
      source_key: values.source_key || null,
      category_ids:
        values.category_ids && values.category_ids.length > 0
          ? values.category_ids
          : null,
      sort_order: values.sort_order,
      active: values.active,
    });
  };

  const selectedCategories = form.watch("category_ids") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {filter ? "Editar Filtro" : "Novo Filtro"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={handleNameChange}
                      placeholder="Ex: Cor"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ex: cor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FILTER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte de Dados</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FILTER_SOURCES.map((src) => (
                        <SelectItem key={src.value} value={src.value}>
                          {src.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source_key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave da Fonte</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: color, size, price"
                    />
                  </FormControl>
                  <FormDescription>
                    Nome do atributo, tag ou campo
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_ids"
              render={() => (
                <FormItem>
                  <FormLabel>Categorias Aplicáveis</FormLabel>
                  <FormDescription>
                    Deixe vazio para aplicar em todas
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto rounded-md border p-3">
                    {categories.map((category) => (
                      <FormField
                        key={category.id}
                        control={form.control}
                        name="category_ids"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, category.id]);
                                  } else {
                                    field.onChange(
                                      current.filter((id) => id !== category.id)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {category.icon} {category.name}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  {selectedCategories.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCategories.length} categoria(s) selecionada(s)
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Filtro visível na loja
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
