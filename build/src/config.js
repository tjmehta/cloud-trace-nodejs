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
const path = require("path");
const pluginDirectory = path.join(path.resolve(__dirname, '..'), 'src', 'plugins');
/**
 * Default configuration. For fields with primitive values, any user-provided
 * value will override the corresponding default value.
 * For fields with non-primitive values (plugins and serviceContext), the
 * user-provided value will be used to extend the default value.
 */
exports.defaultConfig = {
    logLevel: 1,
    enabled: true,
    enhancedDatabaseReporting: false,
    maximumLabelValueSize: 512,
    plugins: {},
    stackTraceLimit: 10,
    flushDelaySeconds: 30,
    ignoreUrls: ['/_ah/health'],
    samplingRate: 10,
    bufferSize: 1000,
    onUncaughtException: 'ignore',
    ignoreContextHeader: false,
    serviceContext: {}
};
//# sourceMappingURL=config.js.map