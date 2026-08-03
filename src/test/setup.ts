import '@testing-library/jest-dom'

// Mock window.URL.createObjectURL for maplibre-gl
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => 'blob:mock-url'
}
