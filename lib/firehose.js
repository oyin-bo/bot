// @ts-check

import { CarReader } from '@ipld/car';
import * as cbor_x from 'cbor-x';
import * as multiformats from 'multiformats';

var cbor_x_extended = false;

/**
 * @param {{
 *   record(op, commit, record): void;
  *  error?(error: Error, timeMsec: number): void;
  * }} callbacks
  */
export  function firehose(callbacks) {
  /** @type {typeof WebSocket} */
  const WebSocketImpl = typeof WebSocket === 'function' ? WebSocket : cacheRequire('ws');

  if (!cbor_x_extended) {
    cbor_x_extended = true;

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

  const wsAddress =
    'wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos';

    // bskyService.replace(/^(http|https)\:/, 'wss:') + 'com.atproto.sync.subscribeRepos';
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
    if (!commit.repo) return;

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

      callbacks.record(op, commit, record);
    }
  }

  function handleError(event) {
    if (typeof callbacks.error !== 'function') return;
    callbacks.error(event, now);
  }
}