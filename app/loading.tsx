import { WanderingEyes } from "@/components/ui/WanderingEyes";

export default function loading() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <WanderingEyes className="size-4 text-[var(--primary)]" />
        </div>
    );
}