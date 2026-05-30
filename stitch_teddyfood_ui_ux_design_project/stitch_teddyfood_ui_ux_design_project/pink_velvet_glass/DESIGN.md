---
name: Pink Velvet Glass
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#594048'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8d6f79'
  outline-variant: '#e1bdc8'
  surface-tint: '#b8006c'
  primary: '#b30069'
  on-primary: '#ffffff'
  primary-container: '#df0e84'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb0cc'
  secondary: '#665b62'
  on-secondary: '#ffffff'
  secondary-container: '#eadce4'
  on-secondary-container: '#6a6066'
  tertiary: '#046c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#068800'
  on-tertiary-container: '#f8ffef'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cc'
  on-primary-fixed: '#3e0021'
  on-primary-fixed-variant: '#8d0051'
  secondary-fixed: '#eddfe6'
  secondary-fixed-dim: '#d0c3ca'
  on-secondary-fixed: '#21191f'
  on-secondary-fixed-variant: '#4d444a'
  tertiary-fixed: '#85fd6d'
  tertiary-fixed-dim: '#69df54'
  on-tertiary-fixed: '#012200'
  on-tertiary-fixed-variant: '#035300'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is crafted for a premium, high-energy food delivery experience. It balances the playful friendliness of a 3D mascot with a sophisticated, modern aesthetic. The brand personality is optimistic, efficient, and indulgent.

The visual style employs **Glassmorphism** and **Modern Minimalist** principles. It utilizes high-transparency layers, significant backdrop blurs, and thin, luminous borders to create a sense of lightness and depth. High-quality 3D renders of food and the teddy mascot should be integrated as primary focal points, breaking the 2D plane to create a "tactile digital" environment. The emotional response is one of delight, trust, and premium service.

## Colors

The palette is anchored by **Hot Pink (#E91E8C)**, used strategically for action-oriented elements like primary buttons, active navigation states, and price highlights. To maintain a premium feel, this intense color is balanced by large expanses of **Clean White** and a specialized **Light Pink** scale used for "velvet" backgrounds and subtle container fills.

The "Glass" scale defines the transparency tokens used for cards and modals. Use the `primary-glow` token for soft drop shadows and outer glows on active elements to create a neon-adjacent vibrance without sacrificing the clean, professional aesthetic.

## Typography

This design system uses **Be Vietnam Pro** (as a high-quality alternative to Poppins with better screen rendering) to convey a modern, friendly tone. Headlines use heavy weights (700-800) with slight negative letter-spacing to create a "chunky," premium editorial look similar to high-end lifestyle magazines.

Body text is kept clean and airy with a generous line height to ensure readability during the fast-paced browsing typical of food delivery. Label styles are used for categories and metadata, often employing semi-bold weights for quick scanning.

## Layout & Spacing

The layout follows a **fluid 12-column grid** for desktop and a **single-column fluid layout** for mobile. A 24px gutter provides ample "breathing room," reinforcing the premium positioning of the app. 

Margins are generous; avoid crowding 3D assets or food photography. Components like restaurant cards should use `xl` (32px) padding to allow the glassmorphic background blurs to be fully appreciated. Vertical rhythm is strictly maintained in increments of 8px.

## Elevation & Depth

Hierarchy is established through a combination of **Glassmorphism** and **Soft Shadows**. 

1.  **Base Layer:** Solid White or Light Pink (#FFF0F8).
2.  **Mid Layer (Cards/Containers):** `bg-white/70` with `backdrop-blur-md` and a 1px solid white/20 border. This layer uses a soft, diffused shadow (`0 10px 30px rgba(0,0,0,0.04)`).
3.  **Top Layer (Modals/Popovers):** `bg-white/90` with `backdrop-blur-xl`.
4.  **Interactive States:** When hovering over cards, they should "lift" (TranslateY -8px) and gain a primary-colored outer glow (`rgba(233, 30, 140, 0.15)`).

Shadows should never be pure black; always tint them with a hint of the primary hot pink or deep navy to maintain color harmony.

## Shapes

The design system utilizes a **Pill-shaped (3)** radius philosophy to maximize the "friendly" and "soft" brand vibe. 

- **Buttons & Inputs:** Use full-rounded (pill) corners.
- **Cards:** Use `rounded-3xl` (24px - 32px) to match the soft aesthetic of the 3D mascot.
- **Icons:** Use a consistent 2px stroke width with rounded caps and joins.
- **Images:** All food photography and 3D renders must have rounded corners matching the container radius or be clipped into organic, circular shapes.

## Components

### Buttons
Primary buttons are pill-shaped, using a vibrant Hot Pink gradient (from `#E91E8C` to `#FF4D97`) with a subtle inner white stroke to simulate a 3D edge. On hover, the button should scale 1.05x and gain a soft pink drop shadow.

### Cards
Restaurant and menu items are presented on glassmorphic cards. The background is semi-transparent with a heavy backdrop blur. Images should slightly "overlap" the top edge of the card for a 3D pop-out effect.

### Input Fields
Inputs are pill-shaped with a soft pink background (`#FFF0F8`) and no border. On focus, they transition to a white background with a 1px Hot Pink border and a faint pink outer glow.

### Navigation
Active navigation items are marked by a small Hot Pink dot below the icon/text, accompanied by a subtle `Pink Glow` effect behind the item to indicate the current state.

### Mascot Integration
The 3D Teddy Bear mascot should appear in empty states (e.g., empty cart), loading screens, and as a "guide" in the checkout process. The mascot should always be rendered with soft, directional lighting to match the UI's depth.