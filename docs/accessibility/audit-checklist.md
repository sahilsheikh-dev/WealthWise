# WealthWise Accessibility Audit Checklist

This checklist provides a structured procedure for auditing and verifying accessibility across screens and components in WealthWise. It aligns with WCAG 2.1 Level AA and mobile operating system accessibility guidelines.

---

## 1. Touch Target and Hit Area Verification

| Check | Requirement | Verification Method | Status |
|---|---|---|---|
| **1.1 Minimum Target Size** | All interactive controls (buttons, chips, icon toggles, list items) measure at least 44 × 44 pt. | Inspect layout bounds in React Native DevTools or measure layout points. | Required |
| **1.2 Target Separation** | At least 8 pt spacing exists between adjacent touch targets to prevent erroneous activation. | Visual inspection and padding audit. | Required |
| **1.3 Expanded Hit Slop** | Icon-only buttons smaller than 44 pt visual size declare `hitSlop` to satisfy the 44 pt minimum. | Code review of icon button components (`hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}`). | Required |

---

## 2. Dynamic Typography and Scaling

| Check | Requirement | Verification Method | Status |
|---|---|---|---|
| **2.1 Baseline Scale (1.0×)** | Standard system font scale renders completely with balanced margins and padding. | Automated layout smoke tests and physical device check. | Required |
| **2.2 Intermediate Scale (1.3×)** | Large accessibility text renders without overlapping cards, header clipping, or truncated values. | Physical device verification with OS font size set to Large. | Required |
| **2.3 Maximum Scale (2.0×)** | Text wraps into multi-line layouts gracefully. Critical amounts and labels remain readable without horizontal scrolling or truncation. | Physical device verification with OS accessibility font scale at maximum. | Required |
| **2.4 Flexible Containers** | Containers avoid fixed height styles (`height: 48`) where text content scales dynamically. | Code search for static `height` on text containers; replace with `minHeight` or flexible padding. | Required |

---

## 3. Visual Contrast and Color Independence

| Check | Requirement | Verification Method | Status |
|---|---|---|---|
| **3.1 Body Text Contrast** | Primary text and numeric values achieve at least 4.5:1 contrast against surface backgrounds. | Color contrast analyzer across Light and Dark theme tokens. | Required |
| **3.2 Secondary Text Contrast** | Helper text, secondary captions, and metadata achieve at least 3.0:1 contrast. | Contrast check on `text2`, `text3`, and muted colors. | Required |
| **3.3 Interactive Focus / Borders** | Active chips, focused inputs, and borders provide distinct visual contrast against adjacent surfaces. | Contrast check on `primary`, `border`, and focused state styles. | Required |
| **3.4 Non-Color Signals** | Informational states (e.g. over-budget, pending dues, negative cash flow) combine color with icons, text badges, or prefixes (`-`, `+`). | UI audit of status badges, cards, and warning banners. | Required |

---

## 4. Screen Reader Semantics (TalkBack & VoiceOver)

| Check | Requirement | Verification Method | Status |
|---|---|---|---|
| **4.1 Semantic Roles** | Interactive elements declare `accessibilityRole` (`"button"`, `"header"`, `"link"`, `"switch"`). | Code review and TalkBack / VoiceOver element inspection. | Required |
| **4.2 Actionable Labels** | Icon-only buttons (add, back, close, edit, delete, sort, filter) have explicit `accessibilityLabel` strings. | Screen reader traversal test on physical device. | Required |
| **4.3 Monetary Value Formatting** | Formatted currencies are read naturally (e.g. "1,500 rupees" or formatted amount string) without confusing symbol reads. | VoiceOver and TalkBack readout verification on amounts. | Required |
| **4.4 Dynamic States** | Toggles, tabs, and filter chips declare `accessibilityState={{ selected: boolean, disabled: boolean }}`. | Verify state announcement when toggling chips. | Required |
| **4.5 Decorative Elements** | Decorative icons, divider lines, and background shapes hide from assistive technology (`accessible={false}`). | Confirm screen reader skips non-interactive decoration. | Required |

---

## 5. Forms and Error Handling

| Check | Requirement | Verification Method | Status |
|---|---|---|---|
| **5.1 Field Identification** | Each input field has an associated label or explicit `accessibilityLabel`. | Inspect form fields across transaction, budget, asset, liability, and goal screens. | Required |
| **5.2 Validation Error Association** | Input validation errors are announced and linked to the invalid field via `FormErrorBanner` and field error messages. | Trigger validation failures and verify screen reader announcement. | Required |
| **5.3 Keyboard Dismissal** | Forms can be closed, cancelled, or dismissed using hardware back button, close button, or touch outside. | Verify modal and form screen dismissal behavior. | Required |

---

## 6. Audit Execution Guidance

1. **Automated Verification:** Run Jest test suites covering layout and accessibility props (`npm test -- src/components/__tests__/`).
2. **Device Verification:** Perform physical-device audits with:
   - TalkBack enabled on Android (or VoiceOver on iOS).
   - System font scaling set to minimum, standard, and maximum sizes.
   - Both Light and Dark system themes.
