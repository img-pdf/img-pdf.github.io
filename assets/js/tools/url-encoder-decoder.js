(function () {
  const input = document.getElementById("text-in");
  const output = document.getElementById("text-out");
  const encodeBtn = document.getElementById("encode-btn");
  const decodeBtn = document.getElementById("decode-btn");
  const copyBtn = document.getElementById("copy-btn");
  const swapBtn = document.getElementById("swap-btn");
  const statusLine = document.getElementById("status-line");
  const componentToggle = document.getElementById("component-toggle");

  function setStatus(msg, isError) {
    statusLine.textContent = msg || "";
    statusLine.classList.toggle("is-error", !!isError);
  }

  encodeBtn.addEventListener("click", function () {
    try {
      output.value = componentToggle.checked ? encodeURIComponent(input.value) : encodeURI(input.value);
      setStatus("Encoded.");
    } catch (err) {
      setStatus("Couldn't encode this text: " + err.message, true);
    }
  });

  decodeBtn.addEventListener("click", function () {
    try {
      output.value = componentToggle.checked ? decodeURIComponent(input.value) : decodeURI(input.value);
      setStatus("Decoded.");
    } catch (err) {
      output.value = "";
      setStatus("Invalid encoded input — check for a stray % character.", true);
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
