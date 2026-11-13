import re, zipfile, shutil
from pathlib import Path

zip_file = Path("portfolio-victor-tavian.zip")
html_file = Path("index.html")

with zipfile.ZipFile(zip_file) as z:
    original = z.read("portfolio-victor-tavian/index.html").decode("utf-8")

current = html_file.read_text(encoding="utf-8")

pattern = re.compile(
    r'(<div class="tech\b[^"]*"[^>]*>.*?<img\b[^>]*\bsrc="([^"]+)"[^>]*>.*?<span>([^<]+)</span>.*?</div>)',
    re.S
)

logos = {name.strip(): src for _, src, name in pattern.findall(original)}
count = 0

def restore(match):
    global count
    block, old_src, name = match.groups()
    if name.strip() not in logos:
        return block
    new_src = logos[name.strip()]
    count += 1
    return re.sub(
        r'(\bsrc=")[^"]+(")',
        lambda m: m.group(1) + new_src + m.group(2),
        block,
        count=1
    )

updated = pattern.sub(restore, current)

shutil.copy2(html_file, "index-backup.html")
html_file.write_text(updated, encoding="utf-8")

print(f"Concluído: {count} logotipos restaurados.")
print("Backup criado: index-backup.html")
