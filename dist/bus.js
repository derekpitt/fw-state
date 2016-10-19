"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bus = (function () {
    function Bus() {
        _classCallCheck(this, Bus);

        this.listeners = new Map();
    }

    _createClass(Bus, [{
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
})();

exports.Bus = Bus;