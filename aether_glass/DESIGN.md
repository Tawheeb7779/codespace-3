---
name: Aether Glass
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#a078ff'
  on-tertiary-container: '#340080'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  stack-gap: 12px
---

## Brand & Style
This design system leverages a **Luxury Glassmorphic** aesthetic tailored for a high-performance spatial computing environment. The brand personality is technical, premium, and immersive, evoking the feeling of a professional workspace floating within a deep-space void. 

The visual language is defined by **Spatial Clarity**, where depth is communicated through material density rather than flat color. The interface should feel like high-end optics—precision-engineered glass surfaces that prioritize content legibility while maintaining a sophisticated sense of atmosphere.

**Key Stylistic Pillars:**
- **Refraction over Reflection:** Use backdrop blurs to suggest physical mass.
- **Edge Precision:** Every container must feel "cut" with a diamond edge, using ultra-thin 1px borders.
- **Atmospheric Depth:** Utilize deep navy and charcoal foundations to allow vibrant accents and glass materials to "glow" without causing visual fatigue.

## Colors
The palette is rooted in the "Deep Space" spectrum. The base environment uses a neutral navy-charcoal to provide maximum contrast for the spatial glass layers.

- **Primary & Secondary:** Vibrant Blue (#3b82f6) and Cyan (#06b6d4) are used exclusively for interactive states, progress indicators, and syntax highlighting.
- **Surface Strategy:** Colors are never "flat." They are applied as semi-transparent tints over a blurred background. 
- **Accents:** Use Tertiary Purple (#8b5cf6) sparingly for specialized AI or high-level logic states within the code environment.

## Typography
The system uses **Inter** for all UI and editorial content to ensure maximum legibility against complex blurred backgrounds. For the code-centric nature of the product, **JetBrains Mono** is introduced as a secondary functional font.

- **Contrast:** Headers should be high-contrast white (#FFFFFF) to cut through the glass textures.
- **Hierarchy:** Use font weight rather than scale to differentiate information in tight spatial layouts.
- **Legibility:** On Level 1 & 2 glass, use `text-rendering: optimizeLegibility` and subtle text-shadows (0px 1px 2px rgba(0,0,0,0.5)) if the background is particularly vibrant.

## Layout & Spacing
The layout follows a **Fluid Spatial Grid**. Elements are not bound by rigid columns but by "Z-axis hierarchy." 

- **Margins:** Maintain a minimum 24px safety margin from the edges of the viewport to prevent glass clipping.
- **Rhythm:** Use an 8px base grid for all internal component spacing.
- **Reflow:** On smaller viewports, glass materials should increase in opacity (Level 3) to maintain legibility as backdrop complexity increases.

## Elevation & Depth
Depth is the core mechanic of this design system. It is achieved through a combination of backdrop-filter blurs and tiered opacity.

- **Level 1 (Base):** `backdrop-filter: blur(10px)`; 30% opacity. Used for the persistent background environment.
- **Level 2 (Surface):** `backdrop-filter: blur(40px)`; 50% opacity. Used for the primary editor window and sidebars.
- **Level 3 (Focus):** `backdrop-filter: blur(60px)`; 70% opacity. Used for overlays and modals to "dim" the content beneath.
- **Level 4 (Control):** `backdrop-filter: blur(20px)`; 80% opacity with an inner 1px white glow at 15% opacity. Used for buttons.

**Shadows:** Use large, soft ambient occlusion shadows (`box-shadow: 0 20px 50px rgba(0,0,0,0.3)`) to lift surfaces off the base layer.

## Shapes
The system uses smooth, organic "squircle" inspired radii to mimic high-end hardware.

- **Standard Containers:** 16px (rounded-lg).
- **Primary Windows/Modals:** 24px (rounded-xl).
- **Small Controls/Inputs:** 8px (rounded-md).
- **Borders:** All borders must be 1px. Use a linear gradient for borders: `top-left: rgba(255,255,255,0.2)` to `bottom-right: rgba(255,255,255,0.05)`.

## Components
Consistent application of glass materials across components:

- **Buttons:** Use Level 4 Glass. Primary buttons should feature a subtle inner glow and a 1px border that brightens on hover. Use the Primary Blue for the text or a subtle background tint.
- **Inputs:** Use Level 1 Glass with a 1px border. On focus, the border should transition to the Primary Blue with a 4px outer "aura" (glow).
- **Cards:** Level 2 Glass. Headers within cards should be separated by a 1px horizontal line with 10% white opacity.
- **Chips/Badges:** Pill-shaped, using Level 3 Glass for high contrast. 
- **Code Editor:** The main editing surface should be Level 2 Glass. Selection highlights should use the Primary Blue at 20% opacity with no blur to ensure cursor precision.
- **Command Palette:** Level 3 Glass with a 24px radius. Ensure the backdrop blur is high (60px+) to isolate the tool from the code beneath.