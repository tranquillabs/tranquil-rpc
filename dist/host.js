if(typeof Promise.withResolvers!=='function'){Promise.withResolvers=function(){let a,b;const p=new Promise((x,y)=>{a=x;b=y;});return{promise:p,resolve:a,reject:b};};}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (!this._fragmented) {
            const error = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error);
            return;
          }
          if (compressed) {
            const error = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error);
            return;
          }
        } else {
          const error = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error);
            return;
          }
        } else if (this._masked) {
          const error = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var {
      types: { isUint8Array }
    } = require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error) {
            const event = new ErrorEvent("error", {
              error,
              message: error.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var https = require("https");
    var http = require("http");
    var net = require("net");
    var tls = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket3 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket3, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket3.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket3, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket3.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket3, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket3.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket3, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket3.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket3.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket3.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket3.prototype.addEventListener = addEventListener;
    WebSocket3.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket3;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket3.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket3.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket3.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket3.CLOSED) return;
      if (websocket.readyState === WebSocket3.OPEN) {
        websocket._readyState = WebSocket3.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket3.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket3.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket3.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket3 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var http = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket3 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket3,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server2 = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server2.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version !== 13 && version !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server2, map) {
      for (const event of Object.keys(map)) server2.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server2.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server2) {
      server2._state = CLOSED;
      server2.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server2, req, socket, code, message, headers) {
      if (server2.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server2.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// lib/index.js
var lib_exports = {};
__export(lib_exports, {
  RpcTarget: () => RpcTarget,
  activate: () => activate,
  addTrustedRoot: () => addTrustedRoot,
  closeRunnerServer: () => closeRunnerServer,
  deactivate: () => deactivate,
  endRun: () => endRun,
  ensureRunnerServer: () => ensureRunnerServer,
  isTrusted: () => isTrusted,
  mintRunToken: () => mintRunToken,
  provideRpc: () => provideRpc,
  registerCapability: () => registerCapability,
  sendCancel: () => sendCancel
});
module.exports = __toCommonJS(lib_exports);

// node_modules/capnweb/dist/index.js
var WORKERS_MODULE_SYMBOL = Symbol("workers-module");
if (!Symbol.dispose) Symbol.dispose = Symbol.for("dispose");
if (!Symbol.asyncDispose) Symbol.asyncDispose = Symbol.for("asyncDispose");
if (!Promise.withResolvers) Promise.withResolvers = function() {
  let resolve;
  let reject;
  return {
    promise: new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve,
    reject
  };
};
var workersModule = globalThis[WORKERS_MODULE_SYMBOL];
var RpcTarget$1 = workersModule ? workersModule.RpcTarget : class {
};
var AsyncFunction = async function() {
}.constructor;
var BUFFER_PROTOTYPE = typeof Buffer !== "undefined" ? Buffer.prototype : void 0;
function typeForRpc(value) {
  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return "primitive";
    case "undefined":
      return "undefined";
    case "object":
    case "function":
      break;
    case "bigint":
      return "bigint";
    default:
      return "unsupported";
  }
  if (value === null) return "primitive";
  let prototype = Object.getPrototypeOf(value);
  switch (prototype) {
    case Object.prototype:
      return "object";
    case Function.prototype:
    case AsyncFunction.prototype:
      return "function";
    case Array.prototype:
      return "array";
    case Date.prototype:
      return "date";
    case Uint8Array.prototype:
    case BUFFER_PROTOTYPE:
      return "bytes";
    case WritableStream.prototype:
      return "writable";
    case ReadableStream.prototype:
      return "readable";
    case Headers.prototype:
      return "headers";
    case Request.prototype:
      return "request";
    case Response.prototype:
      return "response";
    case Blob.prototype:
      return "blob";
    case RpcStub$1.prototype:
      return "stub";
    case RpcPromise$1.prototype:
      return "rpc-promise";
    default:
      if (workersModule) {
        if (prototype == workersModule.RpcStub.prototype || value instanceof workersModule.ServiceStub) return "rpc-target";
        else if (prototype == workersModule.RpcPromise.prototype || prototype == workersModule.RpcProperty.prototype) return "rpc-thenable";
      }
      if (value instanceof RpcTarget$1) return "rpc-target";
      if (value instanceof Error) return "error";
      return "unsupported";
  }
}
function mapNotLoaded() {
  throw new Error("RPC map() implementation was not loaded.");
}
var mapImpl = {
  applyMap: mapNotLoaded,
  sendMap: mapNotLoaded
};
function streamNotLoaded() {
  throw new Error("Stream implementation was not loaded.");
}
var streamImpl = {
  createWritableStreamHook: streamNotLoaded,
  createWritableStreamFromHook: streamNotLoaded,
  createReadableStreamHook: streamNotLoaded
};
var StubHook = class {
  stream(path3, args) {
    let pulled = this.call(path3, args).pull();
    let promise;
    if (pulled instanceof Promise) promise = pulled.then((p) => {
      p.dispose();
    });
    else {
      pulled.dispose();
      promise = Promise.resolve();
    }
    return { promise };
  }
};
var ErrorStubHook = class extends StubHook {
  error;
  constructor(error) {
    super();
    this.error = error;
  }
  call(path3, args) {
    return this;
  }
  map(path3, captures, instructions) {
    return this;
  }
  get(path3) {
    return this;
  }
  dup() {
    return this;
  }
  pull() {
    return Promise.reject(this.error);
  }
  ignoreUnhandledRejections() {
  }
  dispose() {
  }
  onBroken(callback) {
    try {
      callback(this.error);
    } catch (err) {
      Promise.resolve(err);
    }
  }
};
var DISPOSED_HOOK = new ErrorStubHook(/* @__PURE__ */ new Error("Attempted to use RPC stub after it has been disposed."));
var doCall = (hook, path3, params) => {
  return hook.call(path3, params);
};
function withCallInterceptor(interceptor, callback) {
  let oldValue = doCall;
  doCall = interceptor;
  try {
    return callback();
  } finally {
    doCall = oldValue;
  }
}
var RAW_STUB = Symbol("realStub");
var PROXY_HANDLERS = {
  apply(target, thisArg, argumentsList) {
    let stub = target.raw;
    return new RpcPromise$1(doCall(stub.hook, stub.pathIfPromise || [], RpcPayload.fromAppParams(argumentsList)), []);
  },
  get(target, prop, receiver) {
    let stub = target.raw;
    if (prop === RAW_STUB) return stub;
    else if (prop in RpcPromise$1.prototype) return stub[prop];
    else if (typeof prop === "string") return new RpcPromise$1(stub.hook, stub.pathIfPromise ? [...stub.pathIfPromise, prop] : [prop]);
    else if (prop === Symbol.dispose && (!stub.pathIfPromise || stub.pathIfPromise.length == 0)) return () => {
      stub.hook.dispose();
      stub.hook = DISPOSED_HOOK;
    };
    else return;
  },
  has(target, prop) {
    let stub = target.raw;
    if (prop === RAW_STUB) return true;
    else if (prop in RpcPromise$1.prototype) return prop in stub;
    else if (typeof prop === "string") return true;
    else if (prop === Symbol.dispose && (!stub.pathIfPromise || stub.pathIfPromise.length == 0)) return true;
    else return false;
  },
  construct(target, args) {
    throw new Error("An RPC stub cannot be used as a constructor.");
  },
  defineProperty(target, property, attributes) {
    throw new Error("Can't define properties on RPC stubs.");
  },
  deleteProperty(target, p) {
    throw new Error("Can't delete properties on RPC stubs.");
  },
  getOwnPropertyDescriptor(target, p) {
  },
  getPrototypeOf(target) {
    return Object.getPrototypeOf(target.raw);
  },
  isExtensible(target) {
    return false;
  },
  ownKeys(target) {
    return [];
  },
  preventExtensions(target) {
    return true;
  },
  set(target, p, newValue, receiver) {
    throw new Error("Can't assign properties on RPC stubs.");
  },
  setPrototypeOf(target, v) {
    throw new Error("Can't override prototype of RPC stubs.");
  }
};
var RpcStub$1 = class RpcStub$12 extends RpcTarget$1 {
  constructor(hook, pathIfPromise) {
    super();
    if (!(hook instanceof StubHook)) {
      let value = hook;
      if (value instanceof RpcTarget$1 || value instanceof Function) hook = TargetStubHook.create(value, void 0);
      else hook = new PayloadStubHook(RpcPayload.fromAppReturn(value));
      if (pathIfPromise) throw new TypeError("RpcStub constructor expected one argument, received two.");
    }
    this.hook = hook;
    this.pathIfPromise = pathIfPromise;
    let func = () => {
    };
    func.raw = this;
    return new Proxy(func, PROXY_HANDLERS);
  }
  hook;
  pathIfPromise;
  dup() {
    let target = this[RAW_STUB];
    if (target.pathIfPromise) return new RpcStub$12(target.hook.get(target.pathIfPromise));
    else return new RpcStub$12(target.hook.dup());
  }
  onRpcBroken(callback) {
    this[RAW_STUB].hook.onBroken(callback);
  }
  map(func) {
    let { hook, pathIfPromise } = this[RAW_STUB];
    return mapImpl.sendMap(hook, pathIfPromise || [], func);
  }
  toString() {
    return "[object RpcStub]";
  }
};
var RpcPromise$1 = class extends RpcStub$1 {
  constructor(hook, pathIfPromise) {
    super(hook, pathIfPromise);
  }
  then(onfulfilled, onrejected) {
    return pullPromise(this).then(...arguments);
  }
  catch(onrejected) {
    return pullPromise(this).catch(...arguments);
  }
  finally(onfinally) {
    return pullPromise(this).finally(...arguments);
  }
  toString() {
    return "[object RpcPromise]";
  }
};
function unwrapStubTakingOwnership(stub) {
  let { hook, pathIfPromise } = stub[RAW_STUB];
  if (pathIfPromise && pathIfPromise.length > 0) return hook.get(pathIfPromise);
  else return hook;
}
function unwrapStubAndDup(stub) {
  let { hook, pathIfPromise } = stub[RAW_STUB];
  if (pathIfPromise) return hook.get(pathIfPromise);
  else return hook.dup();
}
function unwrapStubNoProperties(stub) {
  let { hook, pathIfPromise } = stub[RAW_STUB];
  if (pathIfPromise && pathIfPromise.length > 0) return;
  return hook;
}
function unwrapStubOrParent(stub) {
  return stub[RAW_STUB].hook;
}
function unwrapStubAndPath(stub) {
  return stub[RAW_STUB];
}
async function pullPromise(promise) {
  let { hook, pathIfPromise } = promise[RAW_STUB];
  if (pathIfPromise.length > 0) hook = hook.get(pathIfPromise);
  return (await hook.pull()).deliverResolve();
}
var RpcPayload = class RpcPayload2 {
  value;
  source;
  hooks;
  promises;
  static fromAppParams(value) {
    return new RpcPayload2(value, "params");
  }
  static fromAppReturn(value) {
    return new RpcPayload2(value, "return");
  }
  static fromArray(array) {
    let hooks = [];
    let promises = [];
    let resultArray = [];
    for (let payload of array) {
      payload.ensureDeepCopied();
      for (let hook of payload.hooks) hooks.push(hook);
      for (let promise of payload.promises) {
        if (promise.parent === payload) promise = {
          parent: resultArray,
          property: resultArray.length,
          promise: promise.promise
        };
        promises.push(promise);
      }
      resultArray.push(payload.value);
    }
    return new RpcPayload2(resultArray, "owned", hooks, promises);
  }
  static forEvaluate(hooks, promises) {
    return new RpcPayload2(null, "owned", hooks, promises);
  }
  static deepCopyFrom(value, oldParent, owner) {
    let result = new RpcPayload2(null, "owned", [], []);
    result.value = result.deepCopy(value, oldParent, "value", result, true, owner);
    return result;
  }
  constructor(value, source, hooks, promises) {
    this.value = value;
    this.source = source;
    this.hooks = hooks;
    this.promises = promises;
  }
  rpcTargets;
  getHookForRpcTarget(target, parent, dupStubs = true) {
    if (this.source === "params") {
      if (dupStubs) {
        let dupable = target;
        if (typeof dupable.dup === "function") target = dupable.dup();
      }
      return TargetStubHook.create(target, parent);
    } else if (this.source === "return") {
      let hook = this.rpcTargets?.get(target);
      if (hook) if (dupStubs) return hook.dup();
      else {
        this.rpcTargets?.delete(target);
        return hook;
      }
      else {
        hook = TargetStubHook.create(target, parent);
        if (dupStubs) {
          if (!this.rpcTargets) this.rpcTargets = /* @__PURE__ */ new Map();
          this.rpcTargets.set(target, hook);
          return hook.dup();
        } else return hook;
      }
    } else throw new Error("owned payload shouldn't contain raw RpcTargets");
  }
  getHookForWritableStream(stream, parent, dupStubs = true) {
    if (this.source === "params") return streamImpl.createWritableStreamHook(stream);
    else if (this.source === "return") {
      let hook = this.rpcTargets?.get(stream);
      if (hook) if (dupStubs) return hook.dup();
      else {
        this.rpcTargets?.delete(stream);
        return hook;
      }
      else {
        hook = streamImpl.createWritableStreamHook(stream);
        if (dupStubs) {
          if (!this.rpcTargets) this.rpcTargets = /* @__PURE__ */ new Map();
          this.rpcTargets.set(stream, hook);
          return hook.dup();
        } else return hook;
      }
    } else throw new Error("owned payload shouldn't contain raw WritableStreams");
  }
  getHookForReadableStream(stream, parent, dupStubs = true) {
    if (this.source === "params") return streamImpl.createReadableStreamHook(stream);
    else if (this.source === "return") {
      let hook = this.rpcTargets?.get(stream);
      if (hook) if (dupStubs) return hook.dup();
      else {
        this.rpcTargets?.delete(stream);
        return hook;
      }
      else {
        hook = streamImpl.createReadableStreamHook(stream);
        if (dupStubs) {
          if (!this.rpcTargets) this.rpcTargets = /* @__PURE__ */ new Map();
          this.rpcTargets.set(stream, hook);
          return hook.dup();
        } else return hook;
      }
    } else throw new Error("owned payload shouldn't contain raw ReadableStreams");
  }
  deepCopy(value, oldParent, property, parent, dupStubs, owner) {
    switch (typeForRpc(value)) {
      case "unsupported":
        return value;
      case "primitive":
      case "bigint":
      case "date":
      case "bytes":
      case "blob":
      case "error":
      case "undefined":
        return value;
      case "array": {
        let array = value;
        let len = array.length;
        let result = new Array(len);
        for (let i = 0; i < len; i++) result[i] = this.deepCopy(array[i], array, i, result, dupStubs, owner);
        return result;
      }
      case "object": {
        let result = {};
        let object = value;
        for (let i in object) result[i] = this.deepCopy(object[i], object, i, result, dupStubs, owner);
        return result;
      }
      case "stub":
      case "rpc-promise": {
        let stub = value;
        let hook;
        if (dupStubs) hook = unwrapStubAndDup(stub);
        else hook = unwrapStubTakingOwnership(stub);
        if (stub instanceof RpcPromise$1) {
          let promise = new RpcPromise$1(hook, []);
          this.promises.push({
            parent,
            property,
            promise
          });
          return promise;
        } else {
          this.hooks.push(hook);
          return new RpcStub$1(hook);
        }
      }
      case "function":
      case "rpc-target": {
        let target = value;
        let hook;
        if (owner) hook = owner.getHookForRpcTarget(target, oldParent, dupStubs);
        else hook = TargetStubHook.create(target, oldParent);
        this.hooks.push(hook);
        return new RpcStub$1(hook);
      }
      case "rpc-thenable": {
        let target = value;
        let promise;
        if (owner) promise = new RpcPromise$1(owner.getHookForRpcTarget(target, oldParent, dupStubs), []);
        else promise = new RpcPromise$1(TargetStubHook.create(target, oldParent), []);
        this.promises.push({
          parent,
          property,
          promise
        });
        return promise;
      }
      case "writable": {
        let stream = value;
        let hook;
        if (owner) hook = owner.getHookForWritableStream(stream, oldParent, dupStubs);
        else hook = streamImpl.createWritableStreamHook(stream);
        this.hooks.push(hook);
        return stream;
      }
      case "readable": {
        let stream = value;
        let hook;
        if (owner) hook = owner.getHookForReadableStream(stream, oldParent, dupStubs);
        else hook = streamImpl.createReadableStreamHook(stream);
        this.hooks.push(hook);
        return stream;
      }
      case "headers":
        return new Headers(value);
      case "request": {
        let req = value;
        if (req.body) this.deepCopy(req.body, req, "body", req, dupStubs, owner);
        return new Request(req);
      }
      case "response": {
        let resp = value;
        if (resp.body) this.deepCopy(resp.body, resp, "body", resp, dupStubs, owner);
        return new Response(resp.body, resp);
      }
      default:
        throw new Error("unreachable");
    }
  }
  ensureDeepCopied() {
    if (this.source !== "owned") {
      let dupStubs = this.source === "params";
      this.hooks = [];
      this.promises = [];
      try {
        this.value = this.deepCopy(this.value, void 0, "value", this, dupStubs, this);
      } catch (err) {
        this.hooks = void 0;
        this.promises = void 0;
        throw err;
      }
      this.source = "owned";
      if (this.rpcTargets && this.rpcTargets.size > 0) throw new Error("Not all rpcTargets were accounted for in deep-copy?");
      this.rpcTargets = void 0;
    }
  }
  deliverTo(parent, property, promises) {
    this.ensureDeepCopied();
    if (this.value instanceof RpcPromise$1) RpcPayload2.deliverRpcPromiseTo(this.value, parent, property, promises);
    else {
      parent[property] = this.value;
      for (let record of this.promises) RpcPayload2.deliverRpcPromiseTo(record.promise, record.parent, record.property, promises);
    }
  }
  static deliverRpcPromiseTo(promise, parent, property, promises) {
    let hook = unwrapStubNoProperties(promise);
    if (!hook) throw new Error("property promises should have been resolved earlier");
    let inner = hook.pull();
    if (inner instanceof RpcPayload2) inner.deliverTo(parent, property, promises);
    else promises.push(inner.then((payload) => {
      let subPromises = [];
      payload.deliverTo(parent, property, subPromises);
      if (subPromises.length > 0) return Promise.all(subPromises);
    }));
  }
  async deliverCall(func, thisArg) {
    try {
      let promises = [];
      this.deliverTo(this, "value", promises);
      if (promises.length > 0) await Promise.all(promises);
      let result = Function.prototype.apply.call(func, thisArg, this.value);
      if (result instanceof RpcPromise$1) return RpcPayload2.fromAppReturn(result);
      else return RpcPayload2.fromAppReturn(await result);
    } finally {
      this.dispose();
    }
  }
  async deliverResolve() {
    try {
      let promises = [];
      this.deliverTo(this, "value", promises);
      if (promises.length > 0) await Promise.all(promises);
      let result = this.value;
      if (result instanceof Object) {
        if (!(Symbol.dispose in result)) Object.defineProperty(result, Symbol.dispose, {
          value: () => this.dispose(),
          writable: true,
          enumerable: false,
          configurable: true
        });
      }
      return result;
    } catch (err) {
      this.dispose();
      throw err;
    }
  }
  dispose() {
    if (this.source === "owned") {
      this.hooks.forEach((hook) => hook.dispose());
      this.promises.forEach((promise) => promise.promise[Symbol.dispose]());
    } else if (this.source === "return") {
      this.disposeImpl(this.value, void 0);
      if (this.rpcTargets && this.rpcTargets.size > 0) throw new Error("Not all rpcTargets were accounted for in disposeImpl()?");
    }
    this.source = "owned";
    this.hooks = [];
    this.promises = [];
  }
  disposeImpl(value, parent) {
    switch (typeForRpc(value)) {
      case "unsupported":
      case "primitive":
      case "bigint":
      case "bytes":
      case "blob":
      case "date":
      case "error":
      case "undefined":
        return;
      case "array": {
        let array = value;
        let len = array.length;
        for (let i = 0; i < len; i++) this.disposeImpl(array[i], array);
        return;
      }
      case "object": {
        let object = value;
        for (let i in object) this.disposeImpl(object[i], object);
        return;
      }
      case "stub":
      case "rpc-promise": {
        let hook = unwrapStubNoProperties(value);
        if (hook) hook.dispose();
        return;
      }
      case "function":
      case "rpc-target": {
        let target = value;
        let hook = this.rpcTargets?.get(target);
        if (hook) {
          hook.dispose();
          this.rpcTargets.delete(target);
        } else disposeRpcTarget(target);
        return;
      }
      case "rpc-thenable":
        return;
      case "headers":
        return;
      case "request": {
        let req = value;
        if (req.body) this.disposeImpl(req.body, req);
        return;
      }
      case "response": {
        let resp = value;
        if (resp.body) this.disposeImpl(resp.body, resp);
        return;
      }
      case "writable": {
        let stream = value;
        let hook = this.rpcTargets?.get(stream);
        if (hook) this.rpcTargets.delete(stream);
        else hook = streamImpl.createWritableStreamHook(stream);
        hook.dispose();
        return;
      }
      case "readable": {
        let stream = value;
        let hook = this.rpcTargets?.get(stream);
        if (hook) this.rpcTargets.delete(stream);
        else hook = streamImpl.createReadableStreamHook(stream);
        hook.dispose();
        return;
      }
      default:
        return;
    }
  }
  ignoreUnhandledRejections() {
    if (this.hooks) {
      this.hooks.forEach((hook) => {
        hook.ignoreUnhandledRejections();
      });
      this.promises.forEach((promise) => unwrapStubOrParent(promise.promise).ignoreUnhandledRejections());
    } else this.ignoreUnhandledRejectionsImpl(this.value);
  }
  ignoreUnhandledRejectionsImpl(value) {
    switch (typeForRpc(value)) {
      case "unsupported":
      case "primitive":
      case "bigint":
      case "bytes":
      case "blob":
      case "date":
      case "error":
      case "undefined":
      case "function":
      case "rpc-target":
      case "writable":
      case "readable":
      case "headers":
      case "request":
      case "response":
        return;
      case "array": {
        let array = value;
        let len = array.length;
        for (let i = 0; i < len; i++) this.ignoreUnhandledRejectionsImpl(array[i]);
        return;
      }
      case "object": {
        let object = value;
        for (let i in object) this.ignoreUnhandledRejectionsImpl(object[i]);
        return;
      }
      case "stub":
      case "rpc-promise":
        unwrapStubOrParent(value).ignoreUnhandledRejections();
        return;
      case "rpc-thenable":
        value.then((_) => {
        }, (_) => {
        });
        return;
      default:
        return;
    }
  }
};
function followPath(value, parent, path3, owner) {
  for (let i = 0; i < path3.length; i++) {
    parent = value;
    let part = path3[i];
    if (part in Object.prototype) {
      value = void 0;
      continue;
    }
    switch (typeForRpc(value)) {
      case "object":
      case "function":
        if (Object.hasOwn(value, part)) value = value[part];
        else value = void 0;
        break;
      case "array":
        if (Number.isInteger(part) && part >= 0) value = value[part];
        else value = void 0;
        break;
      case "rpc-target":
      case "rpc-thenable":
        if (Object.hasOwn(value, part)) throw new TypeError(`Attempted to access property '${part}', which is an instance property of the RpcTarget. To avoid leaking private internals, instance properties cannot be accessed over RPC. If you want to make this property available over RPC, define it as a method or getter on the class, instead of an instance property.`);
        else value = value[part];
        owner = null;
        break;
      case "stub":
      case "rpc-promise": {
        let { hook, pathIfPromise } = unwrapStubAndPath(value);
        return {
          hook,
          remainingPath: pathIfPromise ? pathIfPromise.concat(path3.slice(i)) : path3.slice(i)
        };
      }
      case "writable":
        value = void 0;
        break;
      case "readable":
        value = void 0;
        break;
      case "primitive":
      case "bigint":
      case "bytes":
      case "blob":
      case "date":
      case "error":
      case "headers":
      case "request":
      case "response":
        value = void 0;
        break;
      case "undefined":
        value = value[part];
        break;
      case "unsupported":
        if (i === 0) throw new TypeError(`RPC stub points at a non-serializable type.`);
        else {
          let prefix = path3.slice(0, i).join(".");
          let remainder = path3.slice(0, i).join(".");
          throw new TypeError(`'${prefix}' is not a serializable type, so property ${remainder} cannot be accessed.`);
        }
      default:
        throw new TypeError("unreachable");
    }
  }
  if (value instanceof RpcPromise$1) {
    let { hook, pathIfPromise } = unwrapStubAndPath(value);
    return {
      hook,
      remainingPath: pathIfPromise || []
    };
  }
  return {
    value,
    parent,
    owner
  };
}
var ValueStubHook = class extends StubHook {
  call(path3, args) {
    try {
      let { value, owner } = this.getValue();
      let followResult = followPath(value, void 0, path3, owner);
      if (followResult.hook) return followResult.hook.call(followResult.remainingPath, args);
      if (typeof followResult.value != "function") throw new TypeError(`'${path3.join(".")}' is not a function.`);
      return new PromiseStubHook(args.deliverCall(followResult.value, followResult.parent).then((payload) => {
        return new PayloadStubHook(payload);
      }));
    } catch (err) {
      return new ErrorStubHook(err);
    }
  }
  map(path3, captures, instructions) {
    try {
      let followResult;
      try {
        let { value, owner } = this.getValue();
        followResult = followPath(value, void 0, path3, owner);
      } catch (err) {
        for (let cap of captures) cap.dispose();
        throw err;
      }
      if (followResult.hook) return followResult.hook.map(followResult.remainingPath, captures, instructions);
      return mapImpl.applyMap(followResult.value, followResult.parent, followResult.owner, captures, instructions);
    } catch (err) {
      return new ErrorStubHook(err);
    }
  }
  get(path3) {
    try {
      let { value, owner } = this.getValue();
      if (path3.length === 0 && owner === null) throw new Error("Can't dup an RpcTarget stub as a promise.");
      let followResult = followPath(value, void 0, path3, owner);
      if (followResult.hook) return followResult.hook.get(followResult.remainingPath);
      return new PayloadStubHook(RpcPayload.deepCopyFrom(followResult.value, followResult.parent, followResult.owner));
    } catch (err) {
      return new ErrorStubHook(err);
    }
  }
};
var PayloadStubHook = class PayloadStubHook2 extends ValueStubHook {
  constructor(payload) {
    super();
    this.payload = payload;
  }
  payload;
  getPayload() {
    if (this.payload) return this.payload;
    else throw new Error("Attempted to use an RPC StubHook after it was disposed.");
  }
  getValue() {
    let payload = this.getPayload();
    return {
      value: payload.value,
      owner: payload
    };
  }
  dup() {
    let thisPayload = this.getPayload();
    return new PayloadStubHook2(RpcPayload.deepCopyFrom(thisPayload.value, void 0, thisPayload));
  }
  pull() {
    return this.getPayload();
  }
  ignoreUnhandledRejections() {
    if (this.payload) this.payload.ignoreUnhandledRejections();
  }
  dispose() {
    if (this.payload) {
      this.payload.dispose();
      this.payload = void 0;
    }
  }
  onBroken(callback) {
    if (this.payload) {
      if (this.payload.value instanceof RpcStub$1) this.payload.value.onRpcBroken(callback);
    }
  }
};
function disposeRpcTarget(target) {
  if (Symbol.dispose in target) try {
    target[Symbol.dispose]();
  } catch (err) {
    Promise.reject(err);
  }
}
var TargetStubHook = class TargetStubHook2 extends ValueStubHook {
  static create(value, parent) {
    if (typeof value !== "function") parent = void 0;
    return new TargetStubHook2(value, parent);
  }
  constructor(target, parent, dupFrom) {
    super();
    this.target = target;
    this.parent = parent;
    if (dupFrom) {
      if (dupFrom.refcount) {
        this.refcount = dupFrom.refcount;
        ++this.refcount.count;
      }
    } else if (Symbol.dispose in target) this.refcount = { count: 1 };
  }
  target;
  parent;
  refcount;
  getTarget() {
    if (this.target) return this.target;
    else throw new Error("Attempted to use an RPC StubHook after it was disposed.");
  }
  getValue() {
    return {
      value: this.getTarget(),
      owner: null
    };
  }
  dup() {
    return new TargetStubHook2(this.getTarget(), this.parent, this);
  }
  pull() {
    let target = this.getTarget();
    if ("then" in target) return Promise.resolve(target).then((resolution) => {
      return RpcPayload.fromAppReturn(resolution);
    });
    else return Promise.reject(/* @__PURE__ */ new Error("Tried to resolve a non-promise stub."));
  }
  ignoreUnhandledRejections() {
  }
  dispose() {
    if (this.target) {
      if (this.refcount) {
        if (--this.refcount.count == 0) disposeRpcTarget(this.target);
      }
      this.target = void 0;
    }
  }
  onBroken(callback) {
  }
};
var PromiseStubHook = class PromiseStubHook2 extends StubHook {
  promise;
  resolution;
  constructor(promise) {
    super();
    this.promise = promise.then((res) => {
      this.resolution = res;
      return res;
    });
  }
  call(path3, args) {
    args.ensureDeepCopied();
    return new PromiseStubHook2(this.promise.then((hook) => hook.call(path3, args)));
  }
  stream(path3, args) {
    args.ensureDeepCopied();
    return { promise: this.promise.then((hook) => {
      return hook.stream(path3, args).promise;
    }) };
  }
  map(path3, captures, instructions) {
    return new PromiseStubHook2(this.promise.then((hook) => hook.map(path3, captures, instructions), (err) => {
      for (let cap of captures) cap.dispose();
      throw err;
    }));
  }
  get(path3) {
    return new PromiseStubHook2(this.promise.then((hook) => hook.get(path3)));
  }
  dup() {
    if (this.resolution) return this.resolution.dup();
    else return new PromiseStubHook2(this.promise.then((hook) => hook.dup()));
  }
  pull() {
    if (this.resolution) return this.resolution.pull();
    else return this.promise.then((hook) => hook.pull());
  }
  ignoreUnhandledRejections() {
    if (this.resolution) this.resolution.ignoreUnhandledRejections();
    else this.promise.then((res) => {
      res.ignoreUnhandledRejections();
    }, (err) => {
    });
  }
  dispose() {
    if (this.resolution) this.resolution.dispose();
    else this.promise.then((hook) => {
      hook.dispose();
    }, (err) => {
    });
  }
  onBroken(callback) {
    if (this.resolution) this.resolution.onBroken(callback);
    else this.promise.then((hook) => {
      hook.onBroken(callback);
    }, callback);
  }
};
var NullExporter = class {
  exportStub(stub) {
    throw new Error("Cannot serialize RPC stubs without an RPC session.");
  }
  exportPromise(stub) {
    throw new Error("Cannot serialize RPC stubs without an RPC session.");
  }
  getImport(hook) {
  }
  unexport(ids) {
  }
  createPipe(readable) {
    throw new Error("Cannot create pipes without an RPC session.");
  }
  onSendError(error) {
  }
};
var NULL_EXPORTER = new NullExporter();
async function streamToBlob(stream, type) {
  let b = await new Response(stream).blob();
  return b.type === type ? b : b.slice(0, b.size, type);
}
var ERROR_TYPES = {
  Error,
  EvalError,
  RangeError,
  ReferenceError,
  SyntaxError,
  TypeError,
  URIError,
  AggregateError
};
var Devaluator = class Devaluator2 {
  exporter;
  source;
  encodingLevel;
  constructor(exporter, source, encodingLevel) {
    this.exporter = exporter;
    this.source = source;
    this.encodingLevel = encodingLevel;
  }
  static devaluate(value, parent, exporter = NULL_EXPORTER, source, encodingLevel = "string") {
    let devaluator = new Devaluator2(exporter, source, encodingLevel);
    try {
      return devaluator.devaluateImpl(value, parent, 0);
    } catch (err) {
      if (devaluator.exports) try {
        exporter.unexport(devaluator.exports);
      } catch (err2) {
      }
      throw err;
    }
  }
  exports;
  devaluateImpl(value, parent, depth) {
    if (depth >= 64) throw new Error("Serialization exceeded maximum allowed depth. (Does the message contain cycles?)");
    switch (typeForRpc(value)) {
      case "unsupported": {
        let msg;
        try {
          msg = `Cannot serialize value: ${value}`;
        } catch (err) {
          msg = "Cannot serialize value: (couldn't stringify value)";
        }
        throw new TypeError(msg);
      }
      case "primitive":
        if (typeof value === "number" && !isFinite(value)) {
          if (this.encodingLevel === "structuredClonable") return value;
          if (value === Infinity) return ["inf"];
          else if (value === -Infinity) return ["-inf"];
          else return ["nan"];
        } else return value;
      case "object": {
        let object = value;
        let result = {};
        for (let key in object) result[key] = this.devaluateImpl(object[key], object, depth + 1);
        return result;
      }
      case "array": {
        let array = value;
        let len = array.length;
        let result = new Array(len);
        for (let i = 0; i < len; i++) result[i] = this.devaluateImpl(array[i], array, depth + 1);
        return [result];
      }
      case "bigint":
        if (this.encodingLevel === "structuredClonable") return value;
        return ["bigint", value.toString()];
      case "date": {
        if (this.encodingLevel === "structuredClonable") return value;
        const time = value.getTime();
        return ["date", Number.isNaN(time) ? null : time];
      }
      case "bytes": {
        let bytes = value;
        if (this.encodingLevel === "structuredClonable" || this.encodingLevel === "jsonCompatibleWithBytes") return ["bytes", bytes];
        if (bytes.toBase64) return ["bytes", bytes.toBase64({ omitPadding: true })];
        let b64;
        if (typeof Buffer !== "undefined") b64 = (bytes instanceof Buffer ? bytes : Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)).toString("base64");
        else {
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          b64 = btoa(binary);
        }
        return ["bytes", b64.replace(/=+$/, "")];
      }
      case "headers":
        return ["headers", [...value]];
      case "request": {
        let req = value;
        let init = {};
        if (req.method !== "GET") init.method = req.method;
        let headers = [...req.headers];
        if (headers.length > 0) init.headers = headers;
        if (req.body) {
          init.body = this.devaluateImpl(req.body, req, depth + 1);
          init.duplex = req.duplex || "half";
        } else if (req.body === void 0 && ![
          "GET",
          "HEAD",
          "OPTIONS",
          "TRACE",
          "DELETE"
        ].includes(req.method)) {
          let bodyPromise = req.arrayBuffer();
          let readable = new ReadableStream({ async start(controller) {
            try {
              controller.enqueue(new Uint8Array(await bodyPromise));
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          } });
          let hook = streamImpl.createReadableStreamHook(readable);
          init.body = ["readable", this.exporter.createPipe(readable, hook)];
          init.duplex = req.duplex || "half";
        }
        if (req.cache && req.cache !== "default") init.cache = req.cache;
        if (req.redirect !== "follow") init.redirect = req.redirect;
        if (req.integrity) init.integrity = req.integrity;
        if (req.mode && req.mode !== "cors") init.mode = req.mode;
        if (req.credentials && req.credentials !== "same-origin") init.credentials = req.credentials;
        if (req.referrer && req.referrer !== "about:client") init.referrer = req.referrer;
        if (req.referrerPolicy) init.referrerPolicy = req.referrerPolicy;
        if (req.keepalive) init.keepalive = req.keepalive;
        let cfReq = req;
        if (cfReq.cf) init.cf = cfReq.cf;
        if (cfReq.encodeResponseBody && cfReq.encodeResponseBody !== "automatic") init.encodeResponseBody = cfReq.encodeResponseBody;
        return [
          "request",
          req.url,
          init
        ];
      }
      case "response": {
        let resp = value;
        let body = this.devaluateImpl(resp.body, resp, depth + 1);
        let init = {};
        if (resp.status !== 200) init.status = resp.status;
        if (resp.statusText) init.statusText = resp.statusText;
        let headers = [...resp.headers];
        if (headers.length > 0) init.headers = headers;
        let cfResp = resp;
        if (cfResp.cf) init.cf = cfResp.cf;
        if (cfResp.encodeBody && cfResp.encodeBody !== "automatic") init.encodeBody = cfResp.encodeBody;
        if (cfResp.webSocket) throw new TypeError("Can't serialize a Response containing a webSocket.");
        return [
          "response",
          body,
          init
        ];
      }
      case "blob": {
        let blob = value;
        let readable = blob.stream();
        let hook = streamImpl.createReadableStreamHook(readable);
        let importId = this.exporter.createPipe(readable, hook);
        return [
          "blob",
          blob.type,
          ["readable", importId]
        ];
      }
      case "error": {
        let e = value;
        let rewritten = this.exporter.onSendError(e);
        if (rewritten) e = rewritten;
        let anyE = e;
        let props;
        let captureProp = (key, val) => {
          let exportsBefore = this.exports?.length ?? 0;
          try {
            let encoded = this.devaluateImpl(val, e, depth + 1);
            if (!props) props = {};
            props[key] = encoded;
          } catch (err) {
            if (this.exports && this.exports.length > exportsBefore) {
              let tail = this.exports.splice(exportsBefore);
              try {
                this.exporter.unexport(tail);
              } catch (err2) {
              }
            }
          }
        };
        for (let key of Object.keys(e)) {
          if (key === "name" || key === "message" || key === "stack") continue;
          captureProp(key, anyE[key]);
        }
        if ("cause" in e) captureProp("cause", anyE.cause);
        if (e instanceof AggregateError) captureProp("errors", e.errors);
        let result = [
          "error",
          e.name,
          e.message
        ];
        if (props) {
          result.push(rewritten && rewritten.stack ? rewritten.stack : null);
          result.push(props);
        } else if (rewritten && rewritten.stack) result.push(rewritten.stack);
        return result;
      }
      case "undefined":
        if (this.encodingLevel === "structuredClonable") return;
        return ["undefined"];
      case "stub":
      case "rpc-promise": {
        if (!this.source) throw new Error("Can't serialize RPC stubs in this context.");
        let { hook, pathIfPromise } = unwrapStubAndPath(value);
        let importId = this.exporter.getImport(hook);
        if (importId !== void 0) if (pathIfPromise) if (pathIfPromise.length > 0) return [
          "pipeline",
          importId,
          pathIfPromise
        ];
        else return ["pipeline", importId];
        else return ["import", importId];
        if (pathIfPromise) hook = hook.get(pathIfPromise);
        else hook = hook.dup();
        return this.devaluateHook(pathIfPromise ? "promise" : "export", hook);
      }
      case "function":
      case "rpc-target": {
        if (!this.source) throw new Error("Can't serialize RPC stubs in this context.");
        let hook = this.source.getHookForRpcTarget(value, parent);
        return this.devaluateHook("export", hook);
      }
      case "rpc-thenable": {
        if (!this.source) throw new Error("Can't serialize RPC stubs in this context.");
        let hook = this.source.getHookForRpcTarget(value, parent);
        return this.devaluateHook("promise", hook);
      }
      case "writable": {
        if (!this.source) throw new Error("Can't serialize WritableStream in this context.");
        let hook = this.source.getHookForWritableStream(value, parent);
        return this.devaluateHook("writable", hook);
      }
      case "readable": {
        if (!this.source) throw new Error("Can't serialize ReadableStream in this context.");
        let ws = value;
        let hook = this.source.getHookForReadableStream(ws, parent);
        return ["readable", this.exporter.createPipe(ws, hook)];
      }
      default:
        throw new Error("unreachable");
    }
  }
  devaluateHook(type, hook) {
    if (!this.exports) this.exports = [];
    let exportId = type === "promise" ? this.exporter.exportPromise(hook) : this.exporter.exportStub(hook);
    this.exports.push(exportId);
    return [type, exportId];
  }
};
var NullImporter = class {
  importStub(idx) {
    throw new Error("Cannot deserialize RPC stubs without an RPC session.");
  }
  importPromise(idx) {
    throw new Error("Cannot deserialize RPC stubs without an RPC session.");
  }
  getExport(idx) {
  }
  getPipeReadable(exportId) {
    throw new Error("Cannot retrieve pipe readable without an RPC session.");
  }
};
var NULL_IMPORTER = new NullImporter();
function fixBrokenRequestBody(request, body) {
  return new RpcPromise$1(new PromiseStubHook(new Response(body).arrayBuffer().then((arrayBuffer) => {
    let bytes = new Uint8Array(arrayBuffer);
    let result = new Request(request, { body: bytes });
    return new PayloadStubHook(RpcPayload.fromAppReturn(result));
  })), []);
}
function streamToBlobPromise(stream, type) {
  return new RpcPromise$1(new PromiseStubHook(streamToBlob(stream, type).then((blob) => {
    return new PayloadStubHook(RpcPayload.fromAppReturn(blob));
  })), []);
}
var Evaluator = class Evaluator2 {
  importer;
  encodingLevel;
  constructor(importer, encodingLevel = "string") {
    this.importer = importer;
    this.encodingLevel = encodingLevel;
  }
  hooks = [];
  promises = [];
  evaluate(value) {
    let payload = RpcPayload.forEvaluate(this.hooks, this.promises);
    try {
      payload.value = this.evaluateImpl(value, payload, "value");
      return payload;
    } catch (err) {
      payload.dispose();
      throw err;
    }
  }
  evaluateCopy(value) {
    return this.evaluate(structuredClone(value));
  }
  evaluateImpl(value, parent, property) {
    if (this.encodingLevel === "structuredClonable") {
      if (value instanceof Date || typeof value === "bigint") return value;
    }
    if (value instanceof Array) {
      if (value.length == 1 && value[0] instanceof Array) {
        let result = value[0];
        for (let i = 0; i < result.length; i++) result[i] = this.evaluateImpl(result[i], result, i);
        return result;
      } else switch (value[0]) {
        case "bigint":
          if (typeof value[1] == "string") return BigInt(value[1]);
          break;
        case "date":
          if (value[1] === null) return /* @__PURE__ */ new Date(NaN);
          if (typeof value[1] == "number") return new Date(value[1]);
          break;
        case "bytes":
          if (value[1] instanceof Uint8Array) return value[1];
          if (typeof value[1] == "string") if (typeof Buffer !== "undefined") return Buffer.from(value[1], "base64");
          else if (Uint8Array.fromBase64) return Uint8Array.fromBase64(value[1]);
          else {
            let bs = atob(value[1]);
            let len = bs.length;
            let bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = bs.charCodeAt(i);
            return bytes;
          }
          break;
        case "error":
          if (value.length >= 3 && typeof value[1] === "string" && typeof value[2] === "string") {
            let cls = ERROR_TYPES[value[1]] || Error;
            let result = cls === AggregateError ? new cls([], value[2]) : new cls(value[2]);
            if (typeof value[3] === "string") result.stack = value[3];
            if (value.length >= 5) {
              let props = value[4];
              if (!props || typeof props !== "object" || Array.isArray(props)) break;
              let anyResult = result;
              let propsObj = props;
              for (let key of Object.keys(propsObj)) {
                if (key === "name" || key === "message" || key === "stack") continue;
                anyResult[key] = this.evaluateImpl(propsObj[key], result, key);
              }
            }
            return result;
          }
          break;
        case "undefined":
          if (value.length === 1) return;
          break;
        case "inf":
          return Infinity;
        case "-inf":
          return -Infinity;
        case "nan":
          return NaN;
        case "headers":
          if (value.length === 2 && value[1] instanceof Array) return new Headers(value[1]);
          break;
        case "request": {
          if (value.length !== 3 || typeof value[1] !== "string") break;
          let url = value[1];
          let init = value[2];
          if (typeof init !== "object" || init === null) break;
          if (init.body) {
            init.body = this.evaluateImpl(init.body, init, "body");
            if (init.body === null || typeof init.body === "string" || init.body instanceof Uint8Array || init.body instanceof ReadableStream) {
            } else throw new TypeError("Request body must be of type ReadableStream.");
          }
          if (init.signal) {
            init.signal = this.evaluateImpl(init.signal, init, "signal");
            if (!(init.signal instanceof AbortSignal)) throw new TypeError("Request siganl must be of type AbortSignal.");
          }
          if (init.headers && !(init.headers instanceof Array)) throw new TypeError("Request headers must be serialized as an array of pairs.");
          let result = new Request(url, init);
          if (init.body instanceof ReadableStream && result.body === void 0) {
            let promise = fixBrokenRequestBody(result, init.body);
            this.promises.push({
              promise,
              parent,
              property
            });
            return promise;
          } else return result;
        }
        case "response": {
          if (value.length !== 3) break;
          let body = this.evaluateImpl(value[1], parent, property);
          if (body === null || typeof body === "string" || body instanceof Uint8Array || body instanceof ReadableStream) {
          } else throw new TypeError("Response body must be of type ReadableStream.");
          let init = value[2];
          if (typeof init !== "object" || init === null) break;
          if (init.webSocket) throw new TypeError("Can't deserialize a Response containing a webSocket.");
          if (init.headers && !(init.headers instanceof Array)) throw new TypeError("Request headers must be serialized as an array of pairs.");
          return new Response(body, init);
        }
        case "blob": {
          if (value.length !== 3 || typeof value[1] !== "string") break;
          let contentType = value[1];
          let content = this.evaluateImpl(value[2], parent, property);
          if (!(content instanceof ReadableStream)) throw new TypeError("Blob content must be serialized as a ReadableStream.");
          let promise = streamToBlobPromise(content, contentType);
          this.promises.push({
            promise,
            parent,
            property
          });
          return promise;
        }
        case "import":
        case "pipeline": {
          if (value.length < 2 || value.length > 4) break;
          if (typeof value[1] != "number") break;
          let hook = this.importer.getExport(value[1]);
          if (!hook) throw new Error(`no such entry on exports table: ${value[1]}`);
          let isPromise = value[0] == "pipeline";
          let addStub = (hook2) => {
            if (isPromise) {
              let promise = new RpcPromise$1(hook2, []);
              this.promises.push({
                promise,
                parent,
                property
              });
              return promise;
            } else {
              this.hooks.push(hook2);
              return new RpcPromise$1(hook2, []);
            }
          };
          if (value.length == 2) if (isPromise) return addStub(hook.get([]));
          else return addStub(hook.dup());
          let path3 = value[2];
          if (!(path3 instanceof Array)) break;
          if (!path3.every((part) => {
            return typeof part == "string" || typeof part == "number";
          })) break;
          if (value.length == 3) return addStub(hook.get(path3));
          let args = value[3];
          if (!(args instanceof Array)) break;
          args = new Evaluator2(this.importer).evaluate([args]);
          return addStub(hook.call(path3, args));
        }
        case "remap": {
          if (value.length !== 5 || typeof value[1] !== "number" || !(value[2] instanceof Array) || !(value[3] instanceof Array) || !(value[4] instanceof Array)) break;
          let hook = this.importer.getExport(value[1]);
          if (!hook) throw new Error(`no such entry on exports table: ${value[1]}`);
          let path3 = value[2];
          if (!path3.every((part) => {
            return typeof part == "string" || typeof part == "number";
          })) break;
          let captures = value[3].map((cap) => {
            if (!(cap instanceof Array) || cap.length !== 2 || cap[0] !== "import" && cap[0] !== "export" || typeof cap[1] !== "number") throw new TypeError(`unknown map capture: ${JSON.stringify(cap)}`);
            if (cap[0] === "export") return this.importer.importStub(cap[1]);
            else {
              let exp = this.importer.getExport(cap[1]);
              if (!exp) throw new Error(`no such entry on exports table: ${cap[1]}`);
              return exp.dup();
            }
          });
          let instructions = value[4];
          let promise = new RpcPromise$1(hook.map(path3, captures, instructions), []);
          this.promises.push({
            promise,
            parent,
            property
          });
          return promise;
        }
        case "export":
        case "promise":
          if (typeof value[1] == "number") if (value[0] == "promise") {
            let promise = new RpcPromise$1(this.importer.importPromise(value[1]), []);
            this.promises.push({
              parent,
              property,
              promise
            });
            return promise;
          } else {
            let hook = this.importer.importStub(value[1]);
            this.hooks.push(hook);
            return new RpcStub$1(hook);
          }
          break;
        case "writable":
          if (typeof value[1] == "number") {
            let hook = this.importer.importStub(value[1]);
            let stream = streamImpl.createWritableStreamFromHook(hook);
            this.hooks.push(hook);
            return stream;
          }
          break;
        case "readable":
          if (typeof value[1] == "number") {
            let stream = this.importer.getPipeReadable(value[1]);
            let hook = streamImpl.createReadableStreamHook(stream);
            this.hooks.push(hook);
            return stream;
          }
          break;
      }
      throw new TypeError(`unknown special value: ${JSON.stringify(value)}`);
    } else if (value instanceof Object) {
      let result = value;
      for (let key in result) if (key in Object.prototype || key === "toJSON") {
        this.evaluateImpl(result[key], result, key);
        delete result[key];
      } else result[key] = this.evaluateImpl(result[key], result, key);
      return result;
    } else return value;
  }
};
var ESTIMATED_OBJECT_OVERHEAD = 16;
var ESTIMATED_ENTRY_OVERHEAD = 8;
var ESTIMATED_BINARY_OVERHEAD = 16;
var MAX_ESTIMATE_DEPTH = 64;
function estimateStringSize(value) {
  return 2 + value.length * 3;
}
function estimateEncodedSize(value, seen, depth = 0) {
  if (depth >= MAX_ESTIMATE_DEPTH) return ESTIMATED_ENTRY_OVERHEAD;
  switch (typeof value) {
    case "string":
      return estimateStringSize(value);
    case "number":
      return 16;
    case "bigint":
      return 16;
    case "boolean":
      return 8;
    case "undefined":
      return 16;
    case "object": {
      if (value === null) return 8;
      if (ArrayBuffer.isView(value)) return ESTIMATED_BINARY_OVERHEAD + value.byteLength;
      if (value instanceof ArrayBuffer) return ESTIMATED_BINARY_OVERHEAD + value.byteLength;
      if (typeof Blob !== "undefined" && value instanceof Blob) return ESTIMATED_BINARY_OVERHEAD + value.size;
      if (value instanceof Date) return 16;
      seen ??= /* @__PURE__ */ new WeakSet();
      if (seen.has(value)) return ESTIMATED_ENTRY_OVERHEAD;
      seen.add(value);
      if (value instanceof Array) {
        let size2 = ESTIMATED_OBJECT_OVERHEAD;
        for (let item of value) size2 += ESTIMATED_ENTRY_OVERHEAD + estimateEncodedSize(item, seen, depth + 1);
        return size2;
      }
      if (value instanceof Error) {
        let size2 = ESTIMATED_OBJECT_OVERHEAD + estimateStringSize(value.name) + estimateStringSize(value.message) + estimateStringSize(value.stack ?? "");
        for (let key of Object.keys(value)) size2 += ESTIMATED_ENTRY_OVERHEAD + estimateStringSize(key) + estimateEncodedSize(value[key], seen, depth + 1);
        return size2;
      }
      let size = ESTIMATED_OBJECT_OVERHEAD;
      for (let key of Object.keys(value)) size += ESTIMATED_ENTRY_OVERHEAD + estimateStringSize(key) + estimateEncodedSize(value[key], seen, depth + 1);
      return size;
    }
    default:
      return 16;
  }
}
var ImportTableEntry = class {
  session;
  importId;
  constructor(session, importId, pulling) {
    this.session = session;
    this.importId = importId;
    if (pulling) this.activePull = Promise.withResolvers();
  }
  localRefcount = 0;
  remoteRefcount = 1;
  activePull;
  resolution;
  onBrokenRegistrations;
  resolve(resolution) {
    if (this.localRefcount == 0) {
      resolution.dispose();
      return;
    }
    this.resolution = resolution;
    this.sendRelease();
    if (this.onBrokenRegistrations) {
      for (let i of this.onBrokenRegistrations) {
        let callback = this.session.onBrokenCallbacks[i];
        let endIndex = this.session.onBrokenCallbacks.length;
        resolution.onBroken(callback);
        if (this.session.onBrokenCallbacks[endIndex] === callback) delete this.session.onBrokenCallbacks[endIndex];
        else delete this.session.onBrokenCallbacks[i];
      }
      this.onBrokenRegistrations = void 0;
    }
    if (this.activePull) {
      this.activePull.resolve();
      this.activePull = void 0;
    }
  }
  async awaitResolution() {
    if (!this.activePull) {
      this.session.sendPull(this.importId);
      this.activePull = Promise.withResolvers();
    }
    await this.activePull.promise;
    return this.resolution.pull();
  }
  dispose() {
    if (this.resolution) this.resolution.dispose();
    else {
      this.abort(/* @__PURE__ */ new Error("RPC was canceled because the RpcPromise was disposed."));
      this.sendRelease();
    }
  }
  abort(error) {
    if (!this.resolution) {
      this.resolution = new ErrorStubHook(error);
      if (this.activePull) {
        this.activePull.reject(error);
        this.activePull = void 0;
      }
      this.onBrokenRegistrations = void 0;
    }
  }
  onBroken(callback) {
    if (this.resolution) this.resolution.onBroken(callback);
    else {
      let index = this.session.onBrokenCallbacks.length;
      this.session.onBrokenCallbacks.push(callback);
      if (!this.onBrokenRegistrations) this.onBrokenRegistrations = [];
      this.onBrokenRegistrations.push(index);
    }
  }
  sendRelease() {
    if (this.remoteRefcount > 0) {
      this.session.sendRelease(this.importId, this.remoteRefcount);
      this.remoteRefcount = 0;
    }
  }
};
var RpcImportHook = class RpcImportHook2 extends StubHook {
  isPromise;
  entry;
  constructor(isPromise, entry) {
    super();
    this.isPromise = isPromise;
    ++entry.localRefcount;
    this.entry = entry;
  }
  collectPath(path3) {
    return this;
  }
  getEntry() {
    if (this.entry) return this.entry;
    else throw new Error("This RpcImportHook was already disposed.");
  }
  call(path3, args) {
    let entry = this.getEntry();
    if (entry.resolution) return entry.resolution.call(path3, args);
    else return entry.session.sendCall(entry.importId, path3, args);
  }
  stream(path3, args) {
    let entry = this.getEntry();
    if (entry.resolution) return entry.resolution.stream(path3, args);
    else return entry.session.sendStream(entry.importId, path3, args);
  }
  map(path3, captures, instructions) {
    let entry;
    try {
      entry = this.getEntry();
    } catch (err) {
      for (let cap of captures) cap.dispose();
      throw err;
    }
    if (entry.resolution) return entry.resolution.map(path3, captures, instructions);
    else return entry.session.sendMap(entry.importId, path3, captures, instructions);
  }
  get(path3) {
    let entry = this.getEntry();
    if (entry.resolution) return entry.resolution.get(path3);
    else return entry.session.sendCall(entry.importId, path3);
  }
  dup() {
    return new RpcImportHook2(false, this.getEntry());
  }
  pull() {
    let entry = this.getEntry();
    if (!this.isPromise) throw new Error("Can't pull this hook because it's not a promise hook.");
    if (entry.resolution) return entry.resolution.pull();
    return entry.awaitResolution();
  }
  ignoreUnhandledRejections() {
  }
  dispose() {
    let entry = this.entry;
    this.entry = void 0;
    if (entry) {
      if (--entry.localRefcount === 0) entry.dispose();
    }
  }
  onBroken(callback) {
    if (this.entry) this.entry.onBroken(callback);
  }
};
var RpcMainHook = class extends RpcImportHook {
  session;
  constructor(entry) {
    super(false, entry);
    this.session = entry.session;
  }
  dispose() {
    if (this.session) {
      let session = this.session;
      this.session = void 0;
      session.shutdown();
    }
  }
};
var RpcSessionImpl = class {
  transport;
  options;
  exports = [];
  reverseExports = /* @__PURE__ */ new Map();
  imports = [];
  abortReason;
  cancelReadLoop;
  nextExportId = -1;
  onBatchDone;
  pullCount = 0;
  onBrokenCallbacks = [];
  encodingLevel;
  constructor(transport, mainHook, options) {
    this.transport = transport;
    this.options = options;
    let level = "string";
    if ("encodingLevel" in transport) {
      let raw = transport.encodingLevel;
      if (raw !== void 0) {
        if (raw !== "string" && raw !== "jsonCompatible" && raw !== "jsonCompatibleWithBytes" && raw !== "structuredClonable") throw new TypeError(`Unknown transport encodingLevel: ${String(raw)}`);
        level = raw;
      }
    }
    this.encodingLevel = level;
    this.exports.push({
      hook: mainHook,
      refcount: 1
    });
    this.imports.push(new ImportTableEntry(this, 0, false));
    this.readLoop().catch((err) => this.abort(err));
  }
  getMainImport() {
    return new RpcMainHook(this.imports[0]);
  }
  shutdown() {
    this.abort(/* @__PURE__ */ new Error("RPC session was shut down by disposing the main stub"), false);
  }
  exportStub(hook) {
    if (this.abortReason) throw this.abortReason;
    let existingExportId = this.reverseExports.get(hook);
    if (existingExportId !== void 0) {
      ++this.exports[existingExportId].refcount;
      return existingExportId;
    } else {
      let exportId = this.nextExportId--;
      this.exports[exportId] = {
        hook,
        refcount: 1
      };
      this.reverseExports.set(hook, exportId);
      return exportId;
    }
  }
  exportPromise(hook) {
    if (this.abortReason) throw this.abortReason;
    let exportId = this.nextExportId--;
    this.exports[exportId] = {
      hook,
      refcount: 1
    };
    this.reverseExports.set(hook, exportId);
    this.ensureResolvingExport(exportId);
    return exportId;
  }
  unexport(ids) {
    for (let id of ids) this.releaseExport(id, 1);
  }
  releaseExport(exportId, refcount) {
    let entry = this.exports[exportId];
    if (!entry) throw new Error(`no such export ID: ${exportId}`);
    if (entry.refcount < refcount) throw new Error(`refcount would go negative: ${entry.refcount} < ${refcount}`);
    entry.refcount -= refcount;
    if (entry.refcount === 0) {
      delete this.exports[exportId];
      this.reverseExports.delete(entry.hook);
      entry.hook.dispose();
    }
  }
  onSendError(error) {
    if (this.options.onSendError) return this.options.onSendError(error);
  }
  ensureResolvingExport(exportId) {
    let exp = this.exports[exportId];
    if (!exp) throw new Error(`no such export ID: ${exportId}`);
    if (!exp.pull) {
      let resolve = async () => {
        let hook = exp.hook;
        for (; ; ) {
          let payload = await hook.pull();
          if (payload.value instanceof RpcStub$1) {
            let { hook: inner, pathIfPromise } = unwrapStubAndPath(payload.value);
            if (pathIfPromise && pathIfPromise.length == 0) {
              if (this.getImport(hook) === void 0) {
                hook = inner;
                continue;
              }
            }
          }
          return payload;
        }
      };
      let autoRelease = exp.autoRelease;
      ++this.pullCount;
      exp.pull = resolve().then((payload) => {
        let value = Devaluator.devaluate(payload.value, void 0, this, payload, this.encodingLevel);
        this.send([
          "resolve",
          exportId,
          value
        ]);
        if (autoRelease) this.releaseExport(exportId, 1);
      }, (error) => {
        this.send([
          "reject",
          exportId,
          Devaluator.devaluate(error, void 0, this, void 0, this.encodingLevel)
        ]);
        if (autoRelease) this.releaseExport(exportId, 1);
      }).catch((error) => {
        try {
          this.send([
            "reject",
            exportId,
            Devaluator.devaluate(error, void 0, this, void 0, this.encodingLevel)
          ]);
          if (autoRelease) this.releaseExport(exportId, 1);
        } catch (error2) {
          this.abort(error2);
        }
      }).finally(() => {
        if (--this.pullCount === 0) {
          if (this.onBatchDone) this.onBatchDone.resolve();
        }
      });
    }
  }
  getImport(hook) {
    if (hook instanceof RpcImportHook && hook.entry && hook.entry.session === this) return hook.entry.importId;
    else return;
  }
  importStub(idx) {
    if (this.abortReason) throw this.abortReason;
    let entry = this.imports[idx];
    if (!entry) {
      entry = new ImportTableEntry(this, idx, false);
      this.imports[idx] = entry;
    }
    return new RpcImportHook(false, entry);
  }
  importPromise(idx) {
    if (this.abortReason) throw this.abortReason;
    if (this.imports[idx]) return new ErrorStubHook(/* @__PURE__ */ new Error("Bug in RPC system: The peer sent a promise reusing an existing export ID."));
    let entry = new ImportTableEntry(this, idx, true);
    this.imports[idx] = entry;
    return new RpcImportHook(true, entry);
  }
  getExport(idx) {
    return this.exports[idx]?.hook;
  }
  getPipeReadable(exportId) {
    let entry = this.exports[exportId];
    if (!entry || !entry.pipeReadable) throw new Error(`Export ${exportId} is not a pipe or its readable end was already consumed.`);
    let readable = entry.pipeReadable;
    entry.pipeReadable = void 0;
    return readable;
  }
  createPipe(readable, readableHook) {
    if (this.abortReason) throw this.abortReason;
    this.send(["pipe"]);
    let importId = this.imports.length;
    let entry = new ImportTableEntry(this, importId, false);
    this.imports.push(entry);
    let hook = new RpcImportHook(false, entry);
    let writable = streamImpl.createWritableStreamFromHook(hook);
    readable.pipeTo(writable).catch(() => {
    }).finally(() => readableHook.dispose());
    return importId;
  }
  send(msg) {
    if (this.abortReason !== void 0) return 0;
    if (this.encodingLevel === "string") {
      let msgText;
      try {
        msgText = JSON.stringify(msg);
      } catch (err) {
        try {
          this.abort(err);
        } catch (err2) {
        }
        throw err;
      }
      try {
        let sent = this.transport.send(msgText);
        if (sent !== void 0 && typeof sent.catch === "function") sent.catch((err) => this.abort(err, false));
      } catch (err) {
        queueMicrotask(() => this.abort(err, false));
      }
      return msgText.length;
    } else try {
      let size = this.transport.send(msg);
      if (typeof size === "number") return size;
      let thenable = size;
      if (thenable && typeof thenable.then === "function") Promise.resolve(thenable).catch((err) => this.abort(err, false));
      return;
    } catch (err) {
      queueMicrotask(() => this.abort(err, false));
      return;
    }
  }
  sendCall(id, path3, args) {
    if (this.abortReason) throw this.abortReason;
    let value = [
      "pipeline",
      id,
      path3
    ];
    if (args) {
      let devalue = Devaluator.devaluate(args.value, void 0, this, args, this.encodingLevel);
      value.push(devalue[0]);
    }
    this.send(["push", value]);
    let entry = new ImportTableEntry(this, this.imports.length, false);
    this.imports.push(entry);
    return new RpcImportHook(true, entry);
  }
  sendStream(id, path3, args) {
    if (this.abortReason) throw this.abortReason;
    let value = [
      "pipeline",
      id,
      path3
    ];
    let devalue = Devaluator.devaluate(args.value, void 0, this, args, this.encodingLevel);
    value.push(devalue[0]);
    let msg = ["stream", value];
    let size = this.send(msg);
    if (size === void 0) size = estimateEncodedSize(msg);
    let importId = this.imports.length;
    let entry = new ImportTableEntry(this, importId, true);
    entry.remoteRefcount = 0;
    entry.localRefcount = 1;
    this.imports.push(entry);
    return {
      promise: entry.awaitResolution().then((p) => {
        p.dispose();
        delete this.imports[importId];
      }, (err) => {
        delete this.imports[importId];
        throw err;
      }),
      size
    };
  }
  sendMap(id, path3, captures, instructions) {
    if (this.abortReason) {
      for (let cap of captures) cap.dispose();
      throw this.abortReason;
    }
    let value = [
      "remap",
      id,
      path3,
      captures.map((hook) => {
        let importId = this.getImport(hook);
        if (importId !== void 0) return ["import", importId];
        else return ["export", this.exportStub(hook)];
      }),
      instructions
    ];
    this.send(["push", value]);
    let entry = new ImportTableEntry(this, this.imports.length, false);
    this.imports.push(entry);
    return new RpcImportHook(true, entry);
  }
  sendPull(id) {
    if (this.abortReason) throw this.abortReason;
    this.send(["pull", id]);
  }
  sendRelease(id, remoteRefcount) {
    if (this.abortReason) return;
    this.send([
      "release",
      id,
      remoteRefcount
    ]);
    delete this.imports[id];
  }
  abort(error, trySendAbortMessage = true) {
    if (this.abortReason !== void 0) return;
    this.cancelReadLoop?.(error);
    this.cancelReadLoop = void 0;
    if (trySendAbortMessage) try {
      let abortMsg = ["abort", Devaluator.devaluate(error, void 0, this, void 0, this.encodingLevel)];
      if (this.encodingLevel === "string") {
        let sent = this.transport.send(JSON.stringify(abortMsg));
        if (sent !== void 0 && typeof sent.catch === "function") sent.catch((err) => {
        });
      } else {
        let result = this.transport.send(abortMsg);
        if (result && typeof result.then === "function") Promise.resolve(result).catch((err) => {
        });
      }
    } catch (err) {
    }
    if (error === void 0) error = "undefined";
    this.abortReason = error;
    if (this.onBatchDone) this.onBatchDone.reject(error);
    if (this.transport.abort) try {
      this.transport.abort(error);
    } catch (err) {
      Promise.resolve(err);
    }
    for (let i in this.onBrokenCallbacks) try {
      this.onBrokenCallbacks[i](error);
    } catch (err) {
      Promise.resolve(err);
    }
    for (let i in this.imports) this.imports[i].abort(error);
    for (let i in this.exports) this.exports[i].hook.dispose();
  }
  async readLoop() {
    while (!this.abortReason) {
      let readCanceled = Promise.withResolvers();
      this.cancelReadLoop = readCanceled.reject;
      let raw;
      try {
        raw = await Promise.race([this.transport.receive(), readCanceled.promise]);
      } finally {
        if (this.cancelReadLoop === readCanceled.reject) this.cancelReadLoop = void 0;
      }
      if (this.abortReason) break;
      let msg = this.encodingLevel === "string" ? JSON.parse(raw) : raw;
      if (msg instanceof Array) switch (msg[0]) {
        case "push":
          if (msg.length > 1) {
            let hook = new PayloadStubHook(new Evaluator(this, this.encodingLevel).evaluate(msg[1]));
            hook.ignoreUnhandledRejections();
            this.exports.push({
              hook,
              refcount: 1
            });
            continue;
          }
          break;
        case "stream":
          if (msg.length > 1) {
            let hook = new PayloadStubHook(new Evaluator(this, this.encodingLevel).evaluate(msg[1]));
            hook.ignoreUnhandledRejections();
            let exportId = this.exports.length;
            this.exports.push({
              hook,
              refcount: 1,
              autoRelease: true
            });
            this.ensureResolvingExport(exportId);
            continue;
          }
          break;
        case "pipe": {
          let { readable, writable } = new TransformStream();
          let hook = streamImpl.createWritableStreamHook(writable);
          this.exports.push({
            hook,
            refcount: 1,
            pipeReadable: readable
          });
          continue;
        }
        case "pull": {
          let exportId = msg[1];
          if (typeof exportId == "number") {
            this.ensureResolvingExport(exportId);
            continue;
          }
          break;
        }
        case "resolve":
        case "reject": {
          let importId = msg[1];
          if (typeof importId == "number" && msg.length > 2) {
            let imp = this.imports[importId];
            if (imp) if (msg[0] == "resolve") imp.resolve(new PayloadStubHook(new Evaluator(this, this.encodingLevel).evaluate(msg[2])));
            else {
              let payload = new Evaluator(this, this.encodingLevel).evaluate(msg[2]);
              payload.dispose();
              imp.resolve(new ErrorStubHook(payload.value));
            }
            else if (msg[0] == "resolve") new Evaluator(this, this.encodingLevel).evaluate(msg[2]).dispose();
            continue;
          }
          break;
        }
        case "release": {
          let exportId = msg[1];
          let refcount = msg[2];
          if (typeof exportId == "number" && typeof refcount == "number") {
            this.releaseExport(exportId, refcount);
            continue;
          }
          break;
        }
        case "abort": {
          let payload = new Evaluator(this, this.encodingLevel).evaluate(msg[1]);
          payload.dispose();
          this.abort(payload, false);
          break;
        }
      }
      throw new Error(`bad RPC message: ${JSON.stringify(msg)}`);
    }
  }
  async drain() {
    if (this.abortReason) throw this.abortReason;
    if (this.pullCount > 0) {
      let { promise, resolve, reject } = Promise.withResolvers();
      this.onBatchDone = {
        resolve,
        reject
      };
      await promise;
    }
  }
  getStats() {
    let result = {
      imports: 0,
      exports: 0
    };
    for (let i in this.imports) ++result.imports;
    for (let i in this.exports) ++result.exports;
    return result;
  }
};
var RpcSession$1 = class {
  #session;
  #mainStub;
  constructor(transport, localMain, options = {}) {
    let mainHook;
    if (localMain) mainHook = new PayloadStubHook(RpcPayload.fromAppReturn(localMain));
    else mainHook = new ErrorStubHook(/* @__PURE__ */ new Error("This connection has no main object."));
    this.#session = new RpcSessionImpl(transport, mainHook, options);
    this.#mainStub = new RpcStub$1(this.#session.getMainImport());
  }
  getRemoteMain() {
    return this.#mainStub;
  }
  getStats() {
    return this.#session.getStats();
  }
  drain() {
    return this.#session.drain();
  }
};
var currentMapBuilder;
var MapBuilder = class {
  context;
  captureMap = /* @__PURE__ */ new Map();
  instructions = [];
  constructor(subject, path3) {
    if (currentMapBuilder) this.context = {
      parent: currentMapBuilder,
      captures: [],
      subject: currentMapBuilder.capture(subject),
      path: path3
    };
    else this.context = {
      parent: void 0,
      captures: [],
      subject,
      path: path3
    };
    currentMapBuilder = this;
  }
  unregister() {
    currentMapBuilder = this.context.parent;
  }
  makeInput() {
    return new MapVariableHook(this, 0);
  }
  makeOutput(result) {
    let devalued;
    try {
      devalued = Devaluator.devaluate(result.value, void 0, this, result);
    } finally {
      result.dispose();
    }
    this.instructions.push(devalued);
    if (this.context.parent) {
      this.context.parent.instructions.push([
        "remap",
        this.context.subject,
        this.context.path,
        this.context.captures.map((cap) => ["import", cap]),
        this.instructions
      ]);
      return new MapVariableHook(this.context.parent, this.context.parent.instructions.length);
    } else return this.context.subject.map(this.context.path, this.context.captures, this.instructions);
  }
  pushCall(hook, path3, params) {
    let devalued = Devaluator.devaluate(params.value, void 0, this, params);
    devalued = devalued[0];
    let subject = this.capture(hook.dup());
    this.instructions.push([
      "pipeline",
      subject,
      path3,
      devalued
    ]);
    return new MapVariableHook(this, this.instructions.length);
  }
  pushGet(hook, path3) {
    let subject = this.capture(hook.dup());
    this.instructions.push([
      "pipeline",
      subject,
      path3
    ]);
    return new MapVariableHook(this, this.instructions.length);
  }
  capture(hook) {
    if (hook instanceof MapVariableHook && hook.mapper === this) return hook.idx;
    let result = this.captureMap.get(hook);
    if (result === void 0) {
      if (this.context.parent) {
        let parentIdx = this.context.parent.capture(hook);
        this.context.captures.push(parentIdx);
      } else this.context.captures.push(hook);
      result = -this.context.captures.length;
      this.captureMap.set(hook, result);
    }
    return result;
  }
  exportStub(hook) {
    throw new Error("Can't construct an RpcTarget or RPC callback inside a mapper function. Try creating a new RpcStub outside the callback first, then using it inside the callback.");
  }
  exportPromise(hook) {
    return this.exportStub(hook);
  }
  getImport(hook) {
    return this.capture(hook);
  }
  unexport(ids) {
  }
  createPipe(readable) {
    throw new Error("Cannot send ReadableStream inside a mapper function.");
  }
  onSendError(error) {
  }
};
mapImpl.sendMap = (hook, path3, func) => {
  let builder = new MapBuilder(hook, path3);
  let result;
  try {
    result = RpcPayload.fromAppReturn(withCallInterceptor(builder.pushCall.bind(builder), () => {
      return func(new RpcPromise$1(builder.makeInput(), []));
    }));
  } finally {
    builder.unregister();
  }
  if (result instanceof Promise) {
    result.catch((err) => {
    });
    throw new Error("RPC map() callbacks cannot be async.");
  }
  return new RpcPromise$1(builder.makeOutput(result), []);
};
function throwMapperBuilderUseError() {
  throw new Error("Attempted to use an abstract placeholder from a mapper function. Please make sure your map function has no side effects.");
}
var MapVariableHook = class extends StubHook {
  mapper;
  idx;
  constructor(mapper, idx) {
    super();
    this.mapper = mapper;
    this.idx = idx;
  }
  dup() {
    return this;
  }
  dispose() {
  }
  get(path3) {
    if (path3.length == 0) return this;
    else if (currentMapBuilder) return currentMapBuilder.pushGet(this, path3);
    else throwMapperBuilderUseError();
  }
  call(path3, args) {
    throwMapperBuilderUseError();
  }
  map(path3, captures, instructions) {
    throwMapperBuilderUseError();
  }
  pull() {
    throwMapperBuilderUseError();
  }
  ignoreUnhandledRejections() {
  }
  onBroken(callback) {
    throwMapperBuilderUseError();
  }
};
var MapApplicator = class {
  captures;
  variables;
  constructor(captures, input) {
    this.captures = captures;
    this.variables = [input];
  }
  dispose() {
    for (let variable of this.variables) variable.dispose();
  }
  apply(instructions) {
    try {
      if (instructions.length < 1) throw new Error("Invalid empty mapper function.");
      for (let instruction of instructions.slice(0, -1)) {
        let payload = new Evaluator(this).evaluateCopy(instruction);
        if (payload.value instanceof RpcStub$1) {
          let hook = unwrapStubNoProperties(payload.value);
          if (hook) {
            this.variables.push(hook);
            continue;
          }
        }
        this.variables.push(new PayloadStubHook(payload));
      }
      return new Evaluator(this).evaluateCopy(instructions[instructions.length - 1]);
    } finally {
      for (let variable of this.variables) variable.dispose();
    }
  }
  importStub(idx) {
    throw new Error("A mapper function cannot refer to exports.");
  }
  importPromise(idx) {
    return this.importStub(idx);
  }
  getExport(idx) {
    if (idx < 0) return this.captures[-idx - 1];
    else return this.variables[idx];
  }
  getPipeReadable(exportId) {
    throw new Error("A mapper function cannot use pipe readables.");
  }
};
function applyMapToElement(input, parent, owner, captures, instructions) {
  let mapper = new MapApplicator(captures, new PayloadStubHook(RpcPayload.deepCopyFrom(input, parent, owner)));
  try {
    return mapper.apply(instructions);
  } finally {
    mapper.dispose();
  }
}
mapImpl.applyMap = (input, parent, owner, captures, instructions) => {
  try {
    let result;
    if (input instanceof RpcPromise$1) throw new Error("applyMap() can't be called on RpcPromise");
    else if (input instanceof Array) {
      let payloads = [];
      try {
        for (let elem of input) payloads.push(applyMapToElement(elem, input, owner, captures, instructions));
      } catch (err) {
        for (let payload of payloads) payload.dispose();
        throw err;
      }
      result = RpcPayload.fromArray(payloads);
    } else if (input === null || input === void 0) result = RpcPayload.fromAppReturn(input);
    else result = applyMapToElement(input, parent, owner, captures, instructions);
    return new PayloadStubHook(result);
  } finally {
    for (let cap of captures) cap.dispose();
  }
};
var WritableStreamStubHook = class WritableStreamStubHook2 extends StubHook {
  state;
  static create(stream) {
    return new WritableStreamStubHook2({
      refcount: 1,
      writer: stream.getWriter(),
      closed: false
    });
  }
  constructor(state, dupFrom) {
    super();
    this.state = state;
    if (dupFrom) ++state.refcount;
  }
  getState() {
    if (this.state) return this.state;
    else throw new Error("Attempted to use a WritableStreamStubHook after it was disposed.");
  }
  call(path3, args) {
    try {
      let state = this.getState();
      if (path3.length !== 1 || typeof path3[0] !== "string") throw new Error("WritableStream stub only supports direct method calls");
      const method = path3[0];
      if (method !== "write" && method !== "close" && method !== "abort") {
        args.dispose();
        throw new Error(`Unknown WritableStream method: ${method}`);
      }
      if (method === "close" || method === "abort") state.closed = true;
      let func = state.writer[method];
      return new PromiseStubHook(args.deliverCall(func, state.writer).then((payload) => new PayloadStubHook(payload)));
    } catch (err) {
      return new ErrorStubHook(err);
    }
  }
  map(path3, captures, instructions) {
    for (let cap of captures) cap.dispose();
    return new ErrorStubHook(/* @__PURE__ */ new Error("Cannot use map() on a WritableStream"));
  }
  get(path3) {
    return new ErrorStubHook(/* @__PURE__ */ new Error("Cannot access properties on a WritableStream stub"));
  }
  dup() {
    return new WritableStreamStubHook2(this.getState(), this);
  }
  pull() {
    return Promise.reject(/* @__PURE__ */ new Error("Cannot pull a WritableStream stub"));
  }
  ignoreUnhandledRejections() {
  }
  dispose() {
    let state = this.state;
    this.state = void 0;
    if (state) {
      if (--state.refcount === 0) {
        if (!state.closed) state.writer.abort(/* @__PURE__ */ new Error("WritableStream RPC stub was disposed without calling close()")).catch(() => {
        });
        state.writer.releaseLock();
      }
    }
  }
  onBroken(callback) {
  }
};
var INITIAL_WINDOW = 256 * 1024;
var MAX_WINDOW = 1024 * 1024 * 1024;
var MIN_WINDOW = 64 * 1024;
var STARTUP_GROWTH_FACTOR = 2;
var STEADY_GROWTH_FACTOR = 1.25;
var DECAY_FACTOR = 0.9;
var STARTUP_EXIT_ROUNDS = 3;
var FlowController = class {
  now;
  window = INITIAL_WINDOW;
  bytesInFlight = 0;
  inStartupPhase = true;
  delivered = 0;
  deliveredTime = 0;
  firstAckTime = 0;
  firstAckDelivered = 0;
  minRtt = Infinity;
  roundsWithoutIncrease = 0;
  lastRoundWindow = 0;
  roundStartTime = 0;
  constructor(now) {
    this.now = now;
  }
  onSend(size) {
    this.bytesInFlight += size;
    let token = {
      sentTime: this.now(),
      size,
      deliveredAtSend: this.delivered,
      deliveredTimeAtSend: this.deliveredTime,
      windowAtSend: this.window,
      windowFullAtSend: this.bytesInFlight >= this.window
    };
    return {
      token,
      shouldBlock: token.windowFullAtSend
    };
  }
  onError(token) {
    this.bytesInFlight -= token.size;
  }
  onAck(token) {
    let ackTime = this.now();
    this.delivered += token.size;
    this.deliveredTime = ackTime;
    this.bytesInFlight -= token.size;
    let rtt = ackTime - token.sentTime;
    this.minRtt = Math.min(this.minRtt, rtt);
    if (this.firstAckTime === 0) {
      this.firstAckTime = ackTime;
      this.firstAckDelivered = this.delivered;
    } else {
      let baseTime;
      let baseDelivered;
      if (token.deliveredTimeAtSend === 0) {
        baseTime = this.firstAckTime;
        baseDelivered = this.firstAckDelivered;
      } else {
        baseTime = token.deliveredTimeAtSend;
        baseDelivered = token.deliveredAtSend;
      }
      let interval = ackTime - baseTime;
      let bandwidth = (this.delivered - baseDelivered) / interval;
      let growthFactor = this.inStartupPhase ? STARTUP_GROWTH_FACTOR : STEADY_GROWTH_FACTOR;
      let newWindow = bandwidth * this.minRtt * growthFactor;
      newWindow = Math.min(newWindow, token.windowAtSend * growthFactor);
      if (token.windowFullAtSend) newWindow = Math.max(newWindow, token.windowAtSend * DECAY_FACTOR);
      else newWindow = Math.max(newWindow, this.window);
      this.window = Math.max(Math.min(newWindow, MAX_WINDOW), MIN_WINDOW);
      if (this.inStartupPhase && token.sentTime >= this.roundStartTime) {
        if (this.window > this.lastRoundWindow * STEADY_GROWTH_FACTOR) this.roundsWithoutIncrease = 0;
        else if (++this.roundsWithoutIncrease >= STARTUP_EXIT_ROUNDS) this.inStartupPhase = false;
        this.roundStartTime = ackTime;
        this.lastRoundWindow = this.window;
      }
    }
    return this.bytesInFlight < this.window;
  }
};
function createWritableStreamFromHook(hook) {
  let pendingError = void 0;
  let hookDisposed = false;
  let fc = new FlowController(() => performance.now());
  let windowResolve;
  let windowReject;
  const disposeHook = () => {
    if (!hookDisposed) {
      hookDisposed = true;
      hook.dispose();
    }
  };
  return new WritableStream({
    write(chunk, controller) {
      if (pendingError !== void 0) throw pendingError;
      const payload = RpcPayload.fromAppParams([chunk]);
      const { promise, size } = hook.stream(["write"], payload);
      if (size === void 0) return promise.catch((err) => {
        if (pendingError === void 0) pendingError = err;
        throw err;
      });
      else {
        let { token, shouldBlock } = fc.onSend(size);
        promise.then(() => {
          if (fc.onAck(token) && windowResolve) {
            windowResolve();
            windowResolve = void 0;
            windowReject = void 0;
          }
        }, (err) => {
          fc.onError(token);
          if (pendingError === void 0) {
            pendingError = err;
            controller.error(err);
            disposeHook();
          }
          if (windowReject) {
            windowReject(err);
            windowResolve = void 0;
            windowReject = void 0;
          }
        });
        if (shouldBlock) return new Promise((resolve, reject) => {
          windowResolve = resolve;
          windowReject = reject;
        });
      }
    },
    async close() {
      if (pendingError !== void 0) {
        disposeHook();
        throw pendingError;
      }
      const { promise } = hook.stream(["close"], RpcPayload.fromAppParams([]));
      try {
        await promise;
      } catch (err) {
        throw pendingError ?? err;
      } finally {
        disposeHook();
      }
    },
    abort(reason) {
      if (pendingError !== void 0) return;
      pendingError = reason ?? /* @__PURE__ */ new Error("WritableStream was aborted");
      if (windowReject) {
        windowReject(pendingError);
        windowResolve = void 0;
        windowReject = void 0;
      }
      const { promise } = hook.stream(["abort"], RpcPayload.fromAppParams([reason]));
      promise.then(() => disposeHook(), () => disposeHook());
    }
  });
}
var ReadableStreamStubHook = class ReadableStreamStubHook2 extends StubHook {
  state;
  static create(stream) {
    return new ReadableStreamStubHook2({
      refcount: 1,
      stream,
      canceled: false
    });
  }
  constructor(state, dupFrom) {
    super();
    this.state = state;
    if (dupFrom) ++state.refcount;
  }
  call(path3, args) {
    args.dispose();
    return new ErrorStubHook(/* @__PURE__ */ new Error("Cannot call methods on a ReadableStream stub"));
  }
  map(path3, captures, instructions) {
    for (let cap of captures) cap.dispose();
    return new ErrorStubHook(/* @__PURE__ */ new Error("Cannot use map() on a ReadableStream"));
  }
  get(path3) {
    return new ErrorStubHook(/* @__PURE__ */ new Error("Cannot access properties on a ReadableStream stub"));
  }
  dup() {
    let state = this.state;
    if (!state) throw new Error("Attempted to dup a ReadableStreamStubHook after it was disposed.");
    return new ReadableStreamStubHook2(state, this);
  }
  pull() {
    return Promise.reject(/* @__PURE__ */ new Error("Cannot pull a ReadableStream stub"));
  }
  ignoreUnhandledRejections() {
  }
  dispose() {
    let state = this.state;
    this.state = void 0;
    if (state) {
      if (--state.refcount === 0) {
        if (!state.canceled) {
          state.canceled = true;
          if (!state.stream.locked) state.stream.cancel(/* @__PURE__ */ new Error("ReadableStream RPC stub was disposed without being consumed")).catch(() => {
          });
        }
      }
    }
  }
  onBroken(callback) {
  }
};
streamImpl.createWritableStreamHook = WritableStreamStubHook.create;
streamImpl.createWritableStreamFromHook = createWritableStreamFromHook;
streamImpl.createReadableStreamHook = ReadableStreamStubHook.create;
var RpcSession = RpcSession$1;
var RpcTarget = RpcTarget$1;

// lib/host.js
var import_atom2 = require("atom");
var import_fs = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));

// lib/channel.js
var CHANNEL = "tranquil:rpc";

// lib/queue.js
function makeQueue() {
  const buffer = [];
  const waiters = [];
  return {
    push(msg) {
      const w = waiters.shift();
      if (w) w.resolve(msg);
      else buffer.push(msg);
    },
    pull() {
      if (buffer.length) return Promise.resolve(buffer.shift());
      return new Promise((resolve, reject) => waiters.push({ resolve, reject }));
    },
    fail(err) {
      let w;
      while (w = waiters.shift()) w.reject(err);
    }
  };
}

// lib/transport-host.js
function hostTransport(webview) {
  const q = makeQueue();
  const onMessage = (e) => {
    if (e.channel === CHANNEL) q.push(e.args[0]);
  };
  webview.addEventListener("ipc-message", onMessage);
  const dispose = () => webview.removeEventListener("ipc-message", onMessage);
  return {
    encodingLevel: "string",
    send: (msg) => {
      webview.send(CHANNEL, msg);
    },
    receive: () => q.pull(),
    abort: (reason) => {
      dispose();
      q.fail(reason instanceof Error ? reason : new Error(String(reason)));
    },
    dispose
  };
}

// lib/registry.js
var factories = /* @__PURE__ */ new Map();
function registerCapability(name, factory, options) {
  if (typeof name !== "string" || name.length === 0) {
    throw new Error("registerCapability: name must be a non-empty string");
  }
  if (typeof factory !== "function") {
    throw new Error(`registerCapability: factory for "${name}" must be a function`);
  }
  const audience = options && options.audience || ["webview"];
  if (!Array.isArray(audience) || audience.length === 0 || audience.some((a) => a !== "webview" && a !== "runner")) {
    throw new Error(
      `registerCapability: audience for "${name}" must be a non-empty array of "webview" | "runner"`
    );
  }
  const requires = options && options.requires || null;
  if (requires != null && typeof requires !== "string") {
    throw new Error(`registerCapability: requires for "${name}" must be a string`);
  }
  factories.set(name, { factory, audience, requires });
}
function buildHostApi(ctx) {
  const kind = ctx && ctx.kind || "webview";
  const proto = Object.create(RpcTarget.prototype);
  const cache = /* @__PURE__ */ new Map();
  for (const [name, { factory, audience, requires }] of factories) {
    if (!audience.includes(kind)) continue;
    if (requires && kind === "runner" && !(ctx && ctx.grants && ctx.grants[requires])) continue;
    Object.defineProperty(proto, name, {
      configurable: true,
      enumerable: false,
      get() {
        if (!cache.has(name)) cache.set(name, factory(ctx));
        return cache.get(name);
      }
    });
  }
  return Object.create(proto);
}

// lib/trust.js
var import_path = __toESM(require("path"));
var import_url = require("url");
var roots = /* @__PURE__ */ new Set();
function toRootPath(input) {
  if (typeof input !== "string" || input.length === 0) return null;
  let abs;
  try {
    abs = input.startsWith("file://") ? (0, import_url.fileURLToPath)(input) : import_path.default.resolve(input);
  } catch (e) {
    return null;
  }
  return abs.replace(/[\\/]+$/, "");
}
function addTrustedRoot(input) {
  const root = toRootPath(input);
  if (root && !roots.has(root)) console.log("[tranquil-rpc]", "trusted root registered:", root);
  if (root) roots.add(root);
  return root;
}
function isTrusted(url) {
  if (typeof url !== "string" || url.length === 0) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return false;
  }
  if (parsed.protocol !== "file:") return false;
  let filePath;
  try {
    parsed.search = "";
    parsed.hash = "";
    filePath = (0, import_url.fileURLToPath)(parsed);
  } catch (e) {
    return false;
  }
  const normalized = filePath.replace(/[\\/]+$/, "");
  for (const root of roots) {
    if (normalized === root || normalized.startsWith(root + import_path.default.sep)) return true;
  }
  return false;
}

