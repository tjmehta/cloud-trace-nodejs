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
import * as CLS from 'continuation-local-storage';
import { SpanDataType } from './constants';
import { Trace, TraceSpan } from './trace';
export interface RealRootContext {
    readonly span: TraceSpan;
    readonly trace: Trace;
    readonly type: SpanDataType.ROOT;
}
export interface PhantomRootContext {
    readonly type: SpanDataType.UNCORRELATED | SpanDataType.UNTRACED;
}
/**
 * This type represents the minimal information to store in continuation-local
 * storage for a request. We store either a root span corresponding to the
 * request, or a sentinel value (UNCORRELATED_SPAN or UNTRACED_SPAN) that tells
 * us that the request is not being traced (with the exact sentinel value
 * specifying whether this is on purpose or by accident, respectively).
 *
 * When we store an actual root span, the only information we need is its
 * current trace/span fields.
 */
export declare type RootContext = RealRootContext | PhantomRootContext;
export declare type Namespace = CLS.Namespace;
export declare type Func<T> = CLS.Func<T>;
/**
 * Stack traces are captured when a root span is started. Because the stack
 * trace height varies on the context propagation mechanism, to keep published
 * stack traces uniform we need to remove the top-most frames when using the
 * c-l-s module. Keep track of this number here.
 */
export declare const ROOT_SPAN_STACK_OFFSET: number;
export declare function createNamespace(): CLS.Namespace;
export declare function destroyNamespace(): void;
export declare function getNamespace(): CLS.Namespace;
/**
 * Get a RootContext object from continuation-local storage.
 */
export declare function getRootContext(): RootContext;
/**
 * Store a RootContext object in continuation-local storage.
 * @param rootContext Either a root span or UNTRACED_SPAN. It doesn't make
 * sense to pass UNCORRELATED_SPAN, which is a value specifically reserved for
 * when getRootContext is known to give an unusable value.
 */
export declare function setRootContext(rootContext: RootContext): void;
export declare function clearRootContext(): void;
