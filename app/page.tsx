import fs from 'node:fs';
import path from 'node:path';
import SiteBody from '@/components/SiteBody';
import SiteScripts from '@/components/SiteScripts';
import TrailCursor from '@/components/TrailCursor';

// A marcação do site fica em content/body.html. Os scripts legados ficam em public/js.
export default function Page() {
  const html = fs.readFileSync(path.join(process.cwd(), 'content', 'body.html'), 'utf8');
  return (
    <>
      <SiteBody html={html} />
      <TrailCursor />
      <SiteScripts />
    </>
  );
}
