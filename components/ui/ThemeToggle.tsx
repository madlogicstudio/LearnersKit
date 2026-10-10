"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

export function ThemeToggle() {

    const [mounted, setMounted] = useState(false);
    const { resolvedTheme, setTheme } = useTheme();
    const [currentTheme, setCurrentTheme] = useState("system");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="p-1 border border-foreground/20 w-20 rounded-full flex flex-row items-center justify-between fadeIn">
            
            <button className={`${currentTheme === "system" ? "bg-foreground/10" : ""} p-1 rounded-full cursor-pointer`}
                onClick={() => {
                    setTheme("system");
                    setCurrentTheme("system");
                }}>
                <MonitorIcon size={14} className="text-foreground/80" />
            </button>
            <button className={`${currentTheme === "dark" ? "bg-foreground/10" : ""} p-1 rounded-full cursor-pointer`}
                onClick={() => {
                    setTheme("dark");
                    setCurrentTheme("dark");
                }}>
                <MoonIcon size={14} className="text-foreground/80" />
            </button>
            <button className={`${currentTheme === "light" ? "bg-foreground/10" : ""} p-1 rounded-full cursor-pointer`}
                onClick={() => {
                    setTheme("light");
                    setCurrentTheme("light");
                }}>
                <SunIcon size={14} className="text-foreground/80" />
            </button>

        </div>
    );
}