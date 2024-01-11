// @ts-check
/// <reference path="../../lib/types.d.ts" />

const oldXrpc = 'https://bsky.social/xrpc';
const newXrpc = 'https://bsky.network/xrpc';

greeter();

async function greeter() {

  const tty = agnosticTerminal();

  /** @type {import('@atproto/api').BskyAgent} */
  let oldLoginAtClient;
  /** @type {import('@atproto/api').BskyAgent} */
  let newClient;
  /** @type {import('@atproto/api').BskyAgent} */
  let olderClient;

  tty.write('Greeter BOT for '); tty.blue(); tty.write('BlueSky'); tty.nocolor(); tty.write('\r\n');
  try {
    oldLoginAtClient = new atproto.BskyAgent({
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
      tty.write('\r\n');
      if (!sessReply?.data?.handle) {
        authSession = undefined;
      } else {
        tty.write(' continue as ');
        tty.green(); tty.write(sessReply.data.handle); tty.nocolor();
        tty.write(' of ');
        const mushroomMatch = String(oldLoginAtClient.pdsUrl).replace(/^https?:\/\//, '').split('.')[0];
        tty.blue();
        tty.write(mushroomMatch);
        tty.nocolor();
        tty.write('? [y]\r\n');
        const replyY = await tty.read();
        if (replyY && !/y/i.test(replyY || '')) authSession = undefined;
      }
    } catch (error) {
      tty.write('\r\n');
      authSession = undefined;
    }

    if (!authSession) {
      tty.write('BlueSky login:\r\n');
      tty.green();
      const username = await tty.read();
      tty.nocolor();
  
      tty.write(' and password:\r\n');
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

    olderClient = new atproto.BskyAgent({
      service: oldXrpc
    });
    patchBskyAgent(olderClient);


    tty.write('Determining latest account page:');
    newClient = new atproto.BskyAgent({ service: newXrpc });
    patchBskyAgentWithCORSProxy(newClient);

    const firstSlice = (await newClient.com.atproto.sync.listRepos({})).data;
    let lowDt = firstSlice;
    /** @type {*} */
    let lowCursor = lowDt.cursor;
    let highCursor;
    tty.green();
    tty.write(' ' + lowCursor);
    while (true) {
      /** @type {string} */
      const twiceCursor = typeof lowCursor === 'string' ?
        String(Number(lowCursor) * 2) :
        /** @type {*} */(lowCursor * 2);

      const nextDt = (await newClient.com.atproto.sync.listRepos({
        cursor: twiceCursor
      })).data;

      if (nextDt?.repos?.length) {
        lowCursor = twiceCursor;
        lowDt = nextDt;
        tty.write(' ' + lowCursor);
      } else {
        highCursor = twiceCursor;
        tty.nocolor();
        tty.write(' ' + highCursor + '\r\n');
        break;
      }
    }

    tty.write('Finding the exact youngest account...');

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

    tty.write('\r\nThe last created account {cursor: ' + lowCursor + '}: ');
    const latestDt = (await newClient.com.atproto.sync.listRepos({
      cursor: lowCursor
    })).data;
    tty.write(latestDt.repos[latestDt.repos.length - 1].did + '\r\n\r\n');

    tty.write('Finding your own last post with greeting...');
    const ownRepoHead = (await oldLoginAtClient.com.atproto.sync.getHead({ did: oldLoginAtClient.session?.did })).data;
    const ownRepoDescr = (await oldLoginAtClient.com.atproto.repo.describeRepo({ repo: oldLoginAtClient.session?.did })).data;

    /** @type {import('@atproto/api').AppBskyFeedPost.Record | undefined} */
    let lastGreetPost;
    let lastPostCursor;
    for await (const postArray of iterateRecentPosts(oldLoginAtClient.session?.did)) {
      for (const post of postArray) {
        if (/welcome|greet|ndewo|kedu|вітаю/i.test(post.text || '') && post.facets?.length) {
          lastGreetPost = post;
          break;
        }
      }
    }

    /** @type {number} */
    let greetFirstPostersAfter;
    if (lastGreetPost) {
      tty.green();
      tty.write(' ' + lastGreetPost.text);
      tty.nocolor();
      tty.write(' ' + lastGreetPost.createdAt + '\r\n\r\n');
      greetFirstPostersAfter = new Date(lastGreetPost.createdAt).getTime();
    } else {
      tty.write(' no greetings found yet, starting fresh!\r\n\r\n');
      greetFirstPostersAfter = Date.now() - 1000 * 60 * 60 * 24 * 2; // last 2 days
    }

    tty.write('Filtering all accounts that posted only after ' + new Date(greetFirstPostersAfter).toLocaleString() + '...');

    const pageSize = Math.floor(firstSlice.repos.length * 0.9);

    /** @type {{ did: string, handle: string, posts: import('@atproto/api').AppBskyFeedPost.Record[] }[]} */
    let firstPosters = [];
    let happyTalkerStretchCount = 0;
    for await (const didArray of iterateRecentAccounts(lowCursor, pageSize)) {
      for (const did of didArray) {
        let unknownDID = true;
        try {
          const repoDescr = (await olderClient.com.atproto.repo.describeRepo({ repo: did })).data;
          tty.write(' ');
          tty.green();
          tty.write(repoDescr.handle);
          tty.nocolor();

          unknownDID = false;

          /** @type {import('@atproto/api').AppBskyFeedPost.Record[] | undefined} */
          let postArray;
          let oldPosts = false;
          for await (const postArrayEntry of iterateRecentPosts(did)) {
            if (postArray) postArray = postArray.concat(postArrayEntry);
            else postArray = postArrayEntry;

            const earliestPost = postArrayEntry[postArrayEntry.length - 1];
            if (new Date(earliestPost.createdAt).getTime() < greetFirstPostersAfter) {
              oldPosts = true;
              break;
            }
          }

          if (!postArray?.length) {
            let oldestRecord;
            try {

              /** @type {import('@atproto/api').AppBskyFeedLike.Record[] | undefined} */
              const likeRecords = !repoDescr.collections?.includes('app.bsky.feed.like') ? undefined :
                (await olderClient.com.atproto.repo.listRecords({
                  collection: 'app.bsky.feed.like',
                  repo: did
                }))?.data?.records?.map(r => r.value);

              if (likeRecords?.length) {
                oldestRecord = likeRecords.reduce((oldest, current) =>
                  Math.min(new Date(current.createdAt).getTime(), oldest),
                  new Date(likeRecords[0].createdAt).getTime());
              }

            } catch (errorProfile) {
            }

            tty.write(
              oldestRecord ? ' silent since ' + new Date(oldestRecord).toLocaleDateString() + '\r\n' :
              ' silent.\r\n');

            happyTalkerStretchCount = 0;
            continue;
          }

          if (oldPosts) {
            tty.write(' older account: posted ' + new Date(postArray[postArray.length - 1].createdAt).toLocaleDateString() + '\r\n');
            happyTalkerStretchCount++;
            if (happyTalkerStretchCount >= 5)
              break;
            else continue;
          }

          const mostRecentDate = new Date(postArray[0].createdAt).toLocaleDateString();
          const earliestDate = new Date(postArray[postArray.length - 1].createdAt).toLocaleDateString();

          tty.write(' is a new poster/' + postArray.length);

          if (earliestDate === mostRecentDate) tty.write(' on ' + earliestDate + '\r\n');
          else tty.write(' on ' + earliestDate + '..' + mostRecentDate + '\r\n');

          firstPosters.push({ did, handle: repoDescr.handle, posts: postArray });
          happyTalkerStretchCount = 0;
        } catch (error) {
          let errorMessage = error.message || 'user data';
          if (unknownDID) {
            tty.green();
            tty.write(' ' + did);
            if (/find user/i.test(errorMessage)) {
              errorMessage = 'raw';
            }
          }

          tty.red();
          tty.write(' ' + errorMessage + '\r\n');
          tty.nocolor();
        }
      }

      if (happyTalkerStretchCount > 5) break;

      tty.write('\r\n');
    }

    tty.write('\r\n' + firstPosters.length + ' first posters to greet:\r\n');
    for (const { did, handle, posts } of firstPosters) {
      tty.blue();
      tty.write(handle + ' ');
      tty.nocolor();
      tty.write(posts[posts.length - 1].text + '\r\n\r\n');
    }

    tty.write('OK, greeting is another step.');

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

  /**
 * @param {string} lastPostCursor
 * @param {number} pageSize
 */
  async function* iterateRecentAccounts(lastPostCursor, pageSize) {
    if (!lastPostCursor) throw new Error('Cannot iterate backwards from nothing.');
    let cursorNum = Number(lastPostCursor);
    const seenAccounts = new Set();
    while (true) {
      const reposSlice = (await newClient.com.atproto.sync.listRepos({
        cursor: String(cursorNum)
      })).data;

      if (!reposSlice.repos?.length) break;

      const reportDids = [];
      for (const r of reposSlice.repos) {
        if (!seenAccounts.has(r.did))
          reportDids.unshift(r.did);
      }

      if (reportDids.length) yield reportDids;

      if (!reposSlice.cursor) break;

      cursorNum = cursorNum - pageSize;
    }
  }

  async function* iterateRecentPosts(did) {
    let lastPostCursor;
    while (true) {
      const records = (await olderClient.com.atproto.repo.listRecords({
        repo: did,
        collection: 'app.bsky.feed.post',
        cursor: lastPostCursor
      })).data;

      if (!records?.records?.length) break;
      /** @type {import('@atproto/api').AppBskyFeedPost.Record[]} */
      const posts = records.records.map(r => r.value);

      yield posts;

      if (!records.cursor) break;
      else lastPostCursor = records.cursor;
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
