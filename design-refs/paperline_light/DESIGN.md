---
name: Paperline Light
colors:
  surface: '#faf9ff'
  surface-dim: '#d9d9e2'
  surface-bright: '#faf9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fc'
  surface-container: '#ededf6'
  surface-container-high: '#e7e7f0'
  surface-container-highest: '#e1e2ea'
  on-surface: '#191b22'
  on-surface-variant: '#424752'
  inverse-surface: '#2e3037'
  inverse-on-surface: '#f0f0f9'
  outline: '#737784'
  outline-variant: '#c3c6d4'
  surface-tint: '#1e5bba'
  primary: '#1a58b7'
  on-primary: '#ffffff'
  primary-container: '#3d72d2'
  on-primary-container: '#fefcff'
  inverse-primary: '#aec6ff'
  secondary: '#76592b'
  on-secondary: '#ffffff'
  secondary-container: '#fed79d'
  on-secondary-container: '#795c2d'
  tertiary: '#825100'
  on-tertiary: '#ffffff'
  tertiary-container: '#a46700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#aec6ff'
  on-primary-fixed: '#001a43'
  on-primary-fixed-variant: '#004397'
  secondary-fixed: '#ffddae'
  secondary-fixed-dim: '#e7c189'
  on-secondary-fixed: '#281800'
  on-secondary-fixed-variant: '#5c4216'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb960'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#faf9ff'
  on-background: '#191b22'
  surface-variant: '#e1e2ea'
typography:
  h1:
    fontFamily: Inter Tight
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter Tight
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter Tight
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
This design system embodies a "High-Resolution Minimalism" aesthetic, prioritizing clarity and intellectual rigor. The style is rooted in modern editorial design—clean, airy, and hyper-precise. It avoids decorative clutter in favor of meaningful whitespace and hairline-thin structural elements.

The target audience consists of professionals and power users who value deep work and information density without cognitive overwhelm. The emotional response is one of calm authority; the UI feels like high-quality stationery or a premium digital canvas. It draws inspiration from Swiss Modernism, utilizing a strict grid and clear typographic hierarchy to convey intelligence and reliability.

## Colors
The palette is architectural and restrained. The foundation is built on an off-white stone background to reduce eye strain, paired with pure white surfaces for active containers. 

- **Primary Electric Blue:** Used sparingly for primary actions, focus states, and meaningful progress indicators.
- **Secondary Gold:** Reserved for highlighting premium features, success states, or subtle sophisticated accents.
- **Ink & Zinc:** Text uses a high-contrast deep ink for readability, while secondary information is pushed back into a muted zinc tone.
- **Borders:** A consistent light grey defines the structure without creating visual noise.

## Typography
This design system employs a three-tier typographic strategy to organize complex information.

1.  **Headlines:** Inter Tight provides a condensed, sophisticated feel for titles, allowing for high-impact messaging without excessive width.
2.  **Body:** Standard Inter is used for all long-form text and interface labels to ensure maximum legibility and a neutral, functional tone.
3.  **Data:** JetBrains Mono is utilized for metadata, technical values, and timestamps, lending a sense of "engineered" precision to the UI.

Always maintain generous line heights for body text to preserve the system's "calm" atmosphere.

## Layout & Spacing
The design system utilizes a strict 4px baseline grid. Layouts should follow a fixed-width central container for editorial content and a fluid, column-based grid for dashboard views. 

- **Grids:** Use a 12-column grid with 20px gutters. 
- **Rhythm:** Vertical spacing between sections should be aggressive (48px+) to allow the "Paper" aesthetic to breathe. 
- **Padding:** Internal component padding should be generous (typically 12px or 16px) to maintain the premium feel.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Hairline Outlines** rather than traditional shadows.

- **Level 0 (Background):** #FAFAF9.
- **Level 1 (Surfaces):** #FFFFFF with a 1px border of #E4E4E7.
- **Level 2 (Interaction):** Active elements may use a very soft, high-diffusion shadow (0px 4px 20px rgba(0,0,0,0.03)) to indicate a "lifted" state, but this should be used sparingly.
- **Glass Effects:** For overlays or sticky headers, use a backdrop blur (12px) with a 70% white tint to maintain the "light" and airy feel.

## Shapes
The shape language is "Soft-Geometric." A consistent radius of 12px-14px is used across all primary components to soften the precision of the hairline borders.

- **Primary Radius:** 12px for standard components (buttons, inputs).
- **Large Radius:** 24px for cards and containers.
- **Hairline Borders:** All borders must be exactly 1px. Use high-contrast borders for interactive elements and low-contrast for structural divisions.
- **Iconography:** Icons must be Lucide-style, 24px bounding box, with a 1.5px stroke weight and slightly rounded caps to match the component radii.

## Components
- **Buttons:** 12px radius. Primary buttons use the Electric Blue background with white text. Secondary buttons use a white background with a #E4E4E7 border and Ink text. No heavy gradients; use solid fills.
- **Inputs:** 1px border in #E4E4E7, white background. On focus, the border shifts to Electric Blue with a 2px outer "glow" of 10% opacity blue.
- **Cards:** White background, 24px radius, 1px border. No shadow in resting state.
- **Chips/Tags:** Pill-shaped (fully rounded). Use Gold backgrounds at 10% opacity with Gold text for "featured" or "premium" items. Use Zinc backgrounds at 10% for general categories.
- **Lists:** Clean rows separated by hairline dividers. 16px vertical padding. Use JetBrains Mono for secondary list metadata.
- **Checkboxes/Radios:** 1.5px stroke. When checked, use Electric Blue fill with a white checkmark.
- **Status Indicators:** Small 8px solid circles. Blue for info, Gold for premium/warning, Ink for neutral.