---
name: Technical Precision
colors:
  surface: '#111319'
  surface-dim: '#111319'
  surface-bright: '#373940'
  surface-container-lowest: '#0c0e14'
  surface-container-low: '#191b22'
  surface-container: '#1d1f26'
  surface-container-high: '#282a30'
  surface-container-highest: '#33353b'
  on-surface: '#e1e2ea'
  on-surface-variant: '#c3c6d4'
  inverse-surface: '#e1e2ea'
  inverse-on-surface: '#2e3037'
  outline: '#8d909e'
  outline-variant: '#424752'
  surface-tint: '#aec6ff'
  primary: '#aec6ff'
  on-primary: '#002e6b'
  primary-container: '#5d8ef1'
  on-primary-container: '#00275e'
  inverse-primary: '#1e5bba'
  secondary: '#e7c189'
  on-secondary: '#432c02'
  secondary-container: '#5e4418'
  on-secondary-container: '#d7b37c'
  tertiary: '#ffb960'
  on-tertiary: '#472a00'
  tertiary-container: '#ca8103'
  on-tertiary-container: '#3e2400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
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
  background: '#111319'
  on-background: '#e1e2ea'
  surface-variant: '#33353b'
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
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '450'
    lineHeight: '1.4'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-page: 48px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is anchored in **Technical Minimalism**, prioritizing information density and clarity for high-stakes document intelligence. It draws from the engineering-led aesthetics of Linear and Vercel, focusing on structural integrity rather than decorative elements. 

The mood is authoritative and concise. Every pixel serves a functional purpose, utilizing hairline borders and a monochromatic base to allow technical data and AI-driven insights to take center stage. The emotional response is one of trust, speed, and mathematical certainty. Avoid soft blurs, organic shapes, or vibrant gradients; instead, lean into sharp execution, strict alignment, and a sophisticated, "dark-engineering" atmosphere.

## Colors

The palette is optimized for long-duration focused work. The default **Dark Mode** uses a deep, ink-black foundation to minimize eye strain and maximize the pop of the electric blue primary accent. 

- **Primary (#5B8DEF):** Reserved for primary actions, progress indicators, and active states. 
- **Secondary Gold (#E8C28A):** Used sparingly for AI-intelligence features, premium tier indicators, or subtle highlights in data visualization.
- **Neutrals:** A strict ramp of cool grays ensures clear information hierarchy.
- **Light Mode:** A "paper" variant that flips the logic, using a warm-white background and high-contrast charcoal text to maintain the premium feel.

## Typography

Typography is the primary driver of the visual hierarchy. 
- **Inter Tight** is used for headlines to provide a condensed, sophisticated look that feels modern and architectural. 
- **Inter** handles all body copy, chosen for its exceptional legibility in complex interfaces. 
- **JetBrains Mono** is essential for "Data" levels, including document metadata, timestamps, and code snippets, reinforcing the technical nature of the platform.

Maintain tight tracking on headlines and generous line heights for body text to ensure readability of dense technical documentation.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid Grid**. Main application views utilize a fixed-width sidebar (240px-280px) with a fluid content area that adheres to a 12-column grid system. 

Spacing is governed by a strict 4px baseline grid. Use "Stack" spacing for vertical rhythm (8px between related elements, 16px between sections). Content should feel "airy" but structured; use internal padding within surfaces (24px) to create a sense of containment and focus. High information density is acceptable, but only when balanced by clear, consistent margins.

## Elevation & Depth

This design system avoids traditional drop shadows in favor of **Tonal Layering and Hairline Borders**. 

- **Level 0 (Background):** The deepest layer (#0B0B0F).
- **Level 1 (Surface):** The primary container for content (#14141A).
- **Level 2 (Elevated):** For modals or popovers, use a slightly lighter gray (#1C1C24) with a subtle 1px border (#23232C).
- **Borders:** Use 1px "hairline" borders for all containers. On dark mode, these should be low-contrast to feel like structural seams rather than harsh boxes.
- **Glass:** Occasional use of background-blur (20px) is permitted for fixed navigation headers to maintain context while scrolling.

## Shapes

The shape language is "Soft-Technical." We avoid the aggressive sharpness of pure brutalism but maintain more structure than consumer-grade apps. 

- **Standard Containers:** Use 12px or 14px corner radii. This creates a balanced, premium feel that softens the high-contrast technical data.
- **Small Elements:** Buttons, tags, and inputs should match the 12px standard.
- **Iconography:** Icons must use a 1.5px stroke weight (Lucide style) with slightly rounded terminals to match the component radii.

## Components

**Buttons**
- **Primary:** Electric blue background, white text, 12px radius. No gradient; use a subtle 10% white overlay on hover.
- **Secondary:** Ghost style. Hairline border (#23232C), no background. Primary blue text on hover.
- **Tertiary:** Pure text with JetBrains Mono for a "utility" feel.

**Inputs**
- Background should be 5% lighter than the parent surface. Hairline border that turns Primary Blue on focus. Labels sit 8px above the field in 12px Inter Bold.

**Chips / Tags**
- Small, 12px radius, using JetBrains Mono. Use subtle background tints (e.g., 10% opacity Blue) for status indicators.

**Data Tables**
- No vertical borders. Use 1px horizontal dividers. Header row in JetBrains Mono, 10px size, all-caps with 0.05em tracking.

**Cards**
- Surface-level background with a 1px border. No shadows. Use 24px internal padding. Ensure all icons within cards are consistently sized at 20px with a 1.5px stroke.

**AI Intelligence Specifics**
- Features powered by AI (Document Intelligence) should be denoted by a subtle Secondary Gold (#E8C28A) hairline left-border or a small gold spark icon.