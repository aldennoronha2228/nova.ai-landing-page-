import struct
import zlib

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

class PNGImage:
    def __init__(self, width, height, pixels):
        self.width = width
        self.height = height
        self.pixels = pixels


def read_chunks(data):
    offset = 8
    while offset < len(data):
        length = struct.unpack('!I', data[offset:offset+4])[0]
        offset += 4
        chunk_type = data[offset:offset+4]
        offset += 4
        chunk_data = data[offset:offset+length]
        offset += length
        crc = data[offset:offset+4]
        offset += 4
        yield chunk_type, chunk_data


def unfilter_scanline(filter_type, raw_row, prev_row, bpp):
    result = bytearray(raw_row)
    if filter_type == 0:
        return result
    if filter_type == 1:
        for i in range(len(result)):
            left = result[i - bpp] if i >= bpp else 0
            result[i] = (result[i] + left) & 0xFF
        return result
    if filter_type == 2:
        for i in range(len(result)):
            above = prev_row[i] if prev_row else 0
            result[i] = (result[i] + above) & 0xFF
        return result
    if filter_type == 3:
        for i in range(len(result)):
            left = result[i - bpp] if i >= bpp else 0
            above = prev_row[i] if prev_row else 0
            result[i] = (result[i] + ((left + above) >> 1)) & 0xFF
        return result
    if filter_type == 4:
        def paeth(a, b, c):
            p = a + b - c
            pa = abs(p - a)
            pb = abs(p - b)
            pc = abs(p - c)
            if pa <= pb and pa <= pc:
                return a
            if pb <= pc:
                return b
            return c
        for i in range(len(result)):
            left = result[i - bpp] if i >= bpp else 0
            above = prev_row[i] if prev_row else 0
            upper_left = prev_row[i - bpp] if (prev_row and i >= bpp) else 0
            result[i] = (result[i] + paeth(left, above, upper_left)) & 0xFF
        return result
    raise ValueError(f"Unknown filter type: {filter_type}")


def read_png(path):
    with open(path, 'rb') as f:
        data = f.read()
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError('Not a PNG file')
    chunks = list(read_chunks(data))
    ihdr = None
    idat_data = b''
    for ctype, cdata in chunks:
        if ctype == b'IHDR':
            ihdr = cdata
        elif ctype == b'IDAT':
            idat_data += cdata
    if ihdr is None:
        raise ValueError('Missing IHDR chunk')
    width, height, bitdepth, color_type, comp, filter_method, interlace = struct.unpack('!IIBBBBB', ihdr)
    if bitdepth != 8:
        raise ValueError('Unsupported bit depth')
    if color_type not in (2, 6):
        raise ValueError('Unsupported color type')
    decompressed = zlib.decompress(idat_data)
    bpp = 3 if color_type == 2 else 4
    stride = width * bpp
    pixels = bytearray(width * height * 4)
    offset = 0
    prev_row = None
    for y in range(height):
        filter_type = decompressed[offset]
        offset += 1
        raw_row = decompressed[offset:offset + stride]
        offset += stride
        row = unfilter_scanline(filter_type, raw_row, prev_row, bpp)
        prev_row = row
        for x in range(width):
            row_offset = x * bpp
            rgba_offset = (y * width + x) * 4
            if color_type == 2:
                pixels[rgba_offset:rgba_offset+4] = bytes((row[row_offset], row[row_offset+1], row[row_offset+2], 255))
            else:
                pixels[rgba_offset:rgba_offset+4] = bytes((row[row_offset], row[row_offset+1], row[row_offset+2], row[row_offset+3]))
    return PNGImage(width, height, pixels)


def write_png(path, width, height, pixels):
    def chunk(tag, data):
        return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data) & 0xffffffff)
    ihdr = struct.pack('!IIBBBBB', width, height, 8, 6, 0, 0, 0)
    raw = bytearray()
    for y in range(height):
        raw.append(0)
        raw.extend(pixels[y * width * 4:(y + 1) * width * 4])
    compressed = zlib.compress(bytes(raw), level=9)
    with open(path, 'wb') as f:
        f.write(PNG_SIGNATURE)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', compressed))
        f.write(chunk(b'IEND', b''))


def background_pixel(x, y, width, height):
    cx = width / 2
    cy = height / 2
    dx = (x - cx) / cx
    dy = (y - cy) / cy
    dist = (dx * dx * 1.35 + dy * dy) ** 0.5
    base = 12 + max(0, (1 - dist)) * 90
    r = int(base * 0.14)
    g = int(base * 0.20)
    b = int(base * 0.42)
    if dist < 0.5:
        r = min(255, r + int((0.5 - dist) * 90))
        g = min(255, g + int((0.5 - dist) * 110))
        b = min(255, b + int((0.5 - dist) * 140))
    return r, g, b, 255


def blend_pixel(bg_rgba, fg_rgba):
    fr, fg, fb, fa = fg_rgba
    br, bg, bb, ba = bg_rgba
    alpha = fa / 255.0
    inv = 1 - alpha
    return (
        int(fr * alpha + br * inv),
        int(fg * alpha + bg * inv),
        int(fb * alpha + bb * inv),
        255,
    )


def compose_share_image(input_path, output_path):
    src = read_png(input_path)
    width, height = 1200, 630
    canvas = bytearray(width * height * 4)
    for y in range(height):
        for x in range(width):
            canvas[(y * width + x) * 4:(y * width + x) * 4 + 4] = bytes(background_pixel(x, y, width, height))
    logo_w, logo_h = src.width, src.height
    start_x = (width - logo_w) // 2
    start_y = (height - logo_h) // 2
    for y in range(logo_h):
        for x in range(logo_w):
            idx = (y * logo_w + x) * 4
            fg = tuple(src.pixels[idx:idx+4])
            if fg[3] == 0:
                continue
            bg_idx = ((start_y + y) * width + (start_x + x)) * 4
            bg = tuple(canvas[bg_idx:bg_idx+4])
            canvas[bg_idx:bg_idx+4] = bytes(blend_pixel(bg, fg))
    write_png(output_path, width, height, canvas)


def compose_share_image_small(input_path, output_path):
    src = read_png(input_path)
    width, height = 512, 512
    canvas = bytearray(width * height * 4)
    for y in range(height):
        for x in range(width):
            canvas[(y * width + x) * 4:(y * width + x) * 4 + 4] = bytes(background_pixel(x, y, width, height))
    logo_w, logo_h = src.width, src.height
    start_x = (width - logo_w) // 2
    start_y = (height - logo_h) // 2
    for y in range(logo_h):
        for x in range(logo_w):
            idx = (y * logo_w + x) * 4
            fg = tuple(src.pixels[idx:idx+4])
            if fg[3] == 0:
                continue
            bg_idx = ((start_y + y) * width + (start_x + x)) * 4
            bg = tuple(canvas[bg_idx:bg_idx+4])
            canvas[bg_idx:bg_idx+4] = bytes(blend_pixel(bg, fg))
    write_png(output_path, width, height, canvas)


def main():
    compose_share_image('public/nova-logo-n.png', 'public/og-image.png')
    compose_share_image_small('public/nova-logo-n.png', 'public/og-image-small.png')
    print('Updated public/og-image.png and public/og-image-small.png from nova-logo-n.png')

if __name__ == '__main__':
    main()
