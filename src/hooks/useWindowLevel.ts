'use client';

import { useMemo } from 'react';

/**
 * Build a 256-entry Look-Up Table (LUT) for CT windowing.
 * Maps input pixel value (0-255) → output pixel value (0-255).
 *
 * Formula: output = clamp((input - lower) / ww * 255, 0, 255)
 * where lower = wl - ww/2
 */
export function buildWindowLUT(ww: number, wl: number): Uint8Array {
  const lut = new Uint8Array(256);
  const lower = wl - ww / 2;
  for (let i = 0; i < 256; i++) {
    const v = ((i - lower) / ww) * 255;
    lut[i] = Math.max(0, Math.min(255, Math.round(v)));
  }
  return lut;
}

/**
 * Apply CT windowing to an ImageData in-place using a LUT.
 * Operates on all RGB channels (grayscale-safe).
 */
export function applyLUT(imageData: ImageData, lut: Uint8Array): void {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Use average of RGB as the "pixel value" for grayscale-like medical images
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const mapped = lut[Math.min(255, Math.max(0, Math.round(avg)))];
    data[i]     = mapped;
    data[i + 1] = mapped;
    data[i + 2] = mapped;
    // alpha (data[i+3]) unchanged
  }
}

/**
 * React hook: memoized LUT for given ww/wl values.
 */
export function useWindowLUT(ww: number, wl: number): Uint8Array {
  return useMemo(() => buildWindowLUT(ww, wl), [ww, wl]);
}
