'use client'

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import { getCurrentUser } from "@/lib/supabase/user";

export const UserProfile = () => {
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadUser() {
            const user = await getCurrentUser();
            setProfileImage(user?.profileImage ?? null);
            setLoading(false);
        }

        loadUser();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-2 rounded-full">
                <User size={18} className="text-white/80" />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center text-white/80 bg-[var(--primary)] dark:bg-foreground/20 rounded-full cursor-pointer">
            {profileImage ? (
                <Image
                    src={profileImage}
                    height={36}
                    width={36}
                    alt="Profile"
                    className="rounded-full object-cover"
                />
            ) : (
                <User size={18} className="cursor-pointer" />
            )}
        </div>
    );
};
