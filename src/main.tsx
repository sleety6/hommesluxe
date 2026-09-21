import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './images.css'
import PasswordRecovery from './admin/PasswordRecovery' 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PasswordRecovery>
      <App />
    </PasswordRecovery>
  </React.StrictMode>
)
