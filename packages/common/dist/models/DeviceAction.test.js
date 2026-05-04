"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const DeviceAction_js_1 = require("./DeviceAction.js");
const index_js_1 = require("../index.js");
(0, node_test_1.default)('PointPercent serializes and deserializes percent coordinates', () => {
    const point = DeviceAction_js_1.PointPercent.fromJson({ xPercent: 0.25, yPercent: 0.75 });
    strict_1.default.deepEqual(point.toJson(), {
        xPercent: 0.25,
        yPercent: 0.75,
    });
});
(0, node_test_1.default)('parity action models expose the expected DeviceAction types', () => {
    const tap = new DeviceAction_js_1.TapPercentAction({
        point: new DeviceAction_js_1.PointPercent({ xPercent: 0.1, yPercent: 0.2 }),
    });
    strict_1.default.equal(tap.type, DeviceAction_js_1.DeviceAction.TAP_PERCENT);
    strict_1.default.deepEqual(tap.toJson(), {
        type: DeviceAction_js_1.DeviceAction.TAP_PERCENT,
        point: { xPercent: 0.1, yPercent: 0.2 },
    });
    strict_1.default.equal(new DeviceAction_js_1.EraseTextAction().type, DeviceAction_js_1.DeviceAction.ERASE_TEXT);
    strict_1.default.equal(new DeviceAction_js_1.RotateAction().type, DeviceAction_js_1.DeviceAction.ROTATE);
    strict_1.default.equal(new DeviceAction_js_1.GetScreenshotAction().type, DeviceAction_js_1.DeviceAction.GET_SCREENSHOT);
    strict_1.default.equal(new DeviceAction_js_1.GetHierarchyAction().type, DeviceAction_js_1.DeviceAction.GET_HIERARCHY);
});
(0, node_test_1.default)('common barrel exports the new parity models', () => {
    const tap = new index_js_1.TapPercentAction({
        point: new index_js_1.PointPercent({ xPercent: 0.4, yPercent: 0.6 }),
    });
    const rotate = new index_js_1.RotateAction();
    strict_1.default.equal(tap.type, DeviceAction_js_1.DeviceAction.TAP_PERCENT);
    strict_1.default.equal(rotate.type, DeviceAction_js_1.DeviceAction.ROTATE);
});
//# sourceMappingURL=DeviceAction.test.js.map