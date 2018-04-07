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
import { Logger } from '@google-cloud/common';
export declare const kSingleton: unique symbol;
/**
 * Trace API expects stack frames to be a JSON string with the following
 * structure:
 * STACK_TRACE := { "stack_frame" : [ FRAMES ] }
 * FRAMES := { "class_name" : CLASS_NAME, "file_name" : FILE_NAME,
 *             "line_number" : LINE_NUMBER, "method_name" : METHOD_NAME }*
 *
 * While the API doesn't expect a column_number at this point, it does accept,
 * and ignore it.
 */
export interface StackFrame {
    class_name?: string;
    method_name?: string;
    file_name?: string;
    line_number?: number;
    column_number?: number;
}
export interface Constructor<T, Config> {
    new (logger: Logger, config: Config): T;
    prototype: T;
    name: string;
}
export declare const FORCE_NEW: unique symbol;
export declare type Forceable<T> = T & {
    [FORCE_NEW]?: boolean;
};
/**
 * A class that provides access to a singleton.
 * We assume that any such singleton is always constructed with two arguments:
 * A logger and an arbitrary configuration object.
 * Instances of this type should only be constructed in module scope.
 */
export declare class Singleton<T, Config> {
    private implementation;
    private [kSingleton];
    constructor(implementation: Constructor<T, Config>);
    create(logger: Logger, config: Forceable<Config>): T;
    get(): T;
}
/**
 * Truncates the provided `string` to be at most `length` bytes
 * after utf8 encoding and the appending of '...'.
 * We produce the result by iterating over input characters to
 * avoid truncating the string potentially producing partial unicode
 * characters at the end.
 */
export declare function truncate(str: string, length: number): string;
export interface TraceContext {
    traceId: string;
    spanId: string;
    options?: number;
}
/**
 * Parse a cookie-style header string to extract traceId, spandId and options
 * ex: '123456/667;o=3'
 * -> {traceId: '123456', spanId: '667', options: '3'}
 * note that we ignore trailing garbage if there is more than one '='
 * Returns null if traceId or spanId could not be found.
 *
 * @param str string representation of the trace headers
 * @return object with keys. null if there is a problem.
 */
export declare function parseContextFromHeader(str: string): TraceContext | null;
/**
 * Generates a trace context header value that can be used
 * to follow the associated request through other Google services.
 *
 * @param traceContext An object with information sufficient for creating a
 *        serialized trace context.
 */
export declare function generateTraceContext(traceContext: TraceContext): string;
/**
 * Retrieves a package name from the full import path.
 * For example:
 *   './node_modules/bar/index/foo.js' => 'bar'
 *
 * @param path The full import path.
 */
export declare function packageNameFromPath(importPath: string): string | null;
/**
 * Creates a StackFrame object containing a structured stack trace.
 * @param numFrames The number of frames to retain.
 * @param skipFrames The number of top-most frames to remove.
 * @param constructorOpt A function passed to Error.captureStackTrace, which
 *   causes it to ignore the frames above the top-most call to this function.
 */
export declare function createStackTrace(numFrames: number, skipFrames: number, constructorOpt?: Function): StackFrame[];
