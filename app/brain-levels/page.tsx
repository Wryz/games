'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/contexts/UserContext'

/** Legacy /brain-levels URL — redirects to the user's profile. */
export default function BrainLevelsRedirectPage() {
  const router = useRouter()
  const { username } = useUser()

  useEffect(() => {
    if (username) {
      router.replace(`/${encodeURIComponent(username)}`)
    } else {
      router.replace('/')
    }
  }, [username, router])

  return null
}
