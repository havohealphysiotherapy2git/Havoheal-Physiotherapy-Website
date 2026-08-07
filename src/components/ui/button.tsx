import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button / link button.
 *
 * Every variant meets a 44px minimum touch target and carries a visible focus
 * ring inherited from the global `:focus-visible` style. Use `asChild` to apply
 * button styling to a Next.js `<Link>` without nesting interactive elements.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[1.15em] [&_svg]:shrink-0 motion-reduce:transition-none',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-glow hover:from-brand-700 hover:to-brand-900 active:translate-y-px',
        secondary:
          'border-2 border-brand-700 bg-white text-brand-800 hover:bg-brand-50 active:translate-y-px',
        accent:
          'bg-gradient-to-br from-coral-500 to-coral-700 text-white shadow-card hover:from-coral-600 hover:to-coral-800 active:translate-y-px',
        whatsapp:
          'border-2 border-[#0f7a52] bg-[#0f7a52] text-white hover:bg-[#0b6242] active:translate-y-px',
        subtle: 'bg-slate-100 text-ink hover:bg-slate-200 active:translate-y-px',
        ghost: 'text-brand-800 hover:bg-brand-50',
        onDark:
          'border-2 border-white/70 bg-white/10 text-white backdrop-blur-sm hover:bg-white hover:text-brand-900',
        destructive:
          'border-2 border-coral-700 bg-white text-coral-800 hover:bg-coral-50 active:translate-y-px',
      },
      size: {
        sm: 'min-h-[44px] px-4 py-2 text-sm',
        md: 'min-h-[48px] px-5 py-3 text-[0.95rem]',
        lg: 'min-h-[54px] px-7 py-3.5 text-base sm:text-lg',
        icon: 'size-11 p-0',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        // Buttons inside forms default to "submit" in HTML; being explicit
        // prevents accidental submits from decorative buttons.
        {...(asChild ? {} : { type: type ?? 'button' })}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
