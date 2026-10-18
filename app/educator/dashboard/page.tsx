'use client'

import LogoutButton from "@/components/adminDashboard/LogoutButton"

function page() {
    return (
        <div className="w-full flex flex-row items-center justify-between p-3">
            Educator dashboard
            <LogoutButton />
        </div>
    )
}

export default page