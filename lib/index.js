// @ts-check
/// <reference path="./types.d.ts" />

import atproto from '@atproto/api';
import atproto_repo from '@atproto/repo';
import xterm from 'xterm';
import xterm_addon_fit from '@xterm/addon-fit';
import { oldFirehose } from './old-firehose';
import { initXTerminal } from './init-xterm';
import { initAtClient } from './init-at-client';

export function exportToGlobal(exports) {
  exports.atproto = atproto;
  exports.atproto_repo = atproto_repo;
  exports.xterm = xterm;
  exports.xterm_fit = xterm_addon_fit;
  //exports.oldFirehose = oldFirehose;
  exports.initXTerminal = initXTerminal;
  exports.initAtClient = initAtClient;
}

if (typeof window !== 'undefined' && window) {
  exportToGlobal(window);;
}