// lib/runner-host.js
var import_crypto = __toESM(require("crypto"));

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// lib/runner-host.js
var import_atom = require("atom");

// lib/transport-ws.js
function wsTransport(socket, { onControl } = {}) {
  const q = makeQueue();
  const handle = (data) => {
    const text = typeof data === "string" ? data : data.toString();
    if (text === "CANCEL") {
      if (onControl) onControl(text);
      return;
    }
    q.push(text);
  };
  let dispose;
  if (typeof socket.on === "function") {
    const onMessage = (data) => handle(data);
    const onClose = () => q.fail(new Error("socket closed"));
    socket.on("message", onMessage);
    socket.on("close", onClose);
    dispose = () => {
      socket.off("message", onMessage);
      socket.off("close", onClose);
    };
  } else {
    const onMessage = (e) => handle(e.data);
    const onClose = () => q.fail(new Error("socket closed"));
    socket.addEventListener("message", onMessage);
    socket.addEventListener("close", onClose);
    dispose = () => {
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("close", onClose);
    };
  }
  return {
    encodingLevel: "string",
    send: (msg) => {
      socket.send(msg);
    },
    receive: () => q.pull(),
    abort: (reason) => {
      dispose();
      q.fail(reason instanceof Error ? reason : new Error(String(reason)));
    },
    dispose
  };
}

