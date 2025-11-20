'use client'

/**
 * Date Range Picker Component
 * Reusable component for selecting date ranges with preset options
 */

import * as React from 'react'
import { format, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type DateRangePreset = 'today' | 'week' | 'month' | 'last30' | 'custom'

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [activePreset, setActivePreset] = React.useState<DateRangePreset>('month')

  const presets = [
    {
      label: 'Today',
      value: 'today' as DateRangePreset,
      getRange: () => {
        const today = new Date()
        return { from: today, to: today }
      }
    },
    {
      label: 'This Week',
      value: 'week' as DateRangePreset,
      getRange: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 })
      })
    },
    {
      label: 'This Month',
      value: 'month' as DateRangePreset,
      getRange: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
      })
    },
    {
      label: 'Last 30 Days',
      value: 'last30' as DateRangePreset,
      getRange: () => ({
        from: subDays(new Date(), 30),
        to: new Date()
      })
    },
    {
      label: 'Custom',
      value: 'custom' as DateRangePreset,
      getRange: () => undefined
    }
  ]

  const handlePresetClick = (preset: typeof presets[0]) => {
    setActivePreset(preset.value)
    const range = preset.getRange()
    onChange(range)
    if (preset.value !== 'custom') {
      setOpen(false)
    }
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    onChange(range)
    setActivePreset('custom')
    // Only close if both dates are selected
    if (range?.from && range?.to) {
      setOpen(false)
    }
  }

  const formatDateRange = () => {
    if (!value?.from) {
      return 'Pick a date range'
    }

    if (value.from && value.to) {
      if (format(value.from, 'yyyy-MM-dd') === format(value.to, 'yyyy-MM-dd')) {
        return format(value.from, 'MMM dd, yyyy')
      }
      return `${format(value.from, 'MMM dd, yyyy')} - ${format(value.to, 'MMM dd, yyyy')}`
    }

    return format(value.from, 'MMM dd, yyyy')
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Preset buttons */}
            <div className="flex flex-col gap-1 border-r p-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">
                PRESETS
              </div>
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={activePreset === preset.value ? 'default' : 'ghost'}
                  size="sm"
                  className="justify-start"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Calendar */}
            <div className="p-3">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={handleCalendarSelect}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
