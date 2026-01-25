# React iOS Wheel Picker

A customizable, smooth wheel picker component for React with TypeScript support.

## Features

- Touch-friendly wheel interactions with drag and scroll
- Looping, arrows, and custom label rendering
- Adjustable row height, font size, and visible count
- Optional mobile vibration feedback
- Controlled and uncontrolled usage

## Installation

```bash
npm install @charon676/react-ios-wheel-picker
```

## Usage

```tsx
import { WheelPicker } from '@charon676/react-ios-wheel-picker'
import '@charon676/react-ios-wheel-picker/dist/wheel-picker.css'

const options = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
// ['A', 'B', 'C', ..., 'Z']

export const Example = () => (
  <WheelPicker
    options={options}
    defaultIndex={0}
    loop
    enableVibration
    onChange={(option, index) => {
      console.log(option, index)
    }}
  />
)
```

### Custom Arrow Example

```tsx
<WheelPicker
  options={options}
  showArrows
  renderArrow={(direction) => (
    <span style={{ fontSize: '1.5rem' }}>
      {direction === 'up' ? '▲' : '▼'}
    </span>
  )}
/>
```

Or with custom SVG icons:

```tsx
import { ChevronUp, ChevronDown } from 'lucide-react'

<WheelPicker
  options={options}
  showArrows
  renderArrow={(direction) => (
    direction === 'up' ? <ChevronUp size={20} /> : <ChevronDown size={20} />
  )}
/>
```

## Props

```ts
type WheelPickerProps<T> = {
  options: readonly T[]
  value?: T
  defaultIndex?: number
  loop?: boolean
  showArrows?: boolean
  showOutline?: boolean
  draggable?: boolean
  wheelSensitivity?: number
  visibleCount?: number
  optionHeight?: number | string
  fontSize?: number | string
  transitionDuration?: number
  className?: string
  enableVibration?: boolean
  isOptionEqual?: (candidate: T, value: T) => boolean
  getOptionKey?: (option: T, index: number) => React.Key
  renderLabel?: (option: T, index: number) => React.ReactNode
  renderArrow?: (direction: 'up' | 'down') => React.ReactNode
  onChange?: (option: T, index: number) => void
}
```

Notes:

- `value` makes the component controlled. Use `defaultIndex` for uncontrolled usage.
- `defaultIndex` sets the initial selection when uncontrolled.
- `loop` wraps from end to start and vice versa.
- `showArrows` toggles the up/down buttons.
- `showOutline` shows/hides the border around viewport and selection window (default: `true`).
- `draggable` enables pointer/touch dragging.
- `wheelSensitivity` scales wheel/trackpad input; higher is faster.
- `visibleCount` is coerced to an odd number for centering.
- `transitionDuration` is the selection animation in milliseconds.
- `isOptionEqual` custom equality check for controlled values.
- `getOptionKey` sets stable keys when options are objects or non-unique labels.
- `renderLabel` custom render for each option (defaults to `String(option)`).
- `renderArrow` custom render for arrow buttons (receives `'up'` or `'down'`).
- `onChange` fires on selection change with `(option, index)`.
- `enableVibration` uses `navigator.vibrate` and only works on supported mobile browsers.
- `optionHeight` and `fontSize` accept numbers (treated as `rem`) or CSS lengths (e.g., `fontSize={2}` → `2rem`, `fontSize="24px"` → `24px`).

## Styling

You can override styles by targeting the classes or by setting CSS variables on the root element.

```tsx
<WheelPicker className="my-wheel" />
```

```css
.my-wheel {
  --wheel-option-height: 3rem;
  --wheel-selection-window-height: var(--wheel-option-height);
  --wheel-option-spacing: 0.2rem;
  --wheel-font-size: 1.75rem;
  --wheel-viewport-height: calc(5 * var(--wheel-option-height) + 4 * var(--wheel-option-spacing));
  --foreground: #e5e7eb;
  --background: #0b0e14;
}
```

Available classes:

- `.wheel-picker`
- `.wheel-picker__controls`
- `.wheel-picker__button`
- `.wheel-picker__viewport`
- `.wheel-picker__selection-window`
- `.wheel-picker__selection-shadow`
- `.wheel-picker__column`
- `.wheel-picker__option`

## Demo

https://heygood.net/react-ios-wheel-picker/

## Build

```bash
npm run build
```

## License

MIT