// lib/runner-host.js
var TAG = "[tranquil-rpc runner]";
var AUTH_TIMEOUT_MS = 3e3;
var TOKEN_TTL_MS = 6e4;
var DEBUG_AUTH_TIMEOUT_MS = 10 * 6e4;
var DEBUG_TOKEN_TTL_MS = 10 * 6e4;
var pendingDebugTokens = 0;
function currentAuthTimeoutMs() {
  return pendingDebugTokens > 0 ? DEBUG_AUTH_TIMEOUT_MS : AUTH_TIMEOUT_MS;
}
function releaseDebugHold(meta) {
  if (!meta || !meta.debug) return;
  meta.debug = false;
  pendingDebugTokens = Math.max(0, pendingDebugTokens - 1);
}
var server = null;
var serverPort = null;
var tokens = /* @__PURE__ */ new Map();
var sessions = /* @__PURE__ */ new Map();
function refuse(socket, why) {
  console.warn(TAG, "auth refused:", why);
  try {
    socket.close(4001, why);
  } catch (e) {
  }
}
function handleConnection(socket) {
  let authed = false;
  const authTimer = setTimeout(() => {
    if (!authed) refuse(socket, "auth timeout");
  }, currentAuthTimeoutMs());
  const onAuthMessage = (data) => {
    if (authed) return;
    clearTimeout(authTimer);
    const text = typeof data === "string" ? data : data.toString();
    if (!text.startsWith("AUTH ")) {
      refuse(socket, "first frame was not AUTH");
      return;
    }
    const token = text.slice(5);
    const meta = tokens.get(token);
    if (meta) {
      clearTimeout(meta.timer);
      releaseDebugHold(meta);
      tokens.delete(token);
    }
    if (!meta) {
      refuse(socket, "unknown or already-used token");
      return;
    }
    authed = true;
    socket.off("message", onAuthMessage);
    const { runId, scriptPath, scriptDir, grants } = meta;
    const subscriptions2 = new import_atom.CompositeDisposable();
    const transport = wsTransport(socket);
    const session = new RpcSession(
      transport,
      // `grants` decides which capabilities this session can even see (ADR-0025). It arrives
      // with the token, so it is fixed at mint time and cannot be influenced by the child.
      buildHostApi({ kind: "runner", runId, scriptPath, scriptDir, grants, subscriptions: subscriptions2 })
    );
    sessions.set(runId, { socket, transport, session, subscriptions: subscriptions2 });
    socket.on("close", () => {
      const s = sessions.get(runId);
      if (!s || s.socket !== socket) return;
      sessions.delete(runId);
      try {
        s.transport.abort(new Error("runner socket closed"));
      } catch (e) {
      }
      try {
        s.subscriptions.dispose();
      } catch (e) {
      }
    });
    socket.send("AUTH OK");
  };
  socket.on("message", onAuthMessage);
  socket.on("close", () => clearTimeout(authTimer));
}
function ensureRunnerServer() {
  if (server && serverPort != null) return Promise.resolve({ port: serverPort });
  return new Promise((resolve, reject) => {
    const wss = new import_websocket_server.default({ host: "127.0.0.1", port: 0 });
    wss.on("listening", () => {
      server = wss;
      serverPort = wss.address().port;
      console.log(TAG, "listening on 127.0.0.1:" + serverPort);
      resolve({ port: serverPort });
    });
    wss.on("error", (err) => {
      if (server !== wss) reject(err);
      else console.error(TAG, "server error:", err);
    });
    wss.on("connection", handleConnection);
  });
}
function mintRunToken({ runId, scriptPath, scriptDir, grants = null, debug = false }) {
  if (!runId) throw new Error("mintRunToken: runId is required");
  const token = import_crypto.default.randomBytes(32).toString("hex");
  const meta = { runId, scriptPath, scriptDir, grants, debug };
  if (debug) pendingDebugTokens += 1;
  meta.timer = setTimeout(
    () => {
      releaseDebugHold(meta);
      tokens.delete(token);
    },
    debug ? DEBUG_TOKEN_TTL_MS : TOKEN_TTL_MS
  );
  tokens.set(token, meta);
  return token;
}
function sendCancel(runId) {
  const s = sessions.get(runId);
  if (!s) return false;
  try {
    s.socket.send("CANCEL");
    return true;
  } catch (e) {
    return false;
  }
}
function endRun(runId) {
  for (const [token, meta] of tokens) {
    if (meta.runId === runId) {
      clearTimeout(meta.timer);
      releaseDebugHold(meta);
      tokens.delete(token);
    }
  }
  const s = sessions.get(runId);
  if (s) {
    try {
      s.socket.close(1e3, "run ended");
    } catch (e) {
    }
  }
}
function closeRunnerServer() {
  for (const [runId] of sessions) endRun(runId);
  for (const [, meta] of tokens) {
    clearTimeout(meta.timer);
    releaseDebugHold(meta);
  }
  tokens.clear();
  if (server) {
    try {
      server.close();
    } catch (e) {
    }
    server = null;
    serverPort = null;
  }
}

