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
import * as common from '@google-cloud/common';
import { Trace } from './trace';
import { Singleton } from './util';
export interface TraceWriterConfig extends common.ServiceAuthenticationConfig {
    projectId?: string;
    onUncaughtException: string;
    bufferSize: number;
    flushDelaySeconds: number;
    stackTraceLimit: number;
    maximumLabelValueSize: number;
    serviceContext: {
        service?: string;
        version?: string;
        minorVersion?: string;
    };
}
export interface LabelObject {
    [key: string]: string;
}
/**
 * A class representing a service that publishes traces in the background.
 */
export declare class TraceWriter extends common.Service {
    private logger;
    private config;
    /** Stringified traces to be published */
    buffer: string[];
    /** Default labels to be attached to written spans */
    defaultLabels: LabelObject;
    /** Reference to global unhandled exception handler */
    private unhandledException?;
    /** Whether the trace writer is active */
    isActive: boolean;
    /**
     * Constructs a new TraceWriter instance.
     * @param logger The Trace Agent's logger object.
     * @param config A config object containing information about
     *   authorization credentials.
     * @constructor
     */
    constructor(logger: common.Logger, config: TraceWriterConfig);
    stop(): void;
    initialize(cb: (err?: Error) => void): void;
    getConfig(): TraceWriterConfig;
    getHostname(cb: (hostname: string) => void): void;
    getInstanceId(cb: (instanceId?: number) => void): void;
    /**
     * Returns the project ID if it has been cached and attempts to load
     * it from the enviroment or network otherwise.
     */
    getProjectId(cb: (err: Error | null, projectId?: string) => void): void;
    /**
     * Ensures that all sub spans of the provided Trace object are
     * closed and then queues the span data to be published.
     *
     * @param trace The trace to be queued.
     */
    writeSpan(trace: Trace): void;
    /**
     * Buffers the provided trace to be published.
     *
     * @private
     * @param trace The trace to be queued.
     */
    queueTrace(trace: Trace): void;
    /**
     * Flushes the buffer of traces at a regular interval
     * controlled by the flushDelay property of this
     * TraceWriter's config.
     * @private
     */
    scheduleFlush(): void;
    /**
     * Serializes the buffered traces to be published asynchronously.
     * @private
     */
    flushBuffer(): void;
    /**
     * Publishes flushed traces to the network.
     * @private
     * @param json The stringified json representation of the queued traces.
     */
    publish(json: string): void;
}
export declare const traceWriter: Singleton<TraceWriter, TraceWriterConfig>;
