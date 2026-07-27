/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Lets next/image serve SVGs through the optimizer.
    // Your DiceBear <Image> tags currently use `unoptimized`, which already
    // bypasses this — but keeping it configured means SVGs still work
    // correctly if that prop is ever removed, or if you use an <Image> for
    // an SVG elsewhere without `unoptimized`.
    dangerouslyAllowSVG: true,
    // Forces the optimizer to send SVGs with a strict CSP + as an attachment,
    // so an SVG response can't execute inline scripts in the browser. Since
    // your /api/avatar/[seed] route generates the SVGs itself (not user
    // upload), this is low-risk either way, but it's the safe default.
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

module.exports = nextConfig;