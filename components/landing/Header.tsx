'use client'

import Image from "next/image"
import { ThemeToggle } from "../ui/ThemeToggle"
import Link from "next/link"
import { Menu, XIcon } from "lucide-react"
import { useState, useRef } from "react"

function Header() {

    const [navOpen, setNavOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <section className="w-full flex flex-row items-center justify-center sticky top-0 left-0 z-10">
            
            <div className="font-sans max-w-[1280px] w-full flex flex-row sm:items-end items-center justify-between p-3 bg-background border-b border-foreground/20">
                <div className="fadeIn flex flex-row items-end gap-3">
                    <Image src="/Web-icon.png" height={32} width={32} alt=""/>
                    <Link href="/" className="font-sans sm:text-lg text-md tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link>               
                </div> 

                <div className="fadeIn sm:flex hidden flex-row items-center gap-6">
                    <Link href="/" className="text-sm text-foreground/80 hover:text-[var(--primary)] transition 
                        header-hovered transform hover:-translate-y-1 hover:pb-1">Home</Link>
                    <Link href="/features" className="text-sm text-foreground/80 hover:text-[var(--primary)] transition
                        header-hovered transform hover:-translate-y-1 hover:pb-1">Features</Link>
                    <Link href="/about" className="text-sm text-foreground/80 hover:text-[var(--primary)] transition
                        header-hovered transform hover:-translate-y-1 hover:pb-1">About</Link>
                    <Link href="/docs" className="text-sm text-foreground/80 hover:text-[var(--primary)] transition
                        header-hovered transform hover:-translate-y-1 hover:pb-1">Docs</Link>
                </div>

                <div className="fadeIn sm:flex hidden flex-row items-center gap-3">
                    <ThemeToggle />
                    <Link href="/login" className="px-4 py-1 border border-[var(--primary)] text-foreground/80 hover:text-background hover:bg-foreground 
                        hover:border-foreground rounded-lg transition duration-300 ease cursor-pointer">
                        <span className="font-sans text-xs">Login</span>
                    </Link>
                    <Link href="/signup" className="px-4 py-1 bg-[var(--primary)] hover:bg-foreground text-background rounded-lg transition duration-300 ease cursor-pointer">
                        <span className="text-xs">Get Started</span>
                    </Link>
                </div> 

                {navOpen?
                    <XIcon size={24} className="fadeIn sm:hidden flex text-foreground/80" onClick={() => setNavOpen(false)}/>
                    :
                    <Menu size={24} className="fadeIn sm:hidden flex text-foreground/80" onClick={() => setNavOpen(true)}/>
                }
                
            </div>

            <div ref={menuRef} className={`w-full h-full lg:hidden flex flex-col items-start justify-start gap-3 
                bg-[var(--background)] fixed top-12 left-0 transition-transform duration-300
                ${navOpen ? "translate-x-0" : "-translate-x-full"}
                ${!navOpen ? "translate-x-full" : "-translate-x-0"}`}>
                
                <div className="w-full flex flex-col items-start py-4 px-3">
                    <div className="my-3">
                        <ThemeToggle />
                    </div>
                    
                    <Link href="/" className="font-sans text-sm cursor-pointer hovered border-b border-foreground/20 p-3 w-full text-foreground/60">Home</Link> 
                    <Link href="/features" className="font-sans text-sm cursor-pointer hovered border-b border-foreground/20 p-3 w-full text-foreground/60">Features</Link> 
                    <Link href="/about" className="font-sans text-sm cursor-pointer hovered border-b border-foreground/20 p-3 w-full text-foreground/60">About</Link>
                    <Link href="/docs" className="font-sans text-sm cursor-pointer hovered border-b border-foreground/20 p-3 w-full text-foreground/60">Docs</Link>  
                </div>

                <div className="w-full mt-auto flex flex-col items-center gap-3 justify-between py-4 px-3 mb-12">
                    <Link href="/login"
                        className="w-full text-center border border-[var(--primary)] font-semibold text-foreground/80 rounded-full px-3 py-2 text-sm cursor-pointer">Login</Link>
                    <Link href="/signup"
                        className="w-full text-center text-white bg-[var(--primary)] font-semibold rounded-full px-3 py-2 text-sm cursor-pointer">Get Started</Link>
                </div>

            </div>  
            

        </section>
    )
}

export default Header