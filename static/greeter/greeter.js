// @ts-check
/// <reference path="../../lib/types.d.ts" />

const { BskyAgent } = require('@atproto/api');

const oldXrpc = 'https://bsky.social/xrpc';
const newXrpc = 'https://bsky.network/xrpc';

async function greeter() {
  const tty = agnosticTerminal();

  await delay(600);

  tty.write('Greeter BOT');
  await delay(400); tty.write(' for ');
  await delay(300); tty.blue(); tty.write('BlueSky'); tty.nocolor();
  await delay(300); tty.write('\r\n');
  await delay(900); tty.write('\r\n');

  let oldLoginAtClient = new atproto.BskyAgent({
    service: oldXrpc,
    persistSession: (evt, sess) => {
      writeStored(sess);
      authSession = sess;
    }
  });
  patchBskyAgent(oldLoginAtClient)
  let authSession = readStored();
  try {
    const sessReply = await oldLoginAtClient.resumeSession(readStored());
    if (!sessReply?.data?.handle) {
      authSession = undefined;
    } else {
      tty.write(' continue as ');
      tty.green(); tty.write(sessReply.data.handle); tty.nocolor();
      tty.write('? [y]\r\n');
      const replyY = await tty.read();
      if (!/y/i.test(replyY || '')) authSession = undefined;
   }
  } catch (error) {
    authSession = undefined;
  }

  if (!authSession) {
    tty.write('BlueSky login:\r\n');
    tty.green();
    const username = await tty.read();
    tty.nocolor();
  
    tty.write('   and password:\r\n');
    tty.green();
    const password = await tty.read(true /* password */);
    tty.nocolor();

    if (!username || !password) {
      tty.red();
      tty.write('NO username or password provided\r\n');
      tty.nocolor();
      return;
    }

    tty.write(' connecting to BlueSky...');
  try {
    oldLoginAtClient = new BskyAgent({
      service: oldXrpc,
      persistSession: (evt, sess) => {
        writeStored(sess);
        authSession = sess;
      }
    });
    patchBskyAgent(oldLoginAtClient);
    await oldLoginAtClient.login({ identifier: username, password });

    const mushroomMatch = String(oldLoginAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
    tty.write('Host: ');
    tty.blue();
    tty.write(mushroomMatch);
    tty.nocolor();
    tty.write('\r\n\r\n');

    tty.write('Determining latest created account:');
    const newClient = new BskyAgent({ service: newXrpc });
    patchBskyAgentWithCORSProxy(newClient);
    const reposFirst = await newClient.com.atproto.sync.listRepos({});
    tty.write(reposFirst.data.cursor + '\r\n');

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

/** @returns {ReturnType<import('../../lib/init-at-client').initAtClient>} */
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

function readStored() {
  if (typeof localStorage !== 'undefined' && typeof localStorage?.getItem === 'function') {
    const stored = localStorage.getItem('bot-greeter-session');
    if (stored) return JSON.parse(stored);
  }
}

function writeStored(data) {
  if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function')
    localStorage.setItem('bot-greeter-session', JSON.stringify(data));
}
