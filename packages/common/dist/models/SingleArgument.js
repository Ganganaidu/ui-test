"use strict";
// Port of common/model/SingleArgument.dart
Object.defineProperty(exports, "__esModule", { value: true });
exports.SingleArgument = void 0;
/**
 * A single key-value argument for app launch.
 *
 * Dart equivalent: common/model/SingleArgument.dart
 */
class SingleArgument {
    key;
    value;
    type;
    constructor(params) {
        this.key = params.key;
        this.value = params.value;
        this.type = params.type;
    }
}
exports.SingleArgument = SingleArgument;
//# sourceMappingURL=SingleArgument.js.map