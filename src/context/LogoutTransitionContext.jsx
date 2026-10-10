import { useState } from 'react'
import { LogoutTransitionContext } from './useLogoutTransition'
import AuthWelcomeScreen from '../components/auth/AuthWelcomeScreen'

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
