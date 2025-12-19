'use client'

import { useState } from 'react'
import { Settings, Save, Database, Mail, Bell, Shield, Globe, Zap, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'

export default function PlatformSettingsPage() {
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    platformName: 'Mobilizer',
    supportEmail: 'support@mobilizer.com',
    maxMovements: '100',
    maxSupportGroupsPerMovement: '50',
    maxMembersPerGroup: '1000',
    enableEmailNotifications: true,
    enablePushNotifications: true,
    requireEmailVerification: true,
    allowPublicRegistration: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = () => {
    // TODO: Implement actual save functionality
    console.log('Saving settings:', formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Platform Settings
        </h1>
        <Button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {saved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-green-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Settings saved successfully!
            </p>
          </CardContent>
        </Card>
      )}

      {/* General Settings */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-600" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platformName">Platform Name</Label>
            <Input
              id="platformName"
              name="platformName"
              value={formData.platformName}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">The name displayed across the platform</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              name="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">Email address for user support inquiries</p>
          </div>
        </CardContent>
      </Card>

      {/* System Limits */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            System Limits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="maxMovements">Maximum Movements</Label>
            <Input
              id="maxMovements"
              name="maxMovements"
              type="number"
              value={formData.maxMovements}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">Maximum number of movements allowed on the platform</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxSupportGroupsPerMovement">Max Support Groups per Movement</Label>
            <Input
              id="maxSupportGroupsPerMovement"
              name="maxSupportGroupsPerMovement"
              type="number"
              value={formData.maxSupportGroupsPerMovement}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">Maximum support groups allowed per movement</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxMembersPerGroup">Max Members per Group</Label>
            <Input
              id="maxMembersPerGroup"
              name="maxMembersPerGroup"
              type="number"
              value={formData.maxMembersPerGroup}
              onChange={handleChange}
            />
            <p className="text-sm text-gray-500">Maximum members allowed per support group</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enableEmailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-500">Enable platform-wide email notifications</p>
            </div>
            <input
              type="checkbox"
              id="enableEmailNotifications"
              name="enableEmailNotifications"
              checked={formData.enableEmailNotifications}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enablePushNotifications">Push Notifications</Label>
              <p className="text-sm text-gray-500">Enable platform-wide push notifications</p>
            </div>
            <input
              type="checkbox"
              id="enablePushNotifications"
              name="enablePushNotifications"
              checked={formData.enablePushNotifications}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-600" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
              <p className="text-sm text-gray-500">Users must verify email before accessing platform</p>
            </div>
            <input
              type="checkbox"
              id="requireEmailVerification"
              name="requireEmailVerification"
              checked={formData.requireEmailVerification}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="allowPublicRegistration">Allow Public Registration</Label>
              <p className="text-sm text-gray-500">Allow anyone to register on the platform</p>
            </div>
            <input
              type="checkbox"
              id="allowPublicRegistration"
              name="allowPublicRegistration"
              checked={formData.allowPublicRegistration}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
            <Zap className="h-12 w-12 mx-auto mb-3 text-indigo-400" />
            <p className="text-indigo-700 font-medium mb-2">Feature Flags Coming Soon</p>
            <p className="text-sm text-indigo-600">
              Enable or disable platform features dynamically without code deployment
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
            <Mail className="h-12 w-12 mx-auto mb-3 text-indigo-400" />
            <p className="text-indigo-700 font-medium mb-2">Email Configuration Coming Soon</p>
            <p className="text-sm text-indigo-600">
              Configure SMTP settings, email templates, and delivery preferences
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Database Management */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
            <Database className="h-12 w-12 mx-auto mb-3 text-indigo-400" />
            <p className="text-indigo-700 font-medium mb-2">Database Tools Coming Soon</p>
            <p className="text-sm text-indigo-600">
              Backup, restore, and maintenance tools for platform database
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium mb-1">Platform Settings</p>
              <p className="text-sm text-yellow-700">
                These settings affect the entire platform. Changes here will impact all movements, support groups, and users.
                Exercise caution when modifying system limits and security settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
