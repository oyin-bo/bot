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
  terminal.write(' APP USER>\x1B[38;5;3m');
  const username = await terminal.read();
  terminal.write('\x1B[0m');
  terminal.write(' APP  PWD>\x1B[38;5;3m');
  const password = await terminal.read(true /* password */);
  terminal.write('\x1B[0m');
  terminal.write(' connecting to BlueSky...');
  try {
    const aclients = await initAtClient({ identifier: username, password });

    const mushroomMatch = String(aclients.authenticatedAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
    terminal.write('Mushroom \x1B[38;5;51m' + mushroomMatch + '\x1B[0m\r\n');
    terminal.write('\r\n');

    console.log(aclients, aclients);
    for (const k in aclients) {
      window[k] = aclients[k];
    }

  } catch (error) {
    if (error.stack) {
      terminal.write(
        '\r\n\x1B[38;5;197m' + error.message + '\x1B[0m\r\n' + 
        (!error.stack ? '' :
          (error.stack.indexOf(error.message) === 0 ?
            error.stack.slice(error.message.length) :
            error.stack) + '\r\n'
        ));
    }
  }

  function initTerminal() {
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

  async function initAtClient({ identifier, password }) {
    /** @type {import('@atproto').BskyAgent} */
    const BskyAgent = (atproto.atproto || atproto).BskyAgent;

    const oldXrpc = 'https://bsky.social/xrpc';
    const newXrpc = 'https://bsky.network/xrpc';

    const oldAtClient = new BskyAgent({ service: oldXrpc });
    const res = await oldAtClient.login(
      { identifier, password }
    );

    const serviceURL =
      res?.data?.didDoc?.service?.find(svc => /pds/i.test(svc?.id || ''))?.serviceEndpoint;

    const authenticatedAtClient = new BskyAgent({ service: serviceURL });
    patchBskyAgentWithCORSProxy(authenticatedAtClient);
    await authenticatedAtClient.login({ identifier, password });

    const unaunthenticatedAtClient = new BskyAgent({ service: newXrpc });
    patchBskyAgentWithCORSProxy(unaunthenticatedAtClient);

    return { oldAtClient, authenticatedAtClient, unaunthenticatedAtClient };

    function patchBskyAgentWithCORSProxy(atClient) {
      atClient.com.atproto.sync._service.xrpc.baseClient.lex.assertValidXrpcOutput = function (lexUri, value, ...rest) {
        return true;
      };

      if (typeof window !== "undefined" && window) {
        const baseFetch = atClient.com.atproto.sync._service.xrpc.baseClient.fetch;
        atClient.com.atproto.sync._service.xrpc.baseClient.fetch = function (reqUri, ...args) {
          if (/(com.atproto.sync.listRepos)|(com.atproto.server.createSession)/.test(reqUri))
            reqUri = "https://corsproxy.io/?" + reqUri;
          return baseFetch.call(
            atClient.com.atproto.sync._service.xrpc.baseClient,
            reqUri,
            ...args
          );
        };
      }
    }

  }

  function delay(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }
} greeter();