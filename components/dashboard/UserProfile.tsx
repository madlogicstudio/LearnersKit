'use client'

import { User } from "lucide-react"

export const UserProfile = () => {
    return (
        <div className="flex flex-col items-center justify-center p-2 text-white/80 bg-[var(--primary)] dark:bg-foreground/20 rounded-full">
            <User size={18} className="cursor-pointer" />
        </div>
    )
}
