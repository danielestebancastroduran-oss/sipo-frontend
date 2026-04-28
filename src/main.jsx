// En main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app.jsx' // Aquí es donde vive la lógica principal

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App /> {/* El Router vivirá dentro de App.jsx */}
  </StrictMode>,
)