// @ts-check
/// <reference types="xterm" />

function greeter() {
  const termHost = document.createElement('div');
  termHost.style.cssText = `
  position: absolute;
  left: 0; top: 0;
  width: 100%; height: 100%;
  `;
  document.body.appendChild(termHost);

  /** @type {import('xterm').Terminal} */
  const term = new Terminal({ allowTransparency: true });
  term.open(termHost);
  term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');

} greeter;