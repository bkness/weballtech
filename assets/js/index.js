function copyInstall(btn) {
  navigator.clipboard.writeText('npm install -g forged-cli')
    .then(() => {
      btn.textContent = 'COPIED';
      setTimeout(() => btn.textContent = 'COPY', 2000);
    })
    .catch(() => {
      btn.textContent = 'FAILED';
      setTimeout(() => btn.textContent = 'COPY', 2000);
    });
}

fetch('https://api.npmjs.org/downloads/point/last-month/forged-cli')
  .then(r => r.json())
  .then(d => {
    const total = d.downloads;
    document.getElementById('dl-count').textContent = total >= 1000
      ? (total / 1000).toFixed(1) + 'k+'
      : total + '+';
  })
  .catch(() => {
    document.getElementById('dl-count').textContent = '400+';
  });
