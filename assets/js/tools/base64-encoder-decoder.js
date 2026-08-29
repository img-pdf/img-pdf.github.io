(function () {
  const input = document.getElementById("text-in");
  const output = document.getElementById("text-out");
  const encodeBtn = document.getElementById("encode-btn");
  const decodeBtn = document.getElementById("decode-btn");
  const copyBtn = document.getElementById("copy-btn");
  const swapBtn = document.getElementById("swap-btn");
  const statusLine = document.getElementById("status-line");

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    bytes.forEach(function (b) { binary += String.fromCharCode(b); });
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  encodeBtn.addEventListener("click", function () {
    try {
      output.value = utf8ToBase64(input.value);
      setStatus("Encoded.");
    } catch (err) {
      setStatus("Couldn't encode this text: " + err.message, true);
    }
  });

  decodeBtn.addEventListener("click", function () {
    try {
      output.value = base64ToUtf8(input.value.trim());
      setStatus("Decoded.");
    } catch (err) {
      output.value = "";
      setStatus("Invalid Base64 input — check for missing characters or padding.", true);
    }
  });

  swapBtn.addEventListener("click", function () {
    const tmp = input.value;
    input.value = output.value;
    output.value = tmp;
    setStatus("");
  });

  copyBtn.addEventListener("click", function () {
    if (!output.value) return;
    navigator.clipboard.writeText(output.value).then(function () {
      copyBtn.textContent = "Copied!";
      setTimeout(function () { copyBtn.textContent = "Copy"; }, 1500);
    });
  });
})();
