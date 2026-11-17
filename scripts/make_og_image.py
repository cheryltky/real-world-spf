"""Draw the 1200x630 link-preview image: cover gradient, title and a sun of dots (no data values)."""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
FONT = "/System/Library/Fonts/Avenir Next.ttc"  # index 2 Demi Bold, 0 Bold
INK, BURN, PINK, SAFE = (31, 42, 51), (198, 63, 74), (242, 160, 168), (251, 239, 217)
STOPS = [(0.0, (251, 212, 191)), (0.45, (248, 229, 154)), (1.0, (184, 226, 242))]


def gradient():
    img = Image.new("RGB", (W, H))
    px = img.load()
    for x in range(W):
        for y in range(H):
            t = min(1, max(0, (x * 0.85 + y * 0.4) / (W * 0.85 + H * 0.4)))
            (t0, c0), (t1, c1) = next((a, b) for a, b in zip(STOPS, STOPS[1:]) if t <= b[0])
            f = (t - t0) / (t1 - t0)
            px[x, y] = tuple(round(a + (b - a) * f) for a, b in zip(c0, c1))
    return img


def sun_spots(cx, cy, gap):
    spots = [(cx, cy)]
    for ring in range(1, 5):
        spots += [(cx + math.cos(a) * ring * gap, cy + math.sin(a) * ring * gap)
                  for a in (i / (ring * 6) * 2 * math.pi - math.pi / 2 for i in range(ring * 6))]
    for ray in range(13):
        a = ray / 13 * 2 * math.pi - math.pi / 2
        spots += [(cx + math.cos(a) * (5.6 + j * 1.15) * gap, cy + math.sin(a) * (5.6 + j * 1.15) * gap) for j in range(3)]
    return spots


def main(out=Path(__file__).resolve().parent.parent / "assets" / "og.png"):
    img = gradient()
    d = ImageDraw.Draw(img)
    for i, (x, y) in enumerate(sun_spots(900, 315, 26)):
        fill, width = (BURN, 4) if i < 37 else (PINK, 2) if i < 61 else (SAFE, 2)
        d.ellipse((x - 11, y - 11, x + 11, y + 11), fill=fill, outline=INK, width=width)
    d.text((72, 70), "DATA IN BYTES", font=ImageFont.truetype(FONT, 24, index=5), fill=INK)
    title = ImageFont.truetype(FONT, 76, index=2)
    for i, line in enumerate(["How much SPF", "are you really", "getting?"]):
        d.text((72, 140 + i * 92), line, font=title, fill=INK)
    d.text((72, 470), "Squeeze the tube. Pick your city and day.\nSee what reaches your skin.", font=ImageFont.truetype(FONT, 30, index=7), fill=INK, spacing=10)
    img.save(out, optimize=True)
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
