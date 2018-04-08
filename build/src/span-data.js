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
const crypto = require("crypto");
const util = require("util");
const uuid = require("uuid");
const constants_1 = require("./constants");
const index_1 = require("./index");
const trace_1 = require("./trace");
const trace_labels_1 = require("./trace-labels");
const trace_writer_1 = require("./trace-writer");
const traceUtil = require("./util");
// Use 6 bytes of randomness only as JS numbers are doubles not 64-bit ints.
const SPAN_ID_RANDOM_BYTES = 6;
// Use the faster crypto.randomFillSync when available (Node 7+) falling back to
// using crypto.randomBytes.
const spanIdBuffer = Buffer.alloc(SPAN_ID_RANDOM_BYTES);
const randomFillSync = crypto.randomFillSync;
const randomBytes = crypto.randomBytes;
const spanRandomBuffer = randomFillSync ?
    () => randomFillSync(spanIdBuffer) :
    () => randomBytes(SPAN_ID_RANDOM_BYTES);
function randomSpanId() {
    // tslint:disable-next-line:ban Needed to parse hexadecimal.
    return parseInt(spanRandomBuffer().toString('hex'), 16).toString();
}
/**
 * Represents a real trace span.
 */
class BaseSpanData {
    /**
     * Creates a trace context object.
     * @param trace The object holding the spans comprising this trace.
     * @param spanName The name of the span.
     * @param parentSpanId The ID of the parent span, or '0' to specify that there
     *                     is none.
     * @param skipFrames the number of frames to remove from the top of the stack
     *                   when collecting the stack trace.
     */
    constructor(trace, spanName, parentSpanId, skipFrames) {
        this.trace = trace;
        this.span = {
            name: traceUtil.truncate(spanName, constants_1.Constants.TRACE_SERVICE_SPAN_NAME_LIMIT),
            startTime: (new Date()).toISOString(),
            endTime: '',
            spanId: randomSpanId(),
            kind: trace_1.SpanKind.SPAN_KIND_UNSPECIFIED,
            parentSpanId: parentSpanId || '0',
            labels: {}
        };
        this.trace.traceId = this.trace.traceId || uuid.v4().split('-').join('');
        this.trace.spans.push(this.span);
        const config = index_1.getConfig();
        if (!config)
            throw new Error('not initialized');
        const stackFrames = traceUtil.createStackTrace(config.stackTraceLimit, skipFrames, this.constructor);
        if (stackFrames.length > 0) {
            // Developer note: This is not equivalent to using addLabel, because the
            // stack trace label has its own size constraints.
            this.span.labels[trace_labels_1.TraceLabels.STACK_TRACE_DETAILS_KEY] =
                traceUtil.truncate(JSON.stringify({ stack_frame: stackFrames }), constants_1.Constants.TRACE_SERVICE_LABEL_VALUE_LIMIT);
        }
    }
    getTraceContext() {
        return traceUtil.generateTraceContext({
            traceId: this.trace.traceId.toString(),
            spanId: this.span.spanId.toString(),
            options: 1 // always traced
        });
    }
    // tslint:disable-next-line:no-any
    addLabel(key, value) {
        const k = traceUtil.truncate(key, constants_1.Constants.TRACE_SERVICE_LABEL_KEY_LIMIT);
        const stringValue = typeof value === 'string' ? value : util.inspect(value);
        const config = index_1.getConfig();
        if (!config)
            throw new Error('not initialized');
        const v = traceUtil.truncate(stringValue, config.maximumLabelValueSize);
        this.span.labels[k] = v;
    }
    endSpan() {
        this.span.endTime = (new Date()).toISOString();
    }
}
exports.BaseSpanData = BaseSpanData;
/**
 * Represents a real root span, which corresponds to an incoming request.
 */
class RootSpanData extends BaseSpanData {
    constructor(trace, spanName, parentSpanId, skipFrames) {
        super(trace, spanName, parentSpanId, skipFrames);
        this.type = constants_1.SpanDataType.ROOT;
        this.span.kind = trace_1.SpanKind.RPC_SERVER;
    }
    endSpan() {
        super.endSpan();
        trace_writer_1.traceWriter.get().writeSpan(this.trace);
    }
}
exports.RootSpanData = RootSpanData;
/**
 * Represents a real child span, which corresponds to an outgoing RPC.
 */
class ChildSpanData extends BaseSpanData {
    constructor(trace, spanName, parentSpanId, skipFrames) {
        super(trace, spanName, parentSpanId, skipFrames);
        this.type = constants_1.SpanDataType.CHILD;
        this.span.kind = trace_1.SpanKind.RPC_CLIENT;
    }
}
exports.ChildSpanData = ChildSpanData;
// Helper function to generate static virtual trace spans.
function createPhantomSpanData(spanType) {
    return Object.freeze(Object.assign({
        getTraceContext() {
            return '';
        },
        // tslint:disable-next-line:no-any
        addLabel(key, value) { },
        endSpan() { }
    }, { type: spanType }));
}
/**
 * A virtual trace span that indicates that a real trace span couldn't be
 * created because context was lost.
 */
exports.UNCORRELATED_SPAN = createPhantomSpanData(constants_1.SpanDataType.UNCORRELATED);
/**
 * A virtual trace span that indicates that a real trace span couldn't be
 * created because it was disallowed by user configuration.
 */
exports.UNTRACED_SPAN = createPhantomSpanData(constants_1.SpanDataType.UNTRACED);
//# sourceMappingURL=span-data.js.map