// lib/host.js
var TAG2 = "[tranquil-rpc]";
var subscriptions = null;
var guestBundleCache = null;
function guestBundle() {
  if (guestBundleCache == null) {
    guestBundleCache = import_fs.default.readFileSync(
      import_path2.default.join(__dirname, "tranquil-rpc-guest.js"),
      "utf8"
    );
  }
  return guestBundleCache;
}
function webviewFor(item) {
  const outlet = item && item.view && item.view.htmlv && item.view.htmlv[0];
  if (outlet) return outlet;
  const el = item && atom.views.getView(item);
  return el && el.querySelector && el.querySelector("webview") || null;
}
function isReady(webview) {
  try {
    webview.getWebContentsId();
    return true;
  } catch (e) {
    return false;
  }
}
function manage(webview, item) {
  let current = null;
  const teardown = (reason) => {
    if (!current) return;
    try {
      current.transport.abort(reason);
    } catch (e) {
    }
    try {
      current.subscriptions.dispose();
    } catch (e) {
    }
    current = null;
  };
  const onLoad = () => {
    teardown("reload");
    let url;
    try {
      url = webview.getURL();
    } catch (e) {
      url = null;
    }
    if (!url) return;
    if (!isTrusted(url)) {
      return;
    }
    const transport = hostTransport(webview);
    const subscriptions2 = new import_atom2.CompositeDisposable();
    const session = new RpcSession(
      transport,
      buildHostApi({ kind: "webview", item, webview, url, subscriptions: subscriptions2 })
    );
    current = { transport, session, subscriptions: subscriptions2 };
    webview.executeJavaScript(guestBundle()).then(() => console.log(TAG2, "trusted session opened + guest injected:", url)).catch((e) => console.error(TAG2, "guest injection failed:", e));
  };
  webview.addEventListener("dom-ready", onLoad);
  if (isReady(webview)) onLoad();
  return new import_atom2.Disposable(() => {
    webview.removeEventListener("dom-ready", onLoad);
    teardown("closed");
  });
}
function activate() {
  subscriptions = new import_atom2.CompositeDisposable();
  const managed = /* @__PURE__ */ new WeakMap();
  registerCapability("ping", (ctx) => () => {
    console.log(TAG2, "ping() invoked by guest:", ctx.url);
    return "pong";
  });
  const consider = (item) => {
    if (!item || typeof item.getURL !== "function") return;
    let tries = 0;
    const tryAttach = () => {
      const webview = webviewFor(item);
      if (!webview) {
        if (tries++ < 100) setTimeout(tryAttach, 100);
        return;
      }
      if (managed.has(webview)) return;
      const disp = manage(webview, item);
      managed.set(webview, disp);
      subscriptions.add(disp);
    };
    tryAttach();
  };
  subscriptions.add(atom.workspace.observePaneItems(consider));
  subscriptions.add(
    atom.workspace.onWillDestroyPaneItem(({ item }) => {
      const webview = webviewFor(item);
      const disp = webview && managed.get(webview);
      if (disp) {
        disp.dispose();
        managed.delete(webview);
      }
    })
  );
  subscriptions.add(
    atom.commands.add("atom-workspace", {
      "tranquil-rpc:open-webview-devtools": () => {
        const webview = webviewFor(atom.workspace.getActivePaneItem());
        if (webview) webview.openDevTools();
        else console.warn(TAG2, "active pane item has no webview");
      }
    })
  );
  return subscriptions;
}
function deactivate() {
  closeRunnerServer();
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }
}

// lib/index.js
function provideRpc() {
  return {
    registerCapability,
    addTrustedRoot,
    isTrusted,
    RpcTarget,
    ensureRunnerServer,
    mintRunToken,
    sendCancel,
    endRun
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RpcTarget,
  activate,
  addTrustedRoot,
  closeRunnerServer,
  deactivate,
  endRun,
  ensureRunnerServer,
  isTrusted,
  mintRunToken,
  provideRpc,
  registerCapability,
  sendCancel
});
