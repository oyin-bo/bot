// @ts-check
/// <reference path="../../lib/types.d.ts" />

async function greeter() {
  const tty = agnosticTerminal();

  await delay(600);

  tty.write('Greeter BOT');
  await delay(400); tty.write(' for ');
  await delay(300); tty.blue(); tty.write('BlueSky'); tty.nocolor();
  await delay(300); tty.write('\r\n');
  await delay(900); tty.write('\r\n');

  // TODO: check if user is logged in
  await delay(1300);
  tty.write('BlueSky APP PASSWORD will be cached\r\n');
  tty.write('  in your browser local storage.\r\n\r\n');
  tty.write(' APP USER>'); tty.green();
  const username = await tty.read();
  tty.nocolor();
  tty.write(' APP  PWD>'); tty.green();
  const password = await tty.read(true /* password */);
  tty.nocolor();
  tty.write(' connecting to BlueSky...');
  try {
    const aclients = await agnosticAtClient({ identifier: username, password });

    const mushroomMatch = String(aclients.authenticatedAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
    tty.write('Mushroom ');
    tty.blue();
    tty.write(mushroomMatch);
    tty.nocolor();
    tty.write('\r\n\r\n');

    console.log(aclients, aclients);
    for (const k in aclients) {
      window[k] = aclients[k];
    }

    const knownDIDs = {};
    let lastReport = Date.now();
    let sinceLastReport = 0;

    const fire = firehose({
      record: (op, commit, record) => {
        if (!knownDIDs[commit.repo]) {
          knownDIDs[commit.repo] = true;
          tty.write(commit.repo.split(':').slice(-1)[0][0]);
          sinceLastReport++;

          if (Date.now() - lastReport > 1000) {
            tty.blue();
            tty.write(' ' + sinceLastReport + 'p/s ');
            tty.nocolor();
            lastReport = Date.now();
            sinceLastReport = 0;
          }
        }
      }
    });

  } catch (error) {
    if (error.stack) {
      tty.write(
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

function agnosticAtClient(args) {
  // in order for xterm not to blow
  if (typeof global !== 'undefined' && global) global.self = {};
  else if (typeof globalThis !== 'undefined' && globalThis) globalThis.self = {};
  
  if (typeof window !== 'undefined' && window) return initAtClient(args);
  else return require('../../static/libs').initAtClient(args);
}

function agnosticTerminal() {
  let terminal = typeof window !== 'undefined' && window ?
    initXTerminal() : {
    write: (txt) => process.stdout.write(txt),
    read: (silent) => new Promise(resolve => {
      const readline = require('readline');
      const intf = readline.createInterface(
        process.stdin,
        process.stdout
      );
      intf.question('', answer => {
        resolve(answer)
      });
    }),
    red, green, blue, nocolor
  };

  return terminal;

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
}