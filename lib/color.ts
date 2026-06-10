// Get contrasting text color (black or white) based on background color luminance
// Uses relative luminance calculation from WCAG
export function getContrastTextColor(hexColor: string): "text-black" | "text-white" {
  const hex = hexColor.replace("#", "");

  // Parse hex color to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using WCAG formula
  const getLuminance = (value: number) => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  const luminance = 0.2126 * getLuminance(r) + 0.7152 * getLuminance(g) + 0.0722 * getLuminance(b);

  // If luminance is high, use black text; otherwise use white
  return luminance > 0.5 ? "text-black" : "text-white";
}

// Alternative: simpler brightness-based approach
export function getContrastTextColorSimple(hexColor: string): "text-black" | "text-white" {
  const hex = hexColor.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Simple brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 128 ? "text-black" : "text-white";
}
