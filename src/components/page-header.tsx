
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode;
    className?: string;
}

export default function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn(
            "mb-6 sm:mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center w-full",
            className
        )}>
            <div className="grid gap-1.5 w-full md:w-auto">
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl md:text-4xl text-foreground leading-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-sm md:text-base text-muted-foreground max-w-[600px] leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex w-full shrink-0 items-center gap-2 sm:gap-3 md:w-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
