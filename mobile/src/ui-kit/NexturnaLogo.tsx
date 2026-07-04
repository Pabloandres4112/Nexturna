import React from 'react';
import { Image, ImageStyle } from 'react-native';

// Real brand assets committed under mobile/assets/
const isotypeSrc = require('../../assets/Isotipo.Nexturna.png') as number;
const logoSrc = require('../../assets/Logo.Nexturna.png') as number;

interface NexturnaLogoProps {
  /** Height of the image in dp. Default 64. */
  size?: number;
  /**
   * When true, renders the full horizontal logo (icon + "Nexturna" wordmark).
   * The source image is 1536×1024, so the rendered width will be ~1.5× size.
   */
  showWordmark?: boolean;
  /**
   * @deprecated Has no effect when using PNG assets.
   * Kept for API compatibility so existing callers don't need to change.
   */
  mono?: boolean;
}

/**
 * Nexturna brand logo component.
 *
 * Displays the official PNG brand assets:
 *   - `showWordmark=false` (default) → Isotipo.Nexturna.png (isotype/icon only, 1:1)
 *   - `showWordmark=true`            → Logo.Nexturna.png   (icon + wordmark, 3:2)
 */
const NexturnaLogo: React.FC<NexturnaLogoProps> = ({
  size = 64,
  showWordmark = false,
  mono: _mono = false,
}) => {
  if (showWordmark) {
    // Logo.Nexturna.png is 1536×1024 → aspect ratio 3:2
    const logoStyle: ImageStyle = { width: Math.round(size * 1.5), height: size };
    return <Image source={logoSrc} style={logoStyle} resizeMode="contain" />;
  }

  const isotypStyle: ImageStyle = { width: size, height: size };
  return <Image source={isotypeSrc} style={isotypStyle} resizeMode="contain" />;
};

export default NexturnaLogo;
