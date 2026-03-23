import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PublicFilter, extractFilterOptions } from "@/hooks/usePublicFilters";
import type { Tables } from "@/integrations/supabase/types";

interface StorefrontFiltersProps {
  filters: PublicFilter[];
  products: Tables<"products">[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (filterId: string, values: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
}

export function StorefrontFilters({
  filters,
  products,
  activeFilters,
  onFilterChange,
  priceRange,
  onPriceRangeChange,
}: StorefrontFiltersProps) {
  // Compute available options for each filter from the product list
  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const filter of filters) {
      map[filter.id] = extractFilterOptions(products, filter);
    }
    return map;
  }, [filters, products]);

  const handleToggle = (filterId: string, value: string, checked: boolean) => {
    const current = activeFilters[filterId] || [];
    if (checked) {
      onFilterChange(filterId, [...current, value]);
    } else {
      onFilterChange(filterId, current.filter(v => v !== value));
    }
  };

  const filtersWithOptions = filters.filter(f => (filterOptions[f.id]?.length ?? 0) > 0);

  if (filtersWithOptions.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Price range */}
      <div>
        <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-muted-foreground">
          Faixa de preço
        </h4>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            value={priceRange[0] || ""}
            onChange={(e) => onPriceRangeChange([Number(e.target.value) || 0, priceRange[1]])}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-card"
          />
          <input
            type="number"
            placeholder="Máx"
            value={priceRange[1] >= 50000 ? "" : priceRange[1]}
            onChange={(e) => onPriceRangeChange([priceRange[0], Number(e.target.value) || 50000])}
            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-card"
          />
        </div>
        <button
          onClick={() => onPriceRangeChange([0, 50000])}
          className="text-xs text-primary hover:underline mt-2"
        >
          Limpar
        </button>
      </div>

      {/* Dynamic filters */}
      {filtersWithOptions.map((filter) => {
        const options = filterOptions[filter.id] || [];
        const selected = activeFilters[filter.id] || [];

        return (
          <div key={filter.id}>
            <h4 className="text-xs font-medium mb-3 uppercase tracking-wider text-muted-foreground">
              {filter.name}
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {options.map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <Checkbox
                    id={`${filter.id}-${option}`}
                    checked={selected.includes(option)}
                    onCheckedChange={(checked) => handleToggle(filter.id, option, !!checked)}
                  />
                  <Label
                    htmlFor={`${filter.id}-${option}`}
                    className="text-sm cursor-pointer text-foreground"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
