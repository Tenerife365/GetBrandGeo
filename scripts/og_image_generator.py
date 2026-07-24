from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
WEB = "/sessions/dreamy-trusting-rubin/mnt/Constantin Daniel Goane--BrandGEO/brandgeo/web"
W, H = 1200, 630
BG = (8, 8, 15); TEAL = (0, 212, 170); WHITE = (255,255,255)
GRAY = (255,255,255,170); GRAD_A = (59,130,246); GRAD_B = (139,92,246)
FB = "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"
def f(sz, bold=True): return ImageFont.truetype(FB if bold else FR, sz)

img = Image.new("RGB", (W, H), BG)
glow = Image.new("RGB", (W, H), BG)
gd = ImageDraw.Draw(glow)
gd.ellipse([-300,-300,500,500], fill=(30,22,60))
gd.ellipse([W-450,H-350,W+300,H+300], fill=(8,38,34))
glow = glow.filter(ImageFilter.GaussianBlur(150))
img = Image.blend(img, glow, 0.9)
d = ImageDraw.Draw(img, "RGBA")

def grad_text(base, xy, text, font, c1, c2):
    x, y = xy
    tmp = Image.new("L", base.size, 0)
    ImageDraw.Draw(tmp).text((x, y), text, font=font, fill=255)
    bbox = ImageDraw.Draw(tmp).textbbox((x, y), text, font=font)
    grad = Image.new("RGB", base.size, c1)
    g2 = ImageDraw.Draw(grad)
    x0, x1 = int(bbox[0]), int(max(bbox[2], bbox[0]+1))
    for i in range(x0, x1):
        t = (i-x0)/(x1-x0)
        g2.line([(i,bbox[1]),(i,bbox[3])], fill=tuple(int(c1[k]+(c2[k]-c1[k])*t) for k in range(3)))
    base.paste(grad, (0,0), tmp)

logo = Image.open(os.path.join(WEB, "logo.png")).convert("RGBA")
lh = 88; lw = int(logo.width*lh/logo.height)
img.paste(logo.resize((lw,lh), Image.LANCZOS), (70, 60), logo.resize((lw,lh), Image.LANCZOS))
fw = f(62)
d.text((70+lw+20, 68), "Brand", font=fw, fill=WHITE)
bw = d.textlength("Brand", font=fw)
grad_text(img, (int(70+lw+20+bw), 68), "GEO", fw, GRAD_A, GRAD_B)
d = ImageDraw.Draw(img, "RGBA")
d.text((70+lw+20, 140), "The AI Visibility Platform", font=f(28, False), fill=GRAY)

hf = f(72)
while ImageDraw.Draw(img).textlength("Be the brand AI recommends.", font=hf) > W - 140:
    hf = f(hf.size - 2)
y = 250
d.text((70, y), "Be the brand ", font=hf, fill=WHITE)
xw = d.textlength("Be the brand ", font=hf)
grad_text(img, (int(70+xw), y), "AI recommends.", hf, GRAD_A, GRAD_B)
d = ImageDraw.Draw(img, "RGBA")
d.text((70, y+110), "Track and improve your visibility across ChatGPT, Gemini,", font=f(32, False), fill=GRAY)
d.text((70, y+156), "Claude, Perplexity and Meta AI.", font=f(32, False), fill=GRAY)

pills = ["Measure", "Track", "Analyze", "Optimize"]
pf = f(26); px = 70; py = H - 110
for p in pills:
    pw2 = d.textlength(p, font=pf) + 44
    d.rounded_rectangle([px, py, px+pw2, py+52], radius=26, fill=(17,17,28,255), outline=(255,255,255,26), width=2)
    d.text((px+22, py+13), p, font=pf, fill=GRAY)
    px += pw2 + 16
tw = d.textlength("getbrandgeo.com", font=f(30))
d.text((W-70-tw, 76), "getbrandgeo.com", font=f(30), fill=TEAL)

img.save(os.path.join(WEB, "images", "og-home.png"), "PNG")
print("saved og-home.png")
