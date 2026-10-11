
import { Cloud, ChartColumn, Folder, File, Users, Bell } from "lucide-react";

function Features() {

    const features = [
        {
            icon: File,
            title: "Academic Records",
            description: "Keep grades, attendance and academic history organized.",
        },
        {
            icon: Folder,
            title: "Data Management",
            description: "Store and retrieve student data securely",
        }, 
        {
            icon: ChartColumn,
            title: "Reports & Analytics",
            description: "Generate reports and insights for better decision making.",
        }, 
        {
            icon: Users,
            title: "User Management",
            description: "Manage roles and permissions for a safer system.",
        },
        {
            icon: Bell,
            title: "Notifications",
            description: "Keep everyone informed with important updates.",
        },
        {
            icon: Cloud,
            title: "Cloud Access",
            description: "Access the system anytime, anywhere, on any device.",
        },
    ];

    return (
        <section className="h-auto w-full flex flex-col items-center sm:my-12 my-6">
        
            <div className="max-w-[1280px] w-full flex flex-col sm:items-start items-center gap-3 p-3">

                <div className="font-sans flex flex-col gap-3 sm:text-left text-center">
                    <span className="text-4xl">Powerful features for student information and <span className="font-bold text-[color:var(--primary)] text-4xl">record management.</span></span>      
                    
                    <span className="sm:text-lg text-md text-gray-400">
                        LearnersKit gives you resources to stay focused, productive and confident in your learning journey.
                    </span>
                </div> 
                
                <div className="grid gap-3 md:grid-cols-3 mt-6">

                    {features.map((feature) => {
                        const Icon = feature.icon

                        return (
                            <div key={feature.title} className={`group rounded-lg bg-background border border-foreground/20 p-6 transition-all 
                                duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer relative mt-6 flex flex-col sm:items-start items-center`}>
                                
                                <div className="absolute left-1/2 top-0 h-6 sm:w-24 w-18 -translate-x-1/2 -translate-y-1/2 rotate-[-2deg] bg-[var(--secondary)]/70" />

                                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--primary)] text-[#24232E] transition-colors 
                                    duration-300 group-hover:bg-[var(--secondary)] group-hover:text-white fadeIn">
                                
                                    <Icon size={27} strokeWidth={1.8} className="fadeIn" />
                                </div>

                                <h3 className="mt-6 text-xl font-medium text-foreground/80 fadeIn">
                                    {feature.title}
                                </h3>

                                <p className="mt-3 text-sm leading-7 text-foreground/80 sm:text-base fadeIn sm:text-left text-center">
                                    {feature.description}
                                </p>

                            </div>
                        )
                    })}

                </div>

            </div>
        
        </section>
    )
}

export default Features