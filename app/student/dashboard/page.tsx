'use client'

import LogoutButton from "@/components/dashboard/LogoutButton"

function page() {
    return (
        <div className="w-full flex flex-row items-center justify-between p-3">
            Student dashboard
            <LogoutButton />
        </div>
    )
}

export default page