/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */













function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bus = function () {
    function Bus() {
        _classCallCheck$1(this, Bus);

        this.listeners = new Map();
    }

    _createClass$1(Bus, [{
        key: "subscribe",
        value: function subscribe(type, cb) {
            var _this = this;

            var listeners = this.listeners.get(type);
            if (listeners == null) {
                listeners = [];
                this.listeners.set(type, listeners);
            }
            listeners.push(cb);
            return {
                dispose: function dispose() {
                    var listeners = _this.listeners.get(type);
                    if (listeners == null) return;
                    var idx = listeners.indexOf(cb);
                    if (idx > -1) {
                        listeners.splice(idx, 1);
                    }
                }
            };
        }
    }, {
        key: "publish",
        value: function publish(message) {
            var listeners = this.listeners.get(message.constructor);
            if (listeners != null) {
                listeners.forEach(function (l) {
                    return l(message);
                });
            }
        }
    }]);

    return Bus;
}();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee() {
        var wait, promises, instance, _loop, hi;

        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        if (!dispatchRuns.get(target.constructor)) {
                            _context.next = 2;
                            break;
                        }

                        return _context.abrupt("return");

                    case 2:
                        wait = waitForGraph.get(target.constructor);

                        if (!(wait && dispatchRuns.get(wait) == null)) {
                            _context.next = 6;
                            break;
                        }

                        _context.next = 6;
                        return performDispatch(event, wait, dispatchRuns);

                    case 6:
                        promises = [];
                        // todo, cache these

                        instance = container.get(target.constructor);

                        _loop = function _loop(hi) {
                            var result = void 0;
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
                            _context.next = 13;
                            break;
                        }

                        _context.next = 13;
                        return Promise.all(promises);

                    case 13:
                        dispatchRuns.set(target.constructor, true);

                    case 14:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
}
function performDispatch(event) {
    var onlyTarget = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var dispatchRuns = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : new Map();

    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function _callee2() {
        var eventHandlers, groupedHandlers, onlyTargetGroup, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step$value, target, _handlers;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        eventHandlers = handlers.get(event.constructor);

                        if (!(eventHandlers == null)) {
                            _context2.next = 3;
                            break;
                        }

                        return _context2.abrupt("return");

                    case 3:
                        groupedHandlers = groupByAsMap(eventHandlers, function (eh) {
                            return eh.target;
                        });

                        if (!onlyTarget) {
                            _context2.next = 12;
                            break;
                        }

                        if (!groupedHandlers.get(onlyTarget)) {
                            _context2.next = 11;
                            break;
                        }

                        onlyTargetGroup = groupedHandlers.get(onlyTarget);

                        groupedHandlers = new Map();
                        groupedHandlers.set(onlyTarget, onlyTargetGroup);
                        _context2.next = 12;
                        break;

                    case 11:
                        return _context2.abrupt("return");

                    case 12:
                        _iteratorNormalCompletion = true;
                        _didIteratorError = false;
                        _iteratorError = undefined;
                        _context2.prev = 15;
                        _iterator = groupedHandlers[Symbol.iterator]();

                    case 17:
                        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                            _context2.next = 24;
                            break;
                        }

                        _step$value = _slicedToArray(_step.value, 2), target = _step$value[0], _handlers = _step$value[1];
                        _context2.next = 21;
                        return dispatchOnStore(event, _handlers, target, dispatchRuns);

                    case 21:
                        _iteratorNormalCompletion = true;
                        _context2.next = 17;
                        break;

                    case 24:
                        _context2.next = 30;
                        break;

                    case 26:
                        _context2.prev = 26;
                        _context2.t0 = _context2["catch"](15);
                        _didIteratorError = true;
                        _iteratorError = _context2.t0;

                    case 30:
                        _context2.prev = 30;
                        _context2.prev = 31;

                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }

                    case 33:
                        _context2.prev = 33;

                        if (!_didIteratorError) {
                            _context2.next = 36;
                            break;
                        }

                        throw _iteratorError;

                    case 36:
                        return _context2.finish(33);

                    case 37:
                        return _context2.finish(30);

                    case 38:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[15, 26, 30, 38], [31,, 33, 37]]);
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

var Store = function () {
    function Store() {
        _classCallCheck(this, Store);

        this.stateSet = false;
        this.waiters = [];
        this.localBus = new Bus();
        this.state = this.defaultState();
    }

    _createClass(Store, [{
        key: "setState",
        value: function setState(newStateFn) {
            var newState = newStateFn(this.state);
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
}();

export { handle, waitFor, setupStores, dispatch, Store };
