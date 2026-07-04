"""
create_icons.py — PWA用アイコンを生成する（192x192 / 512x512）
使い方: python create_icons.py
出力:   src/img/icon-192.png
        src/img/icon-512.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

OUT_DIR = Path(__file__).parent / "src" / "img"

def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 丸角背景（forest green グラデーション風）
    r = size // 5  # 角丸半径
    # 暗→明のグラデーション（簡易: 上から下へ）
    for y in range(size):
        t = y / size
        # #1b5e20 → #43a047
        cr = int(27  + (67  - 27)  * t)
        cg = int(94  + (160 - 94)  * t)
        cb = int(32  + (71  - 32)  * t)
        draw.line([(0, y), (size, y)], fill=(cr, cg, cb, 255))

    # 丸角マスクを適用
    mask = Image.new("L", (size, size), 0)
    md   = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    img.putalpha(mask)

    # 森のシルエット（三角形の木×3）
    tree_color = (255, 255, 255, 180)
    cx = size // 2
    base_y = int(size * 0.82)

    def draw_tree(center_x, trunk_w, h, w):
        # 幹
        tw = max(2, trunk_w)
        th = h // 4
        draw.rectangle(
            [center_x - tw // 2, base_y - th,
             center_x + tw // 2, base_y],
            fill=(200, 255, 200, 160)
        )
        # 葉（重ねた三角形）
        for i, frac in enumerate([1.0, 0.75, 0.55]):
            layer_h = int(h * frac)
            layer_w = int(w * frac)
            top_y   = base_y - th - int(h * 0.25 * i) - layer_h
            draw.polygon([
                (center_x,           top_y),
                (center_x - layer_w, base_y - th - int(h * 0.25 * i)),
                (center_x + layer_w, base_y - th - int(h * 0.25 * i)),
            ], fill=tree_color)

    # 左・中・右の木
    unit = size // 10
    draw_tree(int(cx * 0.52), unit, unit * 5, unit * 3)
    draw_tree(cx,             unit, unit * 6, unit * 4)
    draw_tree(int(cx * 1.48), unit, unit * 5, unit * 3)

    # タイトル文字（PIL デフォルトフォントで代替）
    font_size = max(12, size // 9)
    try:
        # システムフォントを探す（Windows / Mac / Linux）
        candidates = [
            "C:/Windows/Fonts/meiryo.ttc",
            "C:/Windows/Fonts/YuGothM.ttc",
            "/System/Library/Fonts/ヒラギノ丸ゴ ProN W4.ttc",
            "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        ]
        font = None
        for p in candidates:
            if Path(p).exists():
                font = ImageFont.truetype(p, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()

    text     = "チャムズ"
    sub_text = "ファンタジー"
    # テキストの幅を取得
    bbox1 = draw.textbbox((0, 0), text,     font=font)
    bbox2 = draw.textbbox((0, 0), sub_text, font=font)
    tw1 = bbox1[2] - bbox1[0]
    tw2 = bbox2[2] - bbox2[0]

    ty = int(size * 0.86)
    shadow = (0, 0, 0, 120)
    draw.text((cx - tw1 // 2 + 1, ty + 1), text,     font=font, fill=shadow)
    draw.text((cx - tw1 // 2,     ty),     text,     font=font, fill=(255, 255, 220, 255))
    ty2 = ty + font_size + max(1, size // 60)
    draw.text((cx - tw2 // 2 + 1, ty2 + 1), sub_text, font=font, fill=shadow)
    draw.text((cx - tw2 // 2,     ty2),     sub_text, font=font, fill=(200, 255, 200, 220))

    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in [192, 512]:
        path = OUT_DIR / f"icon-{size}.png"
        img  = make_icon(size)
        img.save(path)
        kb = path.stat().st_size // 1024
        print(f"  生成: {path.name}  ({size}x{size}px, {kb}KB)")
    print("完了！ src/img/icon-192.png と icon-512.png を確認してください。")


if __name__ == "__main__":
    main()
