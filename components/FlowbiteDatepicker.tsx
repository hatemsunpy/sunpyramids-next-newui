"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FlowbiteDatepickerProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  defaultValue?: string;
  onChange?: (dateString: string) => void;
  minDate?: string | Date; // YYYY-MM-DD or Date
  maxDate?: string | Date; // YYYY-MM-DD or Date
  required?: boolean;
  disabled?: boolean;
  className?: string;
  autoClose?: boolean;
  enableTime?: boolean;
  selectionMode?: "date" | "month";
}

type CalendarView = "days" | "months" | "years";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISODate(str?: string | null): Date | null {
  if (!str) return null;
  const dateOnly = str.includes("T") ? str.split("T")[0] : str.split(" ")[0];
  const parts = dateOnly.split("-");
  if (parts.length < 2 || parts.length > 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parts[2] ? parseInt(parts[2], 10) : 1;
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month, day);
}

function extractTimeParts(str?: string | null): { hour: number; minute: number } {
  if (!str) return { hour: 10, minute: 0 };
  const delimiter = str.includes("T") ? "T" : str.includes(" ") ? " " : null;
  if (!delimiter) return { hour: 10, minute: 0 };
  const timePart = str.split(delimiter)[1] || "";
  const [h, m] = timePart.split(":").map((v) => parseInt(v, 10));
  return {
    hour: isNaN(h) ? 10 : Math.min(23, Math.max(0, h)),
    minute: isNaN(m) ? 0 : Math.min(59, Math.max(0, m)),
  };
}

function toISODateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string, enableTime = false): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return dateStr;
  const formattedDate = parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  if (!enableTime) return formattedDate;

  const { hour, minute } = extractTimeParts(dateStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const displayMinute = String(minute).padStart(2, "0");
  return `${formattedDate}, ${displayHour}:${displayMinute} ${period}`;
}

