import { SpanDataType } from './constants';
import { SpanData as SpanData } from './plugin-types';
import { Trace, TraceSpan } from './trace';
/**
 * Represents a real trace span.
 */
export declare abstract class BaseSpanData implements SpanData {
    readonly trace: Trace;
    readonly span: TraceSpan;
    readonly abstract type: SpanDataType;
    /**
     * Creates a trace context object.
     * @param trace The object holding the spans comprising this trace.
     * @param spanName The name of the span.
     * @param parentSpanId The ID of the parent span, or '0' to specify that there
     *                     is none.
     * @param skipFrames the number of frames to remove from the top of the stack
     *                   when collecting the stack trace.
     */
    constructor(trace: Trace, spanName: string, parentSpanId: string, skipFrames: number);
    getTraceContext(): string;
    addLabel(key: string, value: any): void;
    endSpan(): void;
}
/**
 * Represents a real root span, which corresponds to an incoming request.
 */
export declare class RootSpanData extends BaseSpanData {
    readonly type: SpanDataType;
    constructor(trace: Trace, spanName: string, parentSpanId: string, skipFrames: number);
    endSpan(): void;
}
/**
 * Represents a real child span, which corresponds to an outgoing RPC.
 */
export declare class ChildSpanData extends BaseSpanData {
    readonly type: SpanDataType;
    constructor(trace: Trace, spanName: string, parentSpanId: string, skipFrames: number);
}
/**
 * A virtual trace span that indicates that a real trace span couldn't be
 * created because context was lost.
 */
export declare const UNCORRELATED_SPAN: SpanData & {
    readonly type: SpanDataType.UNCORRELATED;
};
/**
 * A virtual trace span that indicates that a real trace span couldn't be
 * created because it was disallowed by user configuration.
 */
export declare const UNTRACED_SPAN: SpanData & {
    readonly type: SpanDataType.UNTRACED;
};
