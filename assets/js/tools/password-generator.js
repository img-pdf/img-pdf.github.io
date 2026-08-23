(function () {
  const output = document.getElementById("output-text");
  const copyBtn = document.getElementById("copy-btn");
  const lengthSlider = document.getElementById("length");
  const lengthValue = document.getElementById("length-value");
  const generateBtn = document.getElementById("generate-btn");
  const strengthFill = document.getElementById("strength-fill");
  const strengthLabel = document.getElementById("strength-label");
  const checks = {
    upper: document.getElementById("chk-upper"),
    lower: document.getElementById("chk-lower"),
    numbers: document.getElementById("chk-numbers"),
    symbols: document.getElementById("chk-symbols"),
  };

  const SETS = {
    upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
    lower: "abcdefghijkmnpqrstuvwxyz",
    numbers: "23456789",
    symbols: "!@#$%^&*()-_=+[]{}",
  };

  function randomInt(max) {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function generate() {
    const length = parseInt(lengthSlider.value, 10);
    let pool = "";
    Object.keys(checks).forEach(function (key) {
      if (checks[key].checked) pool += SETS[key];
    });

    if (!pool) {
      output.textContent = "Select at least one character type";
      strengthFill.style.width = "0%";
      strengthLabel.textContent = "";
      return;
    }

    let pwd = "";
    for (let i = 0; i < length; i++) {
      pwd += pool[randomInt(pool.length)];
    }
    output.textContent = pwd;
    updateStrength(length, pool.length);
  }

  function updateStrength(length, poolSize) {
    const entropy = Math.log2(Math.pow(poolSize, length));
    let pct, color, label;
    if (entropy < 40) { pct = 25; color = "var(--danger)"; label = "Weak"; }
    else if (entropy < 65) { pct = 55; color = "var(--star)"; label = "Okay"; }
    else if (entropy < 90) { pct = 80; color = "var(--accent)"; label = "Strong"; }
    else { pct = 100; color = "var(--good)"; label = "Very strong"; }
    strengthFill.style.width = pct + "%";
    strengthFill.style.background = color;
    strengthLabel.textContent = label + " · ~" + Math.round(entropy) + " bits of entropy";
  }

  lengthSlider.addEventListener("input", function () {
    lengthValue.textContent = lengthSlider.value;
    generate();
  });
  Object.values(checks).forEach(function (chk) {
    chk.addEventListener("change", generate);
  });
  generateBtn.addEventListener("click", generate);

  copyBtn.addEventListener("click", function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("is-copied");
      setTimeout(function () {
        copyBtn.textContent = "Copy";
        copyBtn.classList.remove("is-copied");
      }, 1500);
    });
  });

  generate();
})();
