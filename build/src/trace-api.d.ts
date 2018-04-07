/**
 * Copyright 2017 Google Inc. All Rights Reserved.
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
import { Logger } from '@google-cloud/common';
import { SpanDataType } from './constants';
import { SpanData, TraceAgent as TraceAgentInterface } from './plugin-types';
import * as TracingPolicy from './tracing-policy';
/**
 * An interface describing configuration fields read by the TraceAgent object.
 * This includes fields read by the trace policy.
 */
export interface TraceAgentConfig extends TracingPolicy.TracePolicyConfig {
    enhancedDatabaseReporting: boolean;
    ignoreContextHeader: boolean;
    projectId?: string;
}
/**
 * TraceAgent exposes a number of methods to create trace spans and propagate
 * trace context across asynchronous boundaries.
 */
export declare class TraceAgent implements TraceAgentInterface {
    readonly constants: {
        TRACE_CONTEXT_HEADER_NAME: string;
        TRACE_AGENT_REQUEST_HEADER: string;
        TRACE_OPTIONS_TRACE_ENABLED: number;
        TRACE_SERVICE_SPAN_NAME_LIMIT: number;
        TRACE_SERVICE_LABEL_KEY_LIMIT: number;
        TRACE_SERVICE_LABEL_VALUE_LIMIT: number;
    };
    readonly labels: {
        HTTP_RESPONSE_CODE_LABEL_KEY: string;
        HTTP_URL_LABEL_KEY: string;
        HTTP_METHOD_LABEL_KEY: string;
        HTTP_RESPONSE_SIZE_LABEL_KEY: string;
        STACK_TRACE_DETAILS_KEY: string;
        ERROR_DETAILS_NAME: string;
        ERROR_DETAILS_MESSAGE: string;
        GAE_VERSION: string;
        GAE_MODULE_NAME: string;
        GAE_MODULE_VERSION: string;
        GCE_INSTANCE_ID: string;
        GCE_HOSTNAME: string;
        HTTP_SOURCE_IP: string;
        AGENT_DATA: string;
    };
    readonly spanTypes: typeof SpanDataType;
    private pluginName;
    private logger;
    private config;
    policy: TracingPolicy.TracePolicy | null;
    private enabled;
    /**
     * Constructs a new TraceAgent instance.
     * @param name A string identifying this TraceAgent instance in logs.
     */
    constructor(name: string);
    /**
     * Enables this instance. This function is only for internal use and
     * unit tests. A separate TraceWriter instance should be initialized
     * beforehand.
     * @param logger A logger object.
     * @param config An object specifying how this instance should
     * be configured.
     * @private
     */
    enable(logger: Logger, config: TraceAgentConfig): void;
    /**
     * Disable this instance. This function is only for internal use and
     * unit tests.
     * @private
     */
    disable(): void;
    /**
     * Returns whether the TraceAgent instance is active. This function is only
     * for internal use and unit tests; under normal circumstances it will always
     * return true.
     * @private
     */
    isActive(): boolean;
    enhancedDatabaseReportingEnabled(): boolean;
    getWriterProjectId(): string | null;
    isRealSpan(span: SpanData): boolean;
    getResponseTraceContext(incomingTraceContext: string | null, isTraced: boolean): string;
}
