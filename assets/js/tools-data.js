/**
 * IMG-PDF tool registry.
 * `url: null` = page not built yet (shown in search as "coming soon", never linked).
 * Add the real url the moment a tool page ships — nothing else needs to change.
 */
window.IMGPDF_TOOLS = [
  // ---- Image tools ----
  { name: "Image Compressor", category: "Image", url: "/image-tools/image-compressor/", keywords: "compress reduce size jpg png webp", popular: true },
  { name: "Image Resizer", category: "Image", url: "/image-tools/image-resizer/", keywords: "resize dimensions width height", popular: true },
  { name: "Image Cropper", category: "Image", url: null, keywords: "crop cut trim", popular: true },
  { name: "Image Converter", category: "Image", url: null, keywords: "convert jpg png webp format" },
  { name: "Image Rotator", category: "Image", url: null, keywords: "rotate turn flip degrees" },
  { name: "Image Flipper", category: "Image", url: null, keywords: "flip mirror horizontal vertical" },
  { name: "Image Quality Adjuster", category: "Image", url: null, keywords: "quality adjust" },
  { name: "Image Grayscale", category: "Image", url: null, keywords: "grayscale black white" },
  { name: "Image Blur", category: "Image", url: null, keywords: "blur effect" },
  { name: "Image Pixelate", category: "Image", url: null, keywords: "pixelate mosaic" },
  { name: "Image Watermark", category: "Image", url: null, keywords: "watermark stamp logo" },
  { name: "Add Text to Image", category: "Image", url: null, keywords: "text caption overlay" },
  { name: "Image to Base64", category: "Image", url: null, keywords: "base64 encode image" },
  { name: "Base64 to Image", category: "Image", url: null, keywords: "base64 decode image" },
  { name: "Color Picker from Image", category: "Image", url: null, keywords: "color picker eyedropper hex" },
  { name: "Favicon Generator", category: "Image", url: null, keywords: "favicon ico generator" },
  { name: "Passport Photo Maker", category: "Image", url: null, keywords: "passport photo id" },
  { name: "Meme Generator", category: "Image", url: null, keywords: "meme text image" },
  { name: "Screenshot to Image", category: "Image", url: null, keywords: "screenshot capture" },
  { name: "EXIF Metadata Viewer/Remover", category: "Image", url: null, keywords: "exif metadata remove strip privacy" },

  // ---- PDF tools ----
  { name: "JPG to PDF", category: "PDF", url: "/pdf-tools/jpg-to-pdf/", keywords: "jpg pdf convert", popular: true },
  { name: "PNG to PDF", category: "PDF", url: null, keywords: "png pdf convert" },
  { name: "Merge PDF", category: "PDF", url: null, keywords: "merge combine join pdf", popular: true },
  { name: "Split PDF", category: "PDF", url: null, keywords: "split pdf separate" },
  { name: "Extract PDF Pages", category: "PDF", url: null, keywords: "extract pages pdf" },
  { name: "Rotate PDF", category: "PDF", url: null, keywords: "rotate pdf pages" },
  { name: "Delete PDF Pages", category: "PDF", url: null, keywords: "delete remove pages pdf" },
  { name: "Reorder PDF Pages", category: "PDF", url: null, keywords: "reorder rearrange pdf pages" },
  { name: "PDF Watermark", category: "PDF", url: null, keywords: "watermark pdf" },
  { name: "Add Text to PDF", category: "PDF", url: null, keywords: "text pdf edit" },
  { name: "PDF Page Screenshot", category: "PDF", url: null, keywords: "screenshot pdf page image" },

  // ---- Utilities ----
  { name: "Password Generator", category: "Utilities", url: "/utilities/password-generator/", keywords: "password generator secure random", popular: true },
  { name: "QR Code Generator", category: "Utilities", url: "/utilities/qr-code-generator/", keywords: "qr code generator", popular: true },
  { name: "Barcode Generator", category: "Utilities", url: null, keywords: "barcode generator" },
  { name: "UUID Generator", category: "Utilities", url: null, keywords: "uuid guid generator" },
  { name: "Hash Generator", category: "Utilities", url: null, keywords: "hash md5 sha1 sha256" },
  { name: "Base64 Encoder/Decoder", category: "Utilities", url: null, keywords: "base64 encode decode" },
  { name: "URL Encoder/Decoder", category: "Utilities", url: null, keywords: "url encode decode" },
  { name: "Timestamp Converter", category: "Utilities", url: null, keywords: "timestamp unix date convert" },
  { name: "Color Converter", category: "Utilities", url: null, keywords: "color hex rgb hsl convert" },

  // ---- Developer tools ----
  { name: "JSON Formatter", category: "Developer", url: "/developer-tools/json-formatter/", keywords: "json format beautify" },
  { name: "JSON Minifier", category: "Developer", url: null, keywords: "json minify compress" },
  { name: "HTML Formatter", category: "Developer", url: null, keywords: "html format beautify" },
  { name: "CSS Minifier", category: "Developer", url: null, keywords: "css minify compress" },
  { name: "JS Minifier", category: "Developer", url: null, keywords: "javascript js minify compress" },

  // ---- Text tools ----
  { name: "Text Case Converter", category: "Text", url: null, keywords: "case upper lower title convert" },
  { name: "Word Counter", category: "Text", url: null, keywords: "word count counter" },
  { name: "Character Counter", category: "Text", url: null, keywords: "character count counter" },
  { name: "Lorem Ipsum Generator", category: "Text", url: null, keywords: "lorem ipsum placeholder text" },
];
