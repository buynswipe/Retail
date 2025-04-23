"use client"

import { useState } from "react"
import type { DateRange } from "@/lib/analytics-service"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

interface DateRangeSelectorProps {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  startDate?: Date
  endDate?: Date
  setStartDate: (date: Date | undefined) => void
  setEndDate: (date: Date | undefined) => void
}

export function DateRangeSelector({
  dateRange,
  setDateRange,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}: DateRangeSelectorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handleRangeClick = (range: DateRange) => {
    setDateRange(range)

    // Reset custom date range when selecting a predefined range
    if (range !== "custom") {
      setStartDate(undefined)
      setEndDate(undefined)
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date)
      setEndDate(undefined)
    } else {
      // Ensure end date is after start date
      if (date && date >= startDate) {
        setEndDate(date)
        setCalendarOpen(false)
        setDateRange("custom")
      } else {
        setStartDate(date)
        setEndDate(undefined)
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center">
      <div className="flex flex-wrap gap-2">
        <Button variant={dateRange === "7d" ? "default" : "outline"} size="sm" onClick={() => handleRangeClick("7d")}>
          Last 7 days
        </Button>
        <Button variant={dateRange === "30d" ? "default" : "outline"} size="sm" onClick={() => handleRangeClick("30d")}>
          Last 30 days
        </Button>
        <Button variant={dateRange === "90d" ? "default" : "outline"} size="sm" onClick={() => handleRangeClick("90d")}>
          Last 90 days
        </Button>
        <Button variant={dateRange === "1y" ? "default" : "outline"} size="sm" onClick={() => handleRangeClick("1y")}>
          Last year
        </Button>
        <Button variant={dateRange === "all" ? "default" : "outline"} size="sm" onClick={() => handleRangeClick("all")}>
          All time
        </Button>
      </div>

      <div className="flex items-center">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={dateRange === "custom" ? "default" : "outline"}
              size="sm"
              className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate && endDate ? (
                <>
                  {format(startDate, "PPP")} - {format(endDate, "PPP")}
                </>
              ) : startDate ? (
                <>{format(startDate, "PPP")} - Select end date</>
              ) : (
                "Custom range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={startDate} onSelect={handleCalendarSelect} initialFocus />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