function formatDisplayMonth(dateStr: string): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return dateStr;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function FlowbiteDatepicker({
  id,
  name,
  placeholder = "Select date",
  value: controlledValue,
  defaultValue = "",
  onChange,
  minDate,
  maxDate,
  required = false,
  disabled = false,
  className,
  autoClose = true,
  enableTime = false,
  selectionMode = "date",
}: FlowbiteDatepickerProps) {
  const isMonthPicker = selectionMode === "month";
  const initialView: CalendarView = isMonthPicker ? "months" : "days";
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const selectedDateStr = isControlled ? controlledValue || "" : internalValue;

  const [isOpen, setIsOpen] = React.useState(false);
  const [view, setView] = React.useState<CalendarView>(initialView);

  const [initialTime] = React.useState(() => extractTimeParts(selectedDateStr));
  const [selectedHour, setSelectedHour] = React.useState<number>(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = React.useState<number>(initialTime.minute);

  const initialDate = parseISODate(selectedDateStr) || new Date();
  const [viewYear, setViewYear] = React.useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(initialDate.getMonth());

  const containerRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Keep the open popover inside the viewport horizontally.
  // The popover is anchored with `left: 0` to its (sometimes narrow) wrapper,
  // so inputs near the right screen edge would overflow on mobile.
  React.useLayoutEffect(() => {
    if (!isOpen) return;

    const adjust = () => {
      const pop = popoverRef.current;
      if (!pop) return;
      pop.style.left = "0px";
      const rect = pop.getBoundingClientRect();
      const margin = 8;
      let offset = 0;
      if (rect.right > window.innerWidth - margin) {
        offset = window.innerWidth - margin - rect.right;
      }
      if (rect.left + offset < margin) {
        offset = margin - rect.left;
      }
      pop.style.left = `${offset}px`;
    };

    adjust();
    // Re-check after the entry animation settles (scale transform shifts the rect slightly)
    const timer = window.setTimeout(adjust, 200);
    window.addEventListener("resize", adjust);
    window.addEventListener("orientationchange", adjust);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", adjust);
      window.removeEventListener("orientationchange", adjust);
    };
  }, [isOpen]);

  // Parse minDate and maxDate
  const parsedMinDate = React.useMemo(() => {
    if (!minDate) return null;
    if (minDate instanceof Date) return minDate;
    return parseISODate(minDate);
  }, [minDate]);

  const parsedMaxDate = React.useMemo(() => {
    if (!maxDate) return null;
    if (maxDate instanceof Date) return maxDate;
    return parseISODate(maxDate);
  }, [maxDate]);

  // Close when clicking outside or pressing Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setView(initialView);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setView(initialView);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [initialView, isOpen]);

  const handleSelectDate = (date: Date) => {
    const isoDate = toISODateString(date);
    let finalValue = isoDate;
    if (enableTime) {
      const hStr = String(selectedHour).padStart(2, "0");
      const mStr = String(selectedMinute).padStart(2, "0");
      finalValue = `${isoDate}T${hStr}:${mStr}`;
    }
    if (!isControlled) {
      setInternalValue(finalValue);
    }
    onChange?.(finalValue);
    if (!enableTime && autoClose) {
      setIsOpen(false);
      setView(initialView);
    }
  };

  const handleSelectMonth = (year: number, month: number) => {
    const finalValue = `${year}-${String(month + 1).padStart(2, "0")}`;
    setViewYear(year);
    setViewMonth(month);
    if (!isControlled) {
      setInternalValue(finalValue);
    }
    onChange?.(finalValue);
    if (autoClose) {
      setIsOpen(false);
      setView("months");
    }
  };

  const handleTimeChange = (newHour: number, newMinute: number) => {
    setSelectedHour(newHour);
    setSelectedMinute(newMinute);
    const currentDate = parseISODate(selectedDateStr) || new Date();
    const isoDate = toISODateString(currentDate);
    const hStr = String(newHour).padStart(2, "0");
    const mStr = String(newMinute).padStart(2, "0");
    const finalValue = `${isoDate}T${hStr}:${mStr}`;
    if (!isControlled) {
      setInternalValue(finalValue);
    }
    onChange?.(finalValue);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    if (autoClose) {
      setIsOpen(false);
      setView(initialView);
    }
  };

  const handleToday = () => {
    const today = new Date();
    // check if today is within min/max
    if (parsedMinDate && toISODateString(today) < toISODateString(parsedMinDate)) {
      return;
    }
    if (parsedMaxDate && toISODateString(today) > toISODateString(parsedMaxDate)) {
      return;
    }
    if (isMonthPicker) {
      handleSelectMonth(today.getFullYear(), today.getMonth());
    } else {
      setViewYear(today.getFullYear());
      setViewMonth(today.getMonth());
      handleSelectDate(today);
    }
  };

  // Prev / Next navigation
  const handlePrev = () => {
    if (view === "days") {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (view === "months") {
      setViewYear((y) => y - 1);
    } else if (view === "years") {
      setViewYear((y) => y - 12);
    }
  };

  const handleNext = () => {
    if (view === "days") {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (view === "months") {
      setViewYear((y) => y + 1);
    } else if (view === "years") {
      setViewYear((y) => y + 12);
    }
  };

  // Header Title and View Switcher
  const handleTitleClick = () => {
    if (view === "days") setView("months");
    else if (view === "months") setView("years");
    else setView(initialView);
  };

  const getHeaderTitle = () => {
    if (view === "days") {
      return `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    }
    if (view === "months") {
      return `${viewYear}`;
    }
    const decadeStart = Math.floor(viewYear / 10) * 10;
    return `${decadeStart} - ${decadeStart + 11}`;
  };

  // Calendar Day Generation
  const calendarDays = React.useMemo(() => {
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      iso: string;
      disabled: boolean;
    }> = [];

    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    // Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i);
      const iso = toISODateString(d);
      const disabled =
        Boolean(parsedMinDate && iso < toISODateString(parsedMinDate)) ||
        Boolean(parsedMaxDate && iso > toISODateString(parsedMaxDate));
      days.push({ date: d, isCurrentMonth: false, iso, disabled });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      const d = new Date(viewYear, viewMonth, i);
      const iso = toISODateString(d);
      const disabled =
        Boolean(parsedMinDate && iso < toISODateString(parsedMinDate)) ||
        Boolean(parsedMaxDate && iso > toISODateString(parsedMaxDate));
      days.push({ date: d, isCurrentMonth: true, iso, disabled });
    }

    // Next month leading days (fill up to 42 cells)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(viewYear, viewMonth + 1, i);
      const iso = toISODateString(d);
      const disabled =
        Boolean(parsedMinDate && iso < toISODateString(parsedMinDate)) ||
        Boolean(parsedMaxDate && iso > toISODateString(parsedMaxDate));
      days.push({ date: d, isCurrentMonth: false, iso, disabled });
    }

    return days;
  }, [viewYear, viewMonth, parsedMinDate, parsedMaxDate]);

  const todayIso = React.useMemo(() => toISODateString(new Date()), []);

  // Decade years calculation for year view
  const decadeYears = React.useMemo(() => {
    const decadeStart = Math.floor(viewYear / 10) * 10;
    return Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);
  }, [viewYear]);

  const togglePicker = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const selectedDate = parseISODate(selectedDateStr);
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
    setView(initialView);
    setIsOpen(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn("flowbite-datepicker", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden input for HTML form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedDateStr}
          required={required}
        />
      )}

      {/* Trigger Input matching Flowbite React Default Datepicker */}
      <div
        className={cn(
          "flowbite-datepicker-input-wrapper",
          isOpen && "is-open",
          disabled && "is-disabled"
        )}
      >
        <span className="flowbite-datepicker-icon-wrap" aria-hidden="true">
          <svg
            className="flowbite-datepicker-icon"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Z" />
          </svg>
        </span>
        <input
          id={id}
          type="text"
          readOnly
          className="flowbite-datepicker-native-input"
          placeholder={placeholder}
          value={selectedDateStr ? (isMonthPicker ? formatDisplayMonth(selectedDateStr) : formatDisplayDate(selectedDateStr, enableTime)) : ""}
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={(e) => {
            e.stopPropagation();
            togglePicker();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) togglePicker();
            }
          }}
        />

        {selectedDateStr && !disabled && (
          <button
            type="button"
            className="flowbite-datepicker-clear-btn"
            onClick={handleClear}
            title="Clear date"
            aria-label="Clear date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Flowbite Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="flowbite-datepicker-popover"
            role="dialog"
            aria-label={isMonthPicker ? "Month and year picker" : "Calendar picker"}
          >
            {/* Header with Navigation & Title */}
            <div className="flowbite-datepicker-header">
              <button
                type="button"
                className="flowbite-datepicker-nav-btn"
                onClick={handlePrev}
                title="Previous"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                className="flowbite-datepicker-title-btn"
                onClick={handleTitleClick}
                title="Switch calendar view"
              >
                {getHeaderTitle()}
              </button>

              <button
                type="button"
                className="flowbite-datepicker-nav-btn"
                onClick={handleNext}
                title="Next"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View: Days */}
            {view === "days" && (
              <div className="flowbite-datepicker-days-view">
                {/* Weekday Names Header */}
                <div className="flowbite-datepicker-weekdays">
                  {WEEKDAY_NAMES.map((name) => (
                    <div key={name} className="flowbite-datepicker-weekday">
                      {name}
                    </div>
                  ))}
                </div>

                {/* 42 Calendar Days Grid */}
                <div className="flowbite-datepicker-grid">
                  {calendarDays.map((item, idx) => {
                    const isSelected = item.iso === (selectedDateStr.includes("T") ? selectedDateStr.split("T")[0] : selectedDateStr);
                    const isToday = item.iso === todayIso;

                    return (
                      <button
                        key={`${item.iso}-${idx}`}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => handleSelectDate(item.date)}
                        className={cn(
                          "flowbite-datepicker-cell",
                          !item.isCurrentMonth && "is-other-month",
                          isSelected && "is-selected",
                          isToday && !isSelected && "is-today",
                          item.disabled && "is-disabled"
                        )}
                      >
                        {item.date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Optional Time Picker Row */}
                {enableTime && (
                  <div className="flowbite-datepicker-time-section">
                    <div className="flowbite-datepicker-time-label">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Time</span>
                    </div>
                    <div className="flowbite-datepicker-time-controls">
                      <select
                        value={selectedHour % 12 === 0 ? 12 : selectedHour % 12}
                        onChange={(e) => {
                          const h12 = parseInt(e.target.value, 10);
                          const isPM = selectedHour >= 12;
                          const newH = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                          handleTimeChange(newH, selectedMinute);
                        }}
                        className="flowbite-datepicker-time-select"
                        aria-label="Hour"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <span className="flowbite-datepicker-time-sep">:</span>
                      <select
                        value={selectedMinute}
                        onChange={(e) => {
                          const m = parseInt(e.target.value, 10);
                          handleTimeChange(selectedHour, m);
                        }}
                        className="flowbite-datepicker-time-select"
                        aria-label="Minute"
                      >
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                          <option key={m} value={m}>
                            {String(m).padStart(2, "0")}
                          </option>
                        ))}
                      </select>
                      <div className="flowbite-datepicker-ampm-group">
                        <button
                          type="button"
                          className={cn(
                            "flowbite-datepicker-ampm-btn",
                            selectedHour < 12 && "is-active"
                          )}
                          onClick={() => {
                            if (selectedHour >= 12) {
                              handleTimeChange(selectedHour - 12, selectedMinute);
                            }
                          }}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "flowbite-datepicker-ampm-btn",
                            selectedHour >= 12 && "is-active"
                          )}
                          onClick={() => {
                            if (selectedHour < 12) {
                              handleTimeChange(selectedHour + 12, selectedMinute);
                            }
                          }}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View: Months */}
            {view === "months" && (
              <div className="flowbite-datepicker-months-grid">
                {MONTH_SHORT.map((mShort, idx) => {
                  const isSelectedMonth =
                    viewMonth === idx &&
                    selectedDateStr.startsWith(`${viewYear}-`);

                  return (
                    <button
                      key={mShort}
                      type="button"
                      onClick={() => {
                        if (isMonthPicker) {
                          handleSelectMonth(viewYear, idx);
                        } else {
                          setViewMonth(idx);
                          setView("days");
                        }
                      }}
                      className={cn(
                        "flowbite-datepicker-month-cell",
                        isSelectedMonth && "is-selected"
                      )}
                      aria-label={`${MONTH_NAMES[idx]} ${viewYear}`}
                    >
                      {mShort}
                    </button>
                  );
                })}
              </div>
            )}

            {/* View: Years */}
            {view === "years" && (
              <div className="flowbite-datepicker-years-grid">
                {decadeYears.map((yr, idx) => {
                  const isCurrentYear = yr === viewYear;
                  const isDecadeBound = idx === 0 || idx === 11;

                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setViewYear(yr);
                        setView("months");
                      }}
                      className={cn(
                        "flowbite-datepicker-year-cell",
                        isCurrentYear && "is-selected",
                        isDecadeBound && "is-other-decade"
                      )}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Footer with Today, Done, and Clear Buttons */}
            <div className="flowbite-datepicker-footer">
              <button
                type="button"
                className="flowbite-datepicker-btn-today"
                onClick={handleToday}
              >
                {isMonthPicker ? "This month" : "Today"}
              </button>
              {enableTime && (
                <button
                  type="button"
                  className="flowbite-datepicker-btn-done"
                  onClick={() => {
                    setIsOpen(false);
                    setView(initialView);
                  }}
                >
                  Done
                </button>
              )}
              <button
                type="button"
                className="flowbite-datepicker-btn-clear"
                onClick={() => handleClear()}
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
