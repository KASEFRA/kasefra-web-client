'use client'

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import Link from 'next/link'
import {
  ArrowRightLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Mail,
  PieChart,
  ReceiptText,
  Settings,
  ShieldCheck,
  Target,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '@/components/providers/auth-provider'
import { authAPI } from '@/lib/api/auth'
import type { UserProfileResponse } from '@/types/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const resolveAvatarUrl = (avatarUrl?: string | null) => {
  if (!avatarUrl) return ''
  if (avatarUrl.startsWith('http')) return avatarUrl
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${baseUrl}${avatarUrl}`
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail
  }

  return fallback
}

export default function ProfilePage() {
  const { refreshUser } = useAuth()
  const [profile, setProfile] = useState<UserProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [formValues, setFormValues] = useState({ full_name: '', email: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      const profileData = await authAPI.getProfile()
      setProfile(profileData)
      setFormValues({
        full_name: profileData.user.full_name,
        email: profileData.user.email,
      })
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile information.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleAvatarSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setAvatarFile(null)
      setAvatarPreview(null)
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be 5MB or less.')
      return
    }
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    try {
      setAvatarUploading(true)
      await authAPI.uploadAvatar(avatarFile)
      await Promise.all([loadProfile(), refreshUser(true)])
      toast.success('Profile photo updated.')
      setAvatarFile(null)
      setAvatarPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: unknown) {
      console.error('Failed to upload avatar:', error)
      toast.error(getApiErrorMessage(error, 'Failed to upload photo.'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleProfileSave = async () => {
    if (!profile) return

    const nextFullName = formValues.full_name.trim()
    const nextEmail = formValues.email.trim()
    if (!nextFullName || !nextEmail) {
      toast.error('Full name and email are required.')
      return
    }

    const hasChanges =
      nextFullName !== profile.user.full_name || nextEmail !== profile.user.email
    if (!hasChanges) {
      toast.info('No profile changes to save.')
      return
    }

    try {
      setSaving(true)
      await authAPI.updateProfile({
        full_name: nextFullName,
        email: nextEmail,
      })
      await Promise.all([loadProfile(), refreshUser(true)])
      toast.success('Profile updated successfully.')
    } catch (error: unknown) {
      console.error('Failed to update profile:', error)
      toast.error(getApiErrorMessage(error, 'Failed to update profile.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile unavailable</CardTitle>
          <CardDescription>
            We could not load your profile right now. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadProfile}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const { user, stats } = profile
  const avatarSrc = avatarPreview || resolveAvatarUrl(user.avatar_url)
  const initials = user.full_name?.trim()?.charAt(0)?.toUpperCase() || 'U'

  const statCards = [
    {
      title: 'Connected Accounts',
      value: stats.connected_accounts,
      description: 'Active account connections',
      icon: Wallet,
    },
    {
      title: 'Active Budgets',
      value: stats.active_budgets,
      description: 'Running budget plans',
      icon: PieChart,
    },
    {
      title: 'Active Goals',
      value: stats.active_goals,
      description: 'Goals currently in progress',
      icon: Target,
    },
    {
      title: 'Recurring Bills',
      value: stats.recurring_bills,
      description: 'Bills set for auto tracking',
      icon: ReceiptText,
    },
    {
      title: 'Transactions This Month',
      value: stats.transactions_this_month,
      description: 'Posted in current month',
      icon: ArrowRightLeft,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Account identity and backend-generated activity snapshot.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Manage Settings
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="h-16 w-16">
              {avatarSrc ? <AvatarImage src={avatarSrc} alt={user.full_name} /> : null}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <p className="text-xl font-semibold">{user.full_name}</p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload photo
                </Button>
                {avatarFile ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAvatarUpload}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? 'Uploading...' : 'Save photo'}
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WEBP, or GIF. Max 5MB.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Badge variant={user.is_active ? 'default' : 'destructive'}>
                {user.is_active ? 'Active Account' : 'Inactive Account'}
              </Badge>
              {user.is_superuser ? <Badge variant="secondary">Admin</Badge> : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
          <CardDescription>Update your identity details for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formValues.full_name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, full_name: event.target.value }))
                }
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formValues.email}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="Enter your email"
              />
            </div>
          </div>
          <Button onClick={handleProfileSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Account Timeline
          </CardTitle>
          <CardDescription>Dates are delivered from the backend profile endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Member Since</p>
            <p className="mt-2 flex items-center gap-2 font-medium">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {formatDate(user.created_at)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Last Profile Update</p>
            <p className="mt-2 flex items-center gap-2 font-medium">
              <Clock3 className="h-4 w-4 text-muted-foreground" />
              {formatDate(user.updated_at)}
            </p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Latest Transaction Date</p>
            <p className="mt-2 flex items-center gap-2 font-medium">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              {formatDate(stats.latest_transaction_date)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
