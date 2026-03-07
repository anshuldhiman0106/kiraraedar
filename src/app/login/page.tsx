'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { PhoneInput } from "@/components/phone-input"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { useAuthSession } from '@/hooks/use-auth-session'

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return err.message
  }

  return "Something went wrong"
}

export default function LoginPage() {
  const OTP_LENGTH = 6
  const OTP_RESEND_DELAY_SECONDS = 30
  const [mode, setMode] = useState<'phone' | 'email'>('phone')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phone, setPhone] = useState("")
  const [phoneOtp, setPhoneOtp] = useState("")
  const [phoneSessionId, setPhoneSessionId] = useState("")
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, loading: sessionLoading } = useAuthSession()
  const appOrigin = typeof window !== "undefined" ? window.location.origin : ""

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace('/profile')
    }
  }, [sessionLoading, user, router])

  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendCooldown])

  const handleAuth = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    setError('')

    try {
      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (!loginError && loginData?.user) {
        router.replace('/profile')
        return
      }

      if (loginError?.message?.toLowerCase().includes('email not confirmed')) {
        setError('Please verify your email from your inbox before logging in.')
        return
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: appOrigin ? `${appOrigin}/profile` : undefined,
          },
        })

      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          setError('Incorrect password. Try again.')
        } else {
          setError(signUpError.message)
        }
        return
      }

      if (signUpData?.session && signUpData?.user) {
        toast.success('Account created. Complete your profile to continue.')
        router.replace('/profile')
        return
      }

      if (signUpData?.user && !signUpData?.session) {
        toast.success('Verification email sent. Verify your email, then you will be redirected to profile.')
        setError('Verification email sent. Please check your inbox and click the link.')
        return
      }

      toast.success('Check your email for the verification link!')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: appOrigin ? `${appOrigin}/profile` : undefined,
        },
      })

      if (error) {
        setError(error.message)
        setGoogleLoading(false)
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setGoogleLoading(false)
    }
  }

  const handleSendPhoneOtp = async () => {
    if (!phone) {
      setError('Phone number is required')
      return
    }

    setPhoneLoading(true)
    setError('')

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Failed to send OTP')
        return
      }

      setPhoneSessionId(data?.sessionId || '')
      toast.success('OTP sent to your phone')
      setPhoneStep('otp')
      setResendCooldown(OTP_RESEND_DELAY_SECONDS)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp.length !== OTP_LENGTH) {
      setError('Enter 6-digit OTP')
      return
    }

    setPhoneLoading(true)
    setError('')

    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: phoneOtp, sessionId: phoneSessionId, mode: 'login' }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error || 'Invalid OTP')
        return
      }

      if (!data?.access_token || !data?.refresh_token) {
        setError('OTP verified, but login session could not be created')
        return
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      toast.success('Phone login successful')
      router.replace('/profile')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setPhoneLoading(false)
    }
  }

  if (sessionLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="mr-2" /> Checking session...
      </div>
    )
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/40">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="hidden lg:block">
            <div className="inline-flex items-center rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              Kiraedar Access
            </div>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-foreground">
              Login or sign up to continue
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Continue with phone OTP, or use email and Google. Fast onboarding for students and owners.
            </p>
          </div>

          <Card className="border-border/60 bg-card/95 shadow-2xl backdrop-blur">
            <CardHeader className="pb-4">
              <div className="mb-1 flex items-center gap-2">
                <img src="/logo.svg" alt="Kiraedar logo" className="h-8 w-8" />
                <span className="text-sm font-semibold tracking-wide text-muted-foreground">KIRAEDAR</span>
              </div>
              <CardTitle className="text-2xl">Welcome to Kiraedar</CardTitle>
              <CardDescription>Choose your login method.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-1">
                <button
                  type="button"
                  className={`h-10 flex-1 rounded-lg text-sm font-medium transition ${
                    mode === 'phone'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/60'
                  }`}
                  onClick={() => setMode('phone')}
                >
                  Phone OTP
                </button>
                <button
                  type="button"
                  className={`h-10 flex-1 rounded-lg text-sm font-medium transition ${
                    mode === 'email'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-background/60'
                  }`}
                  onClick={() => setMode('email')}
                >
                  Email
                </button>
              </div>

              {mode === 'phone' ? (
                <div className="space-y-4">
                  {phoneStep === 'phone' ? (
                    <>
                      <PhoneInput
                        defaultCountry="IN"
                        country="IN"
                        placeholder="Enter mobile number"
                        value={phone}
                        onChange={(value) => setPhone(value)}
                        disabled={phoneLoading}
                      />
                      <p className="text-sm text-muted-foreground">
                        By continuing you agree to Terms of Use and Privacy Policy.
                      </p>
                      <Button type="button" className="h-11 w-full rounded-xl" onClick={handleSendPhoneOtp} disabled={phoneLoading}>
                        {phoneLoading ? 'Sending OTP...' : 'Send OTP'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                        <p className="mb-3 text-sm text-muted-foreground">Code sent to {phone}</p>
                        <div className="flex justify-center">
                          <InputOTP maxLength={OTP_LENGTH} value={phoneOtp} onChange={setPhoneOtp}>
                            <InputOTPGroup>
                              {[0, 1, 2].map((i) => (
                                <InputOTPSlot key={i} index={i} />
                              ))}
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                              {[3, 4, 5].map((i) => (
                                <InputOTPSlot key={i} index={i} />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                      </div>
                      <Button type="button" className="h-11 w-full rounded-xl" onClick={handleVerifyPhoneOtp} disabled={phoneLoading}>
                        {phoneLoading ? 'Verifying...' : 'Verify OTP'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-full rounded-xl"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneLoading || resendCooldown > 0}
                      >
                        {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-10 w-full rounded-xl"
                        onClick={() => {
                          setPhoneStep('phone')
                          setPhoneOtp('')
                          setPhoneSessionId('')
                          setResendCooldown(0)
                        }}
                      >
                        Change phone number
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="h-11 rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" disabled={loading || !email || !password} className="h-11 w-full rounded-xl">
                    {loading && <Spinner className="mr-1 h-4 w-4" />} Sign In / Sign Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full rounded-xl"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    {googleLoading && <Spinner className="mr-1 h-4 w-4" />} Continue with Google
                  </Button>
                </form>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
              <p className="text-center text-sm text-muted-foreground">
                Having trouble logging in?{' '}
                <a href="mailto:kiraedarr@gmail.com" className="font-medium text-primary hover:underline">
                  Get Help
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
