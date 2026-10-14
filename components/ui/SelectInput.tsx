
"use client";

import { ChevronDown } from "lucide-react";

type SelectOption = {
    label: string;
    value: string;
};

type SelectInputProps = {
    label: string;
    placeholder?: string;
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    name?: string;
};

export default function SelectInput({
    label,
    placeholder = "Select an option",
    options,
    value,
    onChange,
    required = false,
    disabled = false,
    error,
    name,
}: SelectInputProps) {

    return (
        <div className="flex w-full flex-col gap-2">
            <label
                htmlFor={name}
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
                {required && (
                    <span className="ml-1 text-red-500">*</span>
                )}
            </label>

            <div className="relative">
                <select
                id={name}
                name={name}
                value={value}
                required={required}
                disabled={disabled}
                onChange={(event) => onChange?.(event.target.value)}
                className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-foreground/80 outline-none transition-colors dark:bg-[var(--card)] 
                    ${
                        error
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-foreground/10 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 "
                    } ${
                        disabled
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                >
                    <option value="" >{placeholder}</option>

                    {options.map((option) => (
                        <option key={option.value} value={option.value} className="hover:bg-[var(--primary)]" >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
            </div>

            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}
