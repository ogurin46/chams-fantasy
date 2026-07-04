"""
remove_bg.py — モンスター画像の白背景を透明化

使い方:
  python remove_bg.py                  # src/img/enemy_*.png を全件処理
  python remove_bg.py slime mushroom   # 指定IDだけ処理

仕組み:
  - 白に近いピクセルを透明にする（単純閾値）
  - 輪郭付近はフェザリングで滑らかに半透明化
"""

import sys
import os
from pathlib import Path

# .env 読み込み（共通）
def _load_dotenv():
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        if key.strip() and key.strip() not in os.environ:
            os.environ[key.strip()] = val.strip().strip('"').strip("'")
_load_dotenv()

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    from PIL import Image
except ImportError:
    print("エラー: Pillow がインストールされていません")
    print("  pip install Pillow")
    sys.exit(1)

SRC_DIR = Path(__file__).parent / "src" / "img"

# 白背景の判定閾値（0-255）
# 高いほど「白に近いものだけ」透明化 → 下げると広く消える
THRESHOLD = 210   # これ以上白ければ完全透明
FEATHER   = 30    # この幅でなめらかに半透明化（輪郭ぼかし）


def remove_white_bg(img_path: Path) -> None:
    img = Image.open(img_path).convert("RGBA")
    pixels = img.load()
    w, h = img.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # 各チャンネルの「白さ」最小値（一番暗いチャンネルが白基準）
            whiteness = min(r, g, b)

            if whiteness >= THRESHOLD:
                # 完全に白 → 完全透明
                pixels[x, y] = (r, g, b, 0)
            elif whiteness >= THRESHOLD - FEATHER:
                # 輪郭フェザー帯 → 距離に応じて半透明
                ratio = (whiteness - (THRESHOLD - FEATHER)) / FEATHER
                new_alpha = int(a * (1.0 - ratio))
                pixels[x, y] = (r, g, b, new_alpha)
            # それ以外はそのまま

    img.save(img_path)


def main():
    args = sys.argv[1:]

    if args:
        targets = [f"enemy_{a}.png" if not a.endswith(".png") else a for a in args]
        files = [SRC_DIR / t for t in targets if (SRC_DIR / t).exists()]
        missing = [t for t in targets if not (SRC_DIR / t).exists()]
        if missing:
            print(f"見つかりません: {', '.join(missing)}")
    else:
        files = sorted(SRC_DIR.glob("enemy_*.png"))

    if not files:
        print("処理対象ファイルがありません")
        sys.exit(1)

    print(f"処理対象: {len(files)} 件  閾値:{THRESHOLD}  フェザー:{FEATHER}")
    for f in files:
        remove_white_bg(f)
        size_kb = f.stat().st_size // 1024
        print(f"  完了: {f.name}  ({size_kb} KB)")

    print(f"\n全件完了！ ブラウザをリロードして確認してください。")


if __name__ == "__main__":
    main()
