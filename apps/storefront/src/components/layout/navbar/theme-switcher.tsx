"use client";

import {useTheme} from "next-themes";
import {useEffect, useState} from "react";
import {Moon, Sun, Monitor} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {useTranslations} from "next-intl";

export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false);
    const {theme, setTheme} = useTheme();
    const t = useTranslations("Navigation");

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled className="text-foreground size-9" aria-label="Toggle theme">
                <Sun className="size-5" />
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground relative size-9 hover:bg-muted/80 transition-colors"
                        aria-label={t("toggleTheme")}
                    />
                }
            >
                <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500 dark:text-foreground" />
                <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground dark:text-emerald-400" />
                <span className="sr-only">{t("toggleTheme")}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer gap-2.5">
                    <Sun className="size-4 text-amber-500" />
                    <span>{t("themeLight")}</span>
                    {theme === "light" && <span className="ml-auto text-xs font-bold text-electric">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer gap-2.5">
                    <Moon className="size-4 text-emerald-400" />
                    <span>{t("themeDark")}</span>
                    {theme === "dark" && <span className="ml-auto text-xs font-bold text-electric">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer gap-2.5">
                    <Monitor className="size-4 text-muted-foreground" />
                    <span>{t("themeSystem")}</span>
                    {theme === "system" && <span className="ml-auto text-xs font-bold text-electric">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

