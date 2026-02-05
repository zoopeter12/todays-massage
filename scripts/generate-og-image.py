#!/usr/bin/env python3
"""
OG Image Generator for 오늘의마사지 Platform
Generates a 1200x630px PNG image with gradient background and Korean text.
"""

from PIL import Image, ImageDraw, ImageFont
import os


def create_gradient(width, height, start_color, end_color):
    """Create a vertical gradient image."""
    base = Image.new('RGB', (width, height), start_color)
    top = Image.new('RGB', (width, height), end_color)
    mask = Image.new('L', (width, height))
    mask_data = []

    for y in range(height):
        alpha = int(255 * (y / height))
        mask_data.extend([alpha] * width)

    mask.putdata(mask_data)
    base.paste(top, (0, 0), mask)
    return base


def add_text_with_shadow(draw, text, position, font, text_color, shadow_color, shadow_offset=3):
    """Add text with shadow effect."""
    x, y = position
    # Draw shadow
    draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
    # Draw main text
    draw.text((x, y), text, font=font, fill=text_color)


def generate_og_image():
    """Generate the OG image for 오늘의마사지 platform."""
    # Image dimensions
    WIDTH = 1200
    HEIGHT = 630

    # Colors
    PINK = (255, 182, 193)      # Light pink
    PURPLE = (147, 112, 219)    # Medium purple
    WHITE = (255, 255, 255)
    SHADOW = (0, 0, 0, 100)

    # Create gradient background (pink to purple)
    img = create_gradient(WIDTH, HEIGHT, PINK, PURPLE)
    draw = ImageDraw.Draw(img, 'RGBA')

    # Try to use system fonts that support Korean
    # Common Korean fonts on Windows
    korean_fonts = [
        'C:/Windows/Fonts/malgun.ttf',      # Malgun Gothic
        'C:/Windows/Fonts/malgunbd.ttf',    # Malgun Gothic Bold
        'C:/Windows/Fonts/gulim.ttc',       # Gulim
        'C:/Windows/Fonts/batang.ttc',      # Batang
        '/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf',  # Linux
        '/System/Library/Fonts/AppleSDGothicNeo.ttc',  # macOS
    ]

    # Find available font
    main_font = None
    subtitle_font = None

    for font_path in korean_fonts:
        if os.path.exists(font_path):
            try:
                main_font = ImageFont.truetype(font_path, 120)
                subtitle_font = ImageFont.truetype(font_path, 50)
                print(f"Using font: {font_path}")
                break
            except Exception as e:
                print(f"Error loading {font_path}: {e}")
                continue

    # Fallback to default font if no Korean font found
    if main_font is None:
        print("Warning: No Korean font found. Using default font.")
        main_font = ImageFont.load_default()
        subtitle_font = ImageFont.load_default()

    # Main text: "오늘의마사지"
    main_text = "오늘의마사지"

    # Get text bounding box for centering
    main_bbox = draw.textbbox((0, 0), main_text, font=main_font)
    main_width = main_bbox[2] - main_bbox[0]
    main_height = main_bbox[3] - main_bbox[1]

    main_x = (WIDTH - main_width) // 2
    main_y = (HEIGHT - main_height) // 2 - 50

    # Draw main text with shadow
    add_text_with_shadow(
        draw,
        main_text,
        (main_x, main_y),
        main_font,
        WHITE,
        (0, 0, 0, 150),
        shadow_offset=5
    )

    # Subtitle: "내 주변 마사지샵 예약"
    subtitle_text = "내 주변 마사지샵 예약"

    subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=subtitle_font)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]

    subtitle_x = (WIDTH - subtitle_width) // 2
    subtitle_y = main_y + main_height + 40

    # Draw subtitle with shadow
    add_text_with_shadow(
        draw,
        subtitle_text,
        (subtitle_x, subtitle_y),
        subtitle_font,
        WHITE,
        (0, 0, 0, 120),
        shadow_offset=3
    )

    # Add decorative elements (optional rounded corners on corners)
    corner_radius = 20
    corner_color = (255, 255, 255, 50)

    # Top-left corner accent
    draw.ellipse([20, 20, 80, 80], fill=corner_color)

    # Bottom-right corner accent
    draw.ellipse([WIDTH-80, HEIGHT-80, WIDTH-20, HEIGHT-20], fill=corner_color)

    # Save the image
    output_path = "C:/a/public/og-image.png"
    img.save(output_path, 'PNG', quality=95)
    print(f"\n[SUCCESS] OG image successfully generated!")
    print(f"[INFO] Saved to: {output_path}")
    print(f"[INFO] Dimensions: {WIDTH}x{HEIGHT}px")

    return output_path


if __name__ == "__main__":
    try:
        generate_og_image()
    except Exception as e:
        print(f"[ERROR] Error generating OG image: {e}")
        import traceback
        traceback.print_exc()
