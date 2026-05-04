"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimctlClient = exports.IOS_DRIVER_RUNNER_BUNDLE_ID = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const common_1 = require("@usb-ui-test/common");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
exports.IOS_DRIVER_RUNNER_BUNDLE_ID = 'app.usbuitest.iosUITests.xctrunner';
const IOS_PERMISSION_KEYS = [
    'calendar',
    'camera',
    'contacts',
    'homeKit',
    'location',
    'medialibrary',
    'microphone',
    'motion',
    'notifications',
    'photos',
    'reminders',
    'siri',
    'speech',
    'userTracking',
];
const IOS_SIMCTL_PERMISSION_SERVICES = {
    calendar: 'calendar',
    contacts: 'contacts',
    location: 'location-always',
    medialibrary: 'media-library',
    microphone: 'microphone',
    motion: 'motion',
    photos: 'photos',
    reminders: 'reminders',
    siri: 'siri',
};
const IOS_APPLESIMUTILS_PERMISSION_NAMES = {
    homeKit: 'homekit',
};
class SimctlClient {
    _execFileFn;
    _spawnFn;
    constructor(params) {
        this._execFileFn = params?.execFileFn ?? execFileAsync;
        this._spawnFn = params?.spawnFn ?? child_process_1.spawn;
    }
    async installApp(deviceId, appPath) {
        const result = await this._runCommand('xcrun', ['simctl', 'install', deviceId, appPath], `Failed to install iOS app on ${deviceId}`);
        if (result.success) {
            common_1.Logger.i(`Installed iOS app on ${deviceId}: ${appPath}`);
        }
        return result.success;
    }
    async uninstallApp(deviceId, bundleId) {
        return await this._runCommand('xcrun', ['simctl', 'uninstall', deviceId, bundleId], `Failed to uninstall ${bundleId} on ${deviceId}`, { suppressErrorLog: true });
    }
    async openUrl(deviceId, deeplink) {
        const result = await this._runCommand('xcrun', ['simctl', 'openurl', deviceId, deeplink], `Failed to open iOS deeplink on ${deviceId}`);
        if (result.success) {
            common_1.Logger.i(`Opened iOS deeplink on ${deviceId}: ${deeplink}`);
        }
        return result.success;
    }
    async terminateAppResult(deviceId, bundleId) {
        const result = await this._runCommand('xcrun', ['simctl', 'terminate', deviceId, bundleId], `Failed to terminate ${bundleId} on ${deviceId}`, { suppressErrorLog: true });
        if (!result.success &&
            result.message?.includes('found nothing to terminate')) {
            return {
                success: true,
                message: 'App was not running',
            };
        }
        return result;
    }
    async terminateApp(deviceId, bundleId) {
        await this.terminateAppResult(deviceId, bundleId);
    }
    async launchApp(deviceId, bundleId, argumentsMap) {
        const args = ['simctl', 'launch', deviceId, bundleId];
        const launchArgs = [];
        for (const [argumentKey, argumentValue] of Object.entries(argumentsMap ?? {})) {
            const key = argumentValue.key || argumentKey;
            if (argumentValue.type.toLowerCase() === 'env') {
                args.push('--env', `${key}=${argumentValue.value}`);
            }
            else {
                launchArgs.push(argumentValue.value);
            }
        }
        if (launchArgs.length > 0) {
            args.push('--args', ...launchArgs);
        }
        return await this._runCommand('xcrun', args, `Failed to launch ${bundleId} on ${deviceId}`);
    }
    async bringAppToForeground(deviceId, bundleId, argumentsMap) {
        return await this.launchApp(deviceId, bundleId, argumentsMap);
    }
    async setLocation(deviceId, latitude, longitude) {
        return await this._runCommand('xcrun', ['simctl', 'location', deviceId, 'set', `${latitude},${longitude}`], `Failed to set iOS location on ${deviceId}`);
    }
    async clearLocation(deviceId) {
        return await this._runCommand('xcrun', ['simctl', 'location', deviceId, 'clear'], `Failed to clear iOS location on ${deviceId}`);
    }
    async pressButton(deviceId, button) {
        const normalizedButton = this._normalizeButtonName(button);
        const simctlButton = normalizedButton === 'power'
            ? 'lock'
            : normalizedButton === 'menu'
                ? 'home'
                : normalizedButton;
        if (!['home', 'lock', 'volumeup', 'volumedown'].includes(simctlButton)) {
            return {
                success: false,
                message: `iOS simctl button is not mapped: ${button}`,
                data: { handled: false },
            };
        }
        const result = await this._runCommand('xcrun', ['simctl', 'io', deviceId, 'ui', simctlButton], `Failed to press iOS button ${button} on ${deviceId}`);
        return {
            ...result,
            data: { handled: true },
        };
    }
    async allowAllPermissions(deviceId, bundleId) {
        const simctlResult = await this._runCommand('xcrun', ['simctl', 'privacy', deviceId, 'grant', 'all', bundleId], `Failed to grant iOS simulator permissions for ${bundleId} on ${deviceId}`);
        if (!simctlResult.success) {
            return simctlResult;
        }
        const applesimutilsPermissions = Object.fromEntries(IOS_PERMISSION_KEYS.filter((permission) => !(permission in IOS_SIMCTL_PERMISSION_SERVICES)).map((permission) => [permission, 'allow']));
        const applesimutilsResult = await this._applyApplesimutilsPermissions(deviceId, bundleId, applesimutilsPermissions);
        if (!applesimutilsResult.success) {
            return applesimutilsResult;
        }
        return this._mergePermissionResults([
            {
                success: true,
                data: {
                    appliedPermissions: Object.keys(IOS_SIMCTL_PERMISSION_SERVICES),
                },
            },
            applesimutilsResult,
        ]);
    }
    async togglePermissions(deviceId, bundleId, permissions) {
        const simctlPermissions = {};
        const applesimutilsPermissions = {};
        for (const [permissionName, action] of Object.entries(permissions)) {
            if (permissionName in IOS_SIMCTL_PERMISSION_SERVICES) {
                simctlPermissions[permissionName] = action;
            }
            else {
                applesimutilsPermissions[permissionName] = action;
            }
        }
        const simctlResult = await this._applySimctlPermissions(deviceId, bundleId, simctlPermissions);
        if (!simctlResult.success) {
            return simctlResult;
        }
        const applesimutilsResult = await this._applyApplesimutilsPermissions(deviceId, bundleId, applesimutilsPermissions);
        if (!applesimutilsResult.success) {
            return applesimutilsResult;
        }
        return this._mergePermissionResults([simctlResult, applesimutilsResult]);
    }
    async isApplesimutilsInstalled() {
        const result = await this._runCommand('which', ['applesimutils'], 'Failed to resolve applesimutils', { suppressErrorLog: true });
        return result.success && Boolean(result.stdout);
    }
    async clearClipboard(deviceId) {
        return await this._runCommand('/bin/bash', ['-c', `echo -n "" | xcrun simctl pbcopy ${deviceId}`], `Failed to clear simulator clipboard on ${deviceId}`);
    }
    async clearSafariData(deviceId) {
        const result = await this._runCommand('xcrun', ['simctl', 'spawn', deviceId, 'rm', '-rf', 'Library/Safari'], `Failed to clear Safari data on ${deviceId}`, { suppressErrorLog: true });
        if (!result.success &&
            result.message?.includes('No such file or directory')) {
            return {
                success: true,
                message: 'Safari data already clean',
            };
        }
        return result;
    }
    async resetAllPermissions(deviceId) {
        return await this._runCommand('xcrun', ['simctl', 'privacy', deviceId, 'reset', 'all'], `Failed to reset simulator permissions on ${deviceId}`);
    }
    async uninstallUserApps(deviceId) {
        const metadata = await this._listInstalledAppMetadata(deviceId);
        if (!metadata.success || !metadata.data?.['apps']) {
            return {
                success: false,
                message: metadata.message ?? 'Failed to load installed simulator apps',
            };
        }
        const apps = metadata.data['apps'];
        const bundleIds = apps
            .filter((app) => app['bundleId'] !== exports.IOS_DRIVER_RUNNER_BUNDLE_ID)
            .filter((app) => app['applicationType'] === 'User')
            .map((app) => app['bundleId']);
        for (const bundleId of bundleIds) {
            const uninstallResult = await this.uninstallApp(deviceId, bundleId);
            if (!uninstallResult.success) {
                return uninstallResult;
            }
        }
        return {
            success: true,
            message: `Uninstalled ${bundleIds.length} user apps`,
        };
    }
    async listInstalledApps(deviceId) {
        const metadata = await this._listInstalledAppMetadata(deviceId);
        if (!metadata.success || !metadata.data?.['apps']) {
            return [];
        }
        return metadata.data['apps']
            .map((app) => new common_1.DeviceAppInfo({
            packageName: app['bundleId'],
            name: app['name'],
            version: app['version'] ?? null,
        }))
            .sort((left, right) => left.packageName.localeCompare(right.packageName));
    }
    async listInstalledAppIds(deviceId) {
        const apps = await this.listInstalledApps(deviceId);
        return common_1.DeviceAppInfo.getAppIdList(apps);
    }
    async getAppExecutableName(deviceId, bundleId) {
        const metadata = await this._listInstalledAppMetadata(deviceId);
        if (!metadata.success || !metadata.data?.['apps'])
            return null;
        const apps = metadata.data['apps'];
        const app = apps.find((a) => a['bundleId'] === bundleId);
        return app?.['executableName'] ?? null;
    }
    startDriver(deviceId, port) {
        const child = this._spawnFn('xcrun', [
            'simctl',
            'launch',
            '--console',
            '--terminate-running-process',
            deviceId,
            exports.IOS_DRIVER_RUNNER_BUNDLE_ID,
        ], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: {
                ...process.env,
                SIMCTL_CHILD_port: String(port),
                SIMCTL_CHILD_app_perfect_device_id: deviceId,
            },
        });
        common_1.Logger.d(`Starting iOS driver: xcrun simctl launch --console --terminate-running-process ${deviceId} ${exports.IOS_DRIVER_RUNNER_BUNDLE_ID}`);
        return child;
    }
    async _listInstalledAppMetadata(deviceId) {
        const result = await this._runCommand('/bin/bash', ['-c', `xcrun simctl listapps ${deviceId} | plutil -convert json - -o -`], `Failed to list iOS apps on ${deviceId}`);
        if (!result.success) {
            return result;
        }
        try {
            const parsed = JSON.parse(result.stdout ?? '');
            const apps = [];
            for (const [key, value] of Object.entries(parsed)) {
                if (!value || typeof value !== 'object' || Array.isArray(value)) {
                    continue;
                }
                const valueRecord = value;
                const bundleId = valueRecord['CFBundleIdentifier']?.trim() ||
                    valueRecord['bundleIdentifier']?.trim() ||
                    valueRecord['bundleId']?.trim() ||
                    key.trim();
                if (!bundleId) {
                    continue;
                }
                const fallbackName = key.trim() || bundleId;
                const name = valueRecord['CFBundleDisplayName']?.trim() ||
                    valueRecord['CFBundleName']?.trim() ||
                    fallbackName;
                const version = valueRecord['CFBundleVersion']?.trim() ?? null;
                const applicationType = valueRecord['ApplicationType']?.trim() ??
                    (bundleId.startsWith('com.apple.') ? 'System' : 'User');
                const executableName = valueRecord['CFBundleExecutable']?.trim() ?? null;
                apps.push({
                    bundleId,
                    name,
                    version,
                    applicationType,
                    executableName,
                });
            }
            return {
                success: true,
                data: { apps },
            };
        }
        catch (error) {
            return {
                success: false,
                message: error instanceof Error
                    ? error.message
                    : `Failed to parse iOS app metadata: ${String(error)}`,
            };
        }
    }
    async _applySimctlPermissions(deviceId, bundleId, permissions) {
        const appliedPermissions = [];
        for (const [permissionName, action] of Object.entries(permissions)) {
            const service = IOS_SIMCTL_PERMISSION_SERVICES[permissionName];
            if (!service) {
                continue;
            }
            let privacyAction;
            switch (action) {
                case 'allow':
                    privacyAction = 'grant';
                    break;
                case 'deny':
                    privacyAction = 'revoke';
                    break;
                case 'unset':
                    privacyAction = 'reset';
                    break;
                default:
                    return {
                        success: false,
                        message: `Invalid action for ${permissionName}: ${action}`,
                    };
            }
            const result = await this._runCommand('xcrun', ['simctl', 'privacy', deviceId, privacyAction, service, bundleId], `Failed to update iOS ${permissionName} permission for ${bundleId} on ${deviceId}`);
            if (!result.success) {
                return result;
            }
            appliedPermissions.push(permissionName);
        }
        return appliedPermissions.length > 0
            ? {
                success: true,
                data: { appliedPermissions },
            }
            : {
                success: true,
            };
    }
    async _applyApplesimutilsPermissions(deviceId, bundleId, permissions) {
        const translatedPermissions = [];
        const permissionNames = Object.keys(permissions);
        for (const [permissionName, action] of Object.entries(permissions)) {
            let translatedValue;
            switch (action) {
                case 'allow':
                    translatedValue = 'YES';
                    break;
                case 'deny':
                    translatedValue = 'NO';
                    break;
                case 'unset':
                    translatedValue = 'unset';
                    break;
                default:
                    return {
                        success: false,
                        message: `Invalid action for ${permissionName}: ${action}`,
                    };
            }
            const translatedPermissionName = IOS_APPLESIMUTILS_PERMISSION_NAMES[permissionName] ?? permissionName;
            translatedPermissions.push(`${translatedPermissionName}=${translatedValue}`);
        }
        if (translatedPermissions.length === 0) {
            return { success: true };
        }
        if (!(await this.isApplesimutilsInstalled())) {
            const warning = `Skipped pre-granting iOS permissions because applesimutils is not installed: ${permissionNames.join(', ')}`;
            common_1.Logger.w(warning);
            return {
                success: true,
                message: warning,
                data: {
                    skippedPermissions: permissionNames,
                    permissionWarning: warning,
                },
            };
        }
        const result = await this._runCommand('applesimutils', [
            '--byId',
            deviceId,
            '--bundle',
            bundleId,
            '--setPermissions',
            translatedPermissions.join(','),
        ], `Failed to update iOS permissions for ${bundleId} on ${deviceId}`);
        if (!result.success) {
            return result;
        }
        return {
            success: true,
            data: {
                appliedPermissions: permissionNames,
            },
        };
    }
    _mergePermissionResults(results) {
        const messages = results
            .map((result) => result.message)
            .filter((message) => Boolean(message));
        const appliedPermissions = results.flatMap((result) => Array.isArray(result.data?.['appliedPermissions'])
            ? result.data?.['appliedPermissions']
            : []);
        const skippedPermissions = results.flatMap((result) => Array.isArray(result.data?.['skippedPermissions'])
            ? result.data?.['skippedPermissions']
            : []);
        const permissionWarning = results.find((result) => typeof result.data?.['permissionWarning'] === 'string')?.data?.['permissionWarning'];
        const data = {};
        if (appliedPermissions.length > 0) {
            data['appliedPermissions'] = appliedPermissions;
        }
        if (skippedPermissions.length > 0) {
            data['skippedPermissions'] = skippedPermissions;
        }
        if (permissionWarning) {
            data['permissionWarning'] = permissionWarning;
        }
        return {
            success: true,
            message: messages.length > 0 ? messages.join(' ') : undefined,
            data: Object.keys(data).length > 0 ? data : undefined,
        };
    }
    async _runCommand(file, args, failurePrefix, options) {
        try {
            const { stdout, stderr } = await this._execFileFn(file, args);
            const stdoutText = stdout.toString().trim();
            const stderrText = stderr.toString().trim();
            return {
                success: true,
                message: stderrText || stdoutText || undefined,
                stdout: stdoutText,
                stderr: stderrText,
            };
        }
        catch (error) {
            const result = this._toFailureResult(failurePrefix, error);
            if (!options?.suppressErrorLog) {
                common_1.Logger.e(failurePrefix, error);
            }
            return result;
        }
    }
    _toFailureResult(failurePrefix, error) {
        const stdout = typeof error === 'object' &&
            error !== null &&
            'stdout' in error &&
            (typeof error.stdout === 'string' ||
                Buffer.isBuffer(error.stdout))
            ? error.stdout?.toString().trim()
            : '';
        const stderr = typeof error === 'object' &&
            error !== null &&
            'stderr' in error &&
            (typeof error.stderr === 'string' ||
                Buffer.isBuffer(error.stderr))
            ? error.stderr?.toString().trim()
            : '';
        const errorMessage = stderr || stdout || (error instanceof Error ? error.message : String(error));
        return {
            success: false,
            message: `${failurePrefix}: ${errorMessage}`,
            stdout,
            stderr,
        };
    }
    _normalizeButtonName(button) {
        return button.trim().toLowerCase().replace(/[\s-]+/g, '');
    }
}
exports.SimctlClient = SimctlClient;
//# sourceMappingURL=SimctlClient.js.map