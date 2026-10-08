import { notFound } from 'next/navigation'
import UserProfileClient from '@/components/UserProfileClient'
import { isReservedUsername, isValidUsernameLength } from '@/lib/username-validation'

interface UserProfilePageProps {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params
  const profileUsername = decodeURIComponent(username)

  if (
    !profileUsername ||
    !isValidUsernameLength(profileUsername) ||
    isReservedUsername(profileUsername)
  ) {
    notFound()
  }

  return <UserProfileClient username={profileUsername} />
}
