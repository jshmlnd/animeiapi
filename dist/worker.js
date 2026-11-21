var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// src/worker.js
var ANILIST_URL = "https://graphql.anilist.co";
var MIRRORS = [
  "https://www.miruro.tv",
  "https://www.miruro.ru",
  "https://www.miruro.bz",
  "https://www.miruro.to"
];
var MEDIA_LIST_FIELDS = `
  id
  title { romaji english native }
  coverImage { large extraLarge color }
  bannerImage
  format
  season
  seasonYear
  episodes
  duration
  status
  averageScore
  meanScore
  popularity
  favourites
  genres
  isAdult
`;
var CACHE_TTL = 300;
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers }
  });
}
__name(json, "json");
function b64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64urlEncode, "b64urlEncode");
function b64urlDecode(str) {
  const pad = str.length % 4 ? "=".repeat(4 - str.length % 4) : "";
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}
__name(b64urlDecode, "b64urlDecode");
function b64EncodeUrl(str) {
  return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64EncodeUrl, "b64EncodeUrl");
function b64DecodeUrl(str) {
  const pad = str.length % 4 ? "=".repeat(4 - str.length % 4) : "";
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return decodeURIComponent(escape(atob(b64)));
}
__name(b64DecodeUrl, "b64DecodeUrl");
async function gunzip(buf) {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}
__name(gunzip, "gunzip");
async function cacheGet(env2, key) {
  if (!env2.CACHE) return null;
  try {
    return await env2.CACHE.get(key, "json");
  } catch {
    return null;
  }
}
__name(cacheGet, "cacheGet");
async function cachePut(env2, key, value, ttl = CACHE_TTL) {
  if (!env2.CACHE) return;
  try {
    await env2.CACHE.put(key, JSON.stringify(value), { expirationTtl: ttl });
  } catch {
  }
}
__name(cachePut, "cachePut");
async function anilist(query, variables) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Origin: "https://anilist.co" },
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json();
  if (body.errors && body.errors.length) {
    const err = new Error(body.errors.map((e) => e.message).join("; "));
    err.status = body.errors[0] && body.errors[0].status || 502;
    throw err;
  }
  return body.data;
}
__name(anilist, "anilist");
function encodePipeRequest(payload) {
  return b64urlEncode(JSON.stringify(payload));
}
__name(encodePipeRequest, "encodePipeRequest");
async function decodePipeResponse(encoded) {
  const buf = b64urlDecode(encoded.trim());
  const raw = await gunzip(buf);
  return JSON.parse(new TextDecoder().decode(raw));
}
__name(decodePipeResponse, "decodePipeResponse");
async function pipeViaFlareSolverr(env2, base, payload) {
  if (!env2.FLARESOLVERR_URL) {
    const err = new Error("FLARESOLVERR_URL is not set (streaming requires a FlareSolverr instance)");
    err.status = 502;
    throw err;
  }
  const fsUrl = env2.FLARESOLVERR_URL.replace(/\/+$/, "");
  const pipeUrl = `${base}/api/secure/pipe?e=${encodePipeRequest(payload)}`;
  const res = await fetch(`${fsUrl}/v1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cmd: "request.get",
      url: pipeUrl,
      maxTimeout: Number(env2.FLARESOLVERR_TIMEOUT || 6e4)
    })
  });
  const body = await res.json();
  if (body.status !== "ok" || !body.solution) {
    const msg = body.message || "no solution";
    const err = new Error(`FlareSolverr: ${msg}`);
    err.status = 502;
    if (/block|challenge|banned|captcha|forbidden/i.test(msg)) err.isBlocked = true;
    throw err;
  }
  const status = body.solution.status;
  if (status && status >= 400) {
    const err = new Error(`FlareSolverr: upstream HTTP ${status}`);
    err.status = status;
    throw err;
  }
  return decodePipeResponse(body.solution.response);
}
__name(pipeViaFlareSolverr, "pipeViaFlareSolverr");
async function pipeFirstWorking(env2, bases, payload) {
  let lastErr = null;
  for (const base of bases) {
    try {
      return await pipeViaFlareSolverr(env2, base, payload);
    } catch (err) {
      if (!err.isBlocked) throw err;
      lastErr = err;
    }
  }
  throw lastErr || new Error("pipe: no mirrors configured");
}
__name(pipeFirstWorking, "pipeFirstWorking");
function rewriteM3u8(text, baseUrl, proxyBase) {
  const lines = text.split("\n").map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      if (trimmed.includes("://") && !trimmed.startsWith("#EXTM3U")) {
        try {
          const abs = new URL(trimmed, baseUrl).toString();
          return line.replace(trimmed, `${proxyBase}${b64EncodeUrl(abs)}`);
        } catch {
          return line;
        }
      }
      return line;
    }
    try {
      const abs = new URL(trimmed, baseUrl).toString();
      return `${proxyBase}${b64EncodeUrl(abs)}`;
    } catch {
      return line;
    }
  });
  return lines.join("\n");
}
__name(rewriteM3u8, "rewriteM3u8");
async function proxyHls(urlStr, env2, selfUrl) {
  let target;
  try {
    target = new URL(urlStr);
  } catch {
    const err = new Error("invalid hls url");
    err.status = 400;
    throw err;
  }
  const refererBase = env2.HLS_REFERER ? env2.HLS_REFERER.replace(/\/+$/, "") : MIRRORS[0];
  const res = await fetch(target.toString(), {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Referer: `${refererBase}/`,
      Origin: refererBase
    }
  });
  if (res.status >= 400) {
    const err = new Error(`upstream HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  const body = await res.arrayBuffer();
  const headers = {
    "content-type": contentType,
    "cache-control": "public, max-age=3600",
    "access-control-allow-origin": "*"
  };
  const isPlaylist = contentType.includes("mpegurl") || contentType.includes("vnd.apple") || target.pathname.endsWith(".m3u8");
  if (isPlaylist) {
    const proxyBase = `${(env2.HLS_ORIGIN || selfUrl || "https://example.com").replace(/\/+$/, "")}/hls/`;
    const text = new TextDecoder().decode(body);
    const rewritten = rewriteM3u8(text, target.toString(), proxyBase);
    return new Response(rewritten, { status: 200, headers });
  }
  return new Response(body, { status: 200, headers });
}
__name(proxyHls, "proxyHls");
var handlers = {
  async search({ q, page, perPage }) {
    if (!q) return errorOnly("search requires ?q=", 400);
    const data = await anilist(
      `query ($search: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(search: $search, type: ANIME, sort: SEARCH_MATCH) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { search: q, page: page || 1, perPage: Math.min(perPage || 20, 50) }
    );
    const p = data.Page;
    return { page: p.pageInfo.currentPage, perPage: p.pageInfo.perPage, total: p.pageInfo.total, hasNextPage: p.pageInfo.hasNextPage, results: p.media };
  },
  async trending({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, sort: [TRENDING_DESC, POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) }
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },
  async popular({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, sort: [POPULARITY_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) }
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },
  async recent({ page, perPage }) {
    const data = await anilist(
      `query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { total currentPage hasNextPage perPage }
          media(type: ANIME, status: RELEASING, sort: [START_DATE_DESC]) { ${MEDIA_LIST_FIELDS} }
        }
      }`,
      { page: page || 1, perPage: Math.min(perPage || 20, 50) }
    );
    return { results: data.Page.media, pageInfo: data.Page.pageInfo };
  },
  async info({ id }) {
    if (!id) return errorOnly("info requires /info/:id", 400);
    const data = await anilist(
      `query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge color }
          bannerImage
          format season seasonYear episodes duration status
          averageScore meanScore popularity favourites trending
          genres synonyms siteUrl
          trailer { id site thumbnail }
          studios { nodes { id name isAnimationStudio siteUrl } }
          nextAiringEpisode { episode airingAt timeUntilAiring }
          startDate { year month day } endDate { year month day }
        }
      }`,
      { id: Number(id) }
    );
    if (!data.Media) return errorOnly(`anime ${id} not found`, 404);
    return data.Media;
  },
  async episodes({ id }, env2, bases) {
    if (!id) return errorOnly("episodes requires /episodes/:id", 400);
    return pipeFirstWorking(env2, bases, {
      path: "episodes",
      method: "GET",
      query: { anilistId: Number(id) },
      body: null,
      version: "0.1.0"
    });
  },
  async watch({ provider, anilistId, category, slug }, env2, bases) {
    if (!provider || !anilistId || !category || !slug) {
      return errorOnly("watch requires /watch/:provider/:anilistId/:category/:slug", 400);
    }
    const epData = await pipeFirstWorking(env2, bases, {
      path: "episodes",
      method: "GET",
      query: { anilistId: Number(anilistId) },
      body: null,
      version: "0.1.0"
    });
    const prov = (epData.providers || {})[provider] || {};
    const list = (prov.episodes || {})[category] || [];
    const target = list.find((ep) => {
      const origId = String(ep.id || "");
      const prefix = origId.includes(":") ? origId.split(":")[0] : origId;
      return `${prefix}-${ep.number}` === slug;
    });
    if (!target) return errorOnly(`slug '${slug}' not found for ${provider}/${category}`, 404);
    return pipeFirstWorking(env2, bases, {
      path: "sources",
      method: "GET",
      query: { episodeId: b64urlEncode(String(target.id)), provider, category, anilistId: Number(anilistId) },
      body: null,
      version: "0.1.0"
    });
  }
};
function errorOnly(message, status) {
  const err = new Error(message);
  err.status = status;
  throw err;
}
__name(errorOnly, "errorOnly");
var worker_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const mirrorIdx = Math.floor(Date.now() / 1e3) % MIRRORS.length;
    const configured = env2.SOURCE_URL ? env2.SOURCE_URL.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean) : [...MIRRORS];
    const first = configured[mirrorIdx % configured.length];
    const bases = [first, ...configured.filter((u) => u !== first)];
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*"
    };
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const hlsMatch = path.match(/^\/hls\/(.+)$/);
    if (hlsMatch) {
      try {
        const targetUrl = b64DecodeUrl(hlsMatch[1]);
        const selfUrl = `${url.protocol}//${url.host}`;
        return await proxyHls(targetUrl, env2, selfUrl);
      } catch (err) {
        const status = err.status && err.status < 500 ? err.status : 502;
        return json({ success: false, error: "HLS proxy failed", details: err.message }, status, corsHeaders);
      }
    }
    try {
      const q = Object.fromEntries(url.searchParams.entries());
      const cacheKey = `json:${path}?${url.searchParams.toString()}`;
      const routes = [
        { re: /^\/search$/, fn: /* @__PURE__ */ __name(() => handlers.search(q), "fn"), ttl: CACHE_TTL },
        { re: /^\/trending$/, fn: /* @__PURE__ */ __name(() => handlers.trending(q), "fn"), ttl: CACHE_TTL },
        { re: /^\/popular$/, fn: /* @__PURE__ */ __name(() => handlers.popular(q), "fn"), ttl: CACHE_TTL },
        { re: /^\/recent$/, fn: /* @__PURE__ */ __name(() => handlers.recent(q), "fn"), ttl: CACHE_TTL },
        { re: /^\/info\/(\d+)$/, fn: /* @__PURE__ */ __name((m) => handlers.info({ id: m[1] }), "fn"), ttl: CACHE_TTL },
        { re: /^\/episodes\/(\d+)$/, fn: /* @__PURE__ */ __name((m) => handlers.episodes({ id: m[1] }, env2, bases), "fn"), ttl: CACHE_TTL },
        {
          re: /^\/watch\/([^/]+)\/(\d+)\/([^/]+)\/([^/]+)$/,
          fn: /* @__PURE__ */ __name((m) => handlers.watch({ provider: m[1], anilistId: m[2], category: m[3], slug: m[4] }, env2, bases), "fn"),
          ttl: 3600
        },
        {
          re: /^\/api\/stream\/([^/]+)\/(\d+)\/([^/]+)\/([^/]+)$/,
          fn: /* @__PURE__ */ __name((m) => handlers.watch({ provider: m[1], anilistId: m[2], category: m[3], slug: m[4] }, env2, bases), "fn"),
          ttl: 3600
        },
        { re: /^\/health$/, fn: /* @__PURE__ */ __name(() => ({ status: "ok" }), "fn"), ttl: 0 },
        {
          re: /^\/$/,
          fn: /* @__PURE__ */ __name(() => ({
            name: "animeiAPI (Worker)",
            endpoints: ["/search", "/trending", "/popular", "/recent", "/info/:id", "/episodes/:id", "/watch/:provider/:anilistId/:category/:slug", "/api/stream/:provider/:anilistId/:category/:slug", "/hls/:encodedUrl", "/health"]
          }), "fn"),
          ttl: 0
        }
      ];
      for (const r of routes) {
        const m = path.match(r.re);
        if (!m) continue;
        let data;
        if (r.ttl > 0) {
          const cached = await cacheGet(env2, cacheKey);
          if (cached !== null && cached !== void 0) {
            return json({ success: true, cached: true, data: cached }, 200, corsHeaders);
          }
          data = await r.fn(m);
          await cachePut(env2, cacheKey, data, r.ttl);
        } else {
          data = await r.fn(m);
        }
        const count3 = Array.isArray(data) ? data.length : data ? 1 : 0;
        return json({ success: true, cached: false, count: count3, data }, 200, corsHeaders);
      }
      return json({ success: false, error: "Not found" }, 404, corsHeaders);
    } catch (err) {
      const status = err.status && err.status < 500 ? err.status : 502;
      return json({ success: false, error: "Request failed", details: err.message }, status, corsHeaders);
    }
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
