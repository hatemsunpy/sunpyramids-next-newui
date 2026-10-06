export function blurredImageBackground(image: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><filter id="b" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="6"/></filter><image href="${image}" width="100" height="100" preserveAspectRatio="xMidYMid slice" filter="url(#b)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
