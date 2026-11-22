var RUNTIME_PUBLIC_PATH = "server/chunks/ssr/[turbopack]_runtime.js";
var RELATIVE_ROOT_PATH = "..";
var ASSET_PREFIX = "/_next/";
// Apply forwarded globals from workerData if running in a worker thread
if (typeof require !== 'undefined') {
    try {
        var { workerData } = require('worker_threads');
        if (workerData?.__turbopack_globals__) {
            Object.assign(globalThis, workerData.__turbopack_globals__);
            // Remove internal data so it's not visible to user code
            delete workerData.__turbopack_globals__;
        }
    } catch (_) {
        // Not in a worker thread context, ignore
    }
}
/**
 * This file contains runtime types and functions that are shared between all
 * TurboPack ECMAScript runtimes.
 *
 * It will be prepended to the runtime code of each runtime.
 */ /* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-types.d.ts" />
/// <reference path="./async-module.ts" />
/**
 * Describes why a module was instantiated.
 * Shared between browser and Node.js runtimes.
 */ var SourceType = /*#__PURE__*/ function(SourceType) {
    /**
   * The module was instantiated because it was included in an evaluated chunk's
   * runtime.
   * SourceData is a ChunkPath.
   */ SourceType[SourceType["Runtime"] = 0] = "Runtime";
    /**
   * The module was instantiated because a parent module imported it.
   * SourceData is a ModuleId.
   */ SourceType[SourceType["Parent"] = 1] = "Parent";
    /**
   * The module was instantiated because it was included in a chunk's hot module
   * update.
   * SourceData is an array of ModuleIds or undefined.
   */ SourceType[SourceType["Update"] = 2] = "Update";
    return SourceType;
}(SourceType || {});
/**
 * Flag indicating which module object type to create when a module is merged. Set to `true`
 * by each runtime that uses ModuleWithDirection (browser dev-base.ts, nodejs dev-base.ts,
 * nodejs build-base.ts). Browser production (build-base.ts) leaves it as `false` since it
 * uses plain Module objects.
 */ let createModuleWithDirectionFlag = false;
const REEXPORTED_OBJECTS = new WeakMap();
/**
 * Constructs the `__turbopack_context__` object for a module.
 */ function Context(module, exports) {
    this.m = module;
    // We need to store this here instead of accessing it from the module object to:
    // 1. Make it available to factories directly, since we rewrite `this` to
    //    `__turbopack_context__.e` in CJS modules.
    // 2. Support async modules which rewrite `module.exports` to a promise, so we
    //    can still access the original exports object from functions like
    //    `esmExport`
    // Ideally we could find a new approach for async modules and drop this property altogether.
    this.e = exports;
}
const contextPrototype = Context.prototype;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag;
function defineProp(obj, name, options) {
    if (!hasOwnProperty.call(obj, name)) Object.defineProperty(obj, name, options);
}
function getOverwrittenModule(moduleCache, id) {
    let module = moduleCache.get(id);
    if (module === undefined) {
        if (createModuleWithDirectionFlag) {
            // set in development modes for hmr support
            module = createModuleWithDirection(id);
        } else {
            module = createModuleObject(id);
        }
        moduleCache.set(id, module);
    }
    return module;
}
/**
 * Creates the module object. Only done here to ensure all module objects have the same shape.
 */ function createModuleObject(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined
    };
}
function createModuleWithDirection(id) {
    return {
        exports: {},
        error: undefined,
        id,
        namespaceObject: undefined,
        parents: [],
        children: []
    };
}
const BindingTag_Value = 0;
/**
 * Terminates a module's group of entries in an {@link EsmReexports} list.
 */ const REEXPORT_GROUP_END = 0;
/**
 * Adds the getters to the exports object.
 */ function esm(exports, bindings, dynamic) {
    defineProp(exports, '__esModule', {
        value: true
    });
    if (toStringTag) defineProp(exports, toStringTag, {
        value: 'Module'
    });
    let i = 0;
    while(i < bindings.length){
        const propName = bindings[i++];
        const tagOrFunction = bindings[i++];
        if (typeof tagOrFunction === 'number') {
            if (tagOrFunction === BindingTag_Value) {
                defineProp(exports, propName, {
                    value: bindings[i++],
                    enumerable: true,
                    writable: false
                });
            } else {
                throw new Error(`unexpected tag: ${tagOrFunction}`);
            }
        } else {
            const getterFn = tagOrFunction;
            if (typeof bindings[i] === 'function') {
                const setterFn = bindings[i++];
                defineProp(exports, propName, {
                    get: getterFn,
                    set: setterFn,
                    enumerable: true
                });
            } else {
                defineProp(exports, propName, {
                    get: getterFn,
                    enumerable: true
                });
            }
        }
    }
    // The properties defined above are already non-configurable and
    // non-writable, so the namespace's existing exports are effectively
    // immutable. Sealing additionally makes the object non-extensible, matching
    // real ESM-namespace semantics. Modules with dynamic re-exports
    // (`export *` from a CommonJS module) must stay extensible so the dynamic
    // export proxy can surface keys discovered at runtime, so skip the seal for
    // them.
    if (!dynamic) Object.seal(exports);
}
/**
 * Makes the module an ESM with exports
 */ function esmExport(bindings, id, dynamic) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    module.namespaceObject = exports;
    esm(exports, bindings, dynamic);
}
contextPrototype.s = esmExport;
/**
 * Registers re-exports that all forward to properties of other modules.
 *
 * This is a compact spelling of the pattern
 *
 * ```js
 * var ns = context.i(moduleId)
 * context.s([exportName, () => ns[importedName], ...])
 * ```
 *
 * The list is a flat sequence of groups. Each group starts with the source the exports come from,
 * followed by that group's entries, and is terminated by the `0` sentinel (or the end of the list).
 *
 * The group head is either a **module id**, which is instantiated here:
 *
 * ```js
 * context.S([
 *   76061, 'default', 'f', 'named', 'A', 0,
 *   29842, 'otherModule', 'f',
 * ])
 * ```
 *
 * or the **namespace value** of a module that has already been imported, which is used directly:
 *
 * ```js
 * var ns1 = context.i(76061)
 * context.S([ns1, 'default', 'f', 'named', 'A'])
 * ```
 *
 * The producer picks the namespace form when it has generated the import anyway -- because some
 * later import must not be reordered past it -- so nothing is instantiated twice. The two are told
 * apart by type: a module id is always a string or number. A CommonJS function export produces a
 * callable namespace value, so namespace heads can be functions as well as objects.
 *
 * Entries are `exportName, importedName` pairs, except when a group holds exactly one string. That
 * string is then a comma-joined list of the same pairs, which saves the repeated quoting:
 *
 * ```js
 * context.S([
 *   76061, 'default,f,named,A', 0,
 *   29842, 'otherModule,f',
 * ])
 * ```
 *
 * The producer picks that spelling independently for each group whose names contain no commas,
 * since that group's names are recovered by splitting on them.
 *
 * Groups whose head is a module id are instantiated in list order, at the point where the call
 * appears, so the producer must not merge such a group across an import of another module. The
 * destination reuses a source data value or getter descriptor when one exists, falling back to a
 * wrapper getter for dynamic/proxy/inherited properties.
 *
 * `id` names the module the exports belong to when this module was merged into a scope-hoisting
 * group, exactly as it does for {@link EsmExport}.
 *
 * Only the source descriptor's payload (value or getter) is reused. {@link esm} still defines a
 * fresh enumerable, non-configurable destination property, and no source setter is ever forwarded.
 */ function esmReexport(list, id) {
    const bindings = [];
    let i = 0;
    while(i < list.length){
        const head = list[i++];
        const start = i;
        while(i < list.length && list[i] !== REEXPORT_GROUP_END)i++;
        const end = i;
        // Skip the sentinel, if this group was terminated by one rather than by the end of the list.
        i++;
        // Module ids are always strings or numbers. Other values are already-imported namespaces;
        // notably, interop with a CommonJS function export produces a callable namespace function.
        // `esmImport` may return a promise for an async module, but re-exports of async modules keep
        // going through `context.s`, so the producer never routes them here and this stays synchronous.
        const namespace = typeof head === 'string' || typeof head === 'number' ? esmImport.call(this, head) : head;
        if (end - start === 1) {
            const pairs = list[start].split(',');
            for(let j = 0; j < pairs.length; j += 2){
                appendReexportBinding(bindings, pairs[j], namespace, pairs[j + 1]);
            }
        } else {
            for(let j = start; j < end; j += 2){
                appendReexportBinding(bindings, list[j], namespace, list[j + 1]);
            }
        }
    }
    esmExport.call(this, bindings, id);
}
contextPrototype.S = esmReexport;
function appendReexportBinding(bindings, exportedName, namespace, importedName) {
    const descriptor = Reflect.getOwnPropertyDescriptor(namespace, importedName);
    if (descriptor) {
        if ('value' in descriptor) {
            // Code generation only routes immutable imported bindings through this helper, so a data
            // descriptor is a constant export and can be captured once.
            bindings.push(exportedName, BindingTag_Value, descriptor.value);
            return;
        }
        if (descriptor.get) {
            // Accessors remain live by reusing the source getter. `esmReexport` is only called by
            // generated code: every group head is either produced by
            // `this.i` or is the namespace variable from a generated `this.i` call. Every getter on such
            // a namespace is receiver-independent: ESM bindings are compiler-generated arrow functions,
            // and the CommonJS/dynamic-namespace paths create arrows in `createGetter` and
            // `getOwnPropertyDescriptor`. The destination can therefore reuse the exact function instead
            // of allocating another wrapper getter.
            bindings.push(exportedName, descriptor.get);
            return;
        }
    }
    // Dynamic/proxy/inherited CommonJS edge cases may not expose a usable own descriptor.
    bindings.push(exportedName, ()=>namespace[importedName]);
}
function ensureDynamicExports(module, exports) {
    let reexportedObjects = REEXPORTED_OBJECTS.get(module);
    if (!reexportedObjects) {
        REEXPORTED_OBJECTS.set(module, reexportedObjects = []);
        // Returns the re-exported object that provides `prop` as an own property,
        // or `undefined` if none does. The traps share this logic so they always
        // agree on which keys are synthesized from `reexportedObjects`. `default`
        // is never re-exported by `export *`, so it is never synthesized.
        const reexportOwning = (prop)=>{
            if (prop !== 'default') {
                for (const obj of reexportedObjects){
                    if (hasOwnProperty.call(obj, prop)) return obj;
                }
            }
            return undefined;
        };
        // Modules with dynamic re-exports are not sealed by `esm()`, so the
        // target beneath the namespace stays extensible. That is what lets the
        // `ownKeys` and `getOwnPropertyDescriptor` traps legally report keys that
        // exist on `reexportedObjects` but not on the target itself.
        module.exports = module.namespaceObject = new Proxy(exports, {
            get (target, prop) {
                if (hasOwnProperty.call(target, prop) || prop === 'default' || prop === '__esModule') {
                    return Reflect.get(target, prop);
                }
                const obj = reexportOwning(prop);
                return obj && Reflect.get(obj, prop);
            },
            // The namespace is read-only, like a real esm namespace object. The
            // re-exported modules can still mutate their own exports (exposed live
            // via `get`), but mutating the namespace itself is rejected. Refusing
            // here, rather than forwarding to the extensible target, also prevents an
            // assignment/definition from shadowing a dynamic re-export. It also
            // prevents delete from removing a static export.
            set () {
                return false;
            },
            defineProperty () {
                return false;
            },
            deleteProperty () {
                return false;
            },
            // The `has` trap ensures that `'exportName' in starImports` will reflect
            // the truth of whether a key is exported.
            has (target, prop) {
                if (Reflect.has(target, prop)) return true;
                if (prop === 'default' || prop === '__esModule') return false;
                return reexportOwning(prop) !== undefined;
            },
            // ownKeys and getOwnPropertyDescriptor together make the keys enumerable.
            // If a value is returned from `ownKeys` but its property descriptor is
            // not enumerable, it will not be visible to iterator methods.
            // Collectively, they allow code like the following:
            //
            // ```
            // // module.js re-exports dynamic CJS exports
            // export * from './legacyModule.cjs'
            //
            // // from another JS file, reference the re-exported dynamic values
            // import * as Namespace from './module.js'
            // Object.keys(Namespace)
            // ```
            ownKeys (target) {
                const keys = Reflect.ownKeys(target);
                for (const obj of reexportedObjects){
                    for (const key of Reflect.ownKeys(obj)){
                        if (key !== 'default' && !keys.includes(key)) keys.push(key);
                    }
                }
                return keys;
            },
            getOwnPropertyDescriptor (target, prop) {
                const own = Reflect.getOwnPropertyDescriptor(target, prop);
                if (own || prop === 'default' || prop === '__esModule') return own;
                const obj = reexportOwning(prop);
                if (obj) {
                    // Synthetic keys don't exist on the target, so they MUST be
                    // reported as configurable. However the set/delete traps above will
                    // prevent them from actually being changed
                    return {
                        enumerable: true,
                        configurable: true,
                        get: ()=>Reflect.get(obj, prop)
                    };
                }
                return undefined;
            }
        });
    }
    return reexportedObjects;
}
/**
 * Dynamically exports properties from an object
 */ function dynamicExport(object, id) {
    let module;
    let exports;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
        exports = module.exports;
    } else {
        module = this.m;
        exports = this.e;
    }
    const reexportedObjects = ensureDynamicExports(module, exports);
    if (typeof object === 'object' && object !== null) {
        reexportedObjects.push(object);
    }
}
contextPrototype.j = dynamicExport;
function exportValue(value, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = value;
}
contextPrototype.v = exportValue;
function exportNamespace(namespace, id) {
    let module;
    if (id != null) {
        module = getOverwrittenModule(this.c, id);
    } else {
        module = this.m;
    }
    module.exports = module.namespaceObject = namespace;
}
contextPrototype.n = exportNamespace;
function createGetter(obj, key) {
    return ()=>obj[key];
}
/**
 * @returns prototype of the object
 */ const getProto = Object.getPrototypeOf ? (obj)=>Object.getPrototypeOf(obj) : (obj)=>obj.__proto__;
