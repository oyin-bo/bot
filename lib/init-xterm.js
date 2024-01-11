// @ts-check
/// <reference path="./types.d.ts" />

import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from 'xterm';

export function initXTerminal() {
  const termContainer = document.createElement('div');
  termContainer.className = 'terminalContainer';
  termContainer.style.cssText = `
  position: absolute;
  left: 0; top: 0;
  width: 100%; height: 100%;
  border: solid 1em transparent;
  box-sizing: border-box;
  `;
  const termHost = document.createElement('div');
  termHost.className = 'terminalHost';
  termHost.style.cssText = `
  position: relative;
  width: 100%; height: 100%;
  box-sizing: border-box;
  `;

  document.body.appendChild(termContainer);
  termContainer.appendChild(termHost);

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
    cursorStyle: 'block',
    disableStdin: false,
    fontSize: Math.round(sz.height),
    theme: {
      background: '#00000000'
    }
  });

  const fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);

  terminal.open(termHost);
  fitAddon.fit();

  var debounce;
  window.addEventListener('resize', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => fitAddon.fit(), 150);
  });

  terminal.focus();

  return { read, write, red, green, blue, nocolor };

  /**
   * @param {string} text
   */
  function write(text) {
    return terminal.write(text);
  }

  function red() {
    terminal.write('x1B[38;5;197m');
  }

  function green() {
    terminal.write('\x1B[38;5;3m');
  }

  function blue() {
    terminal.write('\x1B[38;5;51m');
  }

  function nocolor() {
    terminal.write('\x1B[0m');
  }

  /** @param {boolean} [silent] */
  function read(silent) {
    return new Promise(resolve => {
      let buf = '';
      const dataSub = terminal.onData(data => {
        buf += data = [...data].filter(ch =>
          ch.length > 1 ||
          ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) !== 0x7F
        ).join('');
        terminal.write(!silent ? data : data.replace(/./g, '*'));
      });
      const keySub = terminal.onKey(e => {
        if (e.key === '\r') {
          dataSub.dispose();
          keySub.dispose();
          terminal.write('\r\n');
          resolve(buf);
        } if (e.key === '\x7F') {
          if (buf) {
            const newBuf = buf.slice(0, buf.length - 1);
            buf = newBuf;
            terminal.write('\b \b');
          }
        }
      });
    });
  }
}