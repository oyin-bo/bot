// @ts-check
/// <reference path="./types.d.ts" />

import * as atproto from '@atproto/api';
// import atproto_repo from '@atproto/repo';

import { CarReader } from '@ipld/car';
import * as cbor_x from 'cbor-x';
import * as multiformats from 'multiformats';

import xterm from 'xterm';
import xterm_addon_fit from '@xterm/addon-fit';

// import { oldFirehose } from './old-firehose';
import { firehose } from './firehose';
import { initXTerminal } from './init-xterm';
import { patchBskyAgent, patchBskyAgentWithCORSProxy } from './init-at-client';


export function exportToGlobal(exports) {
  exports.atproto = atproto;
  //exports.atproto_repo = atproto_repo;
  exports.cbor_x = cbor_x;
  exports.ipld_car = { CarReader };
  exports.multiformats = multiformats;

  exports.xterm = xterm;
  exports.xterm_fit = xterm_addon_fit;

  //exports.oldFirehose = oldFirehose;
  exports.initXTerminal = initXTerminal;
  exports.patchBskyAgent = patchBskyAgent;
  exports.patchBskyAgentWithCORSProxy = patchBskyAgentWithCORSProxy;
  exports.firehose = firehose;
}

if (typeof window !== 'undefined' && window) {
  exportToGlobal(window);
} else if (typeof process !== 'undefined' && typeof process?.exit === 'function') {
  module.exports = {};
  exportToGlobal(module.exports);
}
