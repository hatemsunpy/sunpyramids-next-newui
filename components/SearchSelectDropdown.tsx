"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/animate-ui/components/radix/dropdown-menu";
import { ChevronDown, Check, MapPin, Calendar, ArrowUpDown, Globe2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchSelectDropdownProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  variant?: "search" | "boxed" | "pill";
  iconType?: "location" | "duration" | "sort" | "country" | "none";
  menuTitle?: string;
  searchable?: boolean;
  className?: string;
}

export function SearchSelectDropdown({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  placeholder,
  options,
  onChange,
  required = false,
  disabled = false,
  variant = "search",
  iconType,
  menuTitle,
  searchable,
  className,
}: SearchSelectDropdownProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const selectRef = React.useRef<HTMLSelectElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const isSearchable = searchable ?? options.length > 12;

  const filteredOptions = React.useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lower) ||
        String(opt.value).toLowerCase().includes(lower)
    );
  }, [options, query]);

  const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

  const getFormattedLabel = (optVal: string, optLabel: string) => {
    if (iconType === "duration" && !isNaN(Number(optVal)) && !optLabel.toLowerCase().includes("day")) {
      const num = Number(optVal);
      return `${num} ${num === 1 ? "Day" : "Days"}`;
    }
    return optLabel;
  };

  const displayTriggerLabel = selectedOption
    ? getFormattedLabel(String(selectedOption.value), selectedOption.label)
    : placeholder;
  const isPlaceholder = !selectedOption;

  const handleSelect = (val: string) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
    setOpen(false);
    setQuery("");

    // Sync underlying native select for HTML5 form validation and test runners
    if (selectRef.current) {
      selectRef.current.value = val;
      const event = new Event("change", { bubbles: true });
      selectRef.current.dispatchEvent(event);
    }
  };

  // Focus search input when popover opens
  React.useEffect(() => {
    if (open && isSearchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, isSearchable]);

  return (
    <div className={cn("search-select-dropdown-container relative w-full", className)}>
      {/* Native select keeps test-suite (vitest), accessibility, and standard FormData completely intact */}
      <select
        id={id}
        ref={selectRef}
        name={name}
        value={currentValue}
        required={required}
        disabled={disabled}
        onChange={(e) => {
          if (!isControlled) setInternalValue(e.target.value);
          onChange?.(e.target.value);
        }}
        tabIndex={-1}
        className="search-select-native-accessible"
      >
        <option disabled value="">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Animate-UI Radix Dropdown Presentation */}
      <DropdownMenu
        open={open && !disabled}
        onOpenChange={(nextOpen) => {
          if (disabled) return;
          setOpen(nextOpen);
          if (!nextOpen) {
            setQuery("");
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "search-select-trigger group flex w-full items-center justify-between gap-2 text-left transition-all duration-200 outline-none",
              variant === "boxed" && "search-select-trigger--boxed",
              variant === "pill" && "search-select-trigger--pill",
              isPlaceholder ? "is-placeholder" : "is-selected",
              disabled && "is-disabled"
            )}
            aria-label={placeholder}
            aria-expanded={open}
          >
            <span className="search-select-value truncate text-[0.85rem] font-medium">
              {displayTriggerLabel}
            </span>
            <ChevronDown
              className={cn(
                "search-select-chevron h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ease-out",
                open && "rotate-180 text-primary opacity-100"
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className={cn(
            "search-select-popover",
            iconType === "location" && "search-select-popover--location",
            iconType === "duration" && "search-select-popover--duration",
            variant === "boxed" && "search-select-popover--boxed"
          )}
        >
          {menuTitle ? (
            <>
              <DropdownMenuLabel className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                {iconType === "location" && <MapPin className="h-3.5 w-3.5 text-primary" />}
                {iconType === "duration" && <Calendar className="h-3.5 w-3.5 text-primary" />}
                {iconType === "sort" && <ArrowUpDown className="h-3.5 w-3.5 text-primary" />}
                {iconType === "country" && <Globe2 className="h-3.5 w-3.5 text-primary" />}
                <span>{menuTitle}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}

          {isSearchable && (
            <div className="search-select-search-wrap" onClick={(e) => e.stopPropagation()}>
              <Search className="search-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="search-select-search-field"
              />
            </div>
          )}

          <div className="search-select-items-list">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                No results found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(currentValue);
                const formattedItemLabel = getFormattedLabel(String(opt.value), opt.label);
                return (
                  <DropdownMenuItem
                    key={opt.value}
                    active={isSelected}
                    onSelect={() => handleSelect(String(opt.value))}
                    className={cn(
                      "search-select-item flex items-center justify-between gap-3 text-[0.85rem] cursor-pointer transition-colors",
                      isSelected && "font-semibold text-primary is-active"
                    )}
                  >
                    <span className="truncate">{formattedItemLabel}</span>
                    {isSelected && (
                      <Check className="search-select-check h-4 w-4 shrink-0 text-primary font-bold" />
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const SelectDropdown = SearchSelectDropdown;
