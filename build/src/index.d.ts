import { Config } from './config';
import * as PluginTypes from './plugin-types';
import { PluginLoaderConfig } from './trace-plugin-loader';
import { TraceAgent } from './trace-api';
import { TraceWriterConfig } from './trace-writer';
export { Config, PluginTypes };
export interface TopLevelConfig {
    enabled: boolean;
    logLevel: number;
}
export declare type NormalizedConfig = TraceWriterConfig & PluginLoaderConfig & TopLevelConfig;
export declare function start(projectConfig?: Config): PluginTypes.TraceAgent;
export declare function get(): TraceAgent;
export declare function getConfig(): NormalizedConfig | null;
