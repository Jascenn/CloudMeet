/**
 * Color utility functions for brand color manipulation
 */

export interface RGB {
	r: number;
	g: number;
	b: number;
}

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): RGB {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
		: { r: 59, g: 130, b: 246 }; // Default blue
}

/**
 * Adjust brightness of a hex color and return RGB string
 */
export function adjustBrightness(hex: string, percent: number): string {
	const { r, g, b } = hexToRgb(hex);
	const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c + (255 * percent) / 100)));
	return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`;
}

/**
 * Adjust brightness of a hex color and return hex string
 */
export function adjustBrightnessHex(hex: string, percent: number): string {
	const { r, g, b } = hexToRgb(hex);
	const adjust = (c: number) => Math.min(255, Math.max(0, Math.round(c + (255 * percent) / 100)));
	const toHex = (c: number) => c.toString(16).padStart(2, '0');
	return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

/**
 * Generate a complete set of brand color variants
 */
export interface BrandColors {
	base: string;
	rgb: RGB;
	light: string;
	lighter: string;
	dark: string;
	darkHex: string;
}

export function createBrandColors(brandColor: string): BrandColors {
	return {
		base: brandColor,
		rgb: hexToRgb(brandColor),
		light: adjustBrightness(brandColor, 40),
		lighter: adjustBrightness(brandColor, 60),
		dark: adjustBrightness(brandColor, -15),
		darkHex: adjustBrightnessHex(brandColor, -20)
	};
}
