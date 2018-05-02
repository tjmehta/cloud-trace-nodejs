/**
 * Copyright 2018 Google LLC
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
import * as util from './util';
import { TraceAgentConfig } from './trace-api';
import { Plugin } from './plugin-types';
/**
 * Plugins are user-provided objects containing functions that should be run
 * when a module is loaded, with the intent of monkeypatching a module to be
 * loaded. Each plugin is specific to a module.
 *
 * Plugin objects are a list of load hooks, each of which consists
 * of a file path of a module-internal file to patch, a patch/intercept/hook
 * function, as well as the version range of the module for which that file
 * should be patched. (See ./plugin-types for the exact interface.)
 */
export interface PluginLoaderConfig extends TraceAgentConfig {
    plugins: {
        [pluginName: string]: string;
    };
}
export interface ModulePluginWrapperOptions {
    name: string;
    path: string;
}
export interface CorePluginWrapperOptions {
    children: ModulePluginWrapperOptions[];
}
/**
 * An interface that represents a wrapper around user-provided plugin objects.
 */
export interface PluginWrapper {
    /**
     * Returns whether the given version of the module is supported by this
     * plugin. This may load the plugin into memory.
     * @param version A semver version string.
     */
    isSupported(version: string): boolean;
    /**
     * Call unpatch methods when they were provided.
     */
    unapplyAll(): void;
    /**
     * Applies this object's underlying plugin patches to a file, returning the
     * patched or intercepted value.
     * @param moduleExports The module exports of the file.
     * @param file The file path, relative to the module root.
     * @param version The module version.
     */
    applyPlugin<T>(moduleExports: T, file: string, version: string): T;
}
/**
 * A class that represents wrapper logic around a user-provided plugin object
 * to be applied to a single module.
 */
export declare class ModulePluginWrapper implements PluginWrapper {
    private static readonly NOT_LOADED;
    private readonly unpatchFns;
    private readonly logger;
    private readonly traceConfig;
    private readonly name;
    private readonly path;
    private pluginExportedValue;
    private readonly traceApiInstances;
    /**
     * Constructs a new PluginWrapper instance.
     * @param logger The logger to use.
     * @param options Initialization fields for this object.
     * @param traceConfig Configuration for a TraceAgent instance.
     */
    constructor(logger: Logger, options: ModulePluginWrapperOptions, traceConfig: TraceAgentConfig);
    isSupported(version: string): boolean;
    unapplyAll(): void;
    applyPlugin<T>(moduleExports: T, file: string, version: string): T;
    getPluginExportedValue(): Plugin;
    private createTraceAgentInstance(file);
}
/**
 * A class that represents wrapper logic on top of plugins that patch core
 * (built-in) modules. Core modules are different because (1) they can be
 * required by the plugins that patch them, and (2) the core module being
 * patched doesn't necessarily correspond to the name of the plugin.
 */
export declare class CorePluginWrapper implements PluginWrapper {
    private readonly logger;
    private readonly children;
    constructor(logger: Logger, config: CorePluginWrapperOptions, traceConfig: TraceAgentConfig);
    /**
     * Returns whether the given version of the module is supported by this
     * plugin. This may load the plugin into memory.
     * @param version A semver version string.
     */
    isSupported(version: string): boolean;
    /**
     * Call unpatch methods when they were provided.
     */
    unapplyAll(): void;
    /**
     * Applies this object's underlying plugin patches to a file, returning the
     * patched or intercepted value.
     * @param moduleExports The module exports of the file.
     * @param file The file path, relative to the module root.
     * @param version The module version.
     */
    applyPlugin<T>(moduleExports: T, file: string, version: string): T;
}
export declare enum PluginLoaderState {
    NO_HOOK = 0,
    ACTIVATED = 1,
    DEACTIVATED = 2,
}
/**
 * A class providing functionality to hook into module loading and apply
 * plugins to enable tracing.
 */
export declare class PluginLoader {
    private readonly logger;
    static readonly CORE_MODULE: string;
    private enableRequireHook;
    private readonly pluginMap;
    private readonly moduleVersionCache;
    private internalState;
    /**
     * Constructs a new PluginLoader instance.
     * @param logger The logger to use.
     * @param config The configuration for this instance.
     */
    constructor(logger: Logger, config: PluginLoaderConfig);
    readonly state: PluginLoaderState;
    /**
     * Activates plugin loading/patching by hooking into the require method.
     */
    activate(): PluginLoader;
    /**
     * Deactivates the plugin loader, preventing additional plugins from getting
     * loaded or applied, as well as unpatching any modules for which plugins
     * specified an unpatching method.
     */
    deactivate(): PluginLoader;
    /**
     * Adds a search path for plugin modules. Intended for testing purposes only.
     * @param searchPath The path to add.
     */
    static setPluginSearchPathForTestingOnly(searchPath: string): void;
    /**
     * Separates the internal file path from the name of a module in a module
     * string, returning both (or just the name if it's the main module).
     * @param moduleStr The module string; in the form of either `${module}` or
     *   `${module}/${relPath}`
     */
    static parseModuleString(moduleStr: string): {
        name: string;
        file: string;
    };
    private getVersion(baseDir?);
}
export declare const pluginLoader: util.Singleton<PluginLoader, PluginLoaderConfig>;
