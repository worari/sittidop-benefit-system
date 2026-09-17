"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/presentation/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/presentation/components/ui/command";
import { cn } from "@/presentation/lib/utils";
import { Check, ChevronsUpDown, X, MapPin } from "lucide-react";

interface AddressComboboxProps {
  /** The current value */
  value: string;
  /** Callback when a value is selected */
  onValueChange: (value: string) => void;
  /** List of available options */
  options: string[];
  /** Placeholder text */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Empty state text */
  emptyText?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional className for the trigger button */
  className?: string;
  /** Icon to show before the label */
  icon?: React.ReactNode;
  /** Label above the combobox */
  label?: string;
  /** Show clear button */
  showClear?: boolean;
  /** Callback for clearing */
  onClear?: () => void;
}

export function AddressCombobox({
  value,
  onValueChange,
  options,
  placeholder = "เลือก...",
  searchPlaceholder = "ค้นหา...",
  emptyText = "ไม่พบข้อมูล",
  disabled = false,
  className,
  showClear = true,
  onClear,
}: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Filter options based on search - for Thai text matching
  const filteredOptions = React.useMemo(() => {
    if (!searchValue.trim()) return options.slice(0, 100); // Limit initial display
    const term = searchValue.trim().toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(term)).slice(0, 100);
  }, [options, searchValue]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onValueChange(selectedValue);
      setOpen(false);
      setSearchValue("");
    },
    [onValueChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (onClear) {
        onClear();
      } else {
        onValueChange("");
      }
      setSearchValue("");
    },
    [onClear, onValueChange]
  );

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchValue("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-150",
            className
          )}
        >
          <span
            className={cn(
              "truncate text-left flex-1",
              !value && "text-muted-foreground"
            )}
          >
            {value || placeholder}
          </span>
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            {showClear && value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={handleClear}
                className="rounded-full p-0.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="ล้างค่า"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
            className="text-xs"
          />
          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col items-center gap-1 py-2">
                <MapPin className="h-5 w-5 text-muted-foreground/50" />
                <span>{emptyText}</span>
                {searchValue && (
                  <span className="text-[10px] text-muted-foreground">
                    &ldquo;{searchValue}&rdquo;
                  </span>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-1.5 h-3.5 w-3.5 shrink-0 transition-opacity",
                      value === option ? "opacity-100 text-emerald-600" : "opacity-0"
                    )}
                  />
                  <span className={cn(
                    "truncate",
                    value === option && "font-semibold text-emerald-700 dark:text-emerald-400"
                  )}>
                    {option}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
