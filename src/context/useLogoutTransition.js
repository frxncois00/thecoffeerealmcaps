import { createContext, useContext } from 'react'

export const LogoutTransitionContext = createContext(null)

export const useLogoutTransition = () => {
  const context = useContext(LogoutTransitionContext)
  if (!context) {
    return { transition: null, setTransition: () => {} }
  }
  return context
}
