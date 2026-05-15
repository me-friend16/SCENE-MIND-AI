import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
}

export default function Button({ className, variant = 'primary', fullWidth, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-3xl px-5 py-3 text-sm font-semibold transition-all duration-200',
        fullWidth && 'w-full',
        variant === 'primary' && 'bg-gradient-to-r from-violet-500 to-sky-500 text-white shadow-[0_16px_40px_rgba(124,58,237,0.25)] hover:brightness-110',
        variant === 'secondary' && 'border border-white/15 bg-white/5 text-slate-100 hover:bg-white/10',
        variant === 'ghost' && 'bg-transparent text-slate-200 hover:bg-white/5',
        className,
      )}
      {...props}
    />
  );
}
