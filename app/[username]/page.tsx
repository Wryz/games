import { notFound } from 'next/navigation'
import UserProfileClient from '@/components/UserProfileClient'
import { isReservedUsername, isValidUsernameLength } from '@/lib/username-validation'

interface UserProfilePageProps {
  params: { username: string }
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const profileUsername = decodeURIComponent(params.username)

  if (
    !profileUsername ||
    !isValidUsernameLength(profileUsername) ||
    isReservedUsername(profileUsername)
  ) {
    notFound()
  }

  return <UserProfileClient username={profileUsername} />
}
