'use client'

import SiteShell from '@/components/SiteShell'
import BrainLevels from '@/components/BrainLevels'

interface UserProfileClientProps {
  username: string
}

export default function UserProfileClient({ username }: UserProfileClientProps) {
  return (
    <SiteShell>
      <div className="container-page py-10 sm:py-14">
        <BrainLevels username={username} />
      </div>
    </SiteShell>
  )
}
