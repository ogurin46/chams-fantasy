"""
generate_sprites.py — Kotodama Buddy ゲームスプライト一括生成

使い方:
  python generate_sprites.py [--dry-run] [--targets riku paku mimi ...]

  --dry-run   API を叩かずプロンプトだけ表示して確認
  --targets   生成対象を絞る（省略で全件）
  --out-dir   出力先ディレクトリ（デフォルト: src/img/generated/）
  --steps     推論ステップ数 1-4（デフォルト: 4）

環境変数:
  REPLICATE_API_TOKEN  必須
"""

import sys
import subprocess
import argparse
import os
from pathlib import Path

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def _load_dotenv():
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val

_load_dotenv()

# ─── 生成対象リスト ─────────────────────────────────────────────
SPRITES = [
    # こびとキャラクター 3体 × 3形態
    {
        "id": "riku",       "category": "kobito",
        "file": "riku.png",
        "prompt": (
            "riku, small brave kobito elf boy, red bandana, green shorts, "
            "chibi style, white background, game sprite, flat colors"
        ),
    },
    {
        "id": "riku_form2", "category": "kobito",
        "file": "riku_form2.png",
        "prompt": (
            "riku kobito elf boy with small sword, level 2 evolution, "
            "chibi style, white background, game sprite, brighter colors"
        ),
    },
    {
        "id": "riku_form3", "category": "kobito",
        "file": "riku_form3.png",
        "prompt": (
            "riku kobito knight elf, glowing sword, armor, final evolution, "
            "chibi style, white background, game sprite, epic pose"
        ),
    },
    {
        "id": "paku",       "category": "kobito",
        "file": "paku.png",
        "prompt": (
            "paku, small energetic kobito elf boy, yellow hat, blue overalls, "
            "chibi style, white background, game sprite, chubby cheerful"
        ),
    },
    {
        "id": "paku_form2", "category": "kobito",
        "file": "paku_form2.png",
        "prompt": (
            "paku kobito elf boy with magic wand, level 2 wizard, "
            "chibi style, white background, game sprite, sparkles"
        ),
    },
    {
        "id": "paku_form3", "category": "kobito",
        "file": "paku_form3.png",
        "prompt": (
            "paku kobito wizard elf, powerful magic staff, glowing aura, "
            "chibi style, white background, game sprite, legendary mage"
        ),
    },
    {
        "id": "mimi",       "category": "kobito",
        "file": "mimi.png",
        "prompt": (
            "mimi, small gentle kobito elf girl, pink dress, flower in hair, "
            "chibi style, white background, game sprite, kind smile"
        ),
    },
    {
        "id": "mimi_form2", "category": "kobito",
        "file": "mimi_form2.png",
        "prompt": (
            "mimi kobito fairy girl, small fairy wings, pink dress, level 2, "
            "chibi style, white background, game sprite, gentle glow"
        ),
    },
    {
        "id": "mimi_form3", "category": "kobito",
        "file": "mimi_form3.png",
        "prompt": (
            "mimi kobito saint elf girl, angelic wings, holy aura, golden dress, "
            "chibi style, white background, game sprite, saintly evolution"
        ),
    },

    # ── エリア1: もりのはじまり ──
    {
        "id": "slime",        "category": "monster",
        "file": "enemy_slime.png",
        "prompt": (
            "cute green slime blob monster, small round jelly body, big simple eyes, "
            "chibi game sprite, white background, flat bright colors"
        ),
    },
    {
        "id": "mushroom",     "category": "monster",
        "file": "enemy_mushroom.png",
        "prompt": (
            "cute angry mushroom monster, red spotted cap, small arms and legs, grumpy face, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "leafBug",      "category": "monster",
        "file": "enemy_leafBug.png",
        "prompt": (
            "cute green leaf bug caterpillar monster, hiding under a leaf, simple face, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "darkSlime",    "category": "monster",
        "file": "enemy_darkSlime.png",
        "prompt": (
            "dark purple evil slime boss monster, glowing red eyes, spooky aura, large size, "
            "chibi game sprite, white background, boss enemy"
        ),
    },
    # ── エリア2: まよいのどうくつ ──
    {
        "id": "bat",          "category": "monster",
        "file": "enemy_bat.png",
        "prompt": (
            "cute small bat monster, dark purple wings, simple cute face, hanging upside down, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "spider",       "category": "monster",
        "file": "enemy_spider.png",
        "prompt": (
            "cute spider monster, eight legs, spinning web, yellow eyes, dark body, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "skeleton",     "category": "monster",
        "file": "enemy_skeleton.png",
        "prompt": (
            "cute skeleton warrior monster, bone armor, sad eyes, small shield, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "giantSpider",  "category": "monster",
        "file": "enemy_giantSpider.png",
        "prompt": (
            "giant spider boss monster, enormous web behind it, many red eyes, menacing, "
            "chibi game sprite, white background, boss enemy"
        ),
    },
    # ── エリア3: うみべのまち ──
    {
        "id": "crab",         "category": "monster",
        "file": "enemy_crab.png",
        "prompt": (
            "cute pirate crab monster, large claws, pirate hat, orange shell, angry eyes, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "jellyfish",    "category": "monster",
        "file": "enemy_jellyfish.png",
        "prompt": (
            "cute glowing jellyfish monster, translucent purple body, long tentacles, "
            "chibi game sprite, white background, flat colors, bioluminescent"
        ),
    },
    {
        "id": "fishKnight",   "category": "monster",
        "file": "enemy_fishKnight.png",
        "prompt": (
            "cute fish head soldier monster, fish helmet, small armor, holding spear, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "seaKing",      "category": "monster",
        "file": "enemy_seaKing.png",
        "prompt": (
            "sea king boss monster, trident, crown, dark corrupted ocean king, majestic, "
            "chibi game sprite, white background, boss enemy"
        ),
    },
    # ── エリア4: そらのしろ ──
    {
        "id": "stormBird",    "category": "monster",
        "file": "enemy_stormBird.png",
        "prompt": (
            "storm eagle bird monster, lightning wings, fierce expression, dark feathers, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "darkCloud",    "category": "monster",
        "file": "enemy_darkCloud.png",
        "prompt": (
            "dark storm cloud monster, thunderbolts, evil face inside cloud, floating, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "shadowKnight", "category": "monster",
        "file": "enemy_shadowKnight.png",
        "prompt": (
            "shadow knight monster, dark armor, glowing purple eyes, shadowy sword, "
            "chibi game sprite, white background, flat colors"
        ),
    },
    {
        "id": "darkLord",     "category": "monster",
        "file": "enemy_darkLord.png",
        "prompt": (
            "dark lord final boss monster, golden crown, black cape, evil aura, overwhelming power, "
            "chibi game sprite, white background, boss enemy, dramatic pose"
        ),
    },
]


def parse_args():
    p = argparse.ArgumentParser(description="Kotodama Buddy スプライト一括生成")
    p.add_argument("--dry-run",  action="store_true", help="プロンプト確認のみ（API未使用）")
    p.add_argument("--targets",  nargs="*", help="生成対象ID（省略で全件）")
    p.add_argument("--out-dir",  default="src/img/generated", help="出力先ディレクトリ")
    p.add_argument("--steps",    type=int, default=4, choices=[1,2,3,4])
    p.add_argument("--size",     default="512x512", help="スプライトサイズ")
    p.add_argument("--delay",    type=int, default=12,
                   help="リクエスト間の待機秒数（デフォルト12秒 / 6件/分制限対応）")
    p.add_argument("--skip-existing", action="store_true", help="すでにファイルがあるものはスキップ")
    return p.parse_args()


def main():
    args = parse_args()
    targets = set(args.targets) if args.targets else None
    out_dir = Path(args.out_dir)

    sprites = [s for s in SPRITES if targets is None or s["id"] in targets]
    if not sprites:
        print("対象スプライトが見つかりません。--targets で指定したIDを確認してください。")
        sys.exit(1)

    # カテゴリ別フォルダマッピング（generate_image.py と同じ定義）
    CATEGORY_DIRS = {
        "monster": "docs/monster",
        "kobito":  "docs/kobito",
        "bg":      "docs/bg",
        "icon":    "docs/icon",
    }
    script_dir = Path(__file__).parent

    print(f"生成対象: {len(sprites)} 件  待機間隔: {args.delay}秒")
    if args.dry_run:
        print("─── DRY RUN（API は呼び出しません） ───")

    import time
    ok = 0
    ng = 0
    for i, s in enumerate(sprites):
        category = s.get("category")
        if category and category in CATEGORY_DIRS:
            out_path = script_dir / CATEGORY_DIRS[category] / s["file"]
        else:
            out_path = script_dir / out_dir / s["file"]

        print(f"\n[{i+1}/{len(sprites)}] {s['id']} → {out_path.name}")
        print(f"  prompt: {s['prompt'][:80]}...")

        if args.dry_run:
            continue

        if args.skip_existing and out_path.exists():
            print(f"  スキップ（既存ファイルあり）")
            ok += 1
            continue

        # リクエスト間に待機（初回は不要）
        if i > 0:
            print(f"  {args.delay}秒待機中...")
            time.sleep(args.delay)

        cmd = [
            sys.executable, str(script_dir / "generate_image.py"),
            s["prompt"],
            str(out_path),
            "--size", args.size,
            "--steps", str(args.steps),
        ]
        result = subprocess.run(cmd, capture_output=False)
        if result.returncode == 0:
            ok += 1
        else:
            ng += 1
            print(f"  ⚠️ 失敗（スキップして続行）")

    if not args.dry_run:
        print(f"\n完了: 成功 {ok} 件 / 失敗 {ng} 件")
        if ok > 0:
            est_cost = ok * 0.003
            print(f"概算コスト: ${est_cost:.3f}（約{est_cost*150:.0f}円）")


if __name__ == "__main__":
    main()
