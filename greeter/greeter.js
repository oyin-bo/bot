// @ts-check
/// <reference types="xterm" />

async function greeter() {
  const termHost = document.createElement('div');
  termHost.style.cssText = `
  position: absolute;
  left: 0; top: 0;
  width: 100%; height: 100%;
  padding: 1em;
  `;
  document.body.appendChild(termHost);

  const measure = document.createElement('div');
  measure.style.cssText = `
  font-size: 2vh;
  z-index: -1;
  position: absolute;
  opacity: 0;
  `;
  measure.textContent = 'M';
  document.body.appendChild(measure);
  const sz = measure.getBoundingClientRect();
  document.body.removeChild(measure);

  /** @type {import('xterm').Terminal} */
  const terminal = new Terminal({
    allowTransparency: true,
    cursorBlink: true,
    cursorStyle: 'underline',
    disableStdin: false,
    fontSize: Math.round(sz.height),
    theme: {
      background: '#00000000'
    }
  });

  const fitAddon = new (FitAddon.FitAddon || FitAddon)();
  terminal.loadAddon(fitAddon);

  terminal.open(termHost);
  fitAddon.fit();
  terminal.focus();

  await new Promise(resolve => setTimeout(resolve, 600));

  terminal.write('Greeter BOT for \x1B[1;3;31mBlueSky\x1B[0m $ ');

} greeter();