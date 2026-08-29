(function () {
  const input = document.getElementById("text-input");
  const wordCount = document.getElementById("word-count");
  const charCount = document.getElementById("char-count");
  const sentenceCount = document.getElementById("sentence-count");
  const paragraphCount = document.getElementById("paragraph-count");
  const readingTime = document.getElementById("reading-time");

  function update() {
    const text = input.value;
    const trimmed = text.trim();

    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    const sentences = trimmed ? (trimmed.match(/[.!?]+(\s|$)/g) || []).length || (trimmed ? 1 : 0) : 0;
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter(function (p) { return p.trim(); }).length : 0;
    const minutes = words / 200;

    wordCount.textContent = words;
    charCount.textContent = chars;
    sentenceCount.textContent = sentences;
    paragraphCount.textContent = paragraphs;
    readingTime.textContent = words === 0 ? "0 sec" : minutes < 1 ? Math.max(1, Math.round(minutes * 60)) + " sec" : minutes.toFixed(1) + " min";
  }

  input.addEventListener("input", update);
  update();
})();
