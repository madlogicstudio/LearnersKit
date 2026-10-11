
import { ShieldCheck, GraduationCap, User } from "lucide-react";

function Solution() {

    const solutions = [
        {
            icon: ShieldCheck,
            title: "Admin",
            description: "Manages section codes, students data, records and system settings.",
        },
        {
            icon: GraduationCap,
            title: "Educator",
            description: "View classes, manage student grades and track academic progress.",
        },
        {
            icon: User,
            title: "Student",
            description: "Access their profile, enroll in subjects, view grades and track their academic journey",
        },
    ];

    return (
        <section className="h-auto w-full flex flex-col items-center sm:my-12 my-6">
        
            <div className="max-w-[1280px] w-full flex flex-col sm:items-start items-center gap-3 p-3">

                <div className="font-sans flex flex-col gap-3 sm:text-left text-center">
                    <span className="text-4xl">Built for 3 roles. <span className="font-bold text-[color:var(--primary)] text-4xl">One connected System.</span></span>      
                    
                    <span className="sm:text-lg text-md text-foreground/60">
                    LearnersKit works for everyone in the school ecosystem, for administrators who manage the system, to educators who guides learning, and students who wants to achieve their goals.
                    </span>
                </div> 

                <div className="grid gap-3 md:grid-cols-3 mt-6">

                    {solutions.map((solution) => {
                        const Icon = solution.icon

                        return (
                            <div key={solution.title} className={`group rounded-lg bg-background border border-foreground/20 p-6 transition-all 
                                duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer relative mt-6 flex flex-col sm:items-start items-center`}>
                                
                                <div className="absolute left-1/2 top-0 h-6 sm:w-24 w-18 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-[var(--secondary)]/70" />

                                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)] text-[#24232E] transition-colors 
                                    duration-300 group-hover:bg-[var(--secondary)] group-hover:text-white fadeIn">
                                
                                    <Icon size={27} strokeWidth={1.8} className="fadeIn" />
                                </div>

                                <h3 className="mt-6 text-xl font-medium text-foreground/80 fadeIn">
                                    {solution.title}
                                </h3>

                                <p className="mt-3 text-sm leading-7 text-foreground/80 sm:text-base fadeIn sm:text-left text-center">
                                    {solution.description}
                                </p>

                            </div>
                        )
                    })}

                </div>

            </div> 

        </section>
    )
}

export default Solution