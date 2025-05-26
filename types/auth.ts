export interface User {
  id: string
  username: string
  email?: string
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
  confirmPassword: string
}

export interface ResetPasswordData {
  email: string
  pin: string
  newPassword: string
  confirmPassword: string
}

export interface AdminSettings {
  customPinCodes: { [email: string]: string }
  fieldVisibility: {
    [key: string]: boolean
  }
}
