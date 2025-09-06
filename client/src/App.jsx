import React from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import HomePage from './pages/HomePage'

function App() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  )
}

export default App
