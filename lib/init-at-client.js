// @ts-check
/// <reference path="./types.d.ts" />

import { BskyAgent } from '@atproto/api';

export async function initAtClient({ identifier, password }) {
  const oldXrpc = 'https://bsky.social/xrpc';
  const newXrpc = 'https://bsky.network/xrpc';

  const oldAtClient = new BskyAgent({ service: oldXrpc });
  const res = await oldAtClient.login(
    { identifier, password }
  );

  /** @type {*} */
  const didDoc = res?.data?.didDoc;
  const serviceURL =
    didDoc?.service?.find(svc => /pds/i.test(svc?.id || ''))?.serviceEndpoint;

  const authenticatedAtClient = new BskyAgent({ service: serviceURL });
  patchBskyAgentWithCORSProxy(authenticatedAtClient);
  await authenticatedAtClient.login({ identifier, password });

  const unaunthenticatedAtClient = new BskyAgent({ service: newXrpc });
  patchBskyAgentWithCORSProxy(unaunthenticatedAtClient);

  return { oldAtClient, authenticatedAtClient, unaunthenticatedAtClient };

  function patchBskyAgentWithCORSProxy(atClient) {
    atClient.com.atproto.sync._service.xrpc.baseClient.lex.assertValidXrpcOutput = function (lexUri, value, ...rest) {
      return true;
    };

    if (typeof window !== "undefined" && window) {
      const baseFetch = atClient.com.atproto.sync._service.xrpc.baseClient.fetch;
      atClient.com.atproto.sync._service.xrpc.baseClient.fetch = function (reqUri, ...args) {
        if (/(com.atproto.sync.listRepos)|(com.atproto.server.createSession)/.test(reqUri))
          reqUri = "https://corsproxy.io/?" + reqUri;
        return baseFetch.call(
          atClient.com.atproto.sync._service.xrpc.baseClient,
          reqUri,
          ...args
        );
      };
    }
  }

}