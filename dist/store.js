"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.handle = handle;
exports.waitFor = waitFor;
exports.setupStores = setupStores;
exports.dispatch = dispatch;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _bus = require("./bus");

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};

var handlers = new Map();

function handle(fn, wrapper) {
    return function (target, method) {
        handlers.set(fn, handlers.get(fn) || []);
        handlers.set(fn, handlers.get(fn).concat([{ target: target, method: method, wrapper: wrapper }]));
    };
}

var waitForGraph = new Map();

function waitFor(storeToWaitOn) {
    return function (waiter) {
        waitForGraph.set(waiter, storeToWaitOn);
    };
}

function groupByAsMap(things, on) {
    var map = new Map();
    things.forEach(function (thing) {
        var result = on(thing);
        map.set(result, map.get(result) || []);
        map.set(result, map.get(result).concat([thing]));
    });
    return map;
}
var container = null;

function setupStores(getter) {
    container = getter;

    for (var _len = arguments.length, stores = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        stores[_key - 1] = arguments[_key];
    }

    stores.forEach(function (s) {
        return getter.get(s);
    });
}

function dispatchOnStore(event, handlers, target, dispatchRuns) {
    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$1$0() {
        var wait, promises, instance, _loop, hi;

        return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    if (!dispatchRuns.get(target.constructor)) {
                        context$2$0.next = 2;
                        break;
                    }

                    return context$2$0.abrupt("return");

                case 2:
                    wait = waitForGraph.get(target.constructor);

                    if (!(wait && dispatchRuns.get(wait) == null)) {
                        context$2$0.next = 6;
                        break;
                    }

                    context$2$0.next = 6;
                    return performDispatch(event, wait, dispatchRuns);

                case 6:
                    promises = [];
                    instance = container.get(target.constructor);

                    _loop = function (hi) {
                        var result = undefined;
                        if (handlers[hi].wrapper) {
                            var callHandler = function callHandler() {
                                return instance[handlers[hi].method].apply(instance, [event]);
                            };
                            var wrapperInstance = container.get(handlers[hi].wrapper);
                            result = wrapperInstance.handle.apply(wrapperInstance, [callHandler, event]);
                        } else {
                            result = instance[handlers[hi].method].apply(instance, [event]);
                        }
                        if (result instanceof Promise) {
                            promises.push(result);
                        }
                    };

                    for (hi = 0; hi < handlers.length; hi++) {
                        _loop(hi);
                    }

                    if (!(promises.length > 0)) {
                        context$2$0.next = 13;
                        break;
                    }

                    context$2$0.next = 13;
                    return Promise.all(promises);

                case 13:
                    dispatchRuns.set(target.constructor, true);

                case 14:
                case "end":
                    return context$2$0.stop();
            }
        }, callee$1$0, this);
    }));
}
function performDispatch(event) {
    var onlyTarget = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var dispatchRuns = arguments.length <= 2 || arguments[2] === undefined ? new Map() : arguments[2];

    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$1$0() {
        var eventHandlers, groupedHandlers, onlyTargetGroup, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step$value, target, _handlers;

        return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    eventHandlers = handlers.get(event.constructor);

                    if (!(eventHandlers == null)) {
                        context$2$0.next = 3;
                        break;
                    }

                    return context$2$0.abrupt("return");

                case 3:
                    groupedHandlers = groupByAsMap(eventHandlers, function (eh) {
                        return eh.target;
                    });

                    if (!onlyTarget) {
                        context$2$0.next = 12;
                        break;
                    }

                    if (!groupedHandlers.get(onlyTarget)) {
                        context$2$0.next = 11;
                        break;
                    }

                    onlyTargetGroup = groupedHandlers.get(onlyTarget);

                    groupedHandlers = new Map();
                    groupedHandlers.set(onlyTarget, onlyTargetGroup);
                    context$2$0.next = 12;
                    break;

                case 11:
                    return context$2$0.abrupt("return");

                case 12:
                    _iteratorNormalCompletion = true;
                    _didIteratorError = false;
                    _iteratorError = undefined;
                    context$2$0.prev = 15;
                    _iterator = groupedHandlers[Symbol.iterator]();

                case 17:
                    if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                        context$2$0.next = 26;
                        break;
                    }

                    _step$value = _slicedToArray(_step.value, 2);
                    target = _step$value[0];
                    _handlers = _step$value[1];
                    context$2$0.next = 23;
                    return dispatchOnStore(event, _handlers, target, dispatchRuns);

                case 23:
                    _iteratorNormalCompletion = true;
                    context$2$0.next = 17;
                    break;

                case 26:
                    context$2$0.next = 32;
                    break;

                case 28:
                    context$2$0.prev = 28;
                    context$2$0.t0 = context$2$0["catch"](15);
                    _didIteratorError = true;
                    _iteratorError = context$2$0.t0;

                case 32:
                    context$2$0.prev = 32;
                    context$2$0.prev = 33;

                    if (!_iteratorNormalCompletion && _iterator["return"]) {
                        _iterator["return"]();
                    }

                case 35:
                    context$2$0.prev = 35;

                    if (!_didIteratorError) {
                        context$2$0.next = 38;
                        break;
                    }

                    throw _iteratorError;

                case 38:
                    return context$2$0.finish(35);

                case 39:
                    return context$2$0.finish(32);

                case 40:
                case "end":
                    return context$2$0.stop();
            }
        }, callee$1$0, this, [[15, 28, 32, 40], [33,, 35, 39]]);
    }));
}

function dispatch(event) {
    if (handlers.has(event.constructor)) {
        return performDispatch(event);
    }
}

var StoreStateChanged = function StoreStateChanged() {
    _classCallCheck(this, StoreStateChanged);
};

var Store = (function () {
    function Store() {
        _classCallCheck(this, Store);

        this.stateSet = false;
        this.waiters = [];
        this.localBus = new _bus.Bus();
        this.state = this.defaultState();
    }

    _createClass(Store, [{
        key: "setState",
        value: function setState(newState) {
            Object.assign(this.state, newState);
            this.localBus.publish(new StoreStateChanged());
            if (!this.stateSet) {
                this.stateSet = true;
                this.waiters.forEach(function (w) {
                    return w();
                });
                this.waiters = [];
            }
        }

        // this will return a promise that waits for the
        // first time setState is called (so when something other than the defaultState
        // is called
    }, {
        key: "wait",
        value: function wait() {
            var _this = this;

            if (this.stateSet) return Promise.resolve();
            return new Promise(function (res) {
                _this.waiters.push(res);
            });
        }
    }, {
        key: "onStateChanged",
        value: function onStateChanged(cb) {
            return this.localBus.subscribe(StoreStateChanged, cb);
        }
    }]);

    return Store;
})();

exports.Store = Store;

// if we have already run, GET OUTA HERE

// todo, cache these

// welp, nothing to handle here.. move along