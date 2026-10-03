import { createContext, useContext, useState } from 'react'
import AuthWelcomeScreen from '../components/auth/AuthWelcomeScreen'

const LogoutTransitionContext = createContext(null)

export function LogoutTransitionProvider({ children }) {
  const [transition, setTransition] = useState(null)

  return (
    <LogoutTransitionContext.Provider value={{ transition, setTransition }}>
      {children}
      {transition?.active && (
        <AuthWelcomeScreen
          variant="logout"
          overlay
          statusText={transition.statusText}
          isExiting={transition.isExiting}
          isComplete={transition.isComplete}
        />
      )}
    </LogoutTransitionContext.Provider>
  )
}

export const useLogoutTransition = () => {
  const context = useContext(LogoutTransitionContext)
  if (!context) {
    return { transition: null, setTransition: () => {} }
  }
  return context
}
