// @ts-check
/// <reference path="../../lib/types.d.ts" />

const oldXrpc = 'https://bsky.social/xrpc';
const newXrpc = 'https://bsky.network/xrpc';

greeter();

async function greeter() {

  const tty = agnosticTerminal();

  await delay(600);

  tty.write('Greeter BOT');
  await delay(400); tty.write(' for ');
  await delay(300); tty.blue(); tty.write('BlueSky'); tty.nocolor();
  await delay(300); tty.write('\r\n');
  await delay(900); tty.write('\r\n');

  try {


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
        tty.write(' of ');
        const mushroomMatch = String(oldLoginAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
        tty.blue();
        tty.write(' ' + mushroomMatch);
        tty.nocolor();
        tty.write('? [y]\r\n');
        const replyY = await tty.read();
        if (replyY && !/y/i.test(replyY || '')) authSession = undefined;
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

      oldLoginAtClient = new atproto.BskyAgent({
        service: oldXrpc,
        persistSession: (evt, sess) => {
          writeStored(sess);
          authSession = sess;
        }
      });
      patchBskyAgent(oldLoginAtClient);
      await oldLoginAtClient.login({ identifier: username, password });

      const mushroomMatch = String(oldLoginAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
      tty.blue();
      tty.write(' ' + mushroomMatch);
      tty.nocolor();
      tty.write(' host.\r\n\r\n');
    }

    tty.write('Determining latest account page:');
    const newClient = new atproto.BskyAgent({ service: newXrpc });
    patchBskyAgentWithCORSProxy(newClient);

    let lowCursor = (await newClient.com.atproto.sync.listRepos({})).data.cursor;
    let highCursor;
    tty.green();
    tty.write(' ' + lowCursor);
    while (true) {
      const twiceCursor = typeof lowCursor === 'string' ?
        String(Number(lowCursor) * 2) :
        lowCursor * 2;

      const nextDt = (await newClient.com.atproto.sync.listRepos({
        cursor: lowCursor
      })).data;

      if (nextDt?.repos?.length) {
        lowCursor = twiceCursor;
        tty.write(' ' + lowCursor);
      } else {
        highCursor = twiceCursor;
        tty.nocolor();
        tty.write(' ' + highCursor + '\r\n');
        break;
      }
    }

    while (Number(highCursor) - 1 > Number(lowCursor)) {
      let midCursor = String(Math.floor((Number(lowCursor) + Number(highCursor)) / 2));
      if (midCursor <= Number(lowCursor) + 1) break;
      if (midCursor >= Number(highCursor) - 1) break;

      const dt = (await newClient.com.atproto.sync.listRepos({
        cursor: midCursor
      })).data;
      if (dt.repos?.length) {
        lowCursor = midCursor;
        tty.green();
        tty.write(' [' + lowCursor + ']');
        tty.nocolor();
        tty.write('-' + highCursor);
      } else {
        highCursor = midCursor;
        tty.green();
        tty.write(' ' + String(lowCursor));
        tty.nocolor();
        tty.write('-[' + highCursor + ']');
      }
    }

    tty.write('\r\nDetermining the last created account {cursor: ' + lowCursor + ' }:');
    const latestDt = (await newClient.com.atproto.sync.listRepos({
      cursor: lowCursor
    })).data;
    const latestDID = latestDt.repos[latestDt.repos.length - 1].did;
    tty.write(' ' + latestDID);
    const repoDescr = (await newClient.com.atproto.repo.describeRepo({
      repo: latestDID
    })).data;
    tty.write(' ' + repoDescr.collections.join(',') + '\r\n');


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
}

function delay(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
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
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage?.getItem === 'function') {
      const stored = localStorage.getItem('bot-greeter-session');
      if (stored) return JSON.parse(stored);
    }
  } catch (err) {
    return;
  }
}

function writeStored(data) {
  if (typeof localStorage !== 'undefined' && typeof localStorage?.setItem === 'function')
    localStorage.setItem('bot-greeter-session', data == null ? '' : JSON.stringify(data));
}
