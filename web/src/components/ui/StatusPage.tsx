/** Shared layout for 404 / error / "not found" screens: code, headline, one line, actions. */
export function StatusPage({
  code,
  title,
  children,
  actions,
  as: Wrapper = "main",
}: {
  code?: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  /** Use "div" when rendered inside a page that already has its <main>. */
  as?: "main" | "div";
}) {
  return (
    <Wrapper className="rise-in flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      {code && (
        <p aria-hidden="true" className="font-mono text-7xl leading-none tracking-tight text-sub-alt sm:text-8xl">
          {code}
        </p>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-text">{title}</h1>
      {children && <p className="max-w-md text-sub">{children}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </Wrapper>
  );
}
