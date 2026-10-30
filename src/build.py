"""Build the single-file offline edition. Run: python3 src/build.py"""
from pathlib import Path
import re
root = Path(__file__).resolve().parent.parent
src = root / 'src'
html = (src / 'index.html').read_text()
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + (src / 'style.css').read_text() + '\n</style>')
for reference, path in [('../vendor/three.min.js', root / 'vendor/three.min.js'), ('physics.js', src / 'physics.js'), ('quizzes.js', src / 'quizzes.js'), ('online.js', src / 'online.js'), ('account.js', src / 'account.js'), ('game.js', src / 'game.js')]:
    content = re.sub(r'</script', r'<\\/script', path.read_text(), flags=re.I)
    html = html.replace(f'<script src="{reference}"></script>', '<script>\n' + content + '\n</script>')
(root / '얼음땡.html').write_text(html)
print('완성: 얼음땡.html — 최종본 생성 (로그인·기록 저장은 서버 주소에서 실행)')
