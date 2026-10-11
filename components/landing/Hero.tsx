
import Image from "next/image"

function Hero() {
    return (
        <section className="h-auto w-full flex flex-col items-center sm:my-6 my-12">

            <div className="max-w-[1280px] w-full flex sm:flex-row flex-col items-center gap-3">

                <div className="flex-1 flex flex-col justify-center sm:gap-6 gap-0">

                    <div className="font-sans flex flex-col gap-3 sm:text-left text-center px-3">
                        <span className="sm:text-5xl text-4xl font-medium">Every Student.</span>      
                        <span className="sm:text-5xl text-4xl font-semibold">Every Record.</span>    
                        <span className="sm:text-5xl text-4xl font-semibold text-[color:var(--primary)] ">One System.</span> 
                    </div> 

                    <div className="flex-1 sm:hidden flex">
                        <Image src="/images/Signup-image-student.svg" height={600} width={600} alt="" loading="eager" className="h-full w-full"/>
                    </div>
                
                    <div className="w-full flex flex-col gap-3 sm:text-left text-center px-3">
                        <span className="font-sans sm:text-lg text-md text-foreground/60">
                            A student information and records management system that streamlines student registration, enrollment, and academic recordkeeping.
                        </span>
                        <span className="font-sans sm:text-lg text-md text-foreground/60">
                            It provides a centralized platform for organizing student information, simplifying administrative tasks, and making records easier to manage and retrieve.
                        </span>
                    </div>

                </div>

                <div className="flex-1 sm:flex hidden">
                    <Image src="/images/Signup-image-student.svg" height={600} width={600} alt="" loading="eager" className=""/>
                </div>

            </div>
        
        </section>
    )
}

export default Hero