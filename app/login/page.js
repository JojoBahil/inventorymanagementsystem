'use client'

import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm()
  const router = useRouter()

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="card card-elevated">
          {/* Professional Logo Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Image
                src="/logo.png"
                alt="Second Skin Industries Logo"
                width={32}
                height={32}
                className="dark:invert"
              />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">Welcome Back</h1>
            <p className="text-secondary">Sign in to your SSII account</p>
          </div>

          {/* Professional Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...register('email', { required: true })}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  {...register('password', { required: true })}
                  className="input pl-10"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Professional Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted">
              © 2024 Second Skin Industries Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}