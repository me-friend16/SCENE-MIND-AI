import clsx from 'clsx';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={clsx(
        'rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-cinematic',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
