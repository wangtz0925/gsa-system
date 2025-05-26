"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthService } from "@/lib/auth"
import type { ResetPasswordData } from "@/types/auth"

interface ForgotPasswordFormProps {
  onResetSuccess: () => void
  onSwitchToLogin: () => void
}

export default function ForgotPasswordForm({ onResetSuccess, onSwitchToLogin }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<"email" | "reset">("email")
  const [email, setEmail] = useState("")
  const [resetData, setResetData] = useState<ResetPasswordData>({
    email: "",
    pin: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSendPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await AuthService.sendResetPin(email)
      if (result.success) {
        setMessage(`PIN碼已發送: ${result.pin}`) // 實際應用中不應顯示PIN
        setResetData({ ...resetData, email })
        setStep("reset")
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("發送失敗，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await AuthService.resetPassword(resetData)
      if (result.success) {
        onResetSuccess()
      } else {
        setError(result.message)
      }
    } catch (error) {
      setError("重置失敗，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>忘記密碼</CardTitle>
        <CardDescription>{step === "email" ? "請輸入您的郵箱地址" : "請輸入PIN碼和新密碼"}</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" ? (
          <form onSubmit={handleSendPin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">郵箱</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "發送中..." : "發送PIN碼"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" onClick={onSwitchToLogin}>
                返回登入
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN碼</Label>
              <Input
                id="pin"
                type="text"
                value={resetData.pin}
                onChange={(e) => setResetData({ ...resetData, pin: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密碼</Label>
              <Input
                id="newPassword"
                type="password"
                value={resetData.newPassword}
                onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">確認新密碼</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "重置中..." : "重置密碼"}
            </Button>
            <div className="text-center">
              <Button type="button" variant="link" onClick={() => setStep("email")}>
                重新發送PIN碼
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
