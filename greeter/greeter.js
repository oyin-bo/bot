// @ts-check
/// <reference types="xterm" />

async function greeter() {
  const terminal = initTerminal();
  terminal.terminal.focus();

  await delay(600);

  terminal.write('Greeter BOT');
  await delay(400); terminal.write(' for ');
  await delay(300); terminal.write('\x1B[38;5;51mBlueSky\x1B[0m');
  await delay(300); terminal.write('\r\n');
  await delay(900); terminal.write('\r\n');

  // TODO: check if user is logged in
  await delay(1300);
  terminal.write('BlueSky APP PASSWORD will be cached\r\n');
  terminal.write('  in your browser local storage.\r\n');
  terminal.write('\r\n');
  terminal.write('APP PWD> \x1B[38;5;3m');
  const val = await terminal.read();
  terminal.write('\x1B[0mAUTH: ' + val);

  while (true) {
    await delay(800);
    terminal.write('  ' + new Date() + '\r\n');
  }

  function initTerminal() {
    const termContainer = document.createElement('div');
    termContainer.className = 'terminalContainer';
    termContainer.style.cssText = `
  position: absolute;
  left: 0; top: 0;
  width: 100%; height: 100%;
  `;
    const termHost = document.createElement('div');
    termHost.className = 'terminalHost';
    termContainer.style.cssText = `
  position: relative;
  width: 100%; height: 100%;
  border: solid 1em transparent;
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

    var debounce;
    window.addEventListener('resize', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => fitAddon.fit(), 150);
    });

    return { read, write, terminal, fitAddon };

    function write(text) {
      return terminal.write(text);
    }

    function read() {
      return new Promise(resolve => {
        let buf = '';
        const dataSub = terminal.onData(data => {
          buf += data;
          terminal.write(data);
        });
        const keySub = terminal.onKey(e => {
          if (e.key === '\r') {
            dataSub.dispose();
            keySub.dispose();
            terminal.write('\r\n');
            resolve(buf);
          }
        });
      });
    }
  }

  function delay(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }
} greeter();