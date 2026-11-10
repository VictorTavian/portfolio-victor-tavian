// Marcação estática do site (seções, rodapé, abertura, galeria).
// Os scripts que animam a página leem e alteram esse HTML depois da hidratação,
// por isso o React não reconcilia esse trecho.
export default function SiteBody({ html }: { html: string }) {
  return <div className="site-root" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
