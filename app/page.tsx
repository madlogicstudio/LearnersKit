'use client'

import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useRouter } from "next/navigation"

function page() {

  const router = useRouter();

  return (
    <div className='h-screen w-full flex flex-col items-center justify-center gap-3'>
      Imagine the landing page is here.
      <ThemeToggle />
      <div onClick={() => router.push("/signup")} className="cursor-pointer p-3 bg-[var(--primary)]/60 text-black hover:text-white
        transition duration-300 ease">
        <span>Go to Signup page.</span>
      </div>
    </div>
  )
}

export default page