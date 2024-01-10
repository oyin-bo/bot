// @ts-check
/// <reference path="../../lib/types.d.ts" />

async function greeter() {
  const terminal = initXTerminal();
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





  function delay(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
  }
} greeter();