// Node preload: route every outbound TLS connection through the upstream
// HTTP proxy via CONNECT tunneling. Without this, the Cursor SDK's HTTP/2
// traffic (via @connectrpc/connect-node -> node:http2) connects directly
// to AWS IPs and hangs on networks where only the corporate proxy can
// reach the public internet. Node's http2 module ignores HTTP_PROXY env
// vars and undici's global dispatcher, so we patch tls.connect itself.
//
// Activation:
//   The proxy URL is read once at startup from HTTPS_PROXY / https_proxy.
//   If unset, this file is a no-op.  NO_PROXY / no_proxy are respected
//   (entries match by exact host or `.suffix`).
//
// Wire it in with:
//   NODE_OPTIONS="--require=/abs/path/to/proxy-preload.cjs"
//
// The wrapper scripts inject this automatically when they detect HTTPS_PROXY
// in the environment.
//
// Heads-up: this is local to this project. It does not change any system
// state, does not require sudo, and only affects processes that explicitly
// load it via --require. Traffic still goes through the exact same proxy
// the rest of your shell already uses.

'use strict';

const net = require('node:net');
const tls = require('node:tls');
const { Duplex } = require('node:stream');
const { URL } = require('node:url');

const PATCH_FLAG = Symbol.for('cursor-chat.proxy-preload.patched');
if (tls.connect[PATCH_FLAG]) {
  // Idempotent: surviving --require duplication or re-execs.
  return;
}

const rawProxy = process.env.HTTPS_PROXY || process.env.https_proxy || '';
if (!rawProxy.trim()) {
  // No proxy configured -> nothing to patch. Bridge connects directly.
  return;
}

let PROXY;
try {
  const u = new URL(rawProxy.trim());
  PROXY = {
    host: u.hostname,
    port: parseInt(u.port, 10) || (u.protocol === 'https:' ? 443 : 80),
    auth: u.username
      ? Buffer.from(`${decodeURIComponent(u.username)}:${decodeURIComponent(u.password || '')}`).toString('base64')
      : null,
  };
} catch (e) {
  process.stderr.write(`[proxy-preload] invalid HTTPS_PROXY '${rawProxy}': ${e.message}\n`);
  return;
}

const NO_PROXY = (process.env.NO_PROXY || process.env.no_proxy || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isLocalHost(host) {
  if (!host) return true; // unknown -> don't tunnel
  if (host === 'localhost') return true;
  if (host.startsWith('127.')) return true;
  if (host === '::1') return true;
  return false;
}

function inNoProxy(host) {
  if (!host) return false;
  for (const entry of NO_PROXY) {
    if (entry === '*') return true;
    if (host === entry) return true;
    if (host.endsWith('.' + entry)) return true;
  }
  return false;
}

/**
 * A Duplex that buffers all writes until the real socket is attached,
 * then becomes a transparent pass-through. Returned synchronously from
 * the patched `tls.connect` and handed to `tls.connect({ socket })`,
 * which lets TLS start the ClientHello before the CONNECT tunnel is
 * actually established - the bytes just sit in the buffer until the
 * proxy says "200 OK" and we attach the real proxy socket.
 */
class TunnelStream extends Duplex {
  constructor() {
    super({ allowHalfOpen: true });
    this._buffered = [];
    this._sock = null;
    this._destroyed = false;
  }

  _attach(sock) {
    if (this._destroyed) {
      sock.destroy();
      return;
    }
    this._sock = sock;
    sock.on('data', (chunk) => {
      if (!this.push(chunk)) sock.pause();
    });
    sock.on('end', () => this.push(null));
    sock.on('close', () => this.push(null));
    sock.on('error', (err) => this.destroy(err));

    const pending = this._buffered;
    this._buffered = null;
    for (const [chunk, enc, cb] of pending) {
      sock.write(chunk, enc, cb);
    }
  }

  _read() {
    if (this._sock) this._sock.resume();
  }

  _write(chunk, enc, cb) {
    if (this._sock) {
      this._sock.write(chunk, enc, cb);
    } else if (this._buffered) {
      this._buffered.push([chunk, enc, cb]);
    } else {
      cb(new Error('TunnelStream write after destroy'));
    }
  }

  _final(cb) {
    if (this._sock) this._sock.end(cb);
    else cb();
  }

  _destroy(err, cb) {
    this._destroyed = true;
    if (this._sock) this._sock.destroy(err);
    cb(err);
  }

  // tls.connect calls these on the underlying socket; provide no-op stubs
  // so it doesn't crash on a plain Duplex.
  setNoDelay() { return this; }
  setKeepAlive() { return this; }
  setTimeout() { return this; }
  ref() { return this; }
  unref() { return this; }
}

function openConnectTunnel(targetHost, targetPort, callback) {
  const sock = net.connect(PROXY.port, PROXY.host);
  let headerBuf = '';
  let settled = false;

  const finish = (err, value) => {
    if (settled) return;
    settled = true;
    sock.removeListener('error', onError);
    sock.removeListener('connect', onConnect);
    sock.removeListener('data', onData);
    if (err) {
      try { sock.destroy(); } catch {}
      callback(err);
    } else {
      callback(null, value);
    }
  };

  const onError = (err) => finish(err);
  const onConnect = () => {
    let req = `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n`;
    req += `Host: ${targetHost}:${targetPort}\r\n`;
    req += `Proxy-Connection: keep-alive\r\n`;
    if (PROXY.auth) req += `Proxy-Authorization: Basic ${PROXY.auth}\r\n`;
    req += '\r\n';
    sock.write(req);
    sock.on('data', onData);
  };
  const onData = (chunk) => {
    headerBuf += chunk.toString('latin1');
    const eoh = headerBuf.indexOf('\r\n\r\n');
    if (eoh < 0) {
      if (headerBuf.length > 64 * 1024) {
        finish(new Error('Proxy CONNECT response too large'));
      }
      return;
    }
    const statusLine = headerBuf.slice(0, headerBuf.indexOf('\r\n'));
    if (!/^HTTP\/1\.[01]\s+200\b/.test(statusLine)) {
      finish(new Error('Proxy CONNECT rejected: ' + statusLine));
      return;
    }
    const leftover = Buffer.from(headerBuf.slice(eoh + 4), 'latin1');
    if (leftover.length > 0) sock.unshift(leftover);
    finish(null, sock);
  };

  sock.once('error', onError);
  sock.once('connect', onConnect);
}

const origTlsConnect = tls.connect;

/**
 * tls.connect accepts a few overloaded signatures. Normalize them into one
 * options object so we can decide whether to tunnel.
 */
function normalizeArgs(args) {
  let opts = {};
  let cb;

  const last = args[args.length - 1];
  if (typeof last === 'function') cb = last;

  if (args.length > 0) {
    const first = args[0];
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      opts = first;
    } else if (typeof first === 'number' || (typeof first === 'string' && /^\d+$/.test(first))) {
      // tls.connect(port, host?, options?, cb?). Node's http2 module passes
      // port as a STRING ('443'), so accept stringified integers too.
      const portArg = typeof first === 'string' ? parseInt(first, 10) : first;
      opts = { port: portArg };
      if (typeof args[1] === 'string') opts.host = args[1];
      // Find the trailing options object, if any (skipping the optional host string).
      for (let i = 1; i < args.length; i++) {
        if (typeof args[i] === 'object' && args[i] !== null && !Array.isArray(args[i])) {
          opts = Object.assign({}, args[i], opts);
          break;
        }
      }
    } else if (typeof first === 'string') {
      // Non-numeric string = unix domain socket path. Never proxy.
      return null;
    }
  }
  return { opts, cb };
}

