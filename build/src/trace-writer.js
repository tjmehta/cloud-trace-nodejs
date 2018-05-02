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
const common = require("@google-cloud/common");
const gcpMetadata = require("gcp-metadata");
const os = require("os");
const constants_1 = require("./constants");
const trace_1 = require("./trace");
const trace_labels_1 = require("./trace-labels");
const util_1 = require("./util");
const pjson = require('../../package.json');
const onUncaughtExceptionValues = ['ignore', 'flush', 'flushAndExit'];
const headers = {};
headers[constants_1.Constants.TRACE_AGENT_REQUEST_HEADER] = 1;
/* A list of scopes needed to operate with the trace API */
const SCOPES = ['https://www.googleapis.com/auth/trace.append'];
/**
 * A class representing a service that publishes traces in the background.
 */
class TraceWriter extends common.Service {
    /**
     * Constructs a new TraceWriter instance.
     * @param logger The Trace Agent's logger object.
     * @param config A config object containing information about
     *   authorization credentials.
     * @constructor
     */
    constructor(logger, config) {
        super({
            packageJson: pjson,
            projectIdRequired: false,
            baseUrl: 'https://cloudtrace.googleapis.com/v1',
            scopes: SCOPES
        }, config);
        this.logger = logger;
        this.config = config;
        this.buffer = [];
        this.defaultLabels = {};
        this.isActive = true;
        if (onUncaughtExceptionValues.indexOf(config.onUncaughtException) === -1) {
            logger.error(`TraceWriter#constructor: The value of config.onUncaughtException [${config.onUncaughtException}] should be one of [${onUncaughtExceptionValues.join(', ')}].`);
            // TODO(kjin): Either log an error or throw one, but not both
            throw new Error('Invalid value for onUncaughtException configuration.');
        }
        const onUncaughtException = config.onUncaughtException;
        if (onUncaughtException !== 'ignore') {
            this.unhandledException = () => {
                this.flushBuffer();
                if (onUncaughtException === 'flushAndExit') {
                    setTimeout(() => {
                        process.exit(1);
                    }, 2000);
                }
            };
            process.on('uncaughtException', this.unhandledException);
        }
    }
    stop() {
        this.isActive = false;
    }
    initialize(cb) {
        // Ensure that cb is called only once.
        let pendingOperations = 2;
        // Schedule periodic flushing of the buffer, but only if we are able to get
        // the project number (potentially from the network.)
        this.getProjectId((err, project) => {
            if (err) {
                this.logger.error('TraceWriter#initialize: Unable to acquire the project number', 'automatically from the GCP metadata service. Please provide a', 'valid project ID as environmental variable GCLOUD_PROJECT, or as', `config.projectId passed to start. Original error: ${err}`);
                cb(err);
            }
            else {
                this.config.projectId = project;
                this.scheduleFlush();
                if (--pendingOperations === 0) {
                    cb();
                }
            }
        });
        this.getHostname((hostname) => {
            this.getInstanceId((instanceId) => {
                // tslint:disable-next-line:no-any
                const addDefaultLabel = (key, value) => {
                    this.defaultLabels[key] = `${value}`;
                };
                this.defaultLabels = {};
                addDefaultLabel(trace_labels_1.TraceLabels.AGENT_DATA, `node ${pjson.name} v${pjson.version}`);
                addDefaultLabel(trace_labels_1.TraceLabels.GCE_HOSTNAME, hostname);
                if (instanceId) {
                    addDefaultLabel(trace_labels_1.TraceLabels.GCE_INSTANCE_ID, instanceId);
                }
                const moduleName = this.config.serviceContext.service || hostname;
                addDefaultLabel(trace_labels_1.TraceLabels.GAE_MODULE_NAME, moduleName);
                const moduleVersion = this.config.serviceContext.version;
                if (moduleVersion) {
                    addDefaultLabel(trace_labels_1.TraceLabels.GAE_MODULE_VERSION, moduleVersion);
                    const minorVersion = this.config.serviceContext.minorVersion;
                    if (minorVersion) {
                        let versionLabel = '';
                        if (moduleName !== 'default') {
                            versionLabel = moduleName + ':';
                        }
                        versionLabel += moduleVersion + '.' + minorVersion;
                        addDefaultLabel(trace_labels_1.TraceLabels.GAE_VERSION, versionLabel);
                    }
                }
                Object.freeze(this.defaultLabels);
                if (--pendingOperations === 0) {
                    cb();
                }
            });
        });
    }
    getConfig() {
        return this.config;
    }
    getHostname(cb) {
        gcpMetadata.instance({ property: 'hostname', headers })
            .then((res) => {
            cb(res.data); // hostname
        })
            .catch((err) => {
            if (err.code !== 'ENOTFOUND') {
                // We are running on GCP.
                this.logger.warn('TraceWriter#getHostname: Unable to retrieve GCE hostname', `from the GCP metadata service. Original error: ${err}`);
            }
            cb(os.hostname());
        });
    }
    getInstanceId(cb) {
        gcpMetadata.instance({ property: 'id', headers })
            .then((res) => {
            cb(res.data); // instance ID
        })
            .catch((err) => {
            if (err.code !== 'ENOTFOUND') {
                // We are running on GCP.
                this.logger.warn('TraceWriter#getInstanceId: Unable to retrieve GCE instance ID', `from the GCP metadata service. Original error: ${err}`);
            }
            cb();
        });
    }
    /**
     * Returns the project ID if it has been cached and attempts to load
     * it from the enviroment or network otherwise.
     */
    getProjectId(cb) {
        if (this.config.projectId) {
            cb(null, this.config.projectId);
            return;
        }
        gcpMetadata.project({ property: 'project-id', headers })
            .then((res) => {
            cb(null, res.data); // project ID
        })
            .catch((err) => {
            if (err.response && err.response.status === 503) {
                err.message +=
                    ' This may be due to a temporary server error; please try again later.';
            }
            cb(err);
        });
    }
    /**
     * Ensures that all sub spans of the provided Trace object are
     * closed and then queues the span data to be published.
     *
     * @param trace The trace to be queued.
     */
    writeSpan(trace) {
        for (const span of trace.spans) {
            if (span.endTime === '') {
                span.endTime = (new Date()).toISOString();
            }
        }
        trace.spans.forEach(spanData => {
            if (spanData.kind === trace_1.SpanKind.RPC_SERVER) {
                // Copy properties from the default labels.
                Object.assign(spanData.labels, this.defaultLabels);
            }
        });
        this.queueTrace(trace);
    }
    /**
     * Buffers the provided trace to be published.
     *
     * @private
     * @param trace The trace to be queued.
     */
    queueTrace(trace) {
        this.getProjectId((err, projectId) => {
            if (err || !projectId) {
                this.logger.info('TraceWriter#queueTrace: No project ID, dropping trace.');
                return; // if we even reach this point, disabling traces is already
                // imminent.
            }
            trace.projectId = projectId;
            this.buffer.push(JSON.stringify(trace));
            this.logger.info(`TraceWriter#queueTrace: buffer.size = ${this.buffer.length}`);
            // Publish soon if the buffer is getting big
            if (this.buffer.length >= this.config.bufferSize) {
                this.logger.info('TraceWriter#queueTrace: Trace buffer full, flushing.');
                setImmediate(() => this.flushBuffer());
            }
        });
    }
    /**
     * Flushes the buffer of traces at a regular interval
     * controlled by the flushDelay property of this
     * TraceWriter's config.
     * @private
     */
    scheduleFlush() {
        this.logger.info('TraceWriter#scheduleFlush: Performing periodic flush.');
        this.flushBuffer();
        // Do it again after delay
        if (this.isActive) {
            // 'global.setTimeout' avoids TS2339 on this line.
            // It helps disambiguate the Node runtime setTimeout function from
            // WindowOrWorkerGlobalScope.setTimeout, which returns an integer.
            global
                .setTimeout(this.scheduleFlush.bind(this), this.config.flushDelaySeconds * 1000)
                .unref();
        }
    }
    /**
     * Serializes the buffered traces to be published asynchronously.
     * @private
     */
    flushBuffer() {
        if (this.buffer.length === 0) {
            return;
        }
        // Privatize and clear the buffer.
        const buffer = this.buffer;
        this.buffer = [];
        this.logger.debug('TraceWriter#flushBufffer: Flushing traces', buffer);
        this.publish(`{"traces":[${buffer.join()}]}`);
    }
    /**
     * Publishes flushed traces to the network.
     * @private
     * @param json The stringified json representation of the queued traces.
     */
    publish(json) {
        const uri = `https://cloudtrace.googleapis.com/v1/projects/${this.config.projectId}/traces`;
        const options = { method: 'PATCH', uri, body: json, headers };
        this.logger.debug('TraceWriter#publish: Publishing to ' + uri);
        this.request(options, (err, body, response) => {
            const statusCode = (response && response.statusCode) || 'unknown';
            if (err) {
                this.logger.error(`TraceWriter#publish: Received error status code ${statusCode}. Original error: ${err}`);
            }
            else {
                this.logger.info(`TraceWriter#publish: Published w/ status code: ${statusCode}`);
            }
        });
    }
}
exports.TraceWriter = TraceWriter;
exports.traceWriter = new util_1.Singleton(TraceWriter);
//# sourceMappingURL=trace-writer.js.map