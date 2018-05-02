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
/**
 * An object that determines whether a request should be traced.
 */
export interface TracePolicy {
    shouldTrace(dateMillis: number, url: string): boolean;
}
export declare class RateLimiterPolicy implements TracePolicy {
    private traceWindow;
    private nextTraceStart;
    constructor(samplesPerSecond: number);
    shouldTrace(dateMillis: number): boolean;
}
export declare class FilterPolicy implements TracePolicy {
    private basePolicy;
    private filterUrls;
    constructor(basePolicy: TracePolicy, filterUrls: Array<string | RegExp>);
    private matches(url);
    shouldTrace(dateMillis: number, url: string): boolean;
}
export declare class TraceAllPolicy implements TracePolicy {
    shouldTrace(): boolean;
}
export declare class TraceNonePolicy implements TracePolicy {
    shouldTrace(): boolean;
}
export interface TracePolicyConfig {
    samplingRate: number;
    ignoreUrls?: Array<string | RegExp>;
}
export declare function createTracePolicy(config: TracePolicyConfig): TracePolicy;
