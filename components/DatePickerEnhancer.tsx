"use client";

import { useEffect } from "react";

let lastTarget: HTMLInputElement | null = null;
let lastTriggerTime = 0;

function safeOpenPicker(input: HTMLInputElement) {
  if (input.disabled || input.readOnly) return;
  const now = Date.now();
  if (lastTarget === input && now - lastTriggerTime < 350) {
    return;
  }
  lastTarget = input;
  lastTriggerTime = now;

  // If input is using a delayed native-type switch for placeholder display
  const nativeType = input.getAttribute("data-native-type");
  if (nativeType && input.type !== nativeType) {
    input.type = nativeType;
  }

  try {
    if (typeof input.showPicker === "function") {
      input.showPicker();
    }
  } catch {
    // Ignore unsupported browsers or already-open picker dialogs
  }
}

export function DatePickerEnhancer() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // 1. Direct click on date / month / week / datetime / time input
      if (target instanceof HTMLInputElement) {
        if (
          target.type === "date" ||
          target.type === "month" ||
          target.type === "week" ||
          target.type === "datetime-local" ||
          target.type === "time" ||
          target.getAttribute("data-native-type")
        ) {
          safeOpenPicker(target);
          return;
        }
      }

      // 2. Click on a label or inside a label
      const label = target.closest("label");
      if (label) {
        let input: HTMLInputElement | null = null;
        if (label.htmlFor) {
          const el = document.getElementById(label.htmlFor);
          if (el instanceof HTMLInputElement) input = el;
        }
        if (!input) {
          input = label.querySelector<HTMLInputElement>(
            'input[type="date"], input[type="month"], input[type="week"], input[type="datetime-local"], input[type="time"], input[data-native-type]'
          );
        }
        if (input) {
          safeOpenPicker(input);
          return;
        }
      }

      // 3. Click inside standard input wrapper elements
      const container = target.closest(
        ".input-wrap, .editor-field, .tour-field, .planner-field, .account-field, .home-search-fields > label"
      );
      if (container) {
        const input = container.querySelector<HTMLInputElement>(
          'input[type="date"], input[type="month"], input[type="week"], input[type="datetime-local"], input[type="time"], input[data-native-type]'
        );
        if (input) {
          safeOpenPicker(input);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