function patchedTlsConnect(...args) {
  const norm = normalizeArgs(args);
  if (!norm) return origTlsConnect.apply(this, args);
  const { opts, cb } = norm;

  // Caller already provided their own underlying socket, or a unix path,
  // or it's a non-network connection - pass through untouched.
  if (opts.socket || opts.path) return origTlsConnect.apply(this, args);

  const host = opts.host || opts.servername;
  if (isLocalHost(host) || inNoProxy(host)) return origTlsConnect.apply(this, args);

  const port = opts.port || 443;

  const tunnel = new TunnelStream();
  openConnectTunnel(host, port, (err, sock) => {
    if (err) tunnel.destroy(err);
    else tunnel._attach(sock);
  });

  // Hand the buffered Duplex to TLS. servername stays set to the real
  // destination so SNI is correct. host/port are dropped because tls.connect
  // shouldn't try to open its own socket when `socket` is present.
  const tlsOpts = Object.assign({}, opts, {
    socket: tunnel,
    servername: opts.servername || host,
  });
  delete tlsOpts.host;
  delete tlsOpts.port;

  const tlsSock = cb ? origTlsConnect(tlsOpts, cb) : origTlsConnect(tlsOpts);
  // If the tunnel fails before TLS does anything, propagate the error.
  tunnel.on('error', (e) => {
    if (!tlsSock.destroyed) tlsSock.destroy(e);
  });
  return tlsSock;
}

patchedTlsConnect[PATCH_FLAG] = true;
tls.connect = patchedTlsConnect;

process.stderr.write(
  `[proxy-preload] tls.connect tunneled via ${PROXY.host}:${PROXY.port}` +
    (NO_PROXY.length ? ` (NO_PROXY=${NO_PROXY.join(',')})` : '') +
    `  pid=${process.pid}\n`,
);

// Drop a marker file so callers can verify the preload activated inside
// subprocesses where stderr is captured-and-discarded (e.g. cursor-sdk's
// bridge launcher). Cleared automatically below if MARKER env was set.
const markerPath = process.env.CURSOR_PROXY_PRELOAD_MARKER;
if (markerPath) {
  try {
    const fs = require('node:fs');
    fs.appendFileSync(
      markerPath,
      `${new Date().toISOString()} pid=${process.pid} proxy=${PROXY.host}:${PROXY.port}\n`,
    );
  } catch (e) {
    process.stderr.write(`[proxy-preload] marker write failed: ${e.message}\n`);
  }
}
