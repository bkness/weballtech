function copyCmd(btn, text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      btn.textContent = '✓ copied';
      setTimeout(() => btn.textContent = 'copy', 1500);
    })
    .catch(() => {
      btn.textContent = 'failed';
      setTimeout(() => btn.textContent = 'copy', 1500);
    });
}
