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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuthSession } from '@/hooks/use-auth-session'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)  
  const [error, setError] = useState('')
  const router = useRouter()
  const { user, loading: sessionLoading } = useAuthSession()

  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace("/profile")
    }
  }, [sessionLoading, user, router])

const handleAuth = async (event?: FormEvent<HTMLFormElement>) => {
  event?.preventDefault()
  if (!email || !password) {
    setError("Email and password are required")
    return
  }
  setLoading(true)
  setError("")

  try {
    // ✅ 1️⃣ Try LOGIN first
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    // ✅ Login success
    if (!loginError && loginData?.user) {
      router.replace("/profile")
      return
    }

    // ❌ Login failed → Try SIGNUP
    const { data: signUpData, error: signUpError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/profile`,
        },
      })

    // 🚨 If user already exists → password is wrong
    if (signUpError) {
      if (signUpError.message.includes("User already registered")) {
        setError("Incorrect password. Try again.")
      } else {
        setError(signUpError.message)
      }
      return
    }

    // ✅ Create profile ONLY for brand new users
    if (signUpData?.user) {
      await supabase.from("profiles").upsert({
        id: signUpData.user.id,
        email: signUpData.user.email,
        profile_photo:
          signUpData.user.user_metadata?.avatar_url || "",
        full_name:
          signUpData.user.user_metadata?.full_name || "",
        college: "Govt College Dharamshala",
      })
    }

    toast.success("Check your email for the login link!")
    
  } catch (err: any) {
    setError(err.message || "Something went wrong")
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
        redirectTo: `${window.location.origin}/profile`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  } catch (err: any) {
    setError(err.message || "Something went wrong")
    setGoogleLoading(false)
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
      <section className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* logo */}
          <div className='w-full flex justify-center'>
          <div className="mb-10 flex items-center gap-2 text-white">
            <img src="/logo.svg" alt="Kiraraedar Logo" className="h-12 aspect-square" />
            <span className="text-xl font-semibold tracking-wide">
              KIRAEDAR
            </span>
          </div>
  
          </div>
          
          <CardTitle className="text-lg">
            Welcome Back
          </CardTitle>
          <CardDescription className='text-sm'>
            Enter your email below to login or sign up to your account
          </CardDescription>
          
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
    
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="pr-10"
            />
    
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
              </div>
              {error && <div className="text-sm mt-4 text-red-600">{error}</div>}
          </CardContent>
          <CardFooter className="mt-5 flex-col gap-2">
            <Button type="submit" disabled={loading || !email || !password} className="w-full flex items-center">
              {loading && <Spinner className="mr-1 h-4 w-4" />} Sign In / Sign Up
            </Button>
            <Button variant="outline" className="w-full flex items-center" onClick={handleGoogleSignIn} disabled={googleLoading}>
               { googleLoading && <Spinner className="mr-1 h-4 w-4" />} Continue with Google
            </Button>
          </CardFooter>
        </form>
      </Card>
      </section>
      
      
    )

}
