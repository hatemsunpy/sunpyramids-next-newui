"use client";

import { useEffect } from "react";

const TRUSTINDEX_TIMEOUT_MS = 10_000;
let initializationQueue = Promise.resolve();

function widgetId(script: string) {
  try {
    return new URL(script).search.slice(1).split("&", 1)[0];
  } catch {
    return "";
  }
}

function hasRenderedWidget(container: HTMLElement, script: string) {
  if (container.querySelector(".ti-widget")) return true;
  if (!script.includes("loader-cert.js")) return false;

  const id = widgetId(script);
  return id
    ? document.querySelector(`.ti-widget[data-pid="${id}"]`) !== null
    : document.querySelector(".ti-widget") !== null;
}

function neutralizeBodyScrollLock() {
  if (typeof window === "undefined") return;
  const win = window as any;
  if (win.Trustindex) {
    win.Trustindex.disableBodyScroll = () => {};
  } else {
    try {
      let tiVal: any;
      Object.defineProperty(win, "Trustindex", {
        configurable: true,
        enumerable: true,
        get() {
          return tiVal;
        },
        set(val) {
          tiVal = val;
          if (val && typeof val.disableBodyScroll === "function") {
            val.disableBodyScroll = () => {};
          }
        },
      });
    } catch {}
  }
}

