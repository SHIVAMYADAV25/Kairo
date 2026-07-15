export default function CodeBlock({
  title,
  lang,
  children,
}: {
  title?: string;
  lang?: string;
  children: string;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden my-6 not-prose">
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
            <div className="w-2 h-2 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] font-mono text-neutral-500 ml-1">{title}</span>
          {lang && (
            <span className="ml-auto text-[10px] uppercase tracking-wider text-neutral-600">{lang}</span>
          )}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed font-mono text-neutral-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}
