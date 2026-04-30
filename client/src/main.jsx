import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Точка входа React-клиента для отправки задач и просмотра статусов.
createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
