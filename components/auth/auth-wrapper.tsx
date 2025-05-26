"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AuthService } from "@/lib/auth"
import type { User } from "@/types/auth"
import LoginForm from "./login-form"
import RegisterForm from "./register-form"
import ForgotPasswordForm from "./forgot-password-form"
import ChangePasswordForm from "./change-password-form"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot" | "change">("login")

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setIsLoading(false)
  }, [])

  const handleLoginSuccess = () => {
    const currentUser = AuthService.getCurrentUser()
    setUser(currentUser)
    setAuthMode("login")
  }

  const handleRegisterSuccess = () => {
    setAuthMode("login")
    alert("註冊成功，請登入")
  }

  const handleResetSuccess = () => {
    setAuthMode("login")
    alert("密碼重置成功，請登入")
  }

  const handleChangePasswordSuccess = () => {
    setAuthMode("login")
    alert("密碼修改成功")
  }

  const handleLogout = () => {
    AuthService.logout()
    setUser(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto mt-20">
          {authMode === "login" && (
            <LoginForm
              onLoginSuccess={handleLoginSuccess}
              onSwitchToRegister={() => setAuthMode("register")}
              onSwitchToForgotPassword={() => setAuthMode("forgot")}
            />
          )}
          {authMode === "register" && (
            <RegisterForm onRegisterSuccess={handleRegisterSuccess} onSwitchToLogin={() => setAuthMode("login")} />
          )}
          {authMode === "forgot" && (
            <ForgotPasswordForm onResetSuccess={handleResetSuccess} onSwitchToLogin={() => setAuthMode("login")} />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info and logout */}
      <div className="border-b bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="text-lg font-semibold">岩土工程篩分析系統</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">歡迎，{user.username}</span>
            <Button
              onClick={() => setAuthMode("change")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              修改密碼
            </Button>
            <Button onClick={handleLogout} variant="outline" size="sm" className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </div>

      {/* Change password modal */}
      {authMode === "change" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <ChangePasswordForm onSuccess={handleChangePasswordSuccess} onCancel={() => setAuthMode("login")} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-4">{children}</div>
    </div>
  )
}