function enhanceTrustIndexSlider(container: HTMLElement): (() => void) | undefined {
  if (!container.isConnected) return;
  const widget = container.querySelector<HTMLElement>(".ti-widget");
  if (!widget) return;

  const slider = (widget as any).TrustindexSliderWidget;
  const reviewsContainer = widget.querySelector<HTMLElement>(".ti-reviews-container");
  if (!slider || !reviewsContainer) return;

  if (widget.dataset.swipeEnhanced === "true") return;
  widget.dataset.swipeEnhanced = "true";

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let initialPos = 0;
  let isDragging = false;
  let isScrolling = false;
  let pointerId: number | null = null;
  let suppressClick = false;

  const getSlider = () => (widget as any).TrustindexSliderWidget || slider;

  // Intercept touchstart at capture phase to stop TrustIndex's buggy listener
  const onTouchStartCapture = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
    const sl = getSlider();
    initialPos = sl ? parseFloat(sl.position) || 0 : 0;
    isDragging = false;
    isScrolling = false;
    suppressClick = false;
    e.stopImmediatePropagation();
  };

  const onTouchMoveCapture = (e: TouchEvent) => {
    if (e.touches.length !== 1 || isScrolling) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    const sl = getSlider();
    if (!sl) return;

    if (!isDragging && !isScrolling) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 7) {
        isScrolling = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 7) {
        isDragging = true;
      }
    }

    if (isDragging) {
      e.stopImmediatePropagation();
      if (e.cancelable) e.preventDefault();
      suppressClick = true;

      let moveDx = dx;
      const maxState = typeof sl.getMaximumState === "function" ? sl.getMaximumState() : ((sl.reviewNum || 1) - 1);
      if (!sl.isLoop) {
        if (sl.state <= 0 && dx > 0) moveDx = dx * 0.3;
        if (sl.state >= maxState && dx < 0) moveDx = dx * 0.3;
      }
      const nextPos = initialPos + moveDx;
      if (typeof sl.animate === "function") {
        sl.animate(sl.position, nextPos + "px", 0);
      }
    }
  };

  const onTouchEndCapture = (e: TouchEvent) => {
    if (!isDragging) return;
    e.stopImmediatePropagation();
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = dx / dt;
    const sl = getSlider();
    if (!sl) return;

    const threshold = 35;
    const speedThreshold = 0.22;
    const maxState = typeof sl.getMaximumState === "function" ? sl.getMaximumState() : ((sl.reviewNum || 1) - 1);

    if (dx < -threshold || velocity < -speedThreshold) {
      if (sl.state < maxState || sl.isLoop) {
        sl.move("next", "manual", 300);
      } else {
        sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
      }
    } else if (dx > threshold || velocity > speedThreshold) {
      if (sl.state > 0 || sl.isLoop) {
        sl.move("prev", "manual", 300);
      } else {
        sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
      }
    } else {
      sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
    }

    isDragging = false;
    window.setTimeout(() => {
      suppressClick = false;
    }, 100);
  };

  const onTouchCancelCapture = () => {
    if (isDragging) {
      const sl = getSlider();
      if (sl) sl.animate(sl.position, initialPos + "px", 150);
      isDragging = false;
    }
  };

  // Pointer events for desktop mouse dragging
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    const sl = getSlider();
    if (!sl) return;

    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    initialPos = parseFloat(sl.position) || 0;
    isDragging = false;
    suppressClick = false;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    const sl = getSlider();
    if (!sl) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!isDragging && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
      isDragging = true;
      suppressClick = true;
      try {
        reviewsContainer.setPointerCapture(e.pointerId);
      } catch {}
    }

    if (isDragging) {
      let moveDx = dx;
      const maxState = typeof sl.getMaximumState === "function" ? sl.getMaximumState() : ((sl.reviewNum || 1) - 1);
      if (!sl.isLoop) {
        if (sl.state <= 0 && dx > 0) moveDx = dx * 0.3;
        if (sl.state >= maxState && dx < 0) moveDx = dx * 0.3;
      }
      const nextPos = initialPos + moveDx;
      if (typeof sl.animate === "function") {
        sl.animate(sl.position, nextPos + "px", 0);
      }
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (reviewsContainer.hasPointerCapture(e.pointerId)) {
      try {
        reviewsContainer.releasePointerCapture(e.pointerId);
      } catch {}
    }
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dt = Math.max(1, Date.now() - startTime);
    const velocity = dx / dt;
    const sl = getSlider();
    if (!sl) return;

    const threshold = 35;
    const speedThreshold = 0.22;
    const maxState = typeof sl.getMaximumState === "function" ? sl.getMaximumState() : ((sl.reviewNum || 1) - 1);

    if (dx < -threshold || velocity < -speedThreshold) {
      if (sl.state < maxState || sl.isLoop) {
        sl.move("next", "manual", 300);
      } else {
        sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
      }
    } else if (dx > threshold || velocity > speedThreshold) {
      if (sl.state > 0 || sl.isLoop) {
        sl.move("prev", "manual", 300);
      } else {
        sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
      }
    } else {
      sl.animate((initialPos + dx) + "px", initialPos + "px", 150);
    }

    isDragging = false;
    window.setTimeout(() => {
      suppressClick = false;
    }, 100);
  };

  const onClickCapture = (e: MouseEvent) => {
    if (suppressClick) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  reviewsContainer.addEventListener("touchstart", onTouchStartCapture, { capture: true, passive: true });
  reviewsContainer.addEventListener("touchmove", onTouchMoveCapture, { capture: true, passive: false });
  reviewsContainer.addEventListener("touchend", onTouchEndCapture, { capture: true, passive: false });
  reviewsContainer.addEventListener("touchcancel", onTouchCancelCapture, { capture: true, passive: true });

  reviewsContainer.addEventListener("pointerdown", onPointerDown);
  reviewsContainer.addEventListener("pointermove", onPointerMove);
  reviewsContainer.addEventListener("pointerup", onPointerUp);
  reviewsContainer.addEventListener("pointercancel", onPointerUp);
  reviewsContainer.addEventListener("click", onClickCapture, { capture: true });

  // Interactive bottom line indicator
  const line = widget.querySelector<HTMLElement>(".ti-controls-line");
  let lineCleanup: (() => void) | undefined;
  if (line && !line.dataset.lineEnhanced) {
    line.dataset.lineEnhanced = "true";
    const seekTo = (clientX: number) => {
      const sl = getSlider();
      if (!sl) return;
      const rect = line.getBoundingClientRect();
      if (!rect.width) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const totalSteps = sl.reviewNum ? Math.max(1, sl.reviewNum - (sl.visibleReviewNum || 1)) : 1;
      const targetState = Math.round(ratio * totalSteps);
      sl.move(targetState, "manual", 300);
    };

    const onLineClick = (e: MouseEvent) => seekTo(e.clientX);
    let lineDragging = false;
    const onLinePointerDown = (e: PointerEvent) => {
      lineDragging = true;
      try { line.setPointerCapture(e.pointerId); } catch {}
      seekTo(e.clientX);
    };
    const onLinePointerMove = (e: PointerEvent) => {
      if (!lineDragging) return;
      seekTo(e.clientX);
    };
    const onLinePointerUp = (e: PointerEvent) => {
      if (!lineDragging) return;
      lineDragging = false;
      try { line.releasePointerCapture(e.pointerId); } catch {}
    };

    line.addEventListener("click", onLineClick);
    line.addEventListener("pointerdown", onLinePointerDown);
    line.addEventListener("pointermove", onLinePointerMove);
    line.addEventListener("pointerup", onLinePointerUp);
    line.addEventListener("pointercancel", onLinePointerUp);

    lineCleanup = () => {
      line.removeEventListener("click", onLineClick);
      line.removeEventListener("pointerdown", onLinePointerDown);
      line.removeEventListener("pointermove", onLinePointerMove);
      line.removeEventListener("pointerup", onLinePointerUp);
      line.removeEventListener("pointercancel", onLinePointerUp);
      delete line.dataset.lineEnhanced;
    };
  }

  return () => {
    reviewsContainer.removeEventListener("touchstart", onTouchStartCapture, { capture: true });
    reviewsContainer.removeEventListener("touchmove", onTouchMoveCapture, { capture: true });
    reviewsContainer.removeEventListener("touchend", onTouchEndCapture, { capture: true });
    reviewsContainer.removeEventListener("touchcancel", onTouchCancelCapture, { capture: true });

    reviewsContainer.removeEventListener("pointerdown", onPointerDown);
    reviewsContainer.removeEventListener("pointermove", onPointerMove);
    reviewsContainer.removeEventListener("pointerup", onPointerUp);
    reviewsContainer.removeEventListener("pointercancel", onPointerUp);
    reviewsContainer.removeEventListener("click", onClickCapture, { capture: true });

    lineCleanup?.();
    delete widget.dataset.swipeEnhanced;
  };
}

