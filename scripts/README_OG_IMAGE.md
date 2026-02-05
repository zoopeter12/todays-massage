# OG Image Generator

Python script to generate Open Graph (OG) images for social media sharing using PIL/Pillow.

## Features

- 1200x630px PNG format (optimal for social media platforms)
- Beautiful pink-to-purple gradient background
- Korean text support (Malgun Gothic font)
- Text shadow effects for better readability
- Decorative corner accents
- Production-ready quality (~27KB file size)

## Requirements

```bash
pip install Pillow
```

## Usage

### Generate the OG image

```bash
python scripts/generate-og-image.py
```

This will create: `C:/a/public/og-image.png`

### Test the image

Open `C:/a/public/test-og.html` in a browser to preview the image and see example meta tags.

## Customization

Edit `generate-og-image.py` to customize:

### Colors

```python
PINK = (255, 182, 193)      # Light pink
PURPLE = (147, 112, 219)    # Medium purple
```

### Text

```python
main_text = "오늘의마사지"
subtitle_text = "내 주변 마사지샵 예약"
```

### Font Sizes

```python
main_font = ImageFont.truetype(font_path, 120)      # Main title size
subtitle_font = ImageFont.truetype(font_path, 50)   # Subtitle size
```

### Dimensions

```python
WIDTH = 1200
HEIGHT = 630
```

## Meta Tags

Add these to your HTML `<head>` section:

```html
<!-- Open Graph -->
<meta property="og:title" content="오늘의마사지">
<meta property="og:description" content="내 주변 마사지샵 예약">
<meta property="og:image" content="https://yourdomain.com/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="오늘의마사지">
<meta name="twitter:description" content="내 주변 마사지샵 예약">
<meta name="twitter:image" content="https://yourdomain.com/og-image.png">
```

## Supported Platforms

This OG image works with:

- Facebook
- Twitter/X
- LinkedIn
- KakaoTalk
- Slack
- Discord
- WhatsApp
- Telegram

## Font Support

The script automatically detects and uses available Korean fonts:

**Windows:**
- Malgun Gothic (malgun.ttf)
- Malgun Gothic Bold (malgunbd.ttf)
- Gulim (gulim.ttc)
- Batang (batang.ttc)

**Linux:**
- Nanum Gothic Bold

**macOS:**
- Apple SD Gothic Neo

## File Structure

```
C:/a/
├── scripts/
│   ├── generate-og-image.py    # Main generator script
│   └── README_OG_IMAGE.md      # This file
└── public/
    ├── og-image.png            # Generated OG image
    └── test-og.html            # Test/preview page
```

## Troubleshooting

### Font not found error

If you get a font error, the script will fall back to the default font. To use Korean text properly, ensure you have a Korean font installed:

**Windows:** Malgun Gothic is included by default

**Linux:**
```bash
sudo apt-get install fonts-nanum
```

**macOS:** Korean fonts are included by default

### Unicode encoding error

This has been fixed in the script. If you encounter issues, ensure your terminal supports UTF-8 encoding.

## Production Deployment

1. Generate the image: `python scripts/generate-og-image.py`
2. Upload `public/og-image.png` to your web server
3. Add meta tags to your HTML
4. Test with [Facebook Debugger](https://developers.facebook.com/tools/debug/)
5. Test with [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## Performance

- **Generation time:** <1 second
- **File size:** ~27KB (optimized for fast loading)
- **Dimensions:** 1200x630px (standard OG size)
- **Format:** PNG with high quality (95%)

## License

Free to use and modify for the 오늘의마사지 platform.
