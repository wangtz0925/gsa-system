import type { User, LoginCredentials, RegisterData, ResetPasswordData, AdminSettings } from "@/types/auth"

// 模擬用戶數據庫
const USERS_KEY = "gsa_users"
const CURRENT_USER_KEY = "gsa_current_user"
const RESET_PINS_KEY = "gsa_reset_pins"
const ADMIN_SETTINGS_KEY = "gsa_admin_settings"

export class AuthService {
  static getUsers(): User[] {
    if (typeof window === "undefined") return []
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : []
  }

  static saveUsers(users: User[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null
    const user = localStorage.getItem(CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }

  static setCurrentUser(user: User | null): void {
    if (typeof window === "undefined") return
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }

  static isAdmin(username: string): boolean {
    return username === "wangtz"
  }

  static getAdminSettings(): AdminSettings {
    if (typeof window === "undefined") return { customPinCodes: {}, fieldVisibility: {} }
    const settings = localStorage.getItem(ADMIN_SETTINGS_KEY)
    return settings ? JSON.parse(settings) : { customPinCodes: {}, fieldVisibility: {} }
  }

  static saveAdminSettings(settings: AdminSettings): void {
    if (typeof window === "undefined") return
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings))
  }

  static async register(data: RegisterData): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers()

    // 檢查用戶名是否已存在
    if (users.find((u) => u.username === data.username)) {
      return { success: false, message: "用戶名已存在" }
    }

    // 檢查密碼確認
    if (data.password !== data.confirmPassword) {
      return { success: false, message: "密碼確認不一致" }
    }

    // 創建新用戶
    const newUser: User = {
      id: Date.now().toString(),
      username: data.username,
      createdAt: new Date().toISOString(),
    }

    // 保存用戶（實際應用中密碼需要加密）
    const userWithPassword = { ...newUser, password: data.password }
    users.push(userWithPassword)
    this.saveUsers(users)

    return { success: true, message: "註冊成功", user: newUser }
  }

  static async login(credentials: LoginCredentials): Promise<{ success: boolean; message: string; user?: User }> {
    const users = this.getUsers()
    const user = users.find((u: any) => u.username === credentials.username && u.password === credentials.password)

    if (!user) {
      return { success: false, message: "用戶名或密碼錯誤" }
    }

    const { password, ...userWithoutPassword } = user
    this.setCurrentUser(userWithoutPassword)

    return { success: true, message: "登入成功", user: userWithoutPassword }
  }

  static logout(): void {
    this.setCurrentUser(null)
  }

  static async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      return { success: false, message: "請先登入" }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex((u: any) => u.id === currentUser.id)

    if (userIndex === -1) {
      return { success: false, message: "用戶不存在" }
    }

    const user = users[userIndex] as any
    if (user.password !== currentPassword) {
      return { success: false, message: "當前密碼錯誤" }
    }

    // 更新密碼
    users[userIndex] = { ...user, password: newPassword }
    this.saveUsers(users)

    return { success: true, message: "密碼修改成功" }
  }

  static async sendResetPin(email: string): Promise<{ success: boolean; message: string; pin?: string }> {
    const users = this.getUsers()
    const user = users.find((u: any) => u.email === email)

    if (!user) {
      return { success: false, message: "郵箱不存在" }
    }

    // 檢查管理員是否設定了自定義PIN碼
    const adminSettings = this.getAdminSettings()
    let pin: string

    if (adminSettings.customPinCodes[email]) {
      pin = adminSettings.customPinCodes[email]
    } else {
      // 生成6位數PIN碼
      pin = Math.floor(100000 + Math.random() * 900000).toString()
    }

    // 保存PIN碼（實際應用中應該發送郵件）
    const resetPins = JSON.parse(localStorage.getItem(RESET_PINS_KEY) || "{}")
    resetPins[email] = { pin, expires: Date.now() + 10 * 60 * 1000 } // 10分鐘過期
    localStorage.setItem(RESET_PINS_KEY, JSON.stringify(resetPins))

    return { success: true, message: "PIN碼已發送", pin } // 實際應用中不應返回PIN
  }

  static async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const resetPins = JSON.parse(localStorage.getItem(RESET_PINS_KEY) || "{}")
    const pinData = resetPins[data.email]

    if (!pinData || pinData.pin !== data.pin || Date.now() > pinData.expires) {
      return { success: false, message: "PIN碼無效或已過期" }
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: "密碼確認不一致" }
    }

    const users = this.getUsers()
    const userIndex = users.findIndex((u: any) => u.email === data.email)

    if (userIndex === -1) {
      return { success: false, message: "用戶不存在" }
    }

    // 更新密碼
    users[userIndex] = { ...users[userIndex], password: data.newPassword }
    this.saveUsers(users)

    // 清除PIN碼
    delete resetPins[data.email]
    localStorage.setItem(RESET_PINS_KEY, JSON.stringify(resetPins))

    return { success: true, message: "密碼重置成功" }
  }

  static getAllUsersWithPasswords(): any[] {
    return this.getUsers()
  }
}