/** Prototypes that are not expanded for exports */ const LEAF_PROTOTYPES = [
    null,
    getProto({}),
    getProto([]),
    getProto(getProto)
];
/**
 * @param raw
 * @param ns
 * @param allowExportDefault
 *   * `false`: will have the raw module as default export
 *   * `true`: will have the default property as default export
 */ function interopEsm(raw, ns, allowExportDefault) {
    const bindings = [];
    let defaultLocation = -1;
    for(let current = raw; (typeof current === 'object' || typeof current === 'function') && !LEAF_PROTOTYPES.includes(current); current = getProto(current)){
        for (const key of Object.getOwnPropertyNames(current)){
            bindings.push(key, createGetter(raw, key));
            if (defaultLocation === -1 && key === 'default') {
                defaultLocation = bindings.length - 1;
            }
        }
    }
    // this is not really correct
    // we should set the `default` getter if the imported module is a `.cjs file`
    if (!(allowExportDefault && defaultLocation >= 0)) {
        // Replace the binding with one for the namespace itself in order to preserve iteration order.
        if (defaultLocation >= 0) {
            // Replace the getter with the value
            bindings.splice(defaultLocation, 1, BindingTag_Value, raw);
        } else {
            bindings.push('default', BindingTag_Value, raw);
        }
    }
    esm(ns, bindings);
    return ns;
}
function createNS(raw) {
    if (typeof raw === 'function') {
        return function(...args) {
            return raw.apply(this, args);
        };
    } else {
        return Object.create(null);
    }
}
function esmImport(id) {
    const module = getOrInstantiateModuleFromParent(id, this.m);
    // any ES module has to have `module.namespaceObject` defined.
    if (module.namespaceObject) return module.namespaceObject;
    // only ESM can be an async module, so we don't need to worry about exports being a promise here.
    const raw = module.exports;
    return module.namespaceObject = interopEsm(raw, createNS(raw), raw && raw.__esModule);
}
contextPrototype.i = esmImport;
function asyncLoader(moduleId) {
    const loader = this.r(moduleId);
    return loader(esmImport.bind(this));
}
contextPrototype.A = asyncLoader;
// Add a simple runtime require so that environments without one can still pass
// `typeof require` CommonJS checks so that exports are correctly registered.
const runtimeRequire = // @ts-ignore
typeof require === 'function' ? require : function require1() {
    throw new Error('Unexpected use of runtime require');
};
contextPrototype.t = runtimeRequire;
function commonJsRequire(id) {
    return getOrInstantiateModuleFromParent(id, this.m).exports;
}
contextPrototype.r = commonJsRequire;
/**
 * Remove fragments and query parameters since they are never part of the context map keys
 *
 * This matches how we parse patterns at resolving time.  Arguably we should only do this for
 * strings passed to `import` but the resolve does it for `import` and `require` and so we do
 * here as well.
 */ function parseRequest(request) {
    // Per the URI spec fragments can contain `?` characters, so we should trim it off first
    // https://datatracker.ietf.org/doc/html/rfc3986#section-3.5
    const hashIndex = request.indexOf('#');
    if (hashIndex !== -1) {
        request = request.substring(0, hashIndex);
    }
    const queryIndex = request.indexOf('?');
    if (queryIndex !== -1) {
        request = request.substring(0, queryIndex);
    }
    return request;
}
/**
 * `require.context` and require/import expression runtime.
 */ function moduleContext(map) {
    function moduleContext(id) {
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].module();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    }
    moduleContext.keys = ()=>{
        return Object.keys(map);
    };
    moduleContext.resolve = (id)=>{
        id = parseRequest(id);
        if (hasOwnProperty.call(map, id)) {
            return map[id].id();
        }
        const e = new Error(`Cannot find module '${id}'`);
        e.code = 'MODULE_NOT_FOUND';
        throw e;
    };
    moduleContext.import = async (id)=>{
        return await moduleContext(id);
    };
    return moduleContext;
}
contextPrototype.f = moduleContext;
/**
 * Returns the path of a chunk defined by its data.
 */ function getChunkPath(chunkData) {
    return typeof chunkData === 'string' ? chunkData : chunkData.path;
}
// Load the CompressedmoduleFactories of a chunk into the `moduleFactories` Map.
// The CompressedModuleFactories format is
// - 1 or more module ids
// - a module factory function
// So walking this is a little complex but the flat structure is also fast to
// traverse, we can use `typeof` operators to distinguish the two cases.
function installCompressedModuleFactories(chunkModules, offset, moduleFactories, newModuleId) {
    let i = offset;
    while(i < chunkModules.length){
        let end = i + 1;
        // Find our factory function
        while(end < chunkModules.length && typeof chunkModules[end] !== 'function'){
            end++;
        }
        if (end === chunkModules.length) {
            throw new Error('malformed chunk format, expected a factory function');
        }
        // Install the factory for each module ID that doesn't already have one.
        // When some IDs in this group already have a factory, reuse that existing
        // group factory for the missing IDs to keep all IDs in the group consistent.
        // Otherwise, install the factory from this chunk.
        const moduleFactoryFn = chunkModules[end];
        let existingGroupFactory = undefined;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            const existingFactory = moduleFactories.get(id);
            if (existingFactory) {
                existingGroupFactory = existingFactory;
                break;
            }
        }
        const factoryToInstall = existingGroupFactory ?? moduleFactoryFn;
        let didInstallFactory = false;
        for(let j = i; j < end; j++){
            const id = chunkModules[j];
            if (!moduleFactories.has(id)) {
                if (!didInstallFactory) {
                    if (factoryToInstall === moduleFactoryFn) {
                        applyModuleFactoryName(moduleFactoryFn);
                    }
                    didInstallFactory = true;
                }
                moduleFactories.set(id, factoryToInstall);
                newModuleId?.(id);
            }
        }
        i = end + 1; // end is pointing at the last factory advance to the next id or the end of the array.
    }
}
/**
 * A pseudo "fake" URL object to resolve to its relative path.
 *
 * When UrlRewriteBehavior is set to relative, calls to the `new URL()` will construct url without base using this
 * runtime function to generate context-agnostic urls between different rendering context, i.e ssr / client to avoid
 * hydration mismatch.
 *
 * This is based on webpack's existing implementation:
 * https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/RelativeUrlRuntimeModule.js
 */ const relativeURL = function relativeURL(inputUrl) {
    const realUrl = new URL(inputUrl, 'x:/');
    const values = {};
    for(const key in realUrl)values[key] = realUrl[key];
    values.href = inputUrl;
    values.pathname = inputUrl.replace(/[?#].*/, '');
    values.origin = values.protocol = '';
    values.toString = values.toJSON = (..._args)=>inputUrl;
    for(const key in values)Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        value: values[key]
    });
};
relativeURL.prototype = URL.prototype;
contextPrototype.U = relativeURL;
/**
 * Utility function to ensure all variants of an enum are handled.
 */ function invariant(never, computeMessage) {
    throw new Error(`Invariant: ${computeMessage(never)}`);
}
/**
 * Constructs an error message for when a module factory is not available.
 */ function factoryNotAvailableMessage(moduleId, sourceType, sourceData) {
    let instantiationReason;
    switch(sourceType){
        case 0:
            instantiationReason = `as a runtime entry of chunk ${sourceData}`;
            break;
        case 1:
            instantiationReason = `because it was required from module ${sourceData}`;
            break;
        case 2:
            instantiationReason = 'because of an HMR update';
            break;
        default:
            invariant(sourceType, (sourceType)=>`Unknown source type: ${sourceType}`);
    }
    return `Module ${moduleId} was instantiated ${instantiationReason}, but the module factory is not available.`;
}
/**
 * Returns a `file://` URL under a synthetic directory named after `root`
 * (`ROOT` for the project root), for when the real filesystem path is unknown.
 * The root name and path segments are percent-encoded so the result is always
 * a valid file URI.
 */ function placeholderFileUrl(modulePath, root) {
    return `file:///${encodeURIComponent(root ?? 'ROOT')}/${modulePath.split('/').map(encodeURIComponent).join('/')}`;
}
/**
 * A stub function to make `require` available but non-functional in ESM.
 */ function requireStub(_moduleId) {
    throw new Error('dynamic usage of require is not supported');
}
contextPrototype.z = requireStub;
// Make `globalThis` available to the module in a way that cannot be shadowed by a local variable.
contextPrototype.g = globalThis;
function applyModuleFactoryName(factory) {
    // Give the module factory a nice name to improve stack traces.
    Object.defineProperty(factory, 'name', {
        value: 'module evaluation'
    });
}
/// <reference path="../shared/runtime/runtime-utils.ts" />
/// A 'base' utilities to support runtime can have externals.
/// Currently this is for node.js / edge runtime both.
/// If a fn requires node.js specific behavior, it should be placed in `node-external-utils` instead.
async function externalImport(id) {
    let raw;
    try {
        switch (id) {
  case "next/dist/compiled/@vercel/og/index.node.js":
    raw = await import("next/dist/compiled/@vercel/og/index.edge.js");
    break;
  default:
    raw = await import(id);
};
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (raw && raw.__esModule && raw.default && 'default' in raw.default) {
        return interopEsm(raw.default, createNS(raw), true);
    }
    return raw;
}
contextPrototype.y = externalImport;
function externalRequire(id, thunk, esm = false) {
    let raw;
    try {
        raw = thunk();
    } catch (err) {
        // TODO(alexkirsz) This can happen when a client-side module tries to load
        // an external module we don't provide a shim for (e.g. querystring, url).
        // For now, we fail semi-silently, but in the future this should be a
        // compilation error.
        throw new Error(`Failed to load external module ${id}: ${err}`);
    }
    if (!esm || raw.__esModule) {
        return raw;
    }
    return interopEsm(raw, createNS(raw), true);
}
externalRequire.resolve = (id, options)=>{
    return require.resolve(id, options);
};
contextPrototype.x = externalRequire;
/* eslint-disable @typescript-eslint/no-unused-vars */ const path = require('path');
const relativePathToRuntimeRoot = path.relative(RUNTIME_PUBLIC_PATH, '.');
// Compute the relative path to the `distDir`.
const relativePathToDistRoot = path.join(relativePathToRuntimeRoot, RELATIVE_ROOT_PATH);
const RUNTIME_ROOT = path.resolve(__filename, relativePathToRuntimeRoot);
// Compute the absolute path to the root, by stripping distDir from the absolute path to this file.
const ABSOLUTE_ROOT = path.resolve(__filename, relativePathToDistRoot);
/**
 * Returns an absolute path to the given module path.
 * Module path should be relative, either path to a file or a directory.
 *
 * This fn allows to calculate an absolute path for some global static values, such as
 * `__dirname` or `import.meta.url` that Turbopack will not embeds in compile time.
 * See ImportMetaBinding::code_generation for the usage.
 */ function resolveAbsolutePath(modulePath) {
    if (modulePath) {
        return path.join(ABSOLUTE_ROOT, modulePath);
    }
    return ABSOLUTE_ROOT;
}
Context.prototype.P = resolveAbsolutePath;
/**
 * Returns an absolute `file://` URL for the given module path, which is
 * relative to the project root or the named `root`.
 *
 * Uses `url.pathToFileURL` so that the resulting URL is a valid file URI on
 * all platforms (forward slashes on Windows, drive letters handled
 * correctly, path segments URL-encoded).
 *
 * The location of a named `root` isn't known at runtime (the output may have
 * been moved away from the sources), so this returns a placeholder URL for it.
 */ function resolveFileUrl(modulePath, root) {
    if (root !== undefined) {
        return placeholderFileUrl(modulePath, root);
    }
    return require('url').pathToFileURL(resolveAbsolutePath(modulePath)).href;
}
Context.prototype.F = resolveFileUrl;
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="../../shared/runtime/runtime-utils.ts" />
/// <reference path="../../shared-node/base-externals-utils.ts" />
/// <reference path="../../shared-node/node-externals-utils.ts" />
/// <reference path="./nodejs-globals.d.ts" />
/**
 * Base Node.js runtime shared between production and development.
 * Contains chunk loading, module caching, and other non-HMR functionality.
 */ process.env.TURBOPACK = '1';
const url = require('url');
const moduleFactories = new Map();
const moduleCache = new Map();
/**
 * Returns an absolute path to the given module's id.
 */ function resolvePathFromModule(moduleId) {
    const exported = this.r(moduleId);
    const exportedPath = exported?.default ?? exported;
    if (typeof exportedPath !== 'string') {
        return exported;
    }
    const strippedAssetPrefix = exportedPath.slice(ASSET_PREFIX.length);
    const resolved = path.resolve(RUNTIME_ROOT, strippedAssetPrefix);
    return url.pathToFileURL(resolved).href;
}
/**
 * Exports a URL value. No suffix is added in Node.js runtime.
 */ function exportUrl(urlValue, id) {
    exportValue.call(this, urlValue, id);
}
function loadRuntimeChunk(sourcePath, chunkData) {
    if (typeof chunkData === 'string') {
        loadRuntimeChunkPath(sourcePath, chunkData);
    } else {
        loadRuntimeChunkPath(sourcePath, chunkData.path);
    }
}
const loadedChunks = new Set();
const unsupportedLoadChunk = Promise.resolve(undefined);
const loadedChunk = Promise.resolve(undefined);
const chunkCache = new Map();
function clearChunkCache() {
    chunkCache.clear();
    loadedChunks.clear();
}
function loadRuntimeChunkPath(sourcePath, chunkPath) {
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return;
    }
    if (loadedChunks.has(chunkPath)) {
        return;
    }
    try {
        const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
        const chunkModules = requireChunk(chunkPath);
        installCompressedModuleFactories(chunkModules, 0, moduleFactories);
        loadedChunks.add(chunkPath);
    } catch (cause) {
        let errorMessage = `Failed to load chunk ${chunkPath}`;
        if (sourcePath) {
            errorMessage += ` from runtime for chunk ${sourcePath}`;
        }
        const error = new Error(errorMessage, {
            cause
        });
        error.name = 'ChunkLoadError';
        throw error;
    }
}
function loadChunkAsync(chunkData) {
    const chunkPath = typeof chunkData === 'string' ? chunkData : chunkData.path;
    if (!isJs(chunkPath)) {
        // We only support loading JS chunks in Node.js.
        // This branch can be hit when trying to load a CSS chunk.
        return unsupportedLoadChunk;
    }
    let entry = chunkCache.get(chunkPath);
    if (entry === undefined) {
        try {
            // resolve to an absolute path to simplify `require` handling
            const resolved = path.resolve(RUNTIME_ROOT, chunkPath);
            // TODO: consider switching to `import()` to enable concurrent chunk loading and async file io
            // However this is incompatible with hot reloading (since `import` doesn't use the require cache)
            const chunkModules = requireChunk(chunkPath);
            installCompressedModuleFactories(chunkModules, 0, moduleFactories);
            entry = loadedChunk;
        } catch (cause) {
            const errorMessage = `Failed to load chunk ${chunkPath} from module ${this.m.id}`;
            const error = new Error(errorMessage, {
                cause
            });
            error.name = 'ChunkLoadError';
            // Cache the failure promise, future requests will also get this same rejection
            entry = Promise.reject(error);
        }
        chunkCache.set(chunkPath, entry);
    }
    // TODO: Return an instrumented Promise that React can use instead of relying on referential equality.
    return entry;
}
contextPrototype.l = loadChunkAsync;
function loadChunkAsyncByUrl(chunkUrl) {
    const path1 = url.fileURLToPath(new URL(chunkUrl, RUNTIME_ROOT));
    return loadChunkAsync.call(this, path1);
}
contextPrototype.L = loadChunkAsyncByUrl;
// Shared runtime primitive: the root that on-disk chunk paths are resolved
// against. Used by the bundled wasm helper (exposed as `__turbopack_runtime_root__`).
contextPrototype.w = RUNTIME_ROOT;
const regexJsUrl = /\.js(?:\?[^#]*)?(?:#.*)?$/;
/**
 * Checks if a given path/URL ends with .js, optionally followed by ?query or #fragment.
 */ function isJs(chunkUrlOrPath) {
    return regexJsUrl.test(chunkUrlOrPath);
}
/* eslint-disable @typescript-eslint/no-unused-vars */ /// <reference path="./runtime-base.ts" />
/**
 * Production Node.js runtime.
 * Uses ModuleWithDirection and simple module instantiation without HMR support.
 */ // moduleCache and moduleFactories are declared in runtime-base.ts
// this is read in runtime-utils.ts so it creates a module with direction for hmr
createModuleWithDirectionFlag = true;
const nodeContextPrototype = Context.prototype;
nodeContextPrototype.q = exportUrl;
nodeContextPrototype.M = moduleFactories;
// Cast moduleCache to ModuleWithDirection for production mode
nodeContextPrototype.c = moduleCache;
nodeContextPrototype.R = resolvePathFromModule;
nodeContextPrototype.C = clearChunkCache;
function instantiateModule(id, sourceType, sourceData) {
    const moduleFactory = moduleFactories.get(id);
    if (typeof moduleFactory !== 'function') {
        // This can happen if modules incorrectly handle HMR disposes/updates,
        // e.g. when they keep a `setTimeout` around which still executes old code
        // and contains e.g. a `require("something")` call.
        throw new Error(factoryNotAvailableMessage(id, sourceType, sourceData));
    }
    const module1 = createModuleWithDirection(id);
    const exports = module1.exports;
    moduleCache.set(id, module1);
    const context = new Context(module1, exports);
    // NOTE(alexkirsz) This can fail when the module encounters a runtime error.
    try {
        moduleFactory(context, module1, exports);
    } catch (error) {
        module1.error = error;
        throw error;
    }
    ;
    module1.loaded = true;
    if (module1.namespaceObject && module1.exports !== module1.namespaceObject) {
        // in case of a circular dependency: cjs1 -> esm2 -> cjs1
        interopEsm(module1.exports, module1.namespaceObject);
    }
    return module1;
}
/**
 * Retrieves a module from the cache, or instantiate it if it is not cached.
 */ // @ts-ignore
function getOrInstantiateModuleFromParent(id, sourceModule) {
    const module1 = moduleCache.get(id);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateModule(id, SourceType.Parent, sourceModule.id);
}
/**
 * Instantiates a runtime module.
 */ function instantiateRuntimeModule(chunkPath, moduleId) {
    return instantiateModule(moduleId, SourceType.Runtime, chunkPath);
}
/**
 * Retrieves a module from the cache, or instantiate it as a runtime module if it is not cached.
 */ // @ts-ignore TypeScript doesn't separate this module space from the browser runtime
function getOrInstantiateRuntimeModule(chunkPath, moduleId) {
    const module1 = moduleCache.get(moduleId);
    if (module1) {
        if (module1.error) {
            throw module1.error;
        }
        return module1;
    }
    return instantiateRuntimeModule(chunkPath, moduleId);
}
module.exports = (sourcePath)=>({
        m: (id)=>getOrInstantiateRuntimeModule(sourcePath, id),
        c: (chunkData)=>loadRuntimeChunk(sourcePath, chunkData)
    });


//# sourceMappingURL=%5Bturbopack%5D_runtime.js.map

  function requireChunk(chunkPath) {
    switch(chunkPath) {
      case "server/chunks/[externals]__0m2905wcwnvrn._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__0m2905wcwnvrn._.js");
      case "server/chunks/[root-of-the-server]__0z9zm8k6o2--_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0z9zm8k6o2--_._.js");
      case "server/chunks/[turbopack]_runtime.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[turbopack]_runtime.js");
      case "server/chunks/ssr/[externals]__1fgqmmwqjk3ia._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]__1fgqmmwqjk3ia._.js");
      case "server/chunks/ssr/[externals]_buffer_096gy7qd0ob2m._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_buffer_096gy7qd0ob2m._.js");
      case "server/chunks/ssr/[root-of-the-server]__09b40o0ng8ku5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__09b40o0ng8ku5._.js");
      case "server/chunks/ssr/[root-of-the-server]__09r-80xx76qer._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__09r-80xx76qer._.js");
      case "server/chunks/ssr/[root-of-the-server]__0h_6pq1dthkae._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0h_6pq1dthkae._.js");
      case "server/chunks/ssr/[root-of-the-server]__0pxkz8tukqux5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0pxkz8tukqux5._.js");
      case "server/chunks/ssr/[root-of-the-server]__0xn45hpp8d7t3._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0xn45hpp8d7t3._.js");
      case "server/chunks/ssr/[root-of-the-server]__20rznk0i_8r6h._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__20rznk0i_8r6h._.js");
      case "server/chunks/ssr/[turbopack]_runtime.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[turbopack]_runtime.js");
      case "server/chunks/ssr/_0m96-ichca_4m._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0m96-ichca_4m._.js");
      case "server/chunks/ssr/_19qp-su3tiuk8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_19qp-su3tiuk8._.js");
      case "server/chunks/ssr/_213r44u1034f0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_213r44u1034f0._.js");
      case "server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__not-found_page_actions_0pt47yrisjoev.js");
      case "server/chunks/ssr/node_modules_0ib783bs2caan._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0ib783bs2caan._.js");
      case "server/chunks/ssr/node_modules_1jbtcgyhj049i._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_1jbtcgyhj049i._.js");
      case "server/chunks/ssr/node_modules_clsx_dist_clsx_mjs_07hs8bazj5h7o._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_clsx_dist_clsx_mjs_07hs8bazj5h7o._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_Icon_mjs_0lly-em28afbk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_Icon_mjs_0lly-em28afbk._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_12i3_yy1b-p28._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_12i3_yy1b-p28._.js");
      case "server/chunks/ssr/node_modules_next_19misn5bvv8e7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_19misn5bvv8e7._.js");
      case "server/chunks/ssr/node_modules_next_dist_0-amwqbrge23p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0-amwqbrge23p._.js");
      case "server/chunks/ssr/node_modules_next_dist_0tg97786c_yac._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0tg97786c_yac._.js");
      case "server/chunks/ssr/node_modules_next_dist_0z_oheoyvwq5g._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_0z_oheoyvwq5g._.js");
      case "server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1khq67j4vo9y4._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0bew68i643j53._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0bew68i643j53._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_0p8s4lhdi0ir6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_0p8s4lhdi0ir6._.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_unauthorized_0l_sp0xky89qu.js");
      case "server/chunks/ssr/node_modules_next_dist_compiled_@edge-runtime_cookies_index_1kiz_an963mbg.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_compiled_@edge-runtime_cookies_index_1kiz_an963mbg.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_100twnqyanqn0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_100twnqyanqn0.js");
      case "server/chunks/ssr/src_1u5qs1_w42cmf._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1u5qs1_w42cmf._.js");
      case "server/chunks/ssr/src_components_icon_tsx_1fhl0ak7f7-kb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_icon_tsx_1fhl0ak7f7-kb._.js");
      case "server/chunks/ssr/src_components_layout_site-header_tsx_14dsbl7tq79y-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_layout_site-header_tsx_14dsbl7tq79y-._.js");
      case "server/chunks/ssr/src_lib_cn_ts_1jl5mwy8ua2yp._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_cn_ts_1jl5mwy8ua2yp._.js");
      case "server/chunks/ssr/[root-of-the-server]__17m80rwlys60t._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__17m80rwlys60t._.js");
      case "server/chunks/ssr/_next-internal_server_app_about_page_actions_0xvgj076vz0b3.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_about_page_actions_0xvgj076vz0b3.js");
      case "server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_client_components_builtin_global-error_0q-w892nagajq.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_146a13sgzvgsk.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_146a13sgzvgsk.js");
      case "server/chunks/ssr/src_app_about_page_tsx_00exh_sa9z7uq._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_about_page_tsx_00exh_sa9z7uq._.js");
      case "server/chunks/ssr/src_components_0wzyxgsrul6nt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_0wzyxgsrul6nt._.js");
      case "server/chunks/ssr/src_content_companies_ts_0f9dwk_ob8ebu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_content_companies_ts_0f9dwk_ob8ebu._.js");
      case "server/chunks/ssr/src_content_ventures_ts_20h8s13awgcog._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_content_ventures_ts_20h8s13awgcog._.js");
      case "server/chunks/ssr/[externals]_fs_0pplqgcyv2l7l._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]_fs_0pplqgcyv2l7l._.js");
      case "server/chunks/ssr/[root-of-the-server]__0rrbrnrlhbi79._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0rrbrnrlhbi79._.js");
      case "server/chunks/ssr/_098dyaq13vq56._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_098dyaq13vq56._.js");
      case "server/chunks/ssr/_next-internal_server_app_activities_page_actions_1f1lbfrchxuf_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_activities_page_actions_1f1lbfrchxuf_.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02lfss8lhl7ze.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_02lfss8lhl7ze.js");
      case "server/chunks/ssr/src_app_activities_page_tsx_0mmrg0f7gaum5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_activities_page_tsx_0mmrg0f7gaum5._.js");
      case "server/chunks/ssr/src_lib_1jwa4r2_ks0fk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_1jwa4r2_ks0fk._.js");
      case "server/chunks/ssr/src_lib_activities_ts_12-_wub4k8zov._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_activities_ts_12-_wub4k8zov._.js");
      case "server/chunks/ssr/[root-of-the-server]__1u2nmgp-l22xk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1u2nmgp-l22xk._.js");
      case "server/chunks/ssr/_next-internal_server_app_activities_[slug]_page_actions_12sg__ruy8dtt.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_activities_[slug]_page_actions_12sg__ruy8dtt.js");
      case "server/chunks/ssr/node_modules_next_1yp75l067ksv6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_1yp75l067ksv6._.js");
      case "server/chunks/ssr/node_modules_next_dist_1pkebwn_sj97u._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_1pkebwn_sj97u._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12xstpppifnkr.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12xstpppifnkr.js");
      case "server/chunks/ssr/src_app_activities_[slug]_page_tsx_0wwdgh6oxq3no._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_activities_[slug]_page_tsx_0wwdgh6oxq3no._.js");
      case "server/chunks/ssr/src_lib_11mahy55iv75v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_11mahy55iv75v._.js");
      case "server/chunks/ssr/src_lib_application-forms_ts_1bsa2x-6o7ywz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_application-forms_ts_1bsa2x-6o7ywz._.js");
      case "server/chunks/ssr/src_lib_students_ts_1jwju0ykeu5-d._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_students_ts_1jwju0ykeu5-d._.js");
      case "server/chunks/ssr/[externals]__0ibnoobl7dm2n._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[externals]__0ibnoobl7dm2n._.js");
      case "server/chunks/ssr/[root-of-the-server]__0iz9uli4m7g3e._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0iz9uli4m7g3e._.js");
      case "server/chunks/ssr/_027mntsgq6u6p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_027mntsgq6u6p._.js");
      case "server/chunks/ssr/_1orx36me9n7zr._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1orx36me9n7zr._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_new_page_actions_1hntmprqp9qpe.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_new_page_actions_1hntmprqp9qpe.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_19b6hijqki4bg._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_19b6hijqki4bg._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_03nzd6iojktx5.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_03nzd6iojktx5.js");
      case "server/chunks/ssr/src_1q10hnsl2g3yo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1q10hnsl2g3yo._.js");
      case "server/chunks/ssr/src_app_admin_admin-profiles_new_page_tsx_052164xc_6y9p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_admin-profiles_new_page_tsx_052164xc_6y9p._.js");
      case "server/chunks/ssr/src_components_admin_11qb-3z2jm_uh._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_11qb-3z2jm_uh._.js");
      case "server/chunks/ssr/src_lib_auth_ts_0r2vclvk12af6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_auth_ts_0r2vclvk12af6._.js");
      case "server/chunks/ssr/[root-of-the-server]__011pq46aqvvwz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__011pq46aqvvwz._.js");
      case "server/chunks/ssr/_0vcaqinhuezpx._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0vcaqinhuezpx._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_page_actions_0k6aadhc-zujz.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_page_actions_0k6aadhc-zujz.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1lt9mqqo8f81s.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1lt9mqqo8f81s.js");
      case "server/chunks/ssr/src_app_admin_admin-profiles_page_tsx_0uluovfmqo8nk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_admin-profiles_page_tsx_0uluovfmqo8nk._.js");
      case "server/chunks/ssr/src_components_ui_field_tsx_0qrf41bkhefwh._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_ui_field_tsx_0qrf41bkhefwh._.js");
      case "server/chunks/ssr/src_lib_admin-profiles_ts_066f4_yhjkrz-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_admin-profiles_ts_066f4_yhjkrz-._.js");
      case "server/chunks/ssr/[root-of-the-server]__13wqlk4kl7tiw._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__13wqlk4kl7tiw._.js");
      case "server/chunks/ssr/_05g7b1m67uo5-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_05g7b1m67uo5-._.js");
      case "server/chunks/ssr/_1gxu1-nx85wjj._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1gxu1-nx85wjj._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_[id]_page_actions_103x_4zhl5ee6.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_admin-profiles_[id]_page_actions_103x_4zhl5ee6.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1svv4q79ld6w2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1svv4q79ld6w2.js");
      case "server/chunks/ssr/src_components_admin_admin-profile-form_tsx_1h-h297xv3udd._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_admin-profile-form_tsx_1h-h297xv3udd._.js");
      case "server/chunks/ssr/[root-of-the-server]__1s8-p4hnpc379._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1s8-p4hnpc379._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_audit-logs_page_actions_0doh58mbq07t8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_audit-logs_page_actions_0doh58mbq07t8.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1bnd2nb31e4-g.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1bnd2nb31e4-g.js");
      case "server/chunks/ssr/src_app_admin_audit-logs_page_tsx_1r94anfmv9mi0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_audit-logs_page_tsx_1r94anfmv9mi0._.js");
      case "server/chunks/ssr/[root-of-the-server]__0v7g813gw2xc-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0v7g813gw2xc-._.js");
      case "server/chunks/ssr/_0-txzpp88-f5t._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0-txzpp88-f5t._.js");
      case "server/chunks/ssr/_1abcyqel9-mnn._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1abcyqel9-mnn._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_companies_page_actions_0-o98go6_0_0y.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_companies_page_actions_0-o98go6_0_0y.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1u559z6ig3wrh.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1u559z6ig3wrh.js");
      case "server/chunks/ssr/src_app_admin_companies_page_tsx_0ktgcn8zjbnr7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_companies_page_tsx_0ktgcn8zjbnr7._.js");
      case "server/chunks/ssr/src_components_ui_dialog_index_tsx_1lx3e8_ar1gxi._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_ui_dialog_index_tsx_1lx3e8_ar1gxi._.js");
      case "server/chunks/ssr/[root-of-the-server]__143kvumgpd-g9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__143kvumgpd-g9._.js");
      case "server/chunks/ssr/_0iaks7a_0w-sr._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0iaks7a_0w-sr._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_course-categories_page_actions_1bexp0ak3xd4d.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_course-categories_page_actions_1bexp0ak3xd4d.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0v3d5zkwges8h.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0v3d5zkwges8h.js");
      case "server/chunks/ssr/src_app_admin_course-categories_page_tsx_126ccb8rd03bm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_course-categories_page_tsx_126ccb8rd03bm._.js");
      case "server/chunks/ssr/[root-of-the-server]__0lp5-r4i75uc4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0lp5-r4i75uc4._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_digital-ventures_new_page_actions_1d5lzivkxcbg0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_digital-ventures_new_page_actions_1d5lzivkxcbg0.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1iors9_79ywrn.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1iors9_79ywrn.js");
      case "server/chunks/ssr/src_app_admin_digital-ventures_new_page_tsx_1exq17wyycscz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_digital-ventures_new_page_tsx_1exq17wyycscz._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_digital-ventures_page_actions_11fqaxpsag2qi.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_digital-ventures_page_actions_11fqaxpsag2qi.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0dxaez1q9qhbz.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0dxaez1q9qhbz.js");
      case "server/chunks/ssr/src_app_admin_digital-ventures_page_tsx_1xnops2y39w01._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_digital-ventures_page_tsx_1xnops2y39w01._.js");
      case "server/chunks/ssr/src_lib_digital-ventures_ts_0410vzsy3e38w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_digital-ventures_ts_0410vzsy3e38w._.js");
      case "server/chunks/ssr/[root-of-the-server]__0s5ef4rtwzvqm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0s5ef4rtwzvqm._.js");
      case "server/chunks/ssr/_1n54lc96jqoig._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1n54lc96jqoig._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_elevate-360_page_actions_05tl5k_jvlyk8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_elevate-360_page_actions_05tl5k_jvlyk8.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0eqdfj6k_feje.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0eqdfj6k_feje.js");
      case "server/chunks/ssr/src_app_admin_elevate-360_page_tsx_1pe1e1yzlnfm8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_elevate-360_page_tsx_1pe1e1yzlnfm8._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_elevate-360_projects_new_page_actions_08nzw-h52d_kh.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_elevate-360_projects_new_page_actions_08nzw-h52d_kh.js");
      case "server/chunks/ssr/[root-of-the-server]__1vp0f_7h8q51m._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1vp0f_7h8q51m._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_17a7etf7oa_75.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_17a7etf7oa_75.js");
      case "server/chunks/ssr/src_app_admin_elevate-360_projects_new_page_tsx_0fly67h62df86._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_elevate-360_projects_new_page_tsx_0fly67h62df86._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_elevate-360_projects_page_actions_0-1p0qxc9a0c_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_elevate-360_projects_page_actions_0-1p0qxc9a0c_.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1-0vn-cf-b2pl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1-0vn-cf-b2pl.js");
      case "server/chunks/ssr/src_app_admin_elevate-360_projects_page_tsx_1teo-6k3gnyat._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_elevate-360_projects_page_tsx_1teo-6k3gnyat._.js");
      case "server/chunks/ssr/src_lib_elevate-projects_ts_1wkkn-px023mi._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_elevate-projects_ts_1wkkn-px023mi._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_elevate-360_projects_[id]_page_actions_1bpgtf8kk0v46.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_elevate-360_projects_[id]_page_actions_1bpgtf8kk0v46.js");
      case "server/chunks/ssr/[root-of-the-server]__0-9os5o7e2b31._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0-9os5o7e2b31._.js");
      case "server/chunks/ssr/_0_rorgcyn096p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0_rorgcyn096p._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_trash_mjs_0px2gzry_9y7z._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_trash_mjs_0px2gzry_9y7z._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1w1-irohwsr6i.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1w1-irohwsr6i.js");
      case "server/chunks/ssr/src_components_admin_project-form_tsx_0i91b6v96hyuc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_project-form_tsx_0i91b6v96hyuc._.js");
      case "server/chunks/ssr/[root-of-the-server]__08ananr3v3si0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__08ananr3v3si0._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_forbidden_page_actions_0delsw9fx-ac8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_forbidden_page_actions_0delsw9fx-ac8.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_06eqyg6xb20a7.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_06eqyg6xb20a7.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_general-settings_page_actions_0igq27vrc2_je.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_general-settings_page_actions_0igq27vrc2_je.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q4-skc_1zh8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_13q4-skc_1zh8.js");
      case "server/chunks/ssr/src_app_admin_general-settings_page_tsx_0m4z81sb6yk1h._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_general-settings_page_tsx_0m4z81sb6yk1h._.js");
      case "server/chunks/ssr/[root-of-the-server]__09sebdmh6wj_9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__09sebdmh6wj_9._.js");
      case "server/chunks/ssr/_08p3cvw1g67uk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_08p3cvw1g67uk._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_inquiries_page_actions_1mdz_u8nvat52.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_inquiries_page_actions_1mdz_u8nvat52.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_066ty_q-w1qic.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_066ty_q-w1qic.js");
      case "server/chunks/ssr/src_1rlsv_jfippyy._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1rlsv_jfippyy._.js");
      case "server/chunks/ssr/src_components_admin_inquiry-filters_tsx_1i938d5dm-av0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_inquiry-filters_tsx_1i938d5dm-av0._.js");
      case "server/chunks/ssr/src_lib_inquiries_ts_1rc-xxmwag4g2._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_inquiries_ts_1rc-xxmwag4g2._.js");
      case "server/chunks/ssr/[root-of-the-server]__1viatqpji5y-u._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1viatqpji5y-u._.js");
      case "server/chunks/ssr/_0wwf4eyp5kyx0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0wwf4eyp5kyx0._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_inquiries_[id]_page_actions_0mqa5kn1-bniq.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_inquiries_[id]_page_actions_0mqa5kn1-bniq.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1wkm3u_m1ip43.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1wkm3u_m1ip43.js");
      case "server/chunks/ssr/src_1wgv-1v1wz_zt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1wgv-1v1wz_zt._.js");
      case "server/chunks/ssr/src_components_admin_inquiry-status-form_tsx_1gq_lqeqm0dn0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_inquiry-status-form_tsx_1gq_lqeqm0dn0._.js");
      case "server/chunks/ssr/1jng_app_admin_jallal-institute_course-applications_page_actions_15wzsql9l0nsz.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1jng_app_admin_jallal-institute_course-applications_page_actions_15wzsql9l0nsz.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0gg4ey0mmrlva.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0gg4ey0mmrlva.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_course-applications_page_tsx_1my873avl9i04._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_course-applications_page_tsx_1my873avl9i04._.js");
      case "server/chunks/ssr/src_lib_course-applications_ts_1_ev_mr56xubb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_course-applications_ts_1_ev_mr56xubb._.js");
      case "server/chunks/ssr/src_lib_courses_ts_09uxuhho-ci75._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_courses_ts_09uxuhho-ci75._.js");
      case "server/chunks/ssr/1jng_app_admin_jallal-institute_course-applications_[id]_page_actions_010jaimht-uip.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1jng_app_admin_jallal-institute_course-applications_[id]_page_actions_010jaimht-uip.js");
      case "server/chunks/ssr/[root-of-the-server]__06gpl_a_c4-sm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__06gpl_a_c4-sm._.js");
      case "server/chunks/ssr/_02qaa2j6f3212._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_02qaa2j6f3212._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1aoj0dt52771p.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1aoj0dt52771p.js");
      case "server/chunks/ssr/src_0rj34at-m0334._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_0rj34at-m0334._.js");
      case "server/chunks/ssr/src_components_admin_application-review-actions_tsx_0_-08w4hfabrz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_application-review-actions_tsx_0_-08w4hfabrz._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_new_page_actions_00wydzgd69f5t.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_new_page_actions_00wydzgd69f5t.js");
      case "server/chunks/ssr/[root-of-the-server]__1vd_szpbf0253._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1vd_szpbf0253._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_010z2r3qhbgh0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_010z2r3qhbgh0.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_courses_new_page_tsx_1mfrhrmyt-yx3._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_courses_new_page_tsx_1mfrhrmyt-yx3._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_page_actions_1_kew3i2dh16f.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_page_actions_1_kew3i2dh16f.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1x08z1wwu7oto.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1x08z1wwu7oto.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_courses_page_tsx_0y_4vj7q_f-n_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_courses_page_tsx_0y_4vj7q_f-n_._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_[id]_page_actions_0g5_3q5r0iy8g.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_courses_[id]_page_actions_0g5_3q5r0iy8g.js");
      case "server/chunks/ssr/_03g231ly7yy9z._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_03g231ly7yy9z._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_09dih5v6me_8_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_09dih5v6me_8_.js");
      case "server/chunks/ssr/src_components_admin_course-form_tsx_0dxqv8173d916._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_course-form_tsx_0dxqv8173d916._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_enrollments_page_actions_1nofjqkszake0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_enrollments_page_actions_1nofjqkszake0.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0yt4_7ecbiszd.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0yt4_7ecbiszd.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_enrollments_page_tsx_1_uoznj2fodq7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_enrollments_page_tsx_1_uoznj2fodq7._.js");
      case "server/chunks/ssr/src_lib_enrollments_ts_0-tumcg_eamls._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_enrollments_ts_0-tumcg_eamls._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_enrollments_[id]_page_actions_0pyfad8gic55y.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_enrollments_[id]_page_actions_0pyfad8gic55y.js");
      case "server/chunks/ssr/_0_lbx3bs3dhlw._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0_lbx3bs3dhlw._.js");
      case "server/chunks/ssr/_0k-gmrzb_o941._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0k-gmrzb_o941._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1b_8tzll65-pd.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1b_8tzll65-pd.js");
      case "server/chunks/ssr/src_components_admin_enrollment-form_tsx_00je5b4bdvjpd._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_enrollment-form_tsx_00je5b4bdvjpd._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_jallal-institute_page_actions_09jz261xvc3vt.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_jallal-institute_page_actions_09jz261xvc3vt.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_01vufsyjmov-x.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_01vufsyjmov-x.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_page_tsx_1dzp0bcvfu5ly._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_page_tsx_1dzp0bcvfu5ly._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_payments_page_actions_04p6qd-blw4y0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_payments_page_actions_04p6qd-blw4y0.js");
      case "server/chunks/ssr/[root-of-the-server]__0xigkquhgqht4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0xigkquhgqht4._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_198x35y60rryt.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_198x35y60rryt.js");
      case "server/chunks/ssr/src_app_admin_jallal-institute_payments_page_tsx_0il2ec9sze4-7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-institute_payments_page_tsx_0il2ec9sze4-7._.js");
      case "server/chunks/ssr/src_lib_course-payments_ts_04oxwmpsfq5kz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_course-payments_ts_04oxwmpsfq5kz._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-institute_payments_[id]_page_actions_00hj0pwlov7f3.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-institute_payments_[id]_page_actions_00hj0pwlov7f3.js");
      case "server/chunks/ssr/[root-of-the-server]__051y3lk4l1aqt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__051y3lk4l1aqt._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zed4jcubuf_8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zed4jcubuf_8.js");
      case "server/chunks/ssr/src_17tnav68p56ke._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_17tnav68p56ke._.js");
      case "server/chunks/ssr/src_components_admin_payment-verify-form_tsx_0lth3nfk7dp6y._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_payment-verify-form_tsx_0lth3nfk7dp6y._.js");
      case "server/chunks/ssr/[root-of-the-server]__1tte10he75cte._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1tte10he75cte._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_jallal-properties_page_actions_0uzspvh4ab-ur.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_jallal-properties_page_actions_0uzspvh4ab-ur.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0mh1_5jzut67p.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0mh1_5jzut67p.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-properties_projects_page_actions_1wnsm4i9-yhoy.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-properties_projects_page_actions_1wnsm4i9-yhoy.js");
      case "server/chunks/ssr/[root-of-the-server]__1i-9trn9uxzep._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1i-9trn9uxzep._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zyqi1lvsdoq9.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zyqi1lvsdoq9.js");
      case "server/chunks/ssr/src_app_admin_jallal-properties_projects_page_tsx_1zv-8k1akxkff._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-properties_projects_page_tsx_1zv-8k1akxkff._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_new_page_actions_01q28i9j_3sae.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_new_page_actions_01q28i9j_3sae.js");
      case "server/chunks/ssr/[root-of-the-server]__1ng0ztc80fatz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1ng0ztc80fatz._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_15hfcoicihxce.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_15hfcoicihxce.js");
      case "server/chunks/ssr/src_app_admin_jallal-properties_properties_new_page_tsx_1wvaca-5avd4f._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-properties_properties_new_page_tsx_1wvaca-5avd4f._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_page_actions_1gkd2yz9vzlvl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_page_actions_1gkd2yz9vzlvl.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1lfuiaffjn6st.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1lfuiaffjn6st.js");
      case "server/chunks/ssr/src_app_admin_jallal-properties_properties_page_tsx_0p_3rpe6-frjl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-properties_properties_page_tsx_0p_3rpe6-frjl._.js");
      case "server/chunks/ssr/src_lib_properties_ts_0-9giz_j6ka0w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_properties_ts_0-9giz_j6ka0w._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_[id]_page_actions_09bkkwy5mbixl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-properties_properties_[id]_page_actions_09bkkwy5mbixl.js");
      case "server/chunks/ssr/_1icjz4wyja1zi._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1icjz4wyja1zi._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_169xl04owg4cf.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_169xl04owg4cf.js");
      case "server/chunks/ssr/src_components_admin_property-form_tsx_0_n9070hocjw7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_property-form_tsx_0_n9070hocjw7._.js");
      case "server/chunks/ssr/[root-of-the-server]__1x6t9lvrt1db_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1x6t9lvrt1db_._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_jallal-tech_page_actions_0sb83uqu_zxuf.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_jallal-tech_page_actions_0sb83uqu_zxuf.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0n-t5_xe632qb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0n-t5_xe632qb.js");
      case "server/chunks/ssr/src_app_admin_jallal-tech_page_tsx_0u0-_lozot-ij._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-tech_page_tsx_0u0-_lozot-ij._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-tech_projects_new_page_actions_1bjl_cr28hlnb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-tech_projects_new_page_actions_1bjl_cr28hlnb.js");
      case "server/chunks/ssr/[root-of-the-server]__0o45nm2srp8dy._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0o45nm2srp8dy._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10fkvtd4vyjz3.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_10fkvtd4vyjz3.js");
      case "server/chunks/ssr/src_app_admin_jallal-tech_projects_new_page_tsx_01jy61-sy-2h_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-tech_projects_new_page_tsx_01jy61-sy-2h_._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_jallal-tech_projects_page_actions_1ibmvfd-usr_j.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_jallal-tech_projects_page_actions_1ibmvfd-usr_j.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0t78cueub1j3u.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0t78cueub1j3u.js");
      case "server/chunks/ssr/src_app_admin_jallal-tech_projects_page_tsx_0mobfcy17_3cb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-tech_projects_page_tsx_0mobfcy17_3cb._.js");
      case "server/chunks/ssr/src_lib_tech-projects_ts_06sn24_w_fz06._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_tech-projects_ts_06sn24_w_fz06._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_jallal-tech_projects_[id]_page_actions_1es2ya81w-c7m.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_jallal-tech_projects_[id]_page_actions_1es2ya81w-c7m.js");
      case "server/chunks/ssr/[root-of-the-server]__1ajoqq23957j3._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1ajoqq23957j3._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_08y2r7b6ifkea.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_08y2r7b6ifkea.js");
      case "server/chunks/ssr/src_app_admin_jallal-tech_projects_[id]_page_tsx_0peld0blqt-0w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_jallal-tech_projects_[id]_page_tsx_0peld0blqt-0w._.js");
      case "server/chunks/ssr/[root-of-the-server]__1bm88cv2rt0jy._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1bm88cv2rt0jy._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_login_page_actions_024efkcwjgwgn.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_login_page_actions_024efkcwjgwgn.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1hmtjg_zqdyco._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1hmtjg_zqdyco._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1t6tvufymplb9.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1t6tvufymplb9.js");
      case "server/chunks/ssr/src_components_admin_login-form_tsx_0tak86t5f_zud._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_admin_login-form_tsx_0tak86t5f_zud._.js");
      case "server/chunks/ssr/[root-of-the-server]__1tn-1nsb1384o._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1tn-1nsb1384o._.js");
      case "server/chunks/ssr/_0nuzoe1yeore0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0nuzoe1yeore0._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_media-library_page_actions_1eg3prwtx3c0o.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_media-library_page_actions_1eg3prwtx3c0o.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1bm4tdaawalnx._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_1bm4tdaawalnx._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fu2d-0xdn4aa.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fu2d-0xdn4aa.js");
      case "server/chunks/ssr/src_app_admin_media-library_page_tsx_1h3nkv7vvm673._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_media-library_page_tsx_1h3nkv7vvm673._.js");
      case "server/chunks/ssr/_1eganes4xupcf._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1eganes4xupcf._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_notifications_page_actions_19c_uz8x4x4qx.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_notifications_page_actions_19c_uz8x4x4qx.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0oc5kybqae1yd.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0oc5kybqae1yd.js");
      case "server/chunks/ssr/src_app_admin_notifications_page_tsx_11kbqmg64g_te._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_notifications_page_tsx_11kbqmg64g_te._.js");
      case "server/chunks/ssr/[root-of-the-server]__0ha5lake1jfsu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0ha5lake1jfsu._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_page_actions_1mcickzfofbmo.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_page_actions_1mcickzfofbmo.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0thzxe1f9cflp.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0thzxe1f9cflp.js");
      case "server/chunks/ssr/src_app_admin_page_tsx_2179ca-6szw48._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_page_tsx_2179ca-6szw48._.js");
      case "server/chunks/ssr/src_lib_0ttpkl1ye_kff._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_lib_0ttpkl1ye_kff._.js");
      case "server/chunks/ssr/[root-of-the-server]__0b0gmni64sg0a._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0b0gmni64sg0a._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_reports_page_actions_1c-mifh47jnxr.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_reports_page_actions_1c-mifh47jnxr.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_04gpkuyqy495x.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_04gpkuyqy495x.js");
      case "server/chunks/ssr/src_app_admin_reports_page_tsx_0w82aliysxq4o._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_reports_page_tsx_0w82aliysxq4o._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_roles_page_actions_0bst8r-uzrade.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_roles_page_actions_0bst8r-uzrade.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0bazc8ys9ntko.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0bazc8ys9ntko.js");
      case "server/chunks/ssr/src_app_admin_roles_page_tsx_0yn74fif9romd._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_roles_page_tsx_0yn74fif9romd._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_security-settings_page_actions_00v7giig1052d.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_security-settings_page_actions_00v7giig1052d.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0tfh8tuf3joiv.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0tfh8tuf3joiv.js");
      case "server/chunks/ssr/src_app_admin_security-settings_page_tsx_1m068oe5a165s._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_security-settings_page_tsx_1m068oe5a165s._.js");
      case "server/chunks/ssr/[root-of-the-server]__00s3e_d29_eh-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__00s3e_d29_eh-._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_site-settings_page_actions_17ix9vrj0g3kf.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_site-settings_page_actions_17ix9vrj0g3kf.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qb503zex84kg.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1qb503zex84kg.js");
      case "server/chunks/ssr/src_app_admin_site-settings_page_tsx_1wvohlk5ih8s1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_site-settings_page_tsx_1wvohlk5ih8s1._.js");
      case "server/chunks/ssr/[root-of-the-server]__1lk1v-cgb180v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1lk1v-cgb180v._.js");
      case "server/chunks/ssr/_008h3oc8javzk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_008h3oc8javzk._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_training-activities_page_actions_1p0_e-4-z9apz.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_training-activities_page_actions_1p0_e-4-z9apz.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1jjvrgkrdeh76.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1jjvrgkrdeh76.js");
      case "server/chunks/ssr/src_app_admin_training-activities_page_tsx_1o8rdsq6-v5a2._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-activities_page_tsx_1o8rdsq6-v5a2._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_training-application-forms_page_actions_1pkomzunmk5in.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_training-application-forms_page_actions_1pkomzunmk5in.js");
      case "server/chunks/ssr/[root-of-the-server]__1v4iwpc8tqf5m._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1v4iwpc8tqf5m._.js");
      case "server/chunks/ssr/_1sqra_a0b9rbo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1sqra_a0b9rbo._.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0m376l50kyqbc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0m376l50kyqbc._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_11r-ta0zmkuww.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_11r-ta0zmkuww.js");
      case "server/chunks/ssr/src_app_admin_training-application-forms_page_tsx_1fg21otwn77xc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-application-forms_page_tsx_1fg21otwn77xc._.js");
      case "server/chunks/ssr/[root-of-the-server]__09q3y62dn1vvl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__09q3y62dn1vvl._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_training-applications_page_actions_0-m0cfwg0bpi0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_training-applications_page_actions_0-m0cfwg0bpi0.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_075_mfewzqbx8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_075_mfewzqbx8.js");
      case "server/chunks/ssr/src_app_admin_training-applications_page_tsx_0s8phts62fes1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-applications_page_tsx_0s8phts62fes1._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_training-learning-materials_page_actions_07b2gag87qpt-.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_training-learning-materials_page_actions_07b2gag87qpt-.js");
      case "server/chunks/ssr/[root-of-the-server]__1bfeb9me4usbt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1bfeb9me4usbt._.js");
      case "server/chunks/ssr/_1sb9o95u93ndi._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1sb9o95u93ndi._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1js0jrwojmd0l.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1js0jrwojmd0l.js");
      case "server/chunks/ssr/src_app_admin_training-learning-materials_page_tsx_0kd6hkyrtnqsc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-learning-materials_page_tsx_0kd6hkyrtnqsc._.js");
      case "server/chunks/ssr/1oeh_server_app_admin_training-program-announcements_page_actions_12qvpgvmxp95u.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_admin_training-program-announcements_page_actions_12qvpgvmxp95u.js");
      case "server/chunks/ssr/[root-of-the-server]__0ca73cjqn6b35._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0ca73cjqn6b35._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1i2itdi1mpl4q.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1i2itdi1mpl4q.js");
      case "server/chunks/ssr/src_app_admin_training-program-announcements_page_tsx_1k1d-ci02bu5h._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-program-announcements_page_tsx_1k1d-ci02bu5h._.js");
      case "server/chunks/ssr/[root-of-the-server]__119lbxd7otfvl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__119lbxd7otfvl._.js");
      case "server/chunks/ssr/_0ii77t59rtx3p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0ii77t59rtx3p._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_training-programs_page_actions_1k782cyv7zv7j.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_training-programs_page_actions_1k782cyv7zv7j.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0zzlhjo8repis.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0zzlhjo8repis.js");
      case "server/chunks/ssr/src_app_admin_training-programs_page_tsx_0det-b0vh0cew._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-programs_page_tsx_0det-b0vh0cew._.js");
      case "server/chunks/ssr/[root-of-the-server]__075oi4rpcj01o._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__075oi4rpcj01o._.js");
      case "server/chunks/ssr/_0vf2jsuftxg7b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0vf2jsuftxg7b._.js");
      case "server/chunks/ssr/_1ug5log5fu-vl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1ug5log5fu-vl._.js");
      case "server/chunks/ssr/_next-internal_server_app_admin_training-students_page_actions_0-pkrqzj0qidb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_admin_training-students_page_actions_0-pkrqzj0qidb.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12-j6oxju3n9k.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_12-j6oxju3n9k.js");
      case "server/chunks/ssr/src_app_admin_training-students_page_tsx_1jwftkmabew22._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_admin_training-students_page_tsx_1jwftkmabew22._.js");
      case "server/chunks/[externals]_fs_0_jh86rsbbt27._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0_jh86rsbbt27._.js");
      case "server/chunks/[externals]_fs_0pplqgcyv2l7l._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0pplqgcyv2l7l._.js");
      case "server/chunks/[root-of-the-server]__0njcsn1uqb1k6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0njcsn1uqb1k6._.js");
      case "server/chunks/[root-of-the-server]__1v1-l-83czzsr._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1v1-l-83czzsr._.js");
      case "server/chunks/_13qfscp3t0249._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_13qfscp3t0249._.js");
      case "server/chunks/_1bpl1hjzksxr4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1bpl1hjzksxr4._.js");
      case "server/chunks/_next-internal_server_app_api_admin_activities_route_actions_0jqdrj9818f64.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_activities_route_actions_0jqdrj9818f64.js");
      case "server/chunks/node_modules_next_1gv5j_bwu16s1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/node_modules_next_1gv5j_bwu16s1._.js");
      case "server/chunks/src_lib_activities_ts_0a3lfw7uypsk6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_activities_ts_0a3lfw7uypsk6._.js");
      case "server/chunks/src_lib_auth_ts_1cmzhhxbffvde._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_auth_ts_1cmzhhxbffvde._.js");
      case "server/chunks/[externals]_fs_190zlmlk4tw8p._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_190zlmlk4tw8p._.js");
      case "server/chunks/_1g6j-s6ycegdl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1g6j-s6ycegdl._.js");
      case "server/chunks/_next-internal_server_app_api_admin_activities_[id]_route_actions_1tnj2qmjcbjbb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_activities_[id]_route_actions_1tnj2qmjcbjbb.js");
      case "server/chunks/[externals]_fs_0ggyl0ltzky9b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0ggyl0ltzky9b._.js");
      case "server/chunks/_0aoj89xrin02v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0aoj89xrin02v._.js");
      case "server/chunks/_next-internal_server_app_api_admin_admin-profiles_route_actions_1zpw3d7lp_tl_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_admin-profiles_route_actions_1zpw3d7lp_tl_.js");
      case "server/chunks/src_lib_admin-profiles_ts_02te6yizo-da-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_admin-profiles_ts_02te6yizo-da-._.js");
      case "server/chunks/1oeh_server_app_api_admin_admin-profiles_[id]_route_actions_0gzxmwl46j-r0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_admin-profiles_[id]_route_actions_0gzxmwl46j-r0.js");
      case "server/chunks/[externals]_fs_0824rctty8pd6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0824rctty8pd6._.js");
      case "server/chunks/_0lwiwuddx62op._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0lwiwuddx62op._.js");
      case "server/chunks/1oeh_server_app_api_admin_application-forms_route_actions_0wsgy6s2l_8-1.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_application-forms_route_actions_0wsgy6s2l_8-1.js");
      case "server/chunks/[externals]_fs_1wzxmkxi3qd3c._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1wzxmkxi3qd3c._.js");
      case "server/chunks/_15y7l2oblpph5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_15y7l2oblpph5._.js");
      case "server/chunks/src_lib_application-forms_ts_1nke06qc3jvrl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_application-forms_ts_1nke06qc3jvrl._.js");
      case "server/chunks/1oeh_server_app_api_admin_application-forms_[id]_fields_route_actions_0lcepm7mb5rs9.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_application-forms_[id]_fields_route_actions_0lcepm7mb5rs9.js");
      case "server/chunks/[externals]_fs_1b4nogw4bjq1w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1b4nogw4bjq1w._.js");
      case "server/chunks/_0d07jit4r7fby._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0d07jit4r7fby._.js");
      case "server/chunks/0ivl_api_admin_application-forms_[id]_fields_[fieldId]_route_actions_0hl4nhlw0cj1j.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/0ivl_api_admin_application-forms_[id]_fields_[fieldId]_route_actions_0hl4nhlw0cj1j.js");
      case "server/chunks/[externals]_fs_0t7g7kjav5afo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0t7g7kjav5afo._.js");
      case "server/chunks/_1u4lmhj_e8q45._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1u4lmhj_e8q45._.js");
      case "server/chunks/1oeh_server_app_api_admin_application-forms_[id]_route_actions_0dijof1l3cuv4.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_application-forms_[id]_route_actions_0dijof1l3cuv4.js");
      case "server/chunks/[externals]_fs_1qdjh7xw6131l._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1qdjh7xw6131l._.js");
      case "server/chunks/_0u5x1ofkvou2d._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0u5x1ofkvou2d._.js");
      case "server/chunks/[externals]_fs_124vrdogqb5g8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_124vrdogqb5g8._.js");
      case "server/chunks/_1ulddw65wyho9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1ulddw65wyho9._.js");
      case "server/chunks/_next-internal_server_app_api_admin_applications_route_actions_036gsqct_c-ei.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_applications_route_actions_036gsqct_c-ei.js");
      case "server/chunks/src_lib_applications_ts_01gcq-1p5pkzc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_applications_ts_01gcq-1p5pkzc._.js");
      case "server/chunks/1oeh_server_app_api_admin_applications_[id]_route_actions_0ihyz1urlpzti.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_applications_[id]_route_actions_0ihyz1urlpzti.js");
      case "server/chunks/[externals]_fs_0_0uvl36sujon._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0_0uvl36sujon._.js");
      case "server/chunks/_1h5vu701ajo1d._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1h5vu701ajo1d._.js");
      case "server/chunks/1oeh_server_app_api_admin_applications_[id]_status_route_actions_1mbm37ax72y59.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_applications_[id]_status_route_actions_1mbm37ax72y59.js");
      case "server/chunks/[externals]_fs_0v4d_w7owvwtu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0v4d_w7owvwtu._.js");
      case "server/chunks/_1d_20lhtfg2ba._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1d_20lhtfg2ba._.js");
      case "server/chunks/[externals]__186z-wd8bjw7b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__186z-wd8bjw7b._.js");
      case "server/chunks/_15jjyv_c-aj7j._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_15jjyv_c-aj7j._.js");
      case "server/chunks/_next-internal_server_app_api_admin_audit-logs_route_actions_02hwzqu5cc8z8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_audit-logs_route_actions_02hwzqu5cc8z8.js");
      case "server/chunks/[externals]_fs_1n2livpv8c7gq._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1n2livpv8c7gq._.js");
      case "server/chunks/[root-of-the-server]__0w9t539thpb33._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0w9t539thpb33._.js");
      case "server/chunks/_1afvj0k1dwbd5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1afvj0k1dwbd5._.js");
      case "server/chunks/_next-internal_server_app_api_admin_bootstrap_route_actions_04cn4x4j6u86o.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_bootstrap_route_actions_04cn4x4j6u86o.js");
      case "server/chunks/[externals]_fs_1d3fk7ayze96t._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1d3fk7ayze96t._.js");
      case "server/chunks/_1_u3qht_3-yzk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1_u3qht_3-yzk._.js");
      case "server/chunks/_next-internal_server_app_api_admin_companies_route_actions_0gpwn5ddul3ua.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_companies_route_actions_0gpwn5ddul3ua.js");
      case "server/chunks/1oeh_server_app_api_admin_course-applications_route_actions_1y90u0fp0fs-k.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_course-applications_route_actions_1y90u0fp0fs-k.js");
      case "server/chunks/[externals]_fs_1rwfaddd_qjio._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1rwfaddd_qjio._.js");
      case "server/chunks/_0k30p27-pyfvq._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0k30p27-pyfvq._.js");
      case "server/chunks/src_lib_course-applications_ts_1c3fht1e035or._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_course-applications_ts_1c3fht1e035or._.js");
      case "server/chunks/1oeh_server_app_api_admin_course-applications_[id]_route_actions_0dq6w2gev3l9f.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_course-applications_[id]_route_actions_0dq6w2gev3l9f.js");
      case "server/chunks/[root-of-the-server]__0m3lejnja8k_q._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0m3lejnja8k_q._.js");
      case "server/chunks/_0xg7uc3519_n5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0xg7uc3519_n5._.js");
      case "server/chunks/src_lib_notifications_ts_1yak_klirffr1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_notifications_ts_1yak_klirffr1._.js");
      case "server/chunks/0ivl_api_admin_course-applications_[id]_status-history_route_actions_1f0u9s43f0_ae.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/0ivl_api_admin_course-applications_[id]_status-history_route_actions_1f0u9s43f0_ae.js");
      case "server/chunks/[root-of-the-server]__17vojwqu_cf1b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__17vojwqu_cf1b._.js");
      case "server/chunks/_096fxyl9d66yn._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_096fxyl9d66yn._.js");
      case "server/chunks/1oeh_server_app_api_admin_course-categories_route_actions_1f5r_nf0739oy.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_course-categories_route_actions_1f5r_nf0739oy.js");
      case "server/chunks/[externals]_fs_1o-nco-y9jht_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1o-nco-y9jht_._.js");
      case "server/chunks/_0cls5n44lx5az._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0cls5n44lx5az._.js");
      case "server/chunks/[externals]_fs_1-vis27yuh-0x._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1-vis27yuh-0x._.js");
      case "server/chunks/_06nyj_m4hwj3c._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_06nyj_m4hwj3c._.js");
      case "server/chunks/_next-internal_server_app_api_admin_courses_route_actions_009_c1x0ijnmx.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_courses_route_actions_009_c1x0ijnmx.js");
      case "server/chunks/src_lib_courses_ts_1rnp-v9hij7lv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_courses_ts_1rnp-v9hij7lv._.js");
      case "server/chunks/[externals]_fs_1d8cyjc387-kl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1d8cyjc387-kl._.js");
      case "server/chunks/_1p17t8mvsrhdb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1p17t8mvsrhdb._.js");
      case "server/chunks/_next-internal_server_app_api_admin_courses_[id]_route_actions_03dn6zrf9ccqf.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_courses_[id]_route_actions_03dn6zrf9ccqf.js");
      case "server/chunks/[externals]_fs_0ginnnpep9ft_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0ginnnpep9ft_._.js");
      case "server/chunks/_20ya-diw8ms2c._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_20ya-diw8ms2c._.js");
      case "server/chunks/_next-internal_server_app_api_admin_digital-ventures_route_actions_0p2ct36q_1xmv.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_digital-ventures_route_actions_0p2ct36q_1xmv.js");
      case "server/chunks/src_lib_digital-ventures_ts_0dvyx885rn2vv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_digital-ventures_ts_0dvyx885rn2vv._.js");
      case "server/chunks/[externals]_fs_0y8-vzbz-jqs4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0y8-vzbz-jqs4._.js");
      case "server/chunks/_0f0fwrk-88khh._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0f0fwrk-88khh._.js");
      case "server/chunks/_next-internal_server_app_api_admin_elevate-projects_route_actions_1jd9h2qfqsgbb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_elevate-projects_route_actions_1jd9h2qfqsgbb.js");
      case "server/chunks/src_lib_elevate-projects_ts_1vbwpgib43g_6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_elevate-projects_ts_1vbwpgib43g_6._.js");
      case "server/chunks/1oeh_server_app_api_admin_elevate-projects_[id]_route_actions_1msgn8ygf6tup.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_elevate-projects_[id]_route_actions_1msgn8ygf6tup.js");
      case "server/chunks/[externals]_fs_1_4sp5qmmjrt7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1_4sp5qmmjrt7._.js");
      case "server/chunks/_06qq4qwvpxjl0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_06qq4qwvpxjl0._.js");
      case "server/chunks/[externals]_fs_1mgnp6kyv-mzu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1mgnp6kyv-mzu._.js");
      case "server/chunks/_0nttfvf8xg9qm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0nttfvf8xg9qm._.js");
      case "server/chunks/_next-internal_server_app_api_admin_enrollments_route_actions_0cghay4l11p6q.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_enrollments_route_actions_0cghay4l11p6q.js");
      case "server/chunks/src_lib_enrollments_ts_00sjx5ey0x1iu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_enrollments_ts_00sjx5ey0x1iu._.js");
      case "server/chunks/[externals]_fs_0q7wr0eczk2hv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0q7wr0eczk2hv._.js");
      case "server/chunks/_0p3z2i5aer8q7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0p3z2i5aer8q7._.js");
      case "server/chunks/_next-internal_server_app_api_admin_enrollments_[id]_route_actions_1wm7c--kqtto9.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_enrollments_[id]_route_actions_1wm7c--kqtto9.js");
      case "server/chunks/[externals]__1ozwmkjk1mm58._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__1ozwmkjk1mm58._.js");
      case "server/chunks/[root-of-the-server]__1914qdjbk-cn9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1914qdjbk-cn9._.js");
      case "server/chunks/_0bpqoaulo5v-b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0bpqoaulo5v-b._.js");
      case "server/chunks/_next-internal_server_app_api_admin_inquiries_[id]_route_actions_0q---s3jy6vlb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_inquiries_[id]_route_actions_0q---s3jy6vlb.js");
      case "server/chunks/src_lib_inquiries_ts_1_22p9_gf464v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_inquiries_ts_1_22p9_gf464v._.js");
      case "server/chunks/1oeh_server_app_api_admin_learning-materials_route_actions_1or9h-k6e8_bj.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_learning-materials_route_actions_1or9h-k6e8_bj.js");
      case "server/chunks/[externals]_fs_1dm48agw3hddv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1dm48agw3hddv._.js");
      case "server/chunks/_14n2m_6hikae1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_14n2m_6hikae1._.js");
      case "server/chunks/[externals]_fs_0g6fp2742vs0b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0g6fp2742vs0b._.js");
      case "server/chunks/[root-of-the-server]__19ik837ikwmad._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__19ik837ikwmad._.js");
      case "server/chunks/_05skev06oeatd._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_05skev06oeatd._.js");
      case "server/chunks/_next-internal_server_app_api_admin_login_route_actions_14e5p020g5iig.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_login_route_actions_14e5p020g5iig.js");
      case "server/chunks/[externals]__0treqkbodw-xe._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__0treqkbodw-xe._.js");
      case "server/chunks/_0j1yx5q9jn68_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0j1yx5q9jn68_._.js");
      case "server/chunks/_next-internal_server_app_api_admin_logout_route_actions_0-yq0svxnocej.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_logout_route_actions_0-yq0svxnocej.js");
      case "server/chunks/[externals]_fs_03bqw-9i4ycli._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_03bqw-9i4ycli._.js");
      case "server/chunks/_1rq03sm95m8o0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1rq03sm95m8o0._.js");
      case "server/chunks/_next-internal_server_app_api_admin_media-library_route_actions_01sy3x5el2w72.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_media-library_route_actions_01sy3x5el2w72.js");
      case "server/chunks/src_lib_storage_ts_09rs07sb91ybk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_storage_ts_09rs07sb91ybk._.js");
      case "server/chunks/1oeh_server_app_api_admin_media-library_upload_route_actions_1n6udm5jmfn64.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_media-library_upload_route_actions_1n6udm5jmfn64.js");
      case "server/chunks/[externals]_fs_0mt3valp3rlbo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0mt3valp3rlbo._.js");
      case "server/chunks/_02l86gj9uumzh._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_02l86gj9uumzh._.js");
      case "server/chunks/[externals]_fs_0bg7httj8l1vv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0bg7httj8l1vv._.js");
      case "server/chunks/_0unhy_vsxd8pl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0unhy_vsxd8pl._.js");
      case "server/chunks/_next-internal_server_app_api_admin_notifications_route_actions_1i3u1ezrc7_1e.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_notifications_route_actions_1i3u1ezrc7_1e.js");
      case "server/chunks/[externals]_fs_1a0lqgaz-4enx._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1a0lqgaz-4enx._.js");
      case "server/chunks/_17zhx_3g-k6lc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_17zhx_3g-k6lc._.js");
      case "server/chunks/_next-internal_server_app_api_admin_payments_route_actions_20bs7_3im1elu.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_payments_route_actions_20bs7_3im1elu.js");
      case "server/chunks/src_lib_course-payments_ts_14zjq697ancwj._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_course-payments_ts_14zjq697ancwj._.js");
      case "server/chunks/[root-of-the-server]__0g_c03vc5aksb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0g_c03vc5aksb._.js");
      case "server/chunks/_1vqc77hscz-en._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1vqc77hscz-en._.js");
      case "server/chunks/_next-internal_server_app_api_admin_payments_[id]_route_actions_1u3ntcejm5fli.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_payments_[id]_route_actions_1u3ntcejm5fli.js");
      case "server/chunks/1oeh_server_app_api_admin_program-announcements_route_actions_1weewji-g2lz8.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_program-announcements_route_actions_1weewji-g2lz8.js");
      case "server/chunks/[externals]_fs_0vi11ilsqswjb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0vi11ilsqswjb._.js");
      case "server/chunks/_054kqumke2h2b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_054kqumke2h2b._.js");
      case "server/chunks/src_lib_program-announcements_ts_0quqejnp-lssp._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_program-announcements_ts_0quqejnp-lssp._.js");
      case "server/chunks/1oeh_server_app_api_admin_program-announcements_[id]_route_actions_1q-i6tt3thv-0.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_program-announcements_[id]_route_actions_1q-i6tt3thv-0.js");
      case "server/chunks/[externals]_fs_1kqc3g3jiw5wc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1kqc3g3jiw5wc._.js");
      case "server/chunks/_20o1xjmiqgaqs._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_20o1xjmiqgaqs._.js");
      case "server/chunks/1oeh_server_app_api_admin_program-enrollments_route_actions_01l1q2yhwmfjl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_program-enrollments_route_actions_01l1q2yhwmfjl.js");
      case "server/chunks/[externals]_fs_0202g1f8p9fuv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0202g1f8p9fuv._.js");
      case "server/chunks/_19x1jadw6j09v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_19x1jadw6j09v._.js");
      case "server/chunks/src_lib_program-enrollments_ts_1zacexyil-82u._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_program-enrollments_ts_1zacexyil-82u._.js");
      case "server/chunks/[externals]_fs_0s1hb5d4m8del._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0s1hb5d4m8del._.js");
      case "server/chunks/_0-f6jxcllza-l._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0-f6jxcllza-l._.js");
      case "server/chunks/_next-internal_server_app_api_admin_properties_route_actions_0a-ae2gqk_2-l.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_properties_route_actions_0a-ae2gqk_2-l.js");
      case "server/chunks/src_lib_properties_ts_0jo55nh3s6ie5._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_properties_ts_0jo55nh3s6ie5._.js");
      case "server/chunks/[externals]_fs_0ohrvmu2jq9z7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0ohrvmu2jq9z7._.js");
      case "server/chunks/_0z-p83a89hwe2._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0z-p83a89hwe2._.js");
      case "server/chunks/_next-internal_server_app_api_admin_properties_[id]_route_actions_029i9t2bkrv1_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_properties_[id]_route_actions_029i9t2bkrv1_.js");
      case "server/chunks/1oeh_server_app_api_admin_property-projects_route_actions_0t8awmw_jt2u1.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_property-projects_route_actions_0t8awmw_jt2u1.js");
      case "server/chunks/[externals]_fs_1_1p3gp248u5y._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1_1p3gp248u5y._.js");
      case "server/chunks/_0qeyy6fkjalfk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0qeyy6fkjalfk._.js");
      case "server/chunks/src_lib_property-projects_ts_1j0o9hyinh12i._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_property-projects_ts_1j0o9hyinh12i._.js");
      case "server/chunks/1oeh_server_app_api_admin_property-projects_[id]_route_actions_0q1qmqvpi_7pk.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_property-projects_[id]_route_actions_0q1qmqvpi_7pk.js");
      case "server/chunks/[externals]_fs_01jfd49e6qwcn._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_01jfd49e6qwcn._.js");
      case "server/chunks/_1fuepfippb1e8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1fuepfippb1e8._.js");
      case "server/chunks/[externals]_fs_0tus1w0wqhj0y._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0tus1w0wqhj0y._.js");
      case "server/chunks/_0jqh96w9_l-ly._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0jqh96w9_l-ly._.js");
      case "server/chunks/_next-internal_server_app_api_admin_site-settings_route_actions_1gtm455jxw_0r.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_site-settings_route_actions_1gtm455jxw_0r.js");
      case "server/chunks/[externals]_fs_1x926esk4se8g._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1x926esk4se8g._.js");
      case "server/chunks/_1q-_r9l0g9mvv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1q-_r9l0g9mvv._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_route_actions_185rxx3rdtjww.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_route_actions_185rxx3rdtjww.js");
      case "server/chunks/src_lib_students_ts_0tdd6mzwm90c6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_students_ts_0tdd6mzwm90c6._.js");
      case "server/chunks/[externals]_fs_0zxb3bba8fl8t._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0zxb3bba8fl8t._.js");
      case "server/chunks/_0t5st_px1s8tu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0t5st_px1s8tu._.js");
      case "server/chunks/_next-internal_server_app_api_admin_students_[id]_route_actions_0v0lzxa3kj8h_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_students_[id]_route_actions_0v0lzxa3kj8h_.js");
      case "server/chunks/[externals]_fs_0q233bbrmn_wt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0q233bbrmn_wt._.js");
      case "server/chunks/_17wzsziba50nk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_17wzsziba50nk._.js");
      case "server/chunks/_next-internal_server_app_api_admin_tech-projects_route_actions_03r8ranglwcic.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_admin_tech-projects_route_actions_03r8ranglwcic.js");
      case "server/chunks/src_lib_tech-projects_ts_07c1q71wqy42b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/src_lib_tech-projects_ts_07c1q71wqy42b._.js");
      case "server/chunks/1oeh_server_app_api_admin_tech-projects_[id]_route_actions_1ugnyclqd2tkq.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_admin_tech-projects_[id]_route_actions_1ugnyclqd2tkq.js");
      case "server/chunks/[externals]_fs_1id9u3cwnmxue._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1id9u3cwnmxue._.js");
      case "server/chunks/_0z6kly2bb9zgl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0z6kly2bb9zgl._.js");
      case "server/chunks/[root-of-the-server]__1vecq15eck_xo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1vecq15eck_xo._.js");
      case "server/chunks/_0-utmbfsvs0gv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0-utmbfsvs0gv._.js");
      case "server/chunks/_15adamp9oz9gq._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_15adamp9oz9gq._.js");
      case "server/chunks/_next-internal_server_app_api_course-applications_route_actions_0kmyxc5t7574d.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_course-applications_route_actions_0kmyxc5t7574d.js");
      case "server/chunks/node_modules_zod_v4_classic_external_0_xnhi7_4vmfh.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/node_modules_zod_v4_classic_external_0_xnhi7_4vmfh.js");
      case "server/chunks/[externals]_fs_1q--1kuhpg87d._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1q--1kuhpg87d._.js");
      case "server/chunks/_0src-i5-3sqrv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0src-i5-3sqrv._.js");
      case "server/chunks/_next-internal_server_app_api_courses_route_actions_1hl0kzignk233.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_courses_route_actions_1hl0kzignk233.js");
      case "server/chunks/[externals]_fs_1sqonz9rpp5hm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1sqonz9rpp5hm._.js");
      case "server/chunks/_083qgwqqwdykt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_083qgwqqwdykt._.js");
      case "server/chunks/_next-internal_server_app_api_courses_[slug]_route_actions_0mp4kdf_pzlap.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_courses_[slug]_route_actions_0mp4kdf_pzlap.js");
      case "server/chunks/[externals]_fs_08reukwixqbm0._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_08reukwixqbm0._.js");
      case "server/chunks/_0_-kina3ov-2q._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0_-kina3ov-2q._.js");
      case "server/chunks/_next-internal_server_app_api_enrollments_route_actions_0dqy7qi2ikdo2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_enrollments_route_actions_0dqy7qi2ikdo2.js");
      case "server/chunks/[root-of-the-server]__1tjd6ttwzexui._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1tjd6ttwzexui._.js");
      case "server/chunks/_0--qjcebljgbu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0--qjcebljgbu._.js");
      case "server/chunks/_next-internal_server_app_api_inquiries_route_actions_0ppello3d240v.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_inquiries_route_actions_0ppello3d240v.js");
      case "server/chunks/[externals]_fs_0m9hm5904s7_9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_0m9hm5904s7_9._.js");
      case "server/chunks/_0po8kv4650mxs._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0po8kv4650mxs._.js");
      case "server/chunks/_next-internal_server_app_api_properties_route_actions_0wtrxw8f_c-h2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_properties_route_actions_0wtrxw8f_c-h2.js");
      case "server/chunks/[externals]_fs_1gkx8yhqkwh7j._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]_fs_1gkx8yhqkwh7j._.js");
      case "server/chunks/_0y9k5rrge-bx8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0y9k5rrge-bx8._.js");
      case "server/chunks/_next-internal_server_app_api_properties_[slug]_route_actions_03e5h_7qg1ydu.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_properties_[slug]_route_actions_03e5h_7qg1ydu.js");
      case "server/chunks/[externals]__1atqs3mfleo6f._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__1atqs3mfleo6f._.js");
      case "server/chunks/_1vyt90yf1y18k._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1vyt90yf1y18k._.js");
      case "server/chunks/_next-internal_server_app_api_reports_[report]_route_actions_13jm-8ilon20n.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_reports_[report]_route_actions_13jm-8ilon20n.js");
      case "server/chunks/[root-of-the-server]__1yhut99q5jdd9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1yhut99q5jdd9._.js");
      case "server/chunks/_08jr-1zidotsc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_08jr-1zidotsc._.js");
      case "server/chunks/_2171281kvqvyk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_2171281kvqvyk._.js");
      case "server/chunks/_next-internal_server_app_api_student_announcements_route_actions_0t7jfloch99q6.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_announcements_route_actions_0t7jfloch99q6.js");
      case "server/chunks/[root-of-the-server]__0-1h06gtmg6m_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0-1h06gtmg6m_._.js");
      case "server/chunks/_042eua0xhvo6a._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_042eua0xhvo6a._.js");
      case "server/chunks/_next-internal_server_app_api_student_applications_route_actions_0px8a4i0y2zfm.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_applications_route_actions_0px8a4i0y2zfm.js");
      case "server/chunks/1oeh_server_app_api_student_applications_[id]_route_actions_12107a4k59-_e.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_student_applications_[id]_route_actions_12107a4k59-_e.js");
      case "server/chunks/[root-of-the-server]__19gnworsgn1om._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__19gnworsgn1om._.js");
      case "server/chunks/_0oc2u93fenlra._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0oc2u93fenlra._.js");
      case "server/chunks/1oeh_server_app_api_student_course-applications_route_actions_17vtxnxtfi8_2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_student_course-applications_route_actions_17vtxnxtfi8_2.js");
      case "server/chunks/[root-of-the-server]__19iw2ixcratms._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__19iw2ixcratms._.js");
      case "server/chunks/_1fk3s1d3l83ze._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1fk3s1d3l83ze._.js");
      case "server/chunks/1oeh_server_app_api_student_course-applications_[id]_route_actions_1tcl_lxxfulzn.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/1oeh_server_app_api_student_course-applications_[id]_route_actions_1tcl_lxxfulzn.js");
      case "server/chunks/[root-of-the-server]__0ze5sz2wdb-pz._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0ze5sz2wdb-pz._.js");
      case "server/chunks/_1whpl9ki032x4._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1whpl9ki032x4._.js");
      case "server/chunks/[root-of-the-server]__1fivbt5ww1ypi._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1fivbt5ww1ypi._.js");
      case "server/chunks/_0qzylfd-qbc9a._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0qzylfd-qbc9a._.js");
      case "server/chunks/_next-internal_server_app_api_student_enrollments_route_actions_1rz7xtdne-za9.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_enrollments_route_actions_1rz7xtdne-za9.js");
      case "server/chunks/[root-of-the-server]__1fa8h8p4wgik-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1fa8h8p4wgik-._.js");
      case "server/chunks/_00yhsy961pdty._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_00yhsy961pdty._.js");
      case "server/chunks/_next-internal_server_app_api_student_login_route_actions_1sjyilt0fd7ww.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_login_route_actions_1sjyilt0fd7ww.js");
      case "server/chunks/[root-of-the-server]__04on_pwcanc7s._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__04on_pwcanc7s._.js");
      case "server/chunks/_0m82-svxjifji._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0m82-svxjifji._.js");
      case "server/chunks/_next-internal_server_app_api_student_logout_route_actions_0tpgk70tza5lw.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_logout_route_actions_0tpgk70tza5lw.js");
      case "server/chunks/[root-of-the-server]__11vtxi2ibjq2t._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__11vtxi2ibjq2t._.js");
      case "server/chunks/_1tml89by129q_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1tml89by129q_._.js");
      case "server/chunks/_next-internal_server_app_api_student_notifications_route_actions_0_npur-rcb9jy.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_notifications_route_actions_0_npur-rcb9jy.js");
      case "server/chunks/[root-of-the-server]__0do_-j0_log-v._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0do_-j0_log-v._.js");
      case "server/chunks/_1p-68fjwh2_xv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1p-68fjwh2_xv._.js");
      case "server/chunks/_next-internal_server_app_api_student_payments_route_actions_1tsapepxujasg.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_payments_route_actions_1tsapepxujasg.js");
      case "server/chunks/[root-of-the-server]__18jnnszk5jp8k._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__18jnnszk5jp8k._.js");
      case "server/chunks/_1a6zimabcriis._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1a6zimabcriis._.js");
      case "server/chunks/_next-internal_server_app_api_student_register_route_actions_0reefsj-_2imk.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_register_route_actions_0reefsj-_2imk.js");
      case "server/chunks/[root-of-the-server]__1pehd_4pj_sf6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__1pehd_4pj_sf6._.js");
      case "server/chunks/_1nz_3s0glwpb-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1nz_3s0glwpb-._.js");
      case "server/chunks/_next-internal_server_app_api_student_upload_route_actions_06-26nshi59g2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_api_student_upload_route_actions_06-26nshi59g2.js");
      case "server/chunks/ssr/_next-internal_server_app_companies_page_actions_0_5cq8im0kib2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_companies_page_actions_0_5cq8im0kib2.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0cc6gln80habm.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0cc6gln80habm.js");
      case "server/chunks/ssr/src_app_companies_page_tsx_1wm-er97i5n_w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_companies_page_tsx_1wm-er97i5n_w._.js");
      case "server/chunks/ssr/_next-internal_server_app_companies_[slug]_page_actions_0-_1s_cnxwrjf.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_companies_[slug]_page_actions_0-_1s_cnxwrjf.js");
      case "server/chunks/ssr/node_modules_next_dist_19qpk8usuaybt._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_19qpk8usuaybt._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1l_hfmeu19unq.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1l_hfmeu19unq.js");
      case "server/chunks/ssr/src_app_companies_[slug]_page_tsx_1xjdfwzkrcxna._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_companies_[slug]_page_tsx_1xjdfwzkrcxna._.js");
      case "server/chunks/ssr/[root-of-the-server]__18dr5ilelnbtm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__18dr5ilelnbtm._.js");
      case "server/chunks/ssr/_next-internal_server_app_courses_page_actions_0c2kr1qurusf_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_courses_page_actions_0c2kr1qurusf_.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_139lu8-5ja052.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_139lu8-5ja052.js");
      case "server/chunks/ssr/src_1v257xc4k278w._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1v257xc4k278w._.js");
      case "server/chunks/ssr/src_app_courses_025h5oyl_h36l._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_courses_025h5oyl_h36l._.js");
      case "server/chunks/ssr/src_app_courses_enrollment-form_tsx_1g1kol9-pd_14._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_courses_enrollment-form_tsx_1g1kol9-pd_14._.js");
      case "server/chunks/ssr/[root-of-the-server]__1ripv5_aw-8ux._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1ripv5_aw-8ux._.js");
      case "server/chunks/ssr/_19wgus1mm_8gp._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_19wgus1mm_8gp._.js");
      case "server/chunks/ssr/_next-internal_server_app_courses_[slug]_page_actions_102joe8hkpmop.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_courses_[slug]_page_actions_102joe8hkpmop.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1n-_ajh7rn_ok.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1n-_ajh7rn_ok.js");
      case "server/chunks/ssr/src_1c6loojf4jjgb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1c6loojf4jjgb._.js");
      case "server/chunks/ssr/src_components_enrollment_enroll-section_tsx_0jp9chyyj6__8._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_enrollment_enroll-section_tsx_0jp9chyyj6__8._.js");
      case "server/chunks/ssr/[root-of-the-server]__0j6gmqp22o08b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0j6gmqp22o08b._.js");
      case "server/chunks/ssr/_next-internal_server_app_digital-ventures_page_actions_03ur3qiqmps13.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_digital-ventures_page_actions_03ur3qiqmps13.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_211wpz_cqz7aj.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_211wpz_cqz7aj.js");
      case "server/chunks/ssr/src_1v40yzuzn98du._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1v40yzuzn98du._.js");
      case "server/chunks/ssr/src_components_ventures_early-access-dialog_tsx_0r93f403qma2a._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_ventures_early-access-dialog_tsx_0r93f403qma2a._.js");
      case "server/chunks/ssr/src_content_ventures_ts_0sftpvm4lfste._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_content_ventures_ts_0sftpvm4lfste._.js");
      case "server/chunks/[externals]__1a8zw18j894ya._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[externals]__1a8zw18j894ya._.js");
      case "server/chunks/_0uxp3uhmyw1h3._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0uxp3uhmyw1h3._.js");
      case "server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjlssn1kss.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_favicon_ico_route_actions_0g2jjlssn1kss.js");
      case "server/chunks/_0dn7480wo_c3b._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0dn7480wo_c3b._.js");
      case "server/chunks/_next-internal_server_app_icon_svg_route_actions_1r2h_ubdhjtcp.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_icon_svg_route_actions_1r2h_ubdhjtcp.js");
      case "server/chunks/ssr/[root-of-the-server]__20s0zg0v5t7jm._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__20s0zg0v5t7jm._.js");
      case "server/chunks/ssr/_next-internal_server_app_our-companies_page_actions_08ttbbkeuprj5.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_our-companies_page_actions_08ttbbkeuprj5.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hezgjgd9376q.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0hezgjgd9376q.js");
      case "server/chunks/ssr/[root-of-the-server]__1qvuj5_xnrkc_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1qvuj5_xnrkc_._.js");
      case "server/chunks/ssr/_next-internal_server_app_our-companies_[slug]_page_actions_03vq4j7mqg24h.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_our-companies_[slug]_page_actions_03vq4j7mqg24h.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1b5vzify8nx84.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1b5vzify8nx84.js");
      case "server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_page_actions_0hhsz1jew5ls7.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zu21txr96rbl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1zu21txr96rbl.js");
      case "server/chunks/ssr/src_app_page_tsx_1q8t6fz8cg31k._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_page_tsx_1q8t6fz8cg31k._.js");
      case "server/chunks/ssr/[root-of-the-server]__0b3mgnd0e89t_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0b3mgnd0e89t_._.js");
      case "server/chunks/ssr/_next-internal_server_app_partnerships_page_actions_0jq5a-92d8xzb.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_partnerships_page_actions_0jq5a-92d8xzb.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0bjzsijr88v74.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0bjzsijr88v74.js");
      case "server/chunks/ssr/src_1zeyhouzgqaxw._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_1zeyhouzgqaxw._.js");
      case "server/chunks/ssr/src_components_forms_partnership-form_tsx_02dpwu156t48y._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_forms_partnership-form_tsx_02dpwu156t48y._.js");
      case "server/chunks/ssr/_next-internal_server_app_privacy-policy_page_actions_0zb6o_bu8y65d.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_privacy-policy_page_actions_0zb6o_bu8y65d.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0qi2royts0929.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0qi2royts0929.js");
      case "server/chunks/ssr/src_app_privacy-policy_page_tsx_111tm4986-vo-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_privacy-policy_page_tsx_111tm4986-vo-._.js");
      case "server/chunks/[root-of-the-server]__0w-nyj1qpw5of._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0w-nyj1qpw5of._.js");
      case "server/chunks/_1rbd81eryasrk._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_1rbd81eryasrk._.js");
      case "server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89wprgh5.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_robots_txt_route_actions_15vc_89wprgh5.js");
      case "server/chunks/node_modules_next_dist_16uekqf-emgzs._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/node_modules_next_dist_16uekqf-emgzs._.js");
      case "server/chunks/_0muyrbf1n2d7d._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_0muyrbf1n2d7d._.js");
      case "server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9x9dlo2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/_next-internal_server_app_sitemap_xml_route_actions_05l5km9x9dlo2.js");
      case "server/chunks/ssr/[root-of-the-server]__10obmhm8ydgzo._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__10obmhm8ydgzo._.js");
      case "server/chunks/ssr/_1ogi4ybjfidae._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_1ogi4ybjfidae._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_apply_[activityId]_page_actions_075rtc34_nq5f.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_apply_[activityId]_page_actions_075rtc34_nq5f.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_056i_1y4x0dsn._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_056i_1y4x0dsn._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1uwc7910ifhpd.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1uwc7910ifhpd.js");
      case "server/chunks/ssr/src_app_student_apply_[activityId]_064ek5vmx6yb7._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_apply_[activityId]_064ek5vmx6yb7._.js");
      case "server/chunks/ssr/src_app_student_apply_[activityId]_apply-form_tsx_08mj7bspn9gqu._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_apply_[activityId]_apply-form_tsx_08mj7bspn9gqu._.js");
      case "server/chunks/ssr/[root-of-the-server]__02wgm7t05kt00._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__02wgm7t05kt00._.js");
      case "server/chunks/ssr/_00yzoniltm7-h._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_00yzoniltm7-h._.js");
      case "server/chunks/ssr/_129956_xf9j2s._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_129956_xf9j2s._.js");
      case "server/chunks/ssr/_145k0t4q4morl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_145k0t4q4morl._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_course-applications_page_actions_1-z621krlw5us.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_course-applications_page_actions_1-z621krlw5us.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0lb2d39orv6tl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0lb2d39orv6tl.js");
      case "server/chunks/ssr/src_app_student_course-applications_page_tsx_1za6_2lkhp9ck._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_course-applications_page_tsx_1za6_2lkhp9ck._.js");
      case "server/chunks/ssr/1oeh_server_app_student_course-applications_[id]_page_actions_08g8ose2w4kc_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/1oeh_server_app_student_course-applications_[id]_page_actions_08g8ose2w4kc_.js");
      case "server/chunks/ssr/[root-of-the-server]__0u36g5xnb_x-i._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0u36g5xnb_x-i._.js");
      case "server/chunks/ssr/_0qq7j6gv_uxz6._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0qq7j6gv_uxz6._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_01y_0v_-df0vl.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_01y_0v_-df0vl.js");
      case "server/chunks/ssr/src_0glfvxx9w26c1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_0glfvxx9w26c1._.js");
      case "server/chunks/ssr/src_components_enrollment_payment-upload-form_tsx_0o03zemgl521e._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_components_enrollment_payment-upload-form_tsx_0o03zemgl521e._.js");
      case "server/chunks/ssr/[root-of-the-server]__0obz0l27vbgi3._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0obz0l27vbgi3._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_dashboard_page_actions_1elw_zluufjli.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_dashboard_page_actions_1elw_zluufjli.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0c1o9mu21bgpg.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0c1o9mu21bgpg.js");
      case "server/chunks/ssr/src_app_student_dashboard_page_tsx_1cwabwa2fec22._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_dashboard_page_tsx_1cwabwa2fec22._.js");
      case "server/chunks/ssr/[root-of-the-server]__02h0lsfe4fyj_._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__02h0lsfe4fyj_._.js");
      case "server/chunks/ssr/_02prbk3mcwklv._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_02prbk3mcwklv._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_login_page_actions_06803ahak6uzt.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_login_page_actions_06803ahak6uzt.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0t3y_qo8bb3ki.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_0t3y_qo8bb3ki.js");
      case "server/chunks/ssr/src_app_student_login_page_tsx_1sj6ejpvxjepl._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_login_page_tsx_1sj6ejpvxjepl._.js");
      case "server/chunks/ssr/[root-of-the-server]__1s2z1ezqvnr70._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1s2z1ezqvnr70._.js");
      case "server/chunks/ssr/_0_uullbw788gf._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_0_uullbw788gf._.js");
      case "server/chunks/ssr/_next-internal_server_app_student_register_page_actions_0-7s0x1vagfyw.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_student_register_page_actions_0-7s0x1vagfyw.js");
      case "server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ec43t-37teed._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_lucide-react_dist_esm_icons_0ec43t-37teed._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fsrh6w-cc6hp.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fsrh6w-cc6hp.js");
      case "server/chunks/ssr/src_app_student_register_page_tsx_1mbq0jqdl_uf1._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_student_register_page_tsx_1mbq0jqdl_uf1._.js");
      case "server/chunks/ssr/_next-internal_server_app_terms-of-use_page_actions_1o60qr00u7q9_.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app_terms-of-use_page_actions_1o60qr00u7q9_.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fvt-fghihi1i.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_1fvt-fghihi1i.js");
      case "server/chunks/ssr/src_app_terms-of-use_page_tsx_09fglcmwa2jsx._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/src_app_terms-of-use_page_tsx_09fglcmwa2jsx._.js");
      case "server/chunks/ssr/[root-of-the-server]__013uccal699_-._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__013uccal699_-._.js");
      case "server/chunks/ssr/[root-of-the-server]__0_rz5-kj02hrb._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0_rz5-kj02hrb._.js");
      case "server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__0py1t7q9ntzgc._.js");
      case "server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/_next-internal_server_app__global-error_page_actions_0zi5s8-psc_d2.js");
      case "server/chunks/ssr/node_modules_0gxlxpuufujz9._.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_0gxlxpuufujz9._.js");
      case "server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_06zp_1r4dyujd.js": return require("C:/Users/JALLAL TECH/Downloads/JALLAL GROUP WEB/.open-next/server-functions/default/.next/server/chunks/ssr/node_modules_next_dist_esm_build_templates_app-page_06zp_1r4dyujd.js");
      default:
        throw new Error(`Not found ${chunkPath}`);
    }
  }


  async function loadWasmChunk(chunkPath) {
    switch (chunkPath) {

      default:
        throw new Error(`Unknown wasm chunk: ${chunkPath}`);
    }
  }
