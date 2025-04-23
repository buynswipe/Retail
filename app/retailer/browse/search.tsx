"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/app/components/translation-provider"

interface SearchProps {
  onSearch: (query: string, filters: any) => void
  categories: string[]
}

export default function ProductSearch({ onSearch, categories }: SearchProps) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    category: "",
    priceRange: [0, 5000],
    inStock: true,
    discount: false,
    sortBy: "relevance",
  })
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Update active filters display
  useEffect(() => {
    const newActiveFilters = []

    if (filters.category) {
      newActiveFilters.push(`Category: ${filters.category}`)
    }

    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) {
      newActiveFilters.push(`Price: ₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`)
    }

    if (filters.inStock) {
      newActiveFilters.push("In Stock")
    }

    if (filters.discount) {
      newActiveFilters.push("Discounted")
    }

    if (filters.sortBy !== "relevance") {
      newActiveFilters.push(`Sort: ${filters.sortBy}`)
    }

    setActiveFilters(newActiveFilters)
  }, [filters])

  const handleSearch = () => {
    onSearch(searchQuery, filters)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const removeFilter = (filter: string) => {
    if (filter.startsWith("Category:")) {
      setFilters({ ...filters, category: "" })
    } else if (filter.startsWith("Price:")) {
      setFilters({ ...filters, priceRange: [0, 5000] })
    } else if (filter === "In Stock") {
      setFilters({ ...filters, inStock: false })
    } else if (filter === "Discounted") {
      setFilters({ ...filters, discount: false })
    } else if (filter.startsWith("Sort:")) {
      setFilters({ ...filters, sortBy: "relevance" })
    }
  }

  const clearAllFilters = () => {
    setFilters({
      category: "",
      priceRange: [0, 5000],
      inStock: true,
      discount: false,
      sortBy: "relevance",
    })
    setSearchQuery("")
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Input
            placeholder={t("search.placeholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 h-12 text-lg"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} className="h-12 bg-blue-600 hover:bg-blue-700">
            <Search className="mr-2 h-5 w-5" />
            {t("search.button")}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12">
                <Filter className="mr-2 h-5 w-5" />
                {t("search.filters")}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>{t("search.filters")}</SheetTitle>
                <SheetDescription>{t("search.filters.description")}</SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <Label>{t("search.category")}</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("search.category.all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("search.category.all")}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{t("search.price")}</Label>
                    <span className="text-sm text-gray-500">
                      ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 5000]}
                    max={5000}
                    step={100}
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters({ ...filters, priceRange: value as [number, number] })}
                    className="py-4"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={filters.inStock}
                      onCheckedChange={(checked) => setFilters({ ...filters, inStock: checked as boolean })}
                    />
                    <Label htmlFor="inStock">{t("search.inStock")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="discount"
                      checked={filters.discount}
                      onCheckedChange={(checked) => setFilters({ ...filters, discount: checked as boolean })}
                    />
                    <Label htmlFor="discount">{t("search.discount")}</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("search.sortBy")}</Label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("search.sortBy.relevance")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">{t("search.sortBy.relevance")}</SelectItem>
                      <SelectItem value="price-low-high">{t("search.sortBy.priceLowHigh")}</SelectItem>
                      <SelectItem value="price-high-low">{t("search.sortBy.priceHighLow")}</SelectItem>
                      <SelectItem value="newest">{t("search.sortBy.newest")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter>
                <SheetClose asChild>
                  <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
                    {t("search.apply")}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">{t("search.activeFilters")}:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter}
              <button onClick={() => removeFilter(filter)} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {t("search.clearAll")}
          </Button>
        </div>
      )}
    </div>
  )
}
