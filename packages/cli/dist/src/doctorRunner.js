"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doctorRunnerDependencies = void 0;
exports.runDoctorCommand = runDoctorCommand;
const hostPreflight_js_1 = require("./hostPreflight.js");
exports.doctorRunnerDependencies = {
    runHostPreflight: hostPreflight_js_1.runHostPreflight,
    hostPreflightDependencies: hostPreflight_js_1.hostPreflightDependencies,
};
async function runDoctorCommand(options, dependencies = exports.doctorRunnerDependencies) {
    const requestedPlatforms = (0, hostPreflight_js_1.resolveDoctorRequestedPlatforms)(options.platform, dependencies.hostPreflightDependencies.getPlatform());
    const preflight = await dependencies.runHostPreflight({
        requestedPlatforms,
    });
    const report = (0, hostPreflight_js_1.formatHostPreflightReport)(preflight, 'doctor');
    if (options.output) {
        options.output.write(`${report}\n`);
    }
    return {
        success: !(0, hostPreflight_js_1.hasBlockingPreflightFailures)(preflight),
        report,
        preflight,
    };
}
//# sourceMappingURL=doctorRunner.js.map