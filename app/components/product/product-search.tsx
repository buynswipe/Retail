"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useTranslation } from "@/app/components/translation-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface ProductSearchProps {
  onSearch: (filters: ProductFilters) => void
  categories: string[]
  brands: string[]
  initialFilters?: ProductFilters
  className?: string
}

export interface ProductFilters {
  query: string
  categories: string[]
  brands: string[]
  priceRange: [number, number]
  inStock: boolean
  sortBy: string
}

export function ProductSearch({ onSearch, categories, brands, initialFilters, className }: ProductSearchProps) {
  const { t } = useTranslation()
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  const defaultFilters: ProductFilters = {
    query: "",
    categories: [],
    brands: [],
    priceRange: [0, 10000],
    inStock: false,
    sortBy: "relevance",
  }

  const [filters, setFilters] = useState<ProductFilters>(initialFilters || defaultFilters)

  // Calculate active filters count
  useEffect(() => {
    let count = 0
    if (filters.query) count++
    if (filters.categories.length > 0) count++
    if (filters.brands.length > 0) count++
    if (filters.inStock) count++
    if (filters.priceRange[0] > defaultFilters.priceRange[0] || filters.priceRange[1] < defaultFilters.priceRange[1])
      count++
    if (filters.sortBy !== defaultFilters.sortBy) count++
    setActiveFiltersCount(count)
  }, [filters])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, query: e.target.value })
  }

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category]
      return { ...prev, categories: newCategories }
    })
  }

  const handleBrandToggle = (brand: string) => {
    setFilters((prev) => {
      const newBrands = prev.brands.includes(brand) ? prev.brands.filter((b) => b !== brand) : [...prev.brands, brand]
      return { ...prev, brands: newBrands }
    })
  }

  const handlePriceChange = (value: number[]) => {
    setFilters({ ...filters, priceRange: [value[0], value[1]] })
  }

  const handleInStockToggle = (checked: boolean) => {
    setFilters({ ...filters, inStock: checked })
  }

  const handleSortChange = (value: string) => {
    setFilters({ ...filters, sortBy: value })
  }

  const handleSearch = () => {
    onSearch(filters)
    setIsFilterOpen(false)
  }

  const handleReset = () => {
    setFilters(defaultFilters)
  }

  const handleRemoveFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case "query":
        setFilters({ ...filters, query: "" })
        break
      case "category":
        setFilters({
          ...filters,
          categories: filters.categories.filter((c) => c !== value),
        })
        break
      case "brand":
        setFilters({
          ...filters,
          brands: filters.brands.filter((b) => b !== value),
        })
        break
      case "price":
        setFilters({
          ...filters,
          priceRange: defaultFilters.priceRange,
        })
        break
      case "inStock":
        setFilters({ ...filters, inStock: false })
        break
      case "sortBy":
        setFilters({ ...filters, sortBy: defaultFilters.sortBy })
        break
      default:
        break
    }
  }

  const renderActiveFilters = () => {
    if (activeFiltersCount === 0) return null

    return (
      <div className="flex flex-wrap gap-2 mt-4">
        {filters.query && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {t("Search")}: {filters.query}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("query")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.categories.map((category) => (
          <Badge key={category} variant="secondary" className="flex items-center gap-1">
            {category}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("category", category)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {filters.brands.map((brand) => (
          <Badge key={brand} variant="secondary" className="flex items-center gap-1">
            {brand}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("brand", brand)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {(filters.priceRange[0] > defaultFilters.priceRange[0] ||
          filters.priceRange[1] < defaultFilters.priceRange[1]) && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {t("Price")}: {formatCurrency(filters.priceRange[0])} - {formatCurrency(filters.priceRange[1])}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("price")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.inStock && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {t("In Stock")}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("inStock")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.sortBy !== defaultFilters.sortBy && (
          <Badge variant="secondary" className="flex items-center gap-1">
            {t("Sort")}: {t(filters.sortBy)}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => handleRemoveFilter("sortBy")}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {activeFiltersCount > 1 && (
          <Button variant="ghost" size="sm" className="h-7" onClick={handleReset}>
            {t("Clear All")}
          </Button>
        )}
      </div>
    )
  }

  // Desktop filter view
  const renderDesktopFilters = () => (
    <div className="hidden md:block">
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("Search products...")}
                value={filters.query}
                onChange={handleInputChange}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch}>{t("Search")}</Button>
          </div>
          {renderActiveFilters()}
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-medium mb-3">{t("Categories")}</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => handleCategoryToggle(category)}
                />
                <label
                  htmlFor={`category-${category}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {category}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h3 className="font-medium mb-3">{t("Brands")}</h3>
          <div className="space-y-2">
            {brands.map((brand) => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={filters.brands.includes(brand)}
                  onCheckedChange={() => handleBrandToggle(brand)}
                />
                <label
                  htmlFor={`brand-${brand}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {brand}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-medium mb-3">{t("Price Range")}</h3>
          <div className="px-2">
            <Slider
              defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
              min={0}
              max={10000}
              step={100}
              value={[filters.priceRange[0], filters.priceRange[1]]}
              onValueChange={handlePriceChange}
              className="mb-6"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm">{formatCurrency(filters.priceRange[0])}</span>
              <span className="text-sm">{formatCurrency(filters.priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* In Stock */}
        <div>
          <div className="flex items-center space-x-2">
            <Checkbox id="in-stock" checked={filters.inStock} onCheckedChange={handleInStockToggle} />
            <label
              htmlFor="in-stock"
              className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t("In Stock Only")}
            </label>
          </div>
        </div>

        {/* Sort By */}
        <div>
          <h3 className="font-medium mb-3">{t("Sort By")}</h3>
          <div className="space-y-2">
            {["relevance", "price-low-high", "price-high-low", "newest"].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`sort-${option}`}
                  name="sort"
                  checked={filters.sortBy === option}
                  onChange={() => handleSortChange(option)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor={`sort-${option}`} className="text-sm">
                  {option === "relevance" && t("Relevance")}
                  {option === "price-low-high" && t("Price: Low to High")}
                  {option === "price-high-low" && t("Price: High to Low")}
                  {option === "newest" && t("Newest First")}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full" onClick={handleSearch}>
          {t("Apply Filters")}
        </Button>
      </div>
    </div>
  )

  // Mobile filter view
  const renderMobileFilters = () => (
    <div className="md:hidden">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("Search products...")}
            value={filters.query}
            onChange={handleInputChange}
            className="pl-9"
          />
        </div>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="sr-only md:not-sr-only">{t("Filters")}</span>
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">{activeFiltersCount}</Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{t("Filters")}</SheetTitle>
              <SheetDescription>{t("Narrow down your product search with filters")}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Categories */}
              <Accordion type="single" collapsible defaultValue="categories">
                <AccordionItem value="categories">
                  <AccordionTrigger>{t("Categories")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 mt-2">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-category-${category}`}
                            checked={filters.categories.includes(category)}
                            onCheckedChange={() => handleCategoryToggle(category)}
                          />
                          <label
                            htmlFor={`mobile-category-${category}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Brands */}
              <Accordion type="single" collapsible>
                <AccordionItem value="brands">
                  <AccordionTrigger>{t("Brands")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 mt-2">
                      {brands.map((brand) => (
                        <div key={brand} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-brand-${brand}`}
                            checked={filters.brands.includes(brand)}
                            onCheckedChange={() => handleBrandToggle(brand)}
                          />
                          <label
                            htmlFor={`mobile-brand-${brand}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {brand}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Price Range */}
              <Accordion type="single" collapsible>
                <AccordionItem value="price">
                  <AccordionTrigger>{t("Price Range")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="px-2 mt-4">
                      <Slider
                        defaultValue={[filters.priceRange[0], filters.priceRange[1]]}
                        min={0}
                        max={10000}
                        step={100}
                        value={[filters.priceRange[0], filters.priceRange[1]]}
                        onValueChange={handlePriceChange}
                        className="mb-6"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{formatCurrency(filters.priceRange[0])}</span>
                        <span className="text-sm">{formatCurrency(filters.priceRange[1])}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* In Stock */}
              <div className="flex items-center space-x-2 px-1">
                <Checkbox id="mobile-in-stock" checked={filters.inStock} onCheckedChange={handleInStockToggle} />
                <label
                  htmlFor="mobile-in-stock"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("In Stock Only")}
                </label>
              </div>

              {/* Sort By */}
              <Accordion type="single" collapsible>
                <AccordionItem value="sort">
                  <AccordionTrigger>{t("Sort By")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 mt-2">
                      {["relevance", "price-low-high", "price-high-low", "newest"].map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`mobile-sort-${option}`}
                            name="mobile-sort"
                            checked={filters.sortBy === option}
                            onChange={() => handleSortChange(option)}
                            className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          />
                          <label htmlFor={`mobile-sort-${option}`} className="text-sm">
                            {option === "relevance" && t("Relevance")}
                            {option === "price-low-high" && t("Price: Low to High")}
                            {option === "price-high-low" && t("Price: High to Low")}
                            {option === "newest" && t("Newest First")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={handleReset}>
                  {t("Reset")}
                </Button>
                <Button className="flex-1" onClick={handleSearch}>
                  {t("Apply Filters")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      {renderActiveFilters()}
    </div>
  )

  return (
    <div className={className}>
      {renderMobileFilters()}
      {renderDesktopFilters()}
    </div>
  )
}
