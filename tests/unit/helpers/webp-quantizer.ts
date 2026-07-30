// Reads the quantizer index out of a lossy WebP's VP8 keyframe header.
//
// This exists because sharp can write an encode quality but cannot read one
// back: `sharp(file).metadata()` reports dimensions and format, never the
// quality the file was encoded at. Without a way to read it, an assertion about
// two images being encoded on equal terms can only check their dimensions,
// which is exactly the gap that let a 59-vs-82 quality split ship unnoticed.
//
// base_q_idx is the frame-level quantizer libwebp derives from the `quality`
// option. The mapping is monotonic and content-independent — quality 59, 78 and
// 82 give base_q_idx 46, 30 and 24 for both slider frames — so equal
// base_q_idx means equal encode quality regardless of what the photos contain.
//
// The VP8 bitstream format is frozen (RFC 6386), so this parser does not track
// a moving target.

/**
 * Minimal VP8 boolean-entropy decoder, per RFC 6386 section 7.
 *
 * Every field in the frame header is coded with this decoder, so the header
 * cannot be read by slicing bytes — the fields must be decoded in order to
 * reach base_q_idx.
 */
class BoolDecoder {
  private range = 255;
  private value: number;
  private pos = 2;
  private bitCount = 0;

  constructor(private readonly buf: Uint8Array) {
    this.value = (buf[0] << 8) | buf[1];
  }

  /** Decode one boolean with the given probability (128 = uniform). */
  bit(prob = 128): number {
    const split = 1 + (((this.range - 1) * prob) >> 8);
    const bigSplit = split << 8;
    let ret = 0;
    if (this.value >= bigSplit) {
      ret = 1;
      this.range -= split;
      this.value -= bigSplit;
    } else {
      this.range = split;
    }
    while (this.range < 128) {
      this.value <<= 1;
      this.range <<= 1;
      if (++this.bitCount === 8) {
        this.bitCount = 0;
        this.value |= this.buf[this.pos++] ?? 0;
      }
    }
    return ret;
  }

  /** Decode an n-bit unsigned literal, most significant bit first. */
  literal(n: number): number {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | this.bit();
    return v;
  }
}

/** Locate a RIFF chunk's body by its four-character code. */
function findChunk(buf: Buffer, fourcc: string): Buffer | null {
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  let off = 12; // past "RIFF", the file size, and "WEBP"
  while (off + 8 <= buf.length) {
    const tag = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    const body = off + 8;
    if (tag === fourcc) return buf.subarray(body, body + size);
    off = body + size + (size & 1); // chunks are padded to even length
  }
  return null;
}

/**
 * Return the base quantizer index of a lossy WebP, 0–127.
 *
 * Lower means higher quality. Throws on a lossless (VP8L) file, which has no
 * quantizer at all — comparing one against a lossy file would be meaningless,
 * so it fails loudly rather than returning a number that invites a false pass.
 */
export function webpBaseQIndex(buf: Buffer): number {
  if (findChunk(buf, "VP8L")) {
    throw new Error("lossless WebP (VP8L) carries no quantizer index");
  }
  const vp8 = findChunk(buf, "VP8 ");
  if (!vp8) throw new Error("not a lossy WebP: no VP8 chunk");

  // 3-byte frame tag, 3-byte start code, then 2+2 bytes of dimensions.
  const HEADER_BYTES = 10;
  const firstPartSize = (vp8.readUInt32LE(0) >> 5) & 0x7ffff;
  const partition0 = vp8.subarray(
    HEADER_BYTES,
    HEADER_BYTES + Math.min(firstPartSize, 64),
  );

  const d = new BoolDecoder(partition0);
  d.literal(1); // color_space
  d.literal(1); // clamping_type

  if (d.literal(1)) {
    // segmentation_enabled
    const updateMap = d.literal(1);
    const updateData = d.literal(1);
    if (updateData) {
      d.literal(1); // abs_delta
      for (let i = 0; i < 4; i++) if (d.literal(1)) (d.literal(7), d.literal(1));
      for (let i = 0; i < 4; i++) if (d.literal(1)) (d.literal(6), d.literal(1));
    }
    if (updateMap) for (let i = 0; i < 3; i++) if (d.literal(1)) d.literal(8);
  }

  d.literal(1); // filter_type
  d.literal(6); // loop_filter_level
  d.literal(3); // sharpness_level

  if (d.literal(1)) {
    // loop_filter_adj_enable
    if (d.literal(1)) {
      for (let i = 0; i < 8; i++) if (d.literal(1)) (d.literal(6), d.literal(1));
    }
  }

  d.literal(2); // log2_nbr_of_dct_partitions
  const baseQIndex = d.literal(7);

  if (baseQIndex < 0 || baseQIndex > 127) {
    throw new Error(`parsed an out-of-range quantizer index: ${baseQIndex}`);
  }
  return baseQIndex;
}
