import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WheelPicker } from '../src'
import './index.css'

const App = () => {
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const yearOptions = useMemo(() => {
    const current = new Date().getFullYear()
    const start = current - 40
    return Array.from({ length: 60 }, (_, idx) => start + idx)
  }, [])
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, idx) => idx + 1), [])

  const [selectedYear, setSelectedYear] = useState(() => yearOptions[Math.floor(yearOptions.length / 2)])
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate())

  const daysInCurrentMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedMonth, selectedYear])
  const dayOptions = useMemo(() => Array.from({ length: daysInCurrentMonth }, (_, idx) => idx + 1), [daysInCurrentMonth])

  useEffect(() => {
    setSelectedDay((prev) => Math.min(prev, daysInCurrentMonth))
  }, [daysInCurrentMonth])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem',
        color: '#fff',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Date Selector</h1>
        <p style={{ color: '#a8b2d1', margin: 0 }}>Scroll or drag to pick a year, month, and day</p>
      </div>
      <div
        style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.75rem', color: '#9aa6c5' }}>Year</span>
          <WheelPicker
            options={yearOptions}
            value={selectedYear}
            loop
            visibleCount={5}
            showArrows={false}
            wheelSensitivity={0.7}
            fontSize={1.75}
            onChange={(option) => setSelectedYear(option)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.75rem', color: '#9aa6c5' }}>Month</span>
          <WheelPicker
            options={monthOptions}
            value={selectedMonth}
            visibleCount={5}
            loop
            showArrows={false}
            transitionDuration={800}
            wheelSensitivity={1}
            renderLabel={(option) => MONTH_LABELS[option - 1]}
            onChange={(option) => setSelectedMonth(option)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.25em', fontSize: '0.75rem', color: '#9aa6c5' }}>Day</span>
          <WheelPicker
            options={dayOptions}
            value={selectedDay}
            loop
            visibleCount={5}
            showArrows={false}
            onChange={(option) => setSelectedDay(option)}
          />
        </div>
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 300 }}>
        Selected date: {selectedYear}-{String(selectedMonth).padStart(2, '0')}-{String(selectedDay).padStart(2, '0')}
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Wheel picker root not found')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
