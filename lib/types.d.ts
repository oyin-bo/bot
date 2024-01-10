interface Global {
  atproto: typeof atproto;
  atproto_repo: typeof atproto_repo;
  xterm: typeof xterm;
  xterm_addon_fit: typeof xterm_addon_fit;

  oldFirehose: any;
  initXTerminal: typeof initXTerminal;
  initAtClient: typeof initAtClient;
}

declare var atproto: typeof import('@atproto/api');
declare var atproto_repo: typeof import('@atproto/repo');
declare var xterm: typeof import('xterm');
declare var xterm_addon_fit: typeof import('@xterm/addon-fit');

declare var oldFirehose: any;
declare var initXTerminal: typeof import('./init-xterm').initXTerminal;
declare var initAtClient: typeof import('./init-at-client').initAtClient;
