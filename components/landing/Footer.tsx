'use client'

import { Heart, ChevronUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

function Footer() {
    return (
        <section className="h-auto w-full flex flex-col items-center justify-center my-12"> 
            
            <footer className="h-auto max-w-[1280px] w-full py-6 border-t border-foreground/20 flex sm:flex-row flex-col">

                <div className="flex-2 h-full p-3">

                    <div className="flex flex-row items-end sm:justify-start justify-center gap-3">   
                        <Image src="/Web-icon.png" height={32} width={32} alt="Huenicorn-icon" className="cursor-pointer fadeIn" />
                        <Link href="/" className="font-sans text-lg tracking-[0.1em] font-semibold text-foreground/80">LearnersKit</Link> 
                    </div>

                    <p className="font-sans text-md text-foreground/80 mt-6 sm:w-110 w-full sm:text-left text-center">
                        A student information and records management system that streamlines student registration, enrollment, and academic recordkeeping.
                    </p>

                    <div className="w-full flex flex-col sm:items-start items-center justify-center gap-3 sm:my-6 my-12">
                        <span className="w-full font-sans text-md text-foreground/80 sm:text-left text-center">Get the latest news and updates from LearnersKit.</span>
                        <input type="email" placeholder="Your email" className="font-sans w-[320px] bg-background outline-none border 
                            border-foreground/20 rounded-lg px-4 py-2 text-sm placeholder:text-sm placeholder:font-sans text-foreground/80" />
                        <span className="w-[320px] rounded-lg px-3 py-2 sm:text-md text-sm font-sans font-medium text-center cursor-pointer
                            bg-[var(--primary)] dark:bg-[var(--accent)] hover:bg-[var(--secondary)] text-background hover:text-[#EFEFF4] transition">Subscribe</span>
                    </div>

                </div>
                <div className="font-sans flex-1 w-full p-3 flex flex-col sm:items-start items-center gap-4">

                    <span className="text-md font-semibold tracking-[0.1em] text-[var(--primary)] mb-2">Platform</span>

                    <span className="text-md text-foreground/60 cursor-pointer hovered">About</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">How It Works</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Contact</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Launch Week</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Community Guidelines</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Privacy Policy</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Terms of Use</span>

                </div>
                <div className="font-sans flex-1 w-full p-3 flex flex-col sm:items-start items-center gap-4 sm:mt-0 mt-3">
                    
                    <span className="text-md font-semibold tracking-[0.1em] text-[var(--primary)] mb-2">Developers</span>

                    <span className="text-md text-foreground/60 cursor-pointer hovered">Documentation</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">Changelog</span>
                    <span className="text-md text-foreground/60 cursor-pointer hovered">RRS</span>
                    <Link href="https://github.com/madlogicstudio/LearnersKit" className="text-md text-foreground/60 cursor-pointer hovered">Github</Link>
                    <Link href="https://vercel.com/madlogicstudios-projects/learnerskit" className="text-md text-foreground/60 cursor-pointer hovered">Vercel</Link>

                </div>

            </footer>

            <div className="max-w-[1280px] w-full p-3 border-t border-foreground/20">
                <div className="mx-auto flex sm:flex-row flex-col gap-4 items-center sm:justify-between">
                    
                    <div className="flex flex-col sm:items-start items-center gap-2 my-6">
                        <p className="text-md text-foreground/60">
                            © {new Date().getFullYear()} LearnersKit. All rights reserved.
                        </p>
                        <div className="flex items-center gap-1.5 text-md text-foreground/60">
                            Made with
                            <Heart size={20} className="fill-[var(--primary)] text-[var(--primary)]" />
                            by
                            <span className="font-medium text-foreground/60">madlogicstudio</span>
                        </div>
                        
                    </div>
                    
                    <div className="h-6 w-6 flex flex-col items-center justify-center bg-[var(--primary)] p-1 rounded-full cursor-pointer text-[#24232E] hover:text-[#EFEFF4] transition fadeIn"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                        <ChevronUp className="h-6 w-6" />
                    </div>
                </div>
            </div>

        </section>
    )
}

export default Footer