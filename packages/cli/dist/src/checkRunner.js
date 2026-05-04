"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUITE_SELECTOR_CONFLICT_ERROR = void 0;
exports.runCheck = runCheck;
const env_js_1 = require("./env.js");
const appConfig_js_1 = require("./appConfig.js");
const testLoader_js_1 = require("./testLoader.js");
const testSelection_js_1 = require("./testSelection.js");
const workspace_js_1 = require("./workspace.js");
exports.SUITE_SELECTOR_CONFLICT_ERROR = 'Pass either --suite <path> or positional test selectors, not both.';
async function runCheck(options) {
    const workspace = await (0, workspace_js_1.resolveWorkspace)(options.cwd);
    const workspaceConfig = await (0, workspace_js_1.loadWorkspaceConfig)(workspace.usbUiTestDir);
    const resolvedEnvironment = await (0, workspace_js_1.resolveConfiguredEnvironmentFile)(workspace, options.envName);
    const runtimeEnv = new env_js_1.CliEnv();
    if (resolvedEnvironment.usesEmptyBindings) {
        runtimeEnv.load(undefined, { includeDotEnv: false, cwd: workspace.rootDir });
    }
    else {
        runtimeEnv.load(resolvedEnvironment.envName, { cwd: workspace.rootDir });
    }
    const environment = await (0, testLoader_js_1.loadEnvironmentConfig)(resolvedEnvironment.envPath, resolvedEnvironment.envName, runtimeEnv);
    const resolvedRunTarget = await resolveRunTarget(workspace, options);
    const selectedFiles = await (0, testSelection_js_1.selectTestFiles)(workspace.testsDir, resolvedRunTarget.testSelectors, {
        requireSelection: resolvedRunTarget.target.type === 'suite'
            ? false
            : options.requireSelection,
    });
    const tests = await Promise.all(selectedFiles.map(async (filePath) => {
        const test = await (0, testLoader_js_1.loadTest)(filePath, workspace.testsDir);
        (0, testLoader_js_1.validateTestBindings)(test, environment.config, {
            environmentResolved: !resolvedEnvironment.usesEmptyBindings,
        });
        return test;
    }));
    const validatedAppOverride = options.appPath
        ? await (0, workspace_js_1.validateAppOverride)(options.appPath, options.platform)
        : undefined;
    const appOverride = validatedAppOverride
        ? {
            ...validatedAppOverride,
            resolvedIdentifier: await (0, appConfig_js_1.resolveAppOverrideIdentifier)(validatedAppOverride),
        }
        : undefined;
    const resolvedApp = (0, appConfig_js_1.resolveAppConfig)({
        workspaceApp: workspaceConfig.app,
        environmentApp: environment.config.app,
        envName: environment.envName,
        requestedPlatform: options.platform,
        appOverride,
    });
    return {
        workspace,
        environment,
        tests,
        target: resolvedRunTarget.target,
        suite: resolvedRunTarget.suite,
        resolvedApp,
        appOverride,
    };
}
async function resolveRunTarget(workspace, options) {
    const normalizedSelectors = (0, testSelection_js_1.normalizeTestSelectors)(options.selectors);
    if (options.suitePath && normalizedSelectors.length > 0) {
        throw new Error(exports.SUITE_SELECTOR_CONFLICT_ERROR);
    }
    if (!options.suitePath) {
        return {
            target: { type: 'direct' },
            testSelectors: normalizedSelectors,
        };
    }
    const suiteFilePath = await (0, workspace_js_1.resolveSuiteManifestPath)(workspace.suitesDir, options.suitePath);
    const suite = await (0, testLoader_js_1.loadTestSuite)(suiteFilePath, workspace.suitesDir);
    return {
        target: {
            type: 'suite',
            suiteId: suite.suiteId,
            suiteName: suite.name,
            suitePath: suite.relativePath,
        },
        testSelectors: suite.tests,
        suite,
    };
}
//# sourceMappingURL=checkRunner.js.map