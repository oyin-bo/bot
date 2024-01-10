/**
 * @param {{
  *  post?(author: string, postID: string, text: string, replyTo: { shortDID: string, postID: string } | undefined, replyToThread: { shortDID: string, postID: string } | undefined, timeMsec: number);
  *  repost?(who: string, whose: string, postID: string, timeMsec: number);
  *  like?(who: string, whose: string, postID: string, timeMsec: number);
  *  follow?(who: string, whom: string, timeMsec: number);
  *  error?(error: Error, timeMsec: number): void;
  * }} callbacks
  */
export  function oldFirehose(callbacks) {
  /** @type {typeof import('cbor-x') & {__extended42}} */
  const cbor_x = cacheRequire('cbor-x');
  /** @type {typeof import('multiformats')} */
  const multiformats = cacheRequire('multiformats');

  /** @type {typeof WebSocket} */
  const WebSocketImpl = typeof WebSocket === 'function' ? WebSocket : cacheRequire('ws');

  /** @type {typeof import('@ipld/car').CarReader} */
  const CarReader = cacheRequire('@ipld/car').CarReader;

  if (!cbor_x.__extended42) {
    cbor_x.__extended42 = true;
    cbor_x.addExtension({
      Class: multiformats.CID,
      tag: 42,
      encode: () => {
        throw new Error("cannot encode cids");
      },
      decode: (bytes) => {
        if (bytes[0] !== 0) throw new Error("invalid cid for cbor tag 42");
        return multiformats.CID.decode(bytes.subarray(1)); // ignore leading 0x00
      },
    });
  }

  let now = Date.now();

  const wsAddress = bskyService.replace(/^(http|https)\:/, 'wss:') + 'com.atproto.sync.subscribeRepos';
  const ws = new WebSocketImpl(wsAddress);
  ws.addEventListener('message', handleMessage);
  ws.addEventListener('error', error => handleError(error));

  return { stop };

  function stop() {
    ws.close();
  }

  async function handleMessage(event) {
    now = Date.now();
    if (typeof event.data?.arrayBuffer === 'function')
      return event.data.arrayBuffer().then(convertMessageBuf);
    else if (typeof event.data?.byteLength === 'number')
      return convertMessageBuf(event.data);
    // TODO: alert unusual message
  }

  async function convertMessageBuf(messageBuf) {
    const entry = /** @type {any[]} */(cbor_x.decodeMultiple(new Uint8Array(messageBuf)));
    if (!entry || entry[0]?.op !== 1) return;
    const commit = entry[1];
    if (!commit.blocks) return; // TODO: alert unusual commit
    const commitShortDID = shortenDID(commit.repo);
    if (!commitShortDID) return; // TODO: alert unusual commit

    const car = await CarReader.fromBytes(commit.blocks);

    for (const op of commit.ops) {
      const block = op.cid && await car.get(/** @type {*} */(op.cid));
      if (!block) continue; // TODO: alert unusual op

      const record = cbor_x.decode(block.bytes);
      // record.repo = commit.repo;
      // record.rev = /** @type {string} */(commit.rev);
      // record.seq = commit.seq;
      // record.since = /** @type {string} */(commit.since);
      // record.action = op.action;
      // record.cid = cid;
      // record.path = op.path;
      // record.timestamp = commit.time ? Date.parse(commit.time) : Date.now();

      if (op.action !== 'create') return; // ignore deletions for now

      switch (record.$type) {
        case 'app.bsky.feed.like': return handleLike(commitShortDID, record);
        case 'app.bsky.graph.follow': return handleFollow(commitShortDID, record);
        case 'app.bsky.feed.post': return handlePost(commitShortDID, op.path, record);
        case 'app.bsky.feed.repost': return handleRepost(commitShortDID, record);
      }
    }
  }

  /** @param {FeedRecordTypeMap['app.bsky.feed.like']} likeRecord */
  function handleLike(commitShortDID, likeRecord) {
    if (typeof callbacks.like !== 'function') return;
    const subject = breakFeedUri(likeRecord.subject?.uri);
    if (!subject) return; // TODO: alert incomplete like

    return callbacks.like(commitShortDID, subject.shortDID, subject.postID, now);
  }

  /** @param {FeedRecordTypeMap['app.bsky.graph.follow']} followRecord */
  function handleFollow(commitShortDID, followRecord) {
    if (typeof callbacks.follow !== 'function') return;
    const whom = shortenDID(followRecord.subject);
    if (!whom) return; // TODO: alert incomplete follow

    return callbacks.follow(commitShortDID, whom, now);
  }

  /** @param {FeedRecordTypeMap['app.bsky.feed.post']} postRecord */
  function handlePost(commitShortDID, postID, postRecord) {
    if (typeof callbacks.post !== 'function') return;
    const replyTo = breakFeedUri(postRecord.reply?.parent?.uri);
    const replyToThread = postRecord.reply?.root?.uri === postRecord.reply?.parent?.uri ?
      undefined :
      breakFeedUri(postRecord.reply?.root?.uri);

    return callbacks.post(commitShortDID, postID, postRecord.text, replyTo, replyToThread, now);
  }

  /** @param {FeedRecordTypeMap['app.bsky.feed.repost']} repostRecord */
  function handleRepost(commitShortDID, repostRecord) {
    if (typeof callbacks.repost !== 'function') return;
    const subject = breakFeedUri(repostRecord.subject?.uri);
    if (!subject) return; // TODO: alert incomplete repost

    return callbacks.repost(commitShortDID, subject.shortDID, subject.postID, now);
  }

  function handleError(event) {
    if (typeof callbacks.error !== 'function') return;
    callbacks.error(event, now);
  }
}