"""
generate_image.py — Replicate FLUX Schnell による画像生成スクリプト

使い方:
  python generate_image.py "prompt" [output.png] [オプション]

オプション:
  --size WxH     出力サイズ (デフォルト: 1024x1024)
  --steps N      推論ステップ数 1-4 (デフォルト: 4、速度優先なら 1-2)
  --seed N       シード値 (省略で毎回ランダム)
  --list-presets プリセット一覧を表示して終了

環境変数:
  REPLICATE_API_TOKEN  Replicate の API トークン（必須）
  → https://replicate.com/account/api-tokens で発行

例:
  python generate_image.py "cute green slime monster, chibi style" slime.png
  python generate_image.py "forest kobito character, kawaii" riku.png --size 512x512
  python generate_image.py --preset game_sprite "blue kobito" paku.png
"""

import sys
import os

# Windows ターミナルの文字コード問題を回避
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
import argparse
import urllib.request
from pathlib import Path

# .env ファイルがあれば読み込む（python-dotenv 未インストールでも動く）
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

# ─── プリセット（ゲーム用スタイル定義） ───────────────────────
PRESETS = {
    "game_sprite": (
        "game sprite, chibi character, white background, clean outlines, "
        "flat colors, pixel-art inspired, kawaii japanese style"
    ),
    "monster": (
        "cute monster character, chibi style, white background, "
        "simple flat illustration, bright colors, game asset"
    ),
    "background": (
        "2D game background, side-scrolling, flat illustration, "
        "soft colors, japanese forest style, no characters"
    ),
    "icon": (
        "simple icon, white background, flat design, bold outlines, "
        "single object, game UI element"
    ),
}


# カテゴリ → 保存フォルダのマッピング
CATEGORY_DIRS = {
    "monster": "docs/monster",
    "kobito":  "docs/kobito",
    "bg":      "docs/bg",
    "icon":    "docs/icon",
}


def parse_args():
    p = argparse.ArgumentParser(description="Replicate FLUX Schnell 画像生成")
    p.add_argument("prompt", nargs="?", help="生成プロンプト（英語）")
    p.add_argument("output", nargs="?", default="output.png", help="ファイル名（フォルダ指定なしの場合は --category で自動決定）")
    p.add_argument("--category", "-c", choices=list(CATEGORY_DIRS.keys()),
                   help="種別: monster=docs/monster  kobito=docs/kobito  bg=docs/bg  icon=docs/icon")
    p.add_argument("--size",   default="1024x1024", help="WxH（例: 512x512）")
    p.add_argument("--steps",  type=int, default=4, choices=[1,2,3,4], help="推論ステップ数")
    p.add_argument("--seed",   type=int, default=None, help="シード値")
    p.add_argument("--preset", choices=list(PRESETS.keys()), help="スタイルプリセット")
    p.add_argument("--list-presets", action="store_true", help="プリセット一覧を表示")
    return p.parse_args()


def main():
    args = parse_args()

    if args.list_presets:
        print("利用可能なプリセット:")
        for name, style in PRESETS.items():
            print(f"  --preset {name}")
            print(f"    → {style[:80]}...")
        return

    if not args.prompt:
        print("エラー: プロンプトを指定してください", file=sys.stderr)
        print("例: python generate_image.py \"cute slime\" slime.png", file=sys.stderr)
        sys.exit(1)

    # API トークン確認
    token = os.environ.get("REPLICATE_API_TOKEN")
    if not token:
        print("エラー: 環境変数 REPLICATE_API_TOKEN が設定されていません", file=sys.stderr)
        print("  取得先: https://replicate.com/account/api-tokens", file=sys.stderr)
        print("  設定方法（PowerShell）:", file=sys.stderr)
        print("    $env:REPLICATE_API_TOKEN = 'r8_...'", file=sys.stderr)
        sys.exit(1)

    # プロンプト構築
    prompt = args.prompt
    if args.preset:
        prompt = f"{args.prompt}, {PRESETS[args.preset]}"
        print(f"プリセット '{args.preset}' を適用")

    # サイズ解析
    try:
        w, h = map(int, args.size.lower().split("x"))
    except ValueError:
        print(f"エラー: --size の形式が不正です（例: 512x512）", file=sys.stderr)
        sys.exit(1)

    print(f"生成中... prompt: {prompt[:60]}{'...' if len(prompt)>60 else ''}")
    print(f"         size: {w}x{h}  steps: {args.steps}")

    # replicate ライブラリを動的インポート（未インストール時にわかりやすいエラーを出す）
    try:
        import replicate
    except ImportError:
        print("エラー: replicate ライブラリがインストールされていません", file=sys.stderr)
        print("  pip install replicate", file=sys.stderr)
        sys.exit(1)

    # FLUX Schnell で生成
    input_params = {
        "prompt": prompt,
        "width": w,
        "height": h,
        "num_inference_steps": args.steps,
        "output_format": "png",
        "output_quality": 100,
        "disable_safety_checker": False,
    }
    if args.seed is not None:
        input_params["seed"] = args.seed

    # 429 レート制限時は待機してリトライ（最大3回）
    import time
    last_err = None
    for attempt in range(1, 4):
        try:
            output = replicate.run(
                "black-forest-labs/flux-schnell",
                input=input_params,
            )
            last_err = None
            break
        except Exception as e:
            last_err = e
            msg = str(e)
            if "429" in msg or "throttled" in msg.lower() or "rate" in msg.lower():
                wait = 15 * attempt
                print(f"レート制限 — {wait}秒待機してリトライ ({attempt}/3)...")
                time.sleep(wait)
            else:
                print(f"エラー: API 呼び出し失敗 — {e}", file=sys.stderr)
                sys.exit(1)
    if last_err:
        print(f"エラー: リトライ上限に達しました — {last_err}", file=sys.stderr)
        sys.exit(1)

    # 結果を保存
    # --category が指定されていてかつ output にフォルダ指定がない場合、自動でサブフォルダへ
    out_path = Path(args.output)
    if args.category and out_path.parent == Path("."):
        out_path = Path(__file__).parent / CATEGORY_DIRS[args.category] / out_path.name
    elif not out_path.is_absolute():
        out_path = Path(__file__).parent / out_path
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # output は URL のリスト or FileOutput オブジェクトのリスト
    result = output[0] if isinstance(output, list) else output
    if hasattr(result, "url"):
        url = result.url
        urllib.request.urlretrieve(url, out_path)
    elif isinstance(result, str) and result.startswith("http"):
        urllib.request.urlretrieve(result, out_path)
    else:
        # bytes / FileOutput の read() が使える場合
        data = result.read() if hasattr(result, "read") else bytes(result)
        out_path.write_bytes(data)

    size_kb = out_path.stat().st_size // 1024
    print(f"✅ 保存完了: {out_path}  ({size_kb} KB)")


if __name__ == "__main__":
    main()
