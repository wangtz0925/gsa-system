"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import type { LoginCredentials } from "@/types/auth"

interface LoginFormProps {
  onLoginSuccess: () => void
  onSwitchToRegister: () => void
  onSwitchToForgotPassword: () => void
}

export default function LoginForm({ onLoginSuccess, onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await AuthService.login(credentials)
      if (result.success) {
        onLoginSuccess()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("登入失敗，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>登入系統</CardTitle>
        <CardDescription>請輸入您的帳號密碼</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">用戶名</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "登入中..." : "登入"}
          </Button>
          <div className="text-center space-y-2">
            <Button type="button" variant="link" onClick={onSwitchToRegister}>
              還沒有帳號？立即註冊
            </Button>
            <Button type="button" variant="link" onClick={onSwitchToForgotPassword}>
              忘記密碼？
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
