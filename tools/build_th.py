# สร้างหน้าภาษาไทย th/index.html จาก index.html (อังกฤษ) + th.js (คำแปลไทย)
# และอัปเดตข้อมูล FAQ ให้ Google (FAQPage) ในทั้ง 2 หน้าให้ตรงกับคำถามบนหน้า
#
# วิธีใช้: แก้ข้อความใน index.html หรือ th.js แล้วรันจากโฟลเดอร์เว็บ
#     python tools/build_th.py
# ห้ามแก้ th/index.html ตรงๆ เพราะจะถูกเขียนทับทุกครั้งที่รัน
# ใช้แค่ Python ที่มากับเครื่อง ไม่ต้องลงอะไรเพิ่ม
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = 'https://rmshowdown.github.io/bizcapto/'
SITE_TH = SITE + 'th/'
STR = r"'((?:[^'\\]|\\.)*)'"


def load_th():
    src = (ROOT / 'th.js').read_text(encoding='utf-8')
    pairs = re.findall(r"^\s*'([^']+)':\s*" + STR + r",?\s*$", src, re.M)
    return {k: v.replace("\\'", "'").replace('\\\\', '\\') for k, v in pairs}


def element_span(t, open_end, tag):
    """หาตำแหน่งปิดแท็กที่คู่กับแท็กเปิด (นับแท็กชื่อเดียวกันที่ซ้อนอยู่ข้างใน)"""
    depth = 1
    for m in re.finditer(r'<(/?)' + tag + r'\b[^>]*>', t[open_end:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return open_end + m.start(), open_end + m.end()
    raise SystemExit('ไม่เจอแท็กปิด </' + tag + '>')


def replace_inner(t, th, missing):
    out, pos = [], 0
    for m in re.finditer(r'<(\w+)\b[^>]*\bdata-i18n="([^"]+)"[^>]*>', t):
        if m.start() < pos:
            continue
        tag, key = m.group(1), m.group(2)
        close_start, _ = element_span(t, m.end(), tag)
        out.append(t[pos:m.end()])
        if key in th:
            out.append(th[key])
        else:
            missing.add(key)
            out.append(t[m.end():close_start])
        pos = close_start
    out.append(t[pos:])
    return ''.join(out)


def replace_attr(t, th, data_attr, attr, missing):
    def fix(m):
        tag = m.group(0)
        key = re.search(data_attr + r'="([^"]+)"', tag).group(1)
        if key not in th:
            missing.add(key)
            return tag
        return re.sub(r'\b' + attr + r'="[^"]*"', attr + '="' + html.escape(th[key], quote=True) + '"', tag)
    return re.sub(r'<[^>]*\b' + data_attr + r'="[^"]+"[^>]*>', fix, t)


def faq_json(page):
    """อ่านคำถาม-คำตอบจากหน้า แล้วทำเป็น FAQPage"""
    items = []
    for q, a in re.findall(r'<summary[^>]*>(.*?)</summary>\s*<p[^>]*>(.*?)</p>', page, re.S):
        clean = lambda s: html.unescape(re.sub(r'<[^>]+>', '', s)).strip()
        items.append({'@type': 'Question', 'name': clean(q),
                      'acceptedAnswer': {'@type': 'Answer', 'text': clean(a)}})
    data = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': items}
    return '\n'.join('  ' + line for line in json.dumps(data, ensure_ascii=False, indent=2).split('\n'))


def set_faq(page):
    return re.sub(r'(<script type="application/ld\+json" id="faq-ld">\n).*?(\n  </script>)',
                  lambda m: m.group(1) + faq_json(page) + m.group(2), page, count=1, flags=re.S)


def sub1(t, old, new):
    if old not in t:
        raise SystemExit('ไม่เจอข้อความ: ' + old[:70])
    return t.replace(old, new)


def main():
    th = load_th()
    en_path = ROOT / 'index.html'
    en = en_path.read_text(encoding='utf-8')

    # 1) หน้าอังกฤษ: อัปเดต FAQ ให้ Google ให้ตรงกับหน้า
    en_new = set_faq(en)
    if en_new != en:
        en_path.write_text(en_new, encoding='utf-8', newline='\n')
        print('อัปเดต FAQ ใน index.html')
    en = en_new

    # 2) หน้าไทย
    missing = set()
    t = replace_inner(en, th, missing)
    t = replace_attr(t, th, 'data-i18n-aria', 'aria-label', missing)
    t = replace_attr(t, th, 'data-i18n-alt', 'alt', missing)
    t = replace_attr(t, th, 'data-i18n-placeholder', 'placeholder', missing)

    title, desc = html.escape(th['meta.title'], quote=True), html.escape(th['meta.desc'], quote=True)
    t = sub1(t, '<!DOCTYPE html>\n<html lang="en">',
             '<!DOCTYPE html>\n<!-- สร้างอัตโนมัติจาก index.html + th.js ด้วย tools/build_th.py ห้ามแก้ไฟล์นี้ตรงๆ -->\n<html lang="th">')
    t = re.sub(r'<title>.*?</title>', '<title>' + title + '</title>', t, count=1)
    t = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + desc, t, count=1)
    t = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, t, count=1)
    t = re.sub(r'(<meta property="og:description" content=")[^"]*', lambda m: m.group(1) + desc, t, count=1)
    t = re.sub(r'(<meta property="og:image:alt" content=")[^"]*',
               lambda m: m.group(1) + html.escape(th['meta.ogalt'], quote=True), t, count=1)
    t = sub1(t, '<meta property="og:locale" content="en_US">', '<meta property="og:locale" content="th_TH">')
    t = sub1(t, '<link rel="canonical" href="' + SITE + '">', '<link rel="canonical" href="' + SITE_TH + '">')
    t = sub1(t, '<meta property="og:url" content="' + SITE + '">', '<meta property="og:url" content="' + SITE_TH + '">')
    t = t.replace(SITE + 'img/og-image.png', SITE + 'img/og-image-th.png')
    t = sub1(t, '"inLanguage": "en"', '"inLanguage": "th"')
    t = sub1(t, '"url": "' + SITE + '"', '"url": "' + SITE_TH + '"')
    t = re.sub(r'("@type": "SoftwareApplication",.*?"description": ")[^"]*',
               lambda m: m.group(1) + th['meta.desc'].replace('"', '\\"'), t, count=1, flags=re.S)

    # ลิงก์ไฟล์ในเว็บ: หน้าไทยอยู่ในโฟลเดอร์ th/ จึงต้องถอยขึ้น 1 ชั้น
    t = re.sub(r'(href|src)="(fonts/|styles\.css|script\.js|privacy\.html|img/)', r'\1="../\2', t)
    # ปุ่มภาษา
    t = sub1(t, 'data-active="en"', 'data-active="th"')
    t = sub1(t, '<a href="./" hreflang="en" lang="en" data-lang="en" aria-current="page">EN</a>',
             '<a href="../" hreflang="en" lang="en" data-lang="en">EN</a>')
    t = sub1(t, '<a href="th/" hreflang="th" lang="th" data-lang="th">',
             '<a href="./" hreflang="th" lang="th" data-lang="th" aria-current="page">')
    t = set_faq(t)

    out = ROOT / 'th' / 'index.html'
    out.parent.mkdir(exist_ok=True)
    out.write_text(t, encoding='utf-8', newline='\n')
    print('สร้าง th/index.html แล้ว')
    if missing:
        print('ยังไม่มีคำแปลไทย (ใช้ภาษาอังกฤษแทน):', ', '.join(sorted(missing)))
        sys.exit(1)


if __name__ == '__main__':
    main()
