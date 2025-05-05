"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
import type { ProductFilter } from "@/lib/types"
import { getProductCategories, getProductBrands, getProductPriceRange } from "@/lib/product-filter"

export default function ProductSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [maxPriceLimit, setMaxPriceLimit] = useState(1000)

  const [filters, setFilters] = useState<ProductFilter>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
    maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
    inStock: searchParams.get("inStock") === "true" ? true : undefined,
    brands: searchParams.get("brands") ? searchParams.get("brands")?.split(",") : [],
    sortBy: searchParams.get("sortBy") || "created_at",
    sortDirection: (searchParams.get("sortDirection") as "asc" | "desc") || "desc",
  })

  useEffect(() => {
    // Fetch categories, brands, and price range on component mount
    const fetchFilterOptions = async () => {
      const [categoriesData, brandsData, priceRangeData] = await Promise.all([
        getProductCategories(),
        getProductBrands(),
        getProductPriceRange(),
      ])

      setCategories(categoriesData)
      setBrands(brandsData)
      setPriceRange([priceRangeData.min, priceRangeData.max])
      setMaxPriceLimit(priceRangeData.max)

      // Update filters with price range if not already set
      if (filters.minPrice === undefined && filters.maxPrice === undefined) {
        setFilters((prev) => ({
          ...prev,
          minPrice: priceRangeData.min,
          maxPrice: priceRangeData.max,
        }))
      }
    }

    fetchFilterOptions()
  }, [])

  const handleSearch = () => {
    // Update search in filters
    const updatedFilters = { ...filters, search }
    applyFilters(updatedFilters)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const applyFilters = (updatedFilters: ProductFilter) => {
    // Build query string from filters
    const params = new URLSearchParams()

    if (updatedFilters.search) params.set("search", updatedFilters.search)
    if (updatedFilters.category) params.set("category", updatedFilters.category)
    if (updatedFilters.minPrice !== undefined) params.set("minPrice", updatedFilters.minPrice.toString())
    if (updatedFilters.maxPrice !== undefined) params.set("maxPrice", updatedFilters.maxPrice.toString())
    if (updatedFilters.inStock !== undefined) params.set("inStock", updatedFilters.inStock.toString())
    if (updatedFilters.brands && updatedFilters.brands.length > 0) params.set("brands", updatedFilters.brands.join(","))
    if (updatedFilters.sortBy) params.set("sortBy", updatedFilters.sortBy)
    if (updatedFilters.sortDirection) params.set("sortDirection", updatedFilters.sortDirection)

    // Navigate to the same page with updated query params
    router.push(`?${params.toString()}`)

    // Update local state
    setFilters(updatedFilters)
  }

  const resetFilters = () => {
    setSearch("")
    setFilters({
      search: "",
      category: "",
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      inStock: undefined,
      brands: [],
      sortBy: "created_at",
      sortDirection: "desc",
    })

    // Navigate to the same page without query params
    router.push(window.location.pathname)
  }

  const handleBrandToggle = (brand: string, checked: boolean) => {
    setFilters((prev) => {
      const currentBrands = prev.brands || []
      let updatedBrands: string[]

      if (checked) {
        updatedBrands = [...currentBrands, brand]
      } else {
        updatedBrands = currentBrands.filter((b) => b !== brand)
      }

      return { ...prev, brands: updatedBrands }
    })
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={handleSearch} className="shrink-0">
          Search
        </Button>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Products</SheetTitle>
              <SheetDescription>Refine your product search with these filters</SheetDescription>
            </SheetHeader>
            <div className="py-4 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Category</h3>
                <Select
                  value={filters.category || ""}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Price Range</h3>
                <div className="pt-6 px-2">
                  <Slider
                    defaultValue={[filters.minPrice || priceRange[0], filters.maxPrice || priceRange[1]]}
                    max={maxPriceLimit}
                    step={1}
                    onValueChange={(values) => {
                      setFilters((prev) => ({
                        ...prev,
                        minPrice: values[0],
                        maxPrice: values[1],
                      }))
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>₹{filters.minPrice || priceRange[0]}</span>
                  <span>₹{filters.maxPrice || priceRange[1]}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Availability</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={filters.inStock === true}
                    onCheckedChange={(checked) => {
                      setFilters((prev) => ({
                        ...prev,
                        inStock: checked === true ? true : undefined,
                      }))
                    }}
                  />
                  <Label htmlFor="in-stock">In Stock Only</Label>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Brands</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {brands.map((brand) => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={(filters.brands || []).includes(brand)}
                        onCheckedChange={(checked) => {
                          handleBrandToggle(brand, checked === true)
                        }}
                      />
                      <Label htmlFor={`brand-${brand}`}>{brand}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Sort By</h3>
                <Select
                  value={filters.sortBy || "created_at"}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="average_rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Sort Direction</h3>
                <Select
                  value={filters.sortDirection || "desc"}
                  onValueChange={(value: "asc" | "desc") => setFilters((prev) => ({ ...prev, sortDirection: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sort direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SheetFooter className="flex justify-between sm:justify-between">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
              <SheetClose asChild>
                <Button onClick={() => applyFilters(filters)}>Apply Filters</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filters display */}
      {(filters.category ||
        filters.inStock !== undefined ||
        (filters.brands && filters.brands.length > 0) ||
        filters.sortBy !== "created_at") && (
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="text-gray-500">Active filters:</span>

          {filters.category && (
            <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
              Category: {filters.category}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, category: "" }))}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.inStock && (
            <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
              In Stock Only
              <button
                onClick={() => setFilters((prev) => ({ ...prev, inStock: undefined }))}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {filters.brands &&
            filters.brands.map((brand) => (
              <span key={brand} className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
                {brand}
                <button
                  onClick={() => handleBrandToggle(brand, false)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

          {filters.sortBy !== "created_at" && (
            <span className="bg-gray-100 px-2 py-1 rounded-full flex items-center">
              Sort: {filters.sortBy} ({filters.sortDirection === "asc" ? "↑" : "↓"})
              <button
                onClick={() => setFilters((prev) => ({ ...prev, sortBy: "created_at", sortDirection: "desc" }))}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button onClick={resetFilters} className="text-blue-600 hover:text-blue-800 underline">
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
