import * as React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './WheelPicker.css'

// Utility to merge class names conditionally
const mergeClasses = (...classes: Array<string | null | undefined | false>) =>
  classes.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ')
// Clamp a number between min and max values
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
// Default equality checker using Object.is
const defaultEquals = <T,>(candidate: T, target: T) => Object.is(candidate, target)

// Simple arrow svg icon
const ArrowIcon = ({ direction }: { direction: 'up' | 'down' }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
    role='presentation'
    aria-hidden='true'
    className={direction === 'up' ? 'lucide lucide-chevron-up-icon lucide-chevron-up' : 'lucide lucide-chevron-down-icon lucide-chevron-down'}
  >
    {direction === 'up' ? <path d='m18 15-6-6-6 6' /> : <path d='m6 9 6 6 6-6' />}
  </svg>
)
const HIGHLIGHT_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)'
const DEFAULT_TRANSITION_DURATION = 640

const normalizeVisibleCount = (count?: number) => {
  if (typeof count !== 'number' || Number.isNaN(count)) return 5
  const whole = Math.max(1, Math.floor(count))
  return whole % 2 === 0 ? whole + 1 : whole
}

const toCssLength = (value: number | string | undefined, defaultUnit = 'rem') => {
  if (typeof value === 'number') {
    return `${value}${defaultUnit}`
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  return ''
}

type WheelPickerStyleVars = React.CSSProperties & Record<string, string>

export type WheelPickerProps<T> = {
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
  validOptionIndex?: (index: number, option: T) => boolean
  getOptionKey?: (option: T, index: number) => React.Key
  renderLabel?: (option: T, index: number) => React.ReactNode
  renderArrow?: (direction: 'up' | 'down') => React.ReactNode
  onChange?: (option: T, index: number) => void
}

export function WheelPicker<T>({
  options,
  value,
  defaultIndex,
  loop = false,
  className,
  visibleCount = 5,
  showArrows = true,
  showOutline = true,
  optionHeight = '3rem',
  fontSize = '2rem',
  wheelSensitivity = 1,
  draggable = true,
  transitionDuration = DEFAULT_TRANSITION_DURATION,
  enableVibration = false,
  isOptionEqual,
  validOptionIndex,
  getOptionKey,
  renderLabel,
  renderArrow,
  onChange,
}: WheelPickerProps<T>) {
  const equals = useMemo(() => isOptionEqual ?? defaultEquals<T>, [isOptionEqual])
  const isControlled = typeof value !== 'undefined' // Controlled if value prop is provided from parent

  const findIndexByValue = useCallback(
    (search: T | undefined) => {
      if (typeof search === 'undefined') return -1
      return options.findIndex((option) => equals(option, search))
    },
    [equals, options],
  )

  const isSelectableIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= options.length) return false
      return validOptionIndex ? Boolean(validOptionIndex(index, options[index])) : true
    },
    [options, validOptionIndex],
  )

  const findNextSelectableIndex = useCallback(
    (startIndex: number, direction: -1 | 1) => {
      const total = options.length
      if (!total) return -1
      let index = startIndex
      for (let attempt = 0; attempt < total; attempt += 1) {
        if (isSelectableIndex(index)) return index
        if (loop) {
          index = (index + direction + total) % total
        } else {
          index += direction
          if (index < 0 || index >= total) return -1
        }
      }
      return -1
    },
    [isSelectableIndex, loop, options.length],
  )

  const findClosestSelectableIndex = useCallback(
    (candidateIndex: number) => {
      const total = options.length
      if (!total) return -1
      if (isSelectableIndex(candidateIndex)) return candidateIndex
      for (let offset = 1; offset < total; offset += 1) {
        const forward = candidateIndex + offset
        const backward = candidateIndex - offset
        if (loop) {
          const forwardIndex = (forward + total) % total
          if (isSelectableIndex(forwardIndex)) return forwardIndex
          const backwardIndex = (backward + total) % total
          if (isSelectableIndex(backwardIndex)) return backwardIndex
        } else {
          if (forward < total && isSelectableIndex(forward)) return forward
          if (backward >= 0 && isSelectableIndex(backward)) return backward
        }
      }
      return -1
    },
    [isSelectableIndex, loop, options.length],
  )

  const resolveSelectableIndex = useCallback(
    (candidateIndex: number, direction: -1 | 1 | 0) => {
      if (!options.length || candidateIndex === -1) return -1
      const total = options.length
      const normalized = loop
        ? ((candidateIndex % total) + total) % total
        : clamp(candidateIndex, 0, total - 1)
      if (!validOptionIndex) return normalized
      if (direction === 1 || direction === -1) {
        return findNextSelectableIndex(normalized, direction)
      }
      return findClosestSelectableIndex(normalized)
    },
    [findClosestSelectableIndex, findNextSelectableIndex, loop, options.length, validOptionIndex],
  )

  const controlledIndex = useMemo(() => {
    const index = findIndexByValue(value)
    return resolveSelectableIndex(index, 0)
  }, [findIndexByValue, resolveSelectableIndex, value])

  const fallbackIndex = useMemo(() => {
    if (!options.length) return -1
    const requested = typeof defaultIndex === 'number' ? defaultIndex : 0
    return resolveSelectableIndex(requested, 0)
  }, [defaultIndex, options.length, resolveSelectableIndex])

  const [uncontrolledIndex, setUncontrolledIndex] = useState(fallbackIndex)

  useEffect(() => {
    if (!isControlled) {
      setUncontrolledIndex(fallbackIndex)
    }
  }, [fallbackIndex, isControlled])

  // When options change, ensure uncontrolled index is still valid
  useEffect(() => {
    if (!isControlled) {
      setUncontrolledIndex((prev) => {
        if (!options.length) return -1
        const candidate = prev === -1 ? 0 : prev
        return resolveSelectableIndex(candidate, 0)
      })
    }
  }, [isControlled, options.length, resolveSelectableIndex])

  const selectedIndex = useMemo(() => {
    if (isControlled) {
      return controlledIndex
    } else {
      return uncontrolledIndex
    }
  }, [controlledIndex, isControlled, options.length, uncontrolledIndex])

  const [isPointerDragging, setIsPointerDragging] = useState(false)
  useEffect(() => {
    if (!draggable) {
      setIsPointerDragging(false)
    }
  }, [draggable])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const columnRef = useRef<HTMLDivElement | null>(null)
  const wheelAccumRef = useRef(0)
  const dragStateRef = useRef({ pointerId: null as number | null, startY: 0, stepsFromStart: 0 })
  const selectionRef = useRef(selectedIndex)
  const measurementsRef = useRef({ spacing: 0, rowHeight: 0 })
  const lastWheelEventRef = useRef(0)
  const hasMountedRef = useRef(false)
  const highlightTransition = useMemo(() => {
    const duration = Math.max(transitionDuration, 0)
    return `transform ${duration}ms ${HIGHLIGHT_EASING}`
  }, [transitionDuration])
  const resolvedVisibleCount = useMemo(() => normalizeVisibleCount(visibleCount), [visibleCount])
  const optionHeightValue = useMemo(() => {
    const length = toCssLength(optionHeight, 'rem')
    return length || '3rem'
  }, [optionHeight])
  const fontSizeValue = useMemo(() => {
    const length = toCssLength(fontSize, 'rem')
    return length || '1.75rem'
  }, [fontSize])
  const viewportHeightValue = useMemo(() => {
    const gaps = Math.max(resolvedVisibleCount - 1, 0)
    return `calc(${resolvedVisibleCount} * var(--wheel-option-height) + ${gaps} * var(--wheel-option-spacing) - var(--wheel-option-height)/2)`
  }, [resolvedVisibleCount])
  const pickerStyle = useMemo<WheelPickerStyleVars>(
    () =>
      ({
        '--wheel-option-height': optionHeightValue,
        '--wheel-selection-window-height': optionHeightValue,
        '--wheel-font-size': fontSizeValue,
        '--wheel-viewport-height': viewportHeightValue,
      }) as WheelPickerStyleVars,
    [fontSizeValue, optionHeightValue, viewportHeightValue],
  )
  const resolvedWheelSensitivity = useMemo(() => (wheelSensitivity > 0 ? wheelSensitivity : 1), [wheelSensitivity])

  useEffect(() => {
    measurementsRef.current = { spacing: 0, rowHeight: 0 }
  }, [options.length])

  const ensureMeasurements = useCallback(() => {
    const column = columnRef.current
    if (!column) return null
    const cached = measurementsRef.current
    if (cached.spacing > 0 && cached.rowHeight > 0) {
      return cached
    }
    const firstChild = column.children[0] as HTMLElement | undefined
    if (!firstChild) return null
    const secondChild = column.children[1] as HTMLElement | undefined
    const spacing = secondChild ? Math.abs(secondChild.offsetTop - firstChild.offsetTop) : firstChild.offsetHeight
    const rowHeight = firstChild.offsetHeight || spacing
    if (spacing === 0 || rowHeight === 0) return null
    measurementsRef.current = { spacing, rowHeight }
    return measurementsRef.current
  }, [])

  const alignColumn = useCallback((targetIndex: number, animate: boolean) => {
    const column = columnRef.current
    if (!column) return
    const measurements = ensureMeasurements()
    if (!measurements) return

    const container = column.parentElement as HTMLElement | null
    if (!container) return
    const containerHeight = container.clientHeight
    const targetTransform = `translate3d(
      0,
      calc(${containerHeight / 2}px - ${targetIndex}*var(--wheel-option-height) - ${targetIndex}*var(--wheel-option-spacing) - var(--wheel-option-height)/2),
      0
    )`
    if (!animate) {
      column.style.transition = highlightTransition
      column.style.transform = targetTransform
      void column.offsetHeight
      column.style.transition = ''
      return
    }

    column.style.transition = ''
    void column.offsetHeight
    window.requestAnimationFrame(() => {
      column.style.transition = highlightTransition
      column.style.transform = targetTransform
    })
  }, [ensureMeasurements, highlightTransition])

  // Keep DOM position in sync when a parent-controlled value jumps without user interaction
  useEffect(() => {
    if (selectedIndex < 0) return
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      alignColumn(selectedIndex, false)
      selectionRef.current = selectedIndex
      return
    }
    if (selectionRef.current === selectedIndex) return
    selectionRef.current = selectedIndex
    alignColumn(selectedIndex, false)
  }, [alignColumn, selectedIndex])

  // internal selection changes call alignColumn directly with animation hints

  const changeSelection = useCallback(
      (value: number, 
      { relative = false, animate = true }: 
      { relative?: boolean; animate?: boolean } = {}) => 
    {
      if (!options.length || value === 0) return
      if (relative && validOptionIndex) {
        const steps = Math.abs(value)
        const direction = value > 0 ? 1 : -1
        let next = selectionRef.current
        for (let i = 0; i < steps; i += 1) {
          const baseIndex = next === -1 ? (direction === 1 ? 0 : options.length - 1) : next + direction
          const resolvedStep = findNextSelectableIndex(baseIndex, direction)
          if (resolvedStep === -1) break
          next = resolvedStep
        }
        if (next === -1 || next === selectionRef.current) return
        alignColumn(next, animate)
        selectionRef.current = next
        if (!isControlled) {
          setUncontrolledIndex(next)
        }
        // Vibration feedback for mobile devices
        if (enableVibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(10) // Short 10ms vibration
        }
        onChange?.(options[next], next)
        return
      }

      const candidateIndex = relative ? selectionRef.current + value : value
      const direction = relative ? Math.sign(value) : Math.sign(candidateIndex - selectionRef.current)
      const resolved = resolveSelectableIndex(
        candidateIndex,
        direction === 0 ? 0 : (direction as -1 | 1),
      )
      if (resolved === -1 || resolved === selectionRef.current) return
      alignColumn(resolved, animate)
      selectionRef.current = resolved
      if (!isControlled) {
        setUncontrolledIndex(resolved)
      }
      // Vibration feedback for mobile devices
      if (enableVibration && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10) // Short 10ms vibration
      }
      onChange?.(options[resolved], resolved)
    },
    [
      alignColumn,
      enableVibration,
      findNextSelectableIndex,
      isControlled,
      onChange,
      options,
      resolveSelectableIndex,
      validOptionIndex,
    ],
  )

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault()
      const column = columnRef.current
      if (!column) return
      const measurements = ensureMeasurements()
      if (!measurements) return
      const { spacing } = measurements

      wheelAccumRef.current += event.deltaY * resolvedWheelSensitivity
      const rawSteps =
        wheelAccumRef.current > 0
          ? Math.floor(wheelAccumRef.current / spacing)
          : Math.ceil(wheelAccumRef.current / spacing)

      let steps = rawSteps
      if (validOptionIndex && rawSteps !== 0) {
        steps = Math.sign(rawSteps)
        wheelAccumRef.current = 0
      }

      if (steps !== 0) {
        if (!validOptionIndex) {
          wheelAccumRef.current -= steps * spacing
        }
        const now = performance.now()
        const isFastWheel = now - lastWheelEventRef.current < 120 // if less than 120ms since last wheel event, consider it fast
        lastWheelEventRef.current = now
        const animate = !isFastWheel && Math.abs(steps) === 1 // only animate for single step slow wheels
        changeSelection(steps, { relative: true, animate })
      }
    },
    [changeSelection, ensureMeasurements, resolvedWheelSensitivity, validOptionIndex],
  )

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    node.addEventListener('wheel', handleWheel, { passive: false })
    return () => node.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (!draggable) return
    if (event.button !== 0) return
    const column = columnRef.current
    if (!column) return
    dragStateRef.current.pointerId = event.pointerId
    dragStateRef.current.startY = event.clientY
    dragStateRef.current.stepsFromStart = 0
    column.setPointerCapture(event.pointerId)
    setIsPointerDragging(true)
    event.preventDefault()
  }

  const prevDisabled =
    !loop && (selectedIndex === -1 || findNextSelectableIndex(selectedIndex - 1, -1) === -1)
  const nextDisabled =
    !loop && (selectedIndex === -1 || findNextSelectableIndex(selectedIndex + 1, 1) === -1)

  useEffect(() => {
    if (!draggable) return
    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragStateRef.current.pointerId) return
      const column = columnRef.current
      if (!column) return
      const measurements = ensureMeasurements()
      if (!measurements) return
      const { spacing } = measurements
      const deltaY = event.clientY - dragStateRef.current.startY
      const stepsFromStart = deltaY > 0 ? Math.floor(deltaY / spacing) : Math.ceil(deltaY / spacing)
      const pending = stepsFromStart - dragStateRef.current.stepsFromStart
      if (pending !== 0) {
        changeSelection(-pending, { relative: true, animate: false })
        dragStateRef.current.stepsFromStart = stepsFromStart
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      if (event.pointerId !== dragStateRef.current.pointerId) return
      const column = columnRef.current
      if (column?.hasPointerCapture(event.pointerId)) {
        column.releasePointerCapture(event.pointerId)
      }
      dragStateRef.current.pointerId = null
      dragStateRef.current.startY = 0
      dragStateRef.current.stepsFromStart = 0
      setIsPointerDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [changeSelection, draggable, ensureMeasurements])

  return (
    <div className={mergeClasses('wheel-picker', !showOutline && 'wheel-picker--no-outline', className)} style={pickerStyle}>
      <div ref={containerRef} className='wheel-picker__controls'>
        {showArrows && (
          <button
            type='button'
            onClick={() => changeSelection(-1, { relative: true })}
            disabled={prevDisabled}
            className='wheel-picker__button'
            aria-label='Previous option'
          >
            {renderArrow ? renderArrow('up') : <ArrowIcon direction='up' />}
          </button>
        )}
        <div
          className={mergeClasses(
            'wheel-picker__viewport',
            draggable && isPointerDragging && 'wheel-picker__viewport--dragging',
            !showOutline && 'wheel-picker__viewport--no-outline'
          )}
          onPointerDown={draggable ? handlePointerDown : undefined}
        >
          <div
            className={mergeClasses(
              'wheel-picker__selection-window',
              !showOutline && 'wheel-picker__selection-window--no-outline'
            )}
            aria-hidden='true'
          />
          <div className='wheel-picker__selection-shadow' aria-hidden='true' />
          <div ref={columnRef} className='wheel-picker__column'>
            {options.map((option, index) => {
              const key =
                getOptionKey?.(option, index) ??
                (typeof option === 'string' || typeof option === 'number' ? option : index)
              const label = renderLabel ? renderLabel(option, index) : String(option)
              const offset = selectedIndex >= 0 ? index - selectedIndex : 0
              const isSelected = offset === 0
              const absOffset = Math.abs(offset)
              let opacity = 0.35
              let translateY = 0
              let scale = 0.95
              if (isSelected) {
                opacity = 1
                scale = 1.16
              } else if (absOffset === 1) {
                opacity = 0.78
                translateY = offset < 0 ? -3 : 3
                scale = 1.05
              } else if (absOffset === 2) {
                opacity = 0.6
                translateY = offset < 0 ? -4 : 4
              }
              return (
                <div
                  key={key}
                  className='wheel-picker__option'
                  style={{
                    opacity,
                    transform: `translateY(${translateY}px) scale(${scale})`,
                  }}
                >
                  {label}
                </div>
              )
            })}
          </div>
        </div>
        {showArrows && (
          <button
            type='button'
            onClick={() => changeSelection(1, { relative: true })}
            disabled={nextDisabled}
            className='wheel-picker__button'
            aria-label='Next option'
          >
            {renderArrow ? renderArrow('down') : <ArrowIcon direction='down' />}
          </button>
        )}
      </div>
    </div>
  )
}
