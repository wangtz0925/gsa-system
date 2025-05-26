"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthService } from "@/lib/auth"
import type { AdminSettings } from "@/types/auth"

export default function AdminPanel() {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    customPinCodes: {},
    fieldVisibility: {},
  })
  const [newPinEmail, setNewPinEmail] = useState("")
  const [newPinCode, setNewPinCode] = useState("")
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const settings = AuthService.getAdminSettings()
    setAdminSettings(settings)
    const allUsers = AuthService.getAllUsersWithPasswords()
    setUsers(allUsers)
  }, [])

  const saveSettings = () => {
    AuthService.saveAdminSettings(adminSettings)
    alert("設定已保存")
  }

  const addCustomPin = () => {
    if (!newPinEmail || !newPinCode) {
      alert("請輸入郵箱和PIN碼")
      return
    }

    setAdminSettings({
      ...adminSettings,
      customPinCodes: {
        ...adminSettings.customPinCodes,
        [newPinEmail]: newPinCode,
      },
    })
    setNewPinEmail("")
    setNewPinCode("")
  }

  const removeCustomPin = (email: string) => {
    const newCustomPinCodes = { ...adminSettings.customPinCodes }
    delete newCustomPinCodes[email]
    setAdminSettings({
      ...adminSettings,
      customPinCodes: newCustomPinCodes,
    })
  }

  const toggleFieldVisibility = (fieldName: string, visible: boolean) => {
    setAdminSettings({
      ...adminSettings,
      fieldVisibility: {
        ...adminSettings.fieldVisibility,
        [fieldName]: visible,
      },
    })
  }

  const fieldOptions = [
    { key: "fileName", label: "檔案名稱" },
    { key: "sampleId", label: "樣品編號" },
    { key: "location", label: "取樣位置" },
    { key: "depth", label: "深度" },
    { key: "totalMass", label: "總重" },
    { key: "specificGravity", label: "比重" },
    { key: "liquidLimit", label: "液性限度" },
    { key: "plasticLimit", label: "塑性限度" },
    { key: "date", label: "試驗日期" },
    { key: "temperatureInput", label: "溫度輸入" },
    { key: "grainSizeCurve", label: "粒徑分布曲線" },
    { key: "soilClassification", label: "土壤分類" },
    { key: "fileMerge", label: "檔案合併" },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>管理員控制台</CardTitle>
          <CardDescription>系統設定與用戶管理</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fields" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fields">欄位控制</TabsTrigger>
              <TabsTrigger value="pins">PIN碼管理</TabsTrigger>
              <TabsTrigger value="users">用戶管理</TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>欄位顯示控制</CardTitle>
                  <CardDescription>控制系統中各個欄位的顯示與隱藏</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fieldOptions.map((field) => (
                    <div key={field.key} className="flex items-center justify-between">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Switch
                        id={field.key}
                        checked={adminSettings.fieldVisibility[field.key] !== false}
                        onCheckedChange={(checked) => toggleFieldVisibility(field.key, checked)}
                      />
                    </div>
                  ))}
                  <Button onClick={saveSettings} className="w-full">
                    保存設定
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pins" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>自定義PIN碼</CardTitle>
                  <CardDescription>為特定郵箱設定固定的PIN碼</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pinEmail">郵箱</Label>
                      <Input
                        id="pinEmail"
                        type="email"
                        value={newPinEmail}
                        onChange={(e) => setNewPinEmail(e.target.value)}
                        placeholder="user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pinCode">PIN碼</Label>
                      <Input
                        id="pinCode"
                        type="text"
                        value={newPinCode}
                        onChange={(e) => setNewPinCode(e.target.value)}
                        placeholder="123456"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button onClick={addCustomPin} className="w-full">
                        新增PIN碼
                      </Button>
                    </div>
                  </div>

                  {Object.keys(adminSettings.customPinCodes).length > 0 && (
                    <div className="space-y-2">
                      <Label>已設定的PIN碼</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>郵箱</TableHead>
                            <TableHead>PIN碼</TableHead>
                            <TableHead>操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(adminSettings.customPinCodes).map(([email, pin]) => (
                            <TableRow key={email}>
                              <TableCell>{email}</TableCell>
                              <TableCell>{pin}</TableCell>
                              <TableCell>
                                <Button onClick={() => removeCustomPin(email)} variant="destructive" size="sm">
                                  刪除
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <Button onClick={saveSettings} className="w-full">
                    保存PIN碼設定
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>用戶管理</CardTitle>
                  <CardDescription>查看所有註冊用戶的帳號與密碼</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用戶ID</TableHead>
                        <TableHead>用戶名</TableHead>
                        <TableHead>密碼</TableHead>
                        <TableHead>郵箱</TableHead>
                        <TableHead>註冊時間</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell className="font-mono">{user.password}</TableCell>
                          <TableCell>{user.email || "未設定"}</TableCell>
                          <TableCell>{new Date(user.createdAt).toLocaleString("zh-TW")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {users.length === 0 && <div className="text-center py-8 text-muted-foreground">暫無註冊用戶</div>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
