
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import Image from "next/image"

function Cta() {
    return (
        <section className="h-auto w-full flex flex-col items-center sm:my-12 my-6 px-3">
        
            <div className="max-w-[1280px] w-full flex flex-col sm:items-start items-center gap-3 sm:p-12 p-6 bg-[var(--accent)] dark:bg-[var(--secondary)] rounded-lg overflow-hidden">

                <div className="relative w-full font-sans flex flex-col sm:items-start items-center gap-6 sm:text-left text-center sm:py-0 py-6">
                    <span className="text-3xl text-foreground z-1">Ready to simplify your students records?</span>      
                    <Image src="/images/Cta-image.svg" height={360} width={360} alt="" loading="eager" className="sm:hidden flex"/>
                    <span className="sm:text-lg text-md text-foreground/80 max-w-[800px] z-1">
                        Get started with LearnersKit today and experience a smarter way to manage student information and academic records.
                    </span>
                    <Link href="/signup" className="w-[240px] px-4 py-3 bg-[var(--primary)] dark:bg-[var(--accent)] hover:bg-[#24232E] hover:text-[#EFEFF4] text-background 
                        rounded-lg transition duration-300 ease cursor-pointer flex flex-row items-center justify-center gap-3">
                        <span className="text-sm">Get Started</span>
                        <ArrowRight size={16} />
                    </Link>

                    <Image src="/images/Cta-image.svg" height={360} width={360} alt="" loading="eager" className="sm:flex hidden z-0 absolute top-1/2 -translate-y-1/2 right-0"/>

                </div> 

            </div>

        </section>
    )
}

export default Cta