function setupWidgetEnhancements(container: HTMLElement): (() => void) | undefined {
  neutralizeBodyScrollLock();

  let cleanup: (() => void) | undefined;
  let timer: number | undefined;
  let attempts = 0;
  const maxAttempts = 60;

  const tryEnhance = () => {
    if (!container.isConnected) return;
    const res = enhanceTrustIndexSlider(container);
    if (res) {
      cleanup = res;
    } else if (++attempts < maxAttempts) {
      timer = window.setTimeout(tryEnhance, 50);
    }
  };

  tryEnhance();

  return () => {
    if (timer !== undefined) window.clearTimeout(timer);
    cleanup?.();
  };
}

function initializeWidget(
  container: HTMLElement,
  containerId: string,
  script: string,
  isCancelled: () => boolean,
) {
  return new Promise<void>((resolve) => {
    if (isCancelled() || !container.isConnected || hasRenderedWidget(container, script)) {
      resolve();
      return;
    }

    const existingLoader = container.querySelector<HTMLScriptElement>(
      `script[data-trustindex-container="${containerId}"]`,
    );
    if (existingLoader) {
      resolve();
      return;
    }

    let settled = false;
    let releasedDeferredWidget = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      window.clearInterval(poll);
      observer.disconnect();
      resolve();
    };
    const check = () => {
      const placeholder = container.firstElementChild as
        | (HTMLElement & { contentHtml?: unknown })
        | null;
      if (
        !releasedDeferredWidget &&
        !script.includes("loader-cert.js") &&
        typeof placeholder?.contentHtml === "string"
      ) {
        releasedDeferredWidget = true;
        window.dispatchEvent(new Event("mousemove"));
      }
      if (
        isCancelled() ||
        !container.isConnected ||
        hasRenderedWidget(container, script)
      ) {
        finish();
      }
    };
    const observer = new MutationObserver(check);
    const timeout = window.setTimeout(finish, TRUSTINDEX_TIMEOUT_MS);
    const poll = window.setInterval(check, 50);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    const node = document.createElement("script");
    node.src = script;
    node.async = true;
    node.defer = true;
    node.dataset.type = "stripe";
    node.dataset.location = containerId;
    node.dataset.trustindexContainer = containerId;
    node.addEventListener("error", finish, { once: true });
    container.appendChild(node);
    check();
  });
}

export function TrustIndexLoader({ containerId, script }: { containerId: string; script: string }) {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("no-third-party") === "1") return;
    let cancelled = false;
    let timer: number | undefined;
    let visibilityObserver: IntersectionObserver | undefined;
    let enhancementCleanup: (() => void) | undefined;

    neutralizeBodyScrollLock();

    const enqueueInitialization = (container: HTMLElement) => {
      visibilityObserver?.disconnect();
      if (timer !== undefined) return;

      timer = window.setTimeout(() => {
        initializationQueue = initializationQueue
          .catch(() => undefined)
          .then(() => initializeWidget(container, containerId, script, () => cancelled))
          .then(() => {
            if (!cancelled && container.isConnected) {
              enhancementCleanup = setupWidgetEnhancements(container);
            }
          });
      }, 0);
    };

    const container = document.getElementById(containerId);
    if (!container) return;

    if (hasRenderedWidget(container, script)) {
      enhancementCleanup = setupWidgetEnhancements(container);
    }

    if (script.includes("loader-cert.js") || typeof IntersectionObserver === "undefined") {
      enqueueInitialization(container);
    } else {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) enqueueInitialization(container);
        },
        { rootMargin: "1200px 0px" },
      );
      visibilityObserver.observe(container);
    }

    return () => {
      cancelled = true;
      visibilityObserver?.disconnect();
      if (timer !== undefined) window.clearTimeout(timer);
      enhancementCleanup?.();
    };
  }, [containerId, script]);

  return null;
}
