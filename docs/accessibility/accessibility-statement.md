# WealthWise Accessibility Statement

WealthWise is committed to ensuring digital accessibility for individuals of all abilities. We strive to continually improve the user experience for everyone and apply relevant accessibility standards across our mobile application.

## Conformance Standards

WealthWise aims to align with the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards adapted for mobile applications, along with Apple Accessibility and Android Accessibility guidelines.

## Key Accessibility Features

### 1. Touch Target Sizing
- All primary interactive elements (buttons, filter chips, sort chips, tab bar items, action icons, and input selectors) provide an accessible touch target of at least **44 × 44 points** (or density-independent pixels), minimizing accidental taps and assisting users with fine-motor control difficulties.

### 2. Dynamic Typography and Font Scaling
- WealthWise supports system-wide font scaling, accommodating default (1.0×), medium (1.3×), and large (2.0×) accessibility text sizes.
- Flexible layouts, multi-line wrapping, and auto-sizing cards are utilized throughout all primary screens (Home, Budget, Transactions, Goals, Assets, Liabilities) to prevent text clipping, overlapping, or truncation at large font scales.

### 3. Contrast and Visual Hierarchy
- The application implements dedicated Light and Dark themes designed with high contrast ratios.
- Body text, values, and primary labels maintain at least a **4.5:1 contrast ratio** against card and screen backgrounds.
- Secondary captions, helper text, and subtle borders maintain at least a **3.0:1 contrast ratio** against adjacent surfaces.

### 4. Screen Reader Compatibility
- Interactive elements provide semantic React Native accessibility attributes:
  - `accessibilityRole`: Explicitly identifies buttons, headers, links, and switches.
  - `accessibilityLabel`: Provides concise, descriptive spoken labels for icons, monetary values, and dynamic state toggles.
  - `accessibilityHint`: Conveys the outcome of actions where context is not immediately obvious.
  - `accessibilityState`: Communicates dynamic properties such as `selected`, `disabled`, or `expanded`.
- Screen reader navigation is tested and structured for Android TalkBack and iOS VoiceOver.

### 5. Color Independence
- Information is never communicated solely through color. Status indicators (such as overdue dues, emergency fund allocation status, budget variances, and filter states) pair color signals with explicit textual badges, percentage numbers, or distinct visual icons.

## Known Limitations

- **Complex Visualization Graphs:** Financial distribution charts and allocation bars provide screen-reader-accessible summary labels and structured data representations, but individual graphical slices or SVG paths cannot be focused directly by screen readers.
- **Dense Financial Grids:** Multi-column cash flow tables provide sequential row focus; users relying on screen readers are presented with comprehensive row summaries rather than cell-by-cell matrix navigation.

## Feedback and Assistance

We welcome feedback on the accessibility of WealthWise. If you encounter accessibility barriers, experience difficulty using assistive technology with the app, or have suggestions for improvement, please let us know:

- Submit an issue via our [GitHub Issue Tracker](https://github.com/sahilsheikh-dev/WealthWise/issues) using the bug report or question form.
- Contact the repository maintainers through their GitHub profile.
