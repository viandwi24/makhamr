import { getCurrentInstance, version, useSSRContext, defineComponent, computed, ref, h, resolveComponent, reactive, mergeProps, unref, createApp, toRef, isRef, defineAsyncComponent, provide, onErrorCaptured, inject } from 'vue';
import { $fetch } from 'ofetch';
import { createHooks } from 'hookable';
import { getContext } from 'unctx';
import { hasProtocol, isEqual, parseURL, joinURL, stringifyParsedURL, stringifyQuery, parseQuery } from 'ufo';
import { createError as createError$1, sendRedirect } from 'h3';
import { useHead, createHead as createHead$1 } from '@unhead/vue';
import { renderDOMHead, debouncedRenderDOMHead } from '@unhead/dom';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderAttr, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrRenderComponent, ssrRenderSuspense } from 'vue/server-renderer';
import { a as useRuntimeConfig$1 } from '../nitro/node-server.mjs';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'unenv/runtime/fetch/index';
import 'scule';
import 'ohash';
import 'unstorage';
import 'defu';
import 'radix3';
import 'node:fs';
import 'node:url';
import 'pathe';

const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    provide: void 0,
    globalName: "nuxt",
    payload: reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    static: {
      data: {}
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  {
    if (nuxtApp.ssrContext) {
      nuxtApp.ssrContext.nuxt = nuxtApp;
    }
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    if (nuxtApp.ssrContext.payload) {
      Object.assign(nuxtApp.payload, nuxtApp.ssrContext.payload);
    }
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a;
      if (prop === "public") {
        return target.public;
      }
      return (_a = target[prop]) != null ? _a : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return null;
    }
    if (plugin.length > 1) {
      return (nuxtApp) => plugin(nuxtApp, nuxtApp.provide);
    }
    return plugin;
  }).filter(Boolean);
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const nuxtAppInstance = nuxtAppCtx.tryUse();
  if (!nuxtAppInstance) {
    const vm = getCurrentInstance();
    if (!vm) {
      throw new Error("nuxt instance unavailable");
    }
    return vm.appContext.app.$nuxt;
  }
  return nuxtAppInstance;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (_err) => {
  const err = createError(_err);
  try {
    const nuxtApp = useNuxtApp();
    nuxtApp.callHook("app:error", err);
    const error = useError();
    error.value = error.value || err;
  } catch {
    throw err;
  }
  return err;
};
const createError = (err) => {
  const _err = createError$1(err);
  _err.__nuxt_error = true;
  return _err;
};
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = "$s" + _key;
  const nuxt = useNuxtApp();
  const state = toRef(nuxt.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (getCurrentInstance()) {
    return inject("_route", useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : to.path || "/";
  const isExternal = hasProtocol(toPath, true);
  if (isExternal && !(options == null ? void 0 : options.external)) {
    throw new Error("Navigating to external URL is not allowed by default. Use `nagivateTo (url, { external: true })`.");
  }
  if (isExternal && parseURL(toPath).protocol === "script:") {
    throw new Error("Cannot navigate to an URL with script protocol.");
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = isExternal ? toPath : joinURL(useRuntimeConfig().app.baseURL, router.resolve(to).fullPath || "/");
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, (options == null ? void 0 : options.redirectCode) || 302));
    }
  }
  if (isExternal) {
    if (options == null ? void 0 : options.replace) {
      location.replace(toPath);
    } else {
      location.href = toPath;
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  return defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      prefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      noPrefetch: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      prefetchedClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = computed(() => {
        return props.to || props.href || "";
      });
      const isExternal = computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      const prefetched = ref(false);
      const el = void 0;
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          return h(
            resolveComponent("RouterLink"),
            {
              ref: void 0,
              to: to.value,
              ...prefetched.value && !props.custom ? { class: props.prefetchedClass || options.prefetchedClass } : {},
              activeClass: props.activeClass || options.activeClass,
              exactActiveClass: props.exactActiveClass || options.exactActiveClass,
              replace: props.replace,
              ariaCurrentValue: props.ariaCurrentValue,
              custom: props.custom
            },
            slots.default
          );
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        const navigate = () => navigateTo(href, { replace: props.replace });
        if (props.custom) {
          if (!slots.default) {
            return null;
          }
          return slots.default({
            href,
            navigate,
            route: router.resolve(href),
            rel,
            target,
            isExternal: isExternal.value,
            isActive: false,
            isExactActive: false
          });
        }
        return h("a", { ref: el, href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = defineNuxtLink({ componentName: "NuxtLink" });
function isObject(value) {
  return value !== null && typeof value === "object";
}
function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isObject(value) && isObject(object[key])) {
      object[key] = _defu(value, object[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => arguments_.reduce((p, c) => _defu(p, c, "", merger), {});
}
const defuFn = createDefu((object, key, currentValue, _namespace) => {
  if (typeof object[key] !== "undefined" && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});
const inlineConfig = {};
defuFn(inlineConfig);
const components = {};
const _nuxt_components_plugin_mjs_KR1HBZs4kY = defineNuxtPlugin((nuxtApp) => {
  for (const name in components) {
    nuxtApp.vueApp.component(name, components[name]);
    nuxtApp.vueApp.component("Lazy" + name, components[name]);
  }
});
function createHead(initHeadObject) {
  const unhead = createHead$1();
  const legacyHead = {
    unhead,
    install(app) {
      if (version.startsWith("3")) {
        app.config.globalProperties.$head = unhead;
        app.provide("usehead", unhead);
      }
    },
    use(plugin) {
      unhead.use(plugin);
    },
    resolveTags() {
      return unhead.resolveTags();
    },
    headEntries() {
      return unhead.headEntries();
    },
    headTags() {
      return unhead.resolveTags();
    },
    push(input, options) {
      return unhead.push(input, options);
    },
    addEntry(input, options) {
      return unhead.push(input, options);
    },
    addHeadObjs(input, options) {
      return unhead.push(input, options);
    },
    addReactiveEntry(input, options) {
      const api = useHead(input, options);
      if (typeof api !== "undefined")
        return api.dispose;
      return () => {
      };
    },
    removeHeadObjs() {
    },
    updateDOM(document, force) {
      if (force)
        renderDOMHead(unhead, { document });
      else
        debouncedRenderDOMHead(unhead, { delayFn: (fn) => setTimeout(() => fn(), 50), document });
    },
    internalHooks: unhead.hooks,
    hooks: {
      "before:dom": [],
      "resolved:tags": [],
      "resolved:entries": []
    }
  };
  unhead.addHeadObjs = legacyHead.addHeadObjs;
  unhead.updateDOM = legacyHead.updateDOM;
  unhead.hooks.hook("dom:beforeRender", (ctx) => {
    for (const hook of legacyHead.hooks["before:dom"]) {
      if (hook() === false)
        ctx.shouldRender = false;
    }
  });
  if (initHeadObject)
    legacyHead.addHeadObjs(initHeadObject);
  return legacyHead;
}
version.startsWith("2.");
const appHead = { "meta": [{ "charset": "utf-8" }, { "name": "viewport", "content": "width=device-width, initial-scale=1" }, { "hid": "description", "name": "description", "content": "a Apps for Better Search & Filter data Magang Kampus Merdeka from kemdikbud" }], "link": [], "style": [], "script": [], "noscript": [], "title": "MAKHAMR" };
const node_modules__pnpm_nuxt_643_0_0_node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_sF5fM3LTTq = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  head.push(appHead);
  nuxtApp.vueApp.use(head);
  nuxtApp._useHead = useHead;
  {
    nuxtApp.ssrContext.renderMeta = async () => {
      const { renderSSRHead } = await import('@unhead/ssr');
      const meta = await renderSSRHead(head.unhead);
      return {
        ...meta,
        bodyScriptsPrepend: meta.bodyTagsOpen,
        bodyScripts: meta.bodyTags
      };
    };
  }
});
const globalMiddleware = [];
function getRouteFromPath(fullPath) {
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = parseURL(fullPath.toString());
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    params: {},
    name: void 0,
    matched: [],
    redirectedFrom: void 0,
    meta: {},
    href: fullPath
  };
}
const node_modules__pnpm_nuxt_643_0_0_node_modules_nuxt_dist_app_plugins_router_mjs_hFNJ39OY2j = defineNuxtPlugin((nuxtApp) => {
  const initialURL = nuxtApp.ssrContext.url;
  const routes = [];
  const hooks = {
    "navigate:before": [],
    "resolve:before": [],
    "navigate:after": [],
    error: []
  };
  const registerHook = (hook, guard) => {
    hooks[hook].push(guard);
    return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
  };
  useRuntimeConfig().app.baseURL;
  const route = reactive(getRouteFromPath(initialURL));
  async function handleNavigation(url, replace) {
    try {
      const to = getRouteFromPath(url);
      for (const middleware of hooks["navigate:before"]) {
        const result = await middleware(to, route);
        if (result === false || result instanceof Error) {
          return;
        }
        if (result) {
          return handleNavigation(result, true);
        }
      }
      for (const handler of hooks["resolve:before"]) {
        await handler(to, route);
      }
      Object.assign(route, to);
      if (false)
        ;
      for (const middleware of hooks["navigate:after"]) {
        await middleware(to, route);
      }
    } catch (err) {
      for (const handler of hooks.error) {
        await handler(err);
      }
    }
  }
  const router = {
    currentRoute: route,
    isReady: () => Promise.resolve(),
    options: {},
    install: () => Promise.resolve(),
    push: (url) => handleNavigation(url),
    replace: (url) => handleNavigation(url),
    back: () => window.history.go(-1),
    go: (delta) => window.history.go(delta),
    forward: () => window.history.go(1),
    beforeResolve: (guard) => registerHook("resolve:before", guard),
    beforeEach: (guard) => registerHook("navigate:before", guard),
    afterEach: (guard) => registerHook("navigate:after", guard),
    onError: (handler) => registerHook("error", handler),
    resolve: getRouteFromPath,
    addRoute: (parentName, route2) => {
      routes.push(route2);
    },
    getRoutes: () => routes,
    hasRoute: (name) => routes.some((route2) => route2.name === name),
    removeRoute: (name) => {
      const index = routes.findIndex((route2) => route2.name === name);
      if (index !== -1) {
        routes.splice(index, 1);
      }
    }
  };
  nuxtApp.vueApp.component("RouterLink", {
    functional: true,
    props: {
      to: String,
      custom: Boolean,
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      ariaCurrentValue: String
    },
    setup: (props, { slots }) => {
      const navigate = () => handleNavigation(props.to, props.replace);
      return () => {
        var _a;
        const route2 = router.resolve(props.to);
        return props.custom ? (_a = slots.default) == null ? void 0 : _a.call(slots, { href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
          e.preventDefault();
          return navigate();
        } }, slots);
      };
    }
  });
  nuxtApp._route = route;
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  const initialLayout = useState("_layout");
  nuxtApp.hooks.hookOnce("app:created", async () => {
    router.beforeEach(async (to, from) => {
      var _a;
      to.meta = reactive(to.meta || {});
      if (nuxtApp.isHydrating) {
        to.meta.layout = (_a = initialLayout.value) != null ? _a : to.meta.layout;
      }
      nuxtApp._processingMiddleware = true;
      const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
      for (const middleware of middlewareEntries) {
        const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
        {
          if (result === false || result instanceof Error) {
            const error = result || createError$1({
              statusCode: 404,
              statusMessage: `Page Not Found: ${initialURL}`
            });
            return callWithNuxt(nuxtApp, showError, [error]);
          }
        }
        if (result || result === false) {
          return result;
        }
      }
    });
    router.afterEach(() => {
      delete nuxtApp._processingMiddleware;
    });
    await router.replace(initialURL);
    if (!isEqual(route.fullPath, initialURL)) {
      await callWithNuxt(nuxtApp, navigateTo, [route.fullPath]);
    }
  });
  return {
    provide: {
      route,
      router
    }
  };
});
const _plugins = [
  _nuxt_components_plugin_mjs_KR1HBZs4kY,
  node_modules__pnpm_nuxt_643_0_0_node_modules_nuxt_dist_head_runtime_lib_vueuse_head_plugin_mjs_sF5fM3LTTq,
  node_modules__pnpm_nuxt_643_0_0_node_modules_nuxt_dist_app_plugins_router_mjs_hFNJ39OY2j
];
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "FilterBuilder",
  __ssrInlineRender: true,
  props: {
    fields: {
      type: Array,
      required: true
    },
    groupsFilters: {
      type: Array,
      required: true
    }
  },
  emits: ["apply-filter"],
  setup(__props, { emit }) {
    const props = __props;
    const groups_filters_raw = ref([]);
    props.groupsFilters.forEach((group) => {
      groups_filters_raw.value.push({
        group_operation: group.group_operation,
        filters: group.filters.map((filter) => ({
          field: filter.field,
          operation: filter.operation,
          value: filter.value
        }))
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full bg-slate-800 rounded text-sm" }, _attrs))}><div class="px-4 py-2 border-b-2 border-gray-400/50"> Filters Builder </div><div class="px-4 py-2 flex space-y-2 flex-col">`);
      if (unref(groups_filters_raw).length === 0) {
        _push(`<div class="text-center"> no filters </div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<!--[-->`);
      ssrRenderList(unref(groups_filters_raw), (g, i) => {
        _push(`<div class="px-2 py-2 bg-slate-700 rounded"><div class="flex justify-between"><div>Group #${ssrInterpolate(i + 1)}</div><div class="flex space-x-2"><button class="underline"> new child </button><button> x </button></div></div><div><label>Group Operation</label><select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent"><!--[-->`);
        ssrRenderList(["or", "and"], (operation) => {
          _push(`<option${ssrRenderAttr("value", operation)}>${ssrInterpolate(operation)}</option>`);
        });
        _push(`<!--]--></select></div><!--[-->`);
        ssrRenderList(g.filters, (item, j) => {
          _push(`<div class="mt-2 px-2 border-t border-slate-600"><div class="mt-1"> Child #${ssrInterpolate(j + 1)}</div><div><label class="font-thin">Field</label><select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent"><!--[-->`);
          ssrRenderList(__props.fields, (field) => {
            _push(`<option${ssrRenderAttr("value", field)}>${ssrInterpolate(field)}</option>`);
          });
          _push(`<!--]--></select></div><div><label class="font-thin">Value</label><select class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent"><!--[-->`);
          ssrRenderList(["contains", "not_contains", "equal", "not_equal"], (operation) => {
            _push(`<option${ssrRenderAttr("value", operation)}>${ssrInterpolate(operation)}</option>`);
          });
          _push(`<!--]--></select></div><div><label class="font-thin">Value</label><input type="text" class="w-full border text-xs border-gray-400/50 rounded px-2 py-1 bg-transparent"${ssrRenderAttr("value", unref(groups_filters_raw)[i].filters[j].value)} placeholder="value"></div></div>`);
        });
        _push(`<!--]--></div>`);
      });
      _push(`<!--]--></div><div class="flex"><button class="w-full bg-green-700 text-xs text-gray-100 py-2">Apply Filter</button><button class="w-full bg-slate-700 text-xs text-gray-100 py-2">Add New Group</button></div></div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/FilterBuilder.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const datasheets = ref([]);
    const selected_datasheet = ref();
    ref();
    const options = ref({
      onlyShowNewData: false,
      highlightNewData: true
    });
    const datas = ref([]);
    const datasOld = ref([]);
    const loading = ref(false);
    const sortDS = (d) => d.sort((a, b) => b.localeCompare(a));
    const filtered_datasheets = computed(() => {
      return sortDS(datasheets.value);
    });
    const isNewData = (id) => {
      return !datasOld.value.find((item) => item.id === id);
    };
    const fields = computed(() => {
      return datas.value.length > 0 ? Object.keys(datas.value[0]) : [];
    });
    const groups_filters = ref([]);
    const filtered_data = computed(() => {
      const results = [...datas.value];
      if (options.value.onlyShowNewData) {
        results.splice(0, results.length, ...results.filter((item) => isNewData(item.id)));
      }
      for (const group of groups_filters.value) {
        const { group_operation, filters } = group;
        if (group_operation === "or") {
          const temp = [];
          for (const filter of filters) {
            const { field, operation, value } = filter;
            if (operation === "contains") {
              temp.push(...results.filter((item) => item[field].toLowerCase().includes(value.toLowerCase())));
            }
          }
          results.splice(0, results.length, ...temp);
        } else if (group_operation === "and") {
          for (const filter of filters) {
            const { field, operation, value } = filter;
            if (operation === "contains") {
              results.splice(0, results.length, ...results.filter((item) => item[field].toLowerCase().includes(value.toLowerCase())));
            } else if (operation === "not_contains") {
              results.splice(0, results.length, ...results.filter((item) => !item[field].toLowerCase().includes(value.toLowerCase())));
            } else if (operation === "equal") {
              results.splice(0, results.length, ...results.filter((item) => item[field].toLowerCase() === value.toLowerCase()));
            } else if (operation === "not_equal") {
              results.splice(0, results.length, ...results.filter((item) => item[field].toLowerCase() !== value.toLowerCase()));
            }
          }
        }
      }
      return results;
    });
    const applyFilter = (p) => {
      groups_filters.value.splice(0, groups_filters.value.length);
      p.forEach((group) => {
        groups_filters.value.push({
          group_operation: group.group_operation,
          filters: group.filters.map((filter) => ({
            field: filter.field,
            operation: filter.operation,
            value: filter.value
          }))
        });
      });
    };
    const pagination = ref({
      page: 1,
      per_page: 10
    });
    const displayed_data = computed(() => {
      try {
        const { page, per_page } = pagination.value;
        const start = (page - 1) * per_page;
        const end = start + per_page;
        return filtered_data.value.slice(start, end);
      } catch (error) {
        pagination.value.page = 1;
        pagination.value.per_page = 10;
        return filtered_data.value;
      }
    });
    const pagination_page_count = computed(() => {
      return Math.ceil(filtered_data.value.length / pagination.value.per_page);
    });
    const pagination_current_started_index = computed(() => {
      return (pagination.value.page - 1) * pagination.value.per_page + 1;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_FilterBuilder = _sfc_main$2;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-screen h-screen flex bg-slate-900 text-gray-100" }, _attrs))}><div class="max-w-screen-lg w-full mx-auto py-8 flex flex-col items-center justify-center"><div class="flex-1 py-20 max-h-full w-full flex space-x-4"><div class="flex-1"><div class="text-center mb-2 text-sm"><span class="mr-2 font-bold">${ssrInterpolate(unref(filtered_data).length)}</span><span class="mr-2">filtered data from</span><span class="mr-2 font-bold">${ssrInterpolate(unref(datas).length)}</span><span class="mr-2">data</span></div><div class="mt-2 mb-6 flex"><div class="flex space-x-2 items-center"><div>Per Page Item : </div><div class="flex-1"><select class="w-full"><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="200">200</option><option value="500">500</option><option value="1000">1000</option><option value="2000">2000</option><option value="2000">999999999999999</option></select></div></div></div><table class="border-collapse table-fixed w-full text-sm max-h-full"><thead><tr class="w-full"><th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left" width="5%">#</th><th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left" width="15%"></th><th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left">Nama / Perusahaan</th><th class="border-b-2 border-slate-200/80 font-bold p-4 pt-0 text-slate-400 text-left"></th></tr></thead><tbody>`);
      if (unref(loading)) {
        _push(`<tr><td colspan="4" class="text-center">Loading...</td></tr>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading)) {
        _push(`<!--[-->`);
        ssrRenderList(unref(displayed_data), (item, i) => {
          _push(`<tr><td width="5%" class="${ssrRenderClass([{ "bg-green-600/60": unref(options).highlightNewData && isNewData(item.id) }, "border-b border-slate-200/80 p-4 text-slate-200"])}">${ssrInterpolate(i + unref(pagination_current_started_index))}</td><td width="15%" class="${ssrRenderClass([{ "bg-green-600/60": unref(options).highlightNewData && isNewData(item.id) }, "border-b border-slate-200/80 p-4 text-slate-200"])}"><div class="text-center flex justify-center items-center"><img class="w-10 h-10 rounded-full"${ssrRenderAttr("src", item.logo)} alt="avatar"></div></td><td class="${ssrRenderClass([{ "bg-green-600/60": unref(options).highlightNewData && isNewData(item.id) }, "border-b border-slate-200/80 p-4 text-slate-200"])}"><div class="font-bold">${ssrInterpolate(item.name)}</div><div class="text-xs"><span>${ssrInterpolate(item.activity_name)}</span><span class="font-semibold">(${ssrInterpolate(item.mitra_name)})</span></div></td><td class="${ssrRenderClass([{ "bg-green-600/60": unref(options).highlightNewData && isNewData(item.id) }, "border-b border-slate-200/80 p-4 text-slate-200"])}"><div class="flex space-x-2"><a${ssrRenderAttr("href", `https://kampusmerdeka.kemdikbud.go.id/program/magang/browse/${item.mitra_id}/${item.id}`)} target="_blank" class="text-xs text-blue-400 underline"> Buka di kampusmerdeka </a></div></td></tr>`);
        });
        _push(`<!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</tbody></table><div class="mt-2"><div class="flex justify-between items-center"><div class="flex space-x-2"><button class="${ssrRenderClass([{ "text-gray-200": unref(pagination).page > 1 }, "px-2 py-1 rounded bg-slate-800/50 text-xs text-gray-400"])}"${ssrIncludeBooleanAttr(unref(pagination).page <= 1) ? " disabled" : ""}> Prev </button><button class="${ssrRenderClass([{ "text-gray-200": unref(pagination).page < unref(pagination_page_count) }, "px-2 py-1 rounded bg-slate-800/50 text-xs text-gray-400"])}"${ssrIncludeBooleanAttr(unref(pagination).page >= unref(pagination_page_count)) ? " disabled" : ""}> Next </button></div></div></div></div><div class="w-[260px] flex space-y-4 flex-col"><div class="w-full bg-slate-800 rounded text-sm"><div class="px-4 py-2 border-b-2 border-gray-400/50"> Datasheets </div><div class="px-4 py-2 flex flex-col text-left justify-start items-start"><!--[-->`);
      ssrRenderList(unref(filtered_datasheets), (data) => {
        _push(`<button class="${ssrRenderClass([{
          "text-gray-400": !(unref(selected_datasheet) === data),
          "text-gray-200 font-bold": unref(selected_datasheet) === data
        }, "text-xs"])}"><div>${ssrInterpolate(data)} `);
        if (unref(selected_datasheet) === data) {
          _push(`<span>(Selected)</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></button>`);
      });
      _push(`<!--]--></div><div class="px-4 py-2 border-t border-slate-600"><div><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(options).onlyShowNewData) ? ssrLooseContain(unref(options).onlyShowNewData, null) : unref(options).onlyShowNewData) ? " checked" : ""} class="mr-2"><label>Only Show New Data</label></div><div><input type="checkbox"${ssrIncludeBooleanAttr(Array.isArray(unref(options).highlightNewData) ? ssrLooseContain(unref(options).highlightNewData, null) : unref(options).highlightNewData) ? " checked" : ""} class="mr-2"><label>Highlight New Data</label></div></div></div>`);
      _push(ssrRenderComponent(_component_FilterBuilder, {
        "groups-filters": unref(groups_filters),
        fields: unref(fields),
        onApplyFilter: applyFilter
      }, null, _parent));
      _push(`</div></div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const ErrorComponent = defineAsyncComponent(() => import('./_nuxt/error-component.9945d429.mjs').then((r) => r.default || r));
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    provide("_route", useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        callWithNuxt(nuxtApp, showError, [err]);
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(error)) {
            _push(ssrRenderComponent(unref(ErrorComponent), { error: unref(error) }, null, _parent));
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$1), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/.pnpm/nuxt@3.0.0/node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch.create({
    baseURL: baseURL()
  });
}
let entry;
const plugins = normalizePlugins(_plugins);
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (err) {
      await nuxt.callHook("app:error", err);
      nuxt.payload.error = nuxt.payload.error || err;
    }
    return vueApp;
  };
}
const entry$1 = (ctx) => entry(ctx);

export { __nuxt_component_0 as _, entry$1 as default, useNuxtApp as u };
//# sourceMappingURL=server.mjs.map
