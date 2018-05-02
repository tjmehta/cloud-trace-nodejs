"use strict";
/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const filesLoadedBeforeTrace = Object.keys(require.cache);
// Load continuation-local-storage first to ensure the core async APIs get
// patched before any user-land modules get loaded.
// if (require('semver').satisfies(process.version, '<8') ||
//     !process.env.GCLOUD_TRACE_NEW_CONTEXT) {
//   require('continuation-local-storage');
// }
// import * as cls from './cls';
const common = require("@google-cloud/common");
const constants_1 = require("./constants");
const config_1 = require("./config");
const extend = require("extend");
const path = require("path");
const PluginTypes = require("./plugin-types");
exports.PluginTypes = PluginTypes;
const trace_plugin_loader_1 = require("./trace-plugin-loader");
const trace_api_1 = require("./trace-api");
const trace_writer_1 = require("./trace-writer");
const util_1 = require("./util");
const traceAgent = new trace_api_1.TraceAgent('Custom Span API');
const modulesLoadedBeforeTrace = [];
const traceModuleName = path.join('@google-cloud', 'trace-agent');
for (let i = 0; i < filesLoadedBeforeTrace.length; i++) {
    const moduleName = util_1.packageNameFromPath(filesLoadedBeforeTrace[i]);
    if (moduleName && moduleName !== traceModuleName &&
        modulesLoadedBeforeTrace.indexOf(moduleName) === -1) {
        modulesLoadedBeforeTrace.push(moduleName);
    }
}
/**
 * Normalizes the user-provided configuration object by adding default values
 * and overriding with env variables when they are provided.
 * @param projectConfig The user-provided configuration object. It will not
 * be modified.
 * @return A normalized configuration object.
 */
function initConfig(projectConfig) {
    const envConfig = {
        logLevel: Number(process.env.GCLOUD_TRACE_LOGLEVEL) || undefined,
        projectId: process.env.GCLOUD_PROJECT,
        serviceContext: {
            service: process.env.GAE_SERVICE || process.env.GAE_MODULE_NAME,
            version: process.env.GAE_VERSION || process.env.GAE_MODULE_VERSION,
            minorVersion: process.env.GAE_MINOR_VERSION
        }
    };
    let envSetConfig = {};
    if (process.env.hasOwnProperty('GCLOUD_TRACE_CONFIG')) {
        envSetConfig =
            require(path.resolve(process.env.GCLOUD_TRACE_CONFIG));
    }
    // Configuration order of precedence:
    // 1. Environment Variables
    // 2. Project Config
    // 3. Environment Variable Set Configuration File (from GCLOUD_TRACE_CONFIG)
    // 4. Default Config (as specified in './config')
    const config = extend(true, { [util_1.FORCE_NEW]: projectConfig[util_1.FORCE_NEW] }, config_1.defaultConfig, envSetConfig, projectConfig, envConfig);
    // Enforce the upper limit for the label value size.
    if (config.maximumLabelValueSize >
        constants_1.Constants.TRACE_SERVICE_LABEL_VALUE_LIMIT) {
        config.maximumLabelValueSize = constants_1.Constants.TRACE_SERVICE_LABEL_VALUE_LIMIT;
    }
    // Clamp the logger level.
    if (config.logLevel < 0) {
        config.logLevel = 0;
    }
    else if (config.logLevel >= common.logger.LEVELS.length) {
        config.logLevel = common.logger.LEVELS.length - 1;
    }
    return config;
}
/**
 * Stops the Trace Agent. This disables the publicly exposed agent instance,
 * as well as any instances passed to plugins. This also prevents the Trace
 * Writer from publishing additional traces.
 */
function stop() {
    if (traceAgent && traceAgent.isActive()) {
        trace_writer_1.traceWriter.get().stop();
        traceAgent.disable();
        try {
            const loader = trace_plugin_loader_1.pluginLoader.get().deactivate();
        }
        catch (_a) {
            // Plugin loader wasn't even created. No need to de-activate
        }
        // cls.destroyNamespace();
    }
}
/**
 * Start the Trace agent that will make your application available for
 * tracing with Stackdriver Trace.
 *
 * @param config - Trace configuration
 *
 * @resource [Introductory video]{@link
 * https://www.youtube.com/watch?v=NCFDqeo7AeY}
 *
 * @example
 * trace.start();
 */
let config = null;
function start(projectConfig) {
    config = initConfig(projectConfig || {});
    // @ts-ignore
    if (traceAgent.isActive() && !config[util_1.FORCE_NEW]) {
        throw new Error('Cannot call start on an already started agent.');
    }
    else if (traceAgent.isActive()) {
        // For unit tests only.
        // Undoes initialization that occurred last time start() was called.
        stop();
    }
    if (!config.enabled) {
        return traceAgent;
    }
    const logger = common.logger({
        level: common.logger.LEVELS[config.logLevel],
        tag: '@google-cloud/trace-agent'
    });
    // if (modulesLoadedBeforeTrace.length > 0) {
    //   logger.error(
    //       'TraceAgent#start: Tracing might not work as the following modules',
    //       'were loaded before the trace agent was initialized:',
    //       `[${modulesLoadedBeforeTrace.sort().join(', ')}]`);
    //   // Stop storing these entries in memory
    //   filesLoadedBeforeTrace.length = 0;
    //   modulesLoadedBeforeTrace.length = 0;
    // }
    // CLS namespace for context propagation
    // cls.createNamespace();
    trace_writer_1.traceWriter.create(logger, config).initialize((err) => {
        if (err) {
            stop();
        }
    });
    traceAgent.enable(logger, config);
    // pluginLoader.create(logger, config).activate();
    if (typeof config.projectId !== 'string' &&
        typeof config.projectId !== 'undefined') {
        logger.error('TraceAgent#start: config.projectId, if provided, must be a string.', 'Disabling trace agent.');
        stop();
        return traceAgent;
    }
    // Make trace agent available globally without requiring package
    global._google_trace_agent = traceAgent;
    logger.info('TraceAgent#start: Trace Agent activated.');
    return traceAgent;
}
exports.start = start;
function get() {
    return traceAgent;
}
exports.get = get;
function getConfig() {
    return config;
}
exports.getConfig = getConfig;
// If the module was --require'd from the command line, start the agent.
if (module.parent && module.parent.id === 'internal/preload') {
    start();
}
//# sourceMappingURL=index.js.map