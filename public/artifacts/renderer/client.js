import { a as reactExports } from './index.CKUzFFwl.js?dpl=dpl_E5BY2KhJfYDekaeCcorUaHYz19JJ';
import { c as clientExports } from './client.0AL6-CJJ.js?dpl=dpl_E5BY2KhJfYDekaeCcorUaHYz19JJ';

const StaticHtml = ({
  value,
  name,
  hydrate = true
}) => {
  if (value == null || value.trim() === "") return null;
  const tagName = hydrate ? "astro-slot" : "astro-static-slot";
  return reactExports.createElement(tagName, {
    name,
    suppressHydrationWarning: true,
    dangerouslySetInnerHTML: { __html: value }
  });
};
var static_html_default = reactExports.memo(StaticHtml, () => true);

function isAlreadyHydrated(element) {
  for (const key in element) {
    if (key.startsWith("__reactContainer")) {
      return key;
    }
  }
}
const reactPropsMap = {
  class: "className",
  for: "htmlFor"
};
let clientIds = 0;
function createReactElementFromDOMElement(element, id, key) {
  if (id === void 0) {
    clientIds += 1;
    id = clientIds;
    key = 0;
  }
  let attrs = {};
  for (const attr of element.attributes) {
    const propName = reactPropsMap[attr.name] || attr.name;
    attrs[propName] = attr.value;
  }
  attrs.key = `${id}-${key}`;
  if (element.firstChild === null) {
    return reactExports.createElement(element.localName, attrs);
  }
  let childKey = 0;
  return reactExports.createElement(
    element.localName,
    attrs,
    Array.from(element.childNodes).map((c) => {
      if (c.nodeType === Node.TEXT_NODE) {
        return c.data;
      } else if (c.nodeType === Node.ELEMENT_NODE) {
        childKey += 1;
        return createReactElementFromDOMElement(c, id, childKey);
      } else {
        return void 0;
      }
    }).filter((a) => !!a)
  );
}
function getChildren(childString, experimentalReactChildren) {
  if (experimentalReactChildren && childString) {
    let children = [];
    let template = document.createElement("template");
    template.innerHTML = childString;
    for (let child of template.content.children) {
      children.push(createReactElementFromDOMElement(child));
    }
    return children;
  } else if (childString) {
    return reactExports.createElement(static_html_default, { value: childString });
  } else {
    return void 0;
  }
}
let rootMap = /* @__PURE__ */ new WeakMap();
const getOrCreateRoot = (element, creator) => {
  let root = rootMap.get(element);
  if (!root) {
    root = creator();
    rootMap.set(element, root);
  }
  return root;
};
var client_default = (element) => (Component, props, { default: children, ...slotted }, { client }) => {
  if (!element.hasAttribute("ssr")) return;
  const actionKey = element.getAttribute("data-action-key");
  const actionName = element.getAttribute("data-action-name");
  const stringifiedActionResult = element.getAttribute("data-action-result");
  const formState = actionKey && actionName && stringifiedActionResult ? [JSON.parse(stringifiedActionResult), actionKey, actionName] : void 0;
  const renderOptions = {
    identifierPrefix: element.getAttribute("prefix"),
    formState
  };
  for (const [key, value] of Object.entries(slotted)) {
    props[key] = reactExports.createElement(static_html_default, { value, name: key });
  }
  const componentEl = reactExports.createElement(
    Component,
    props,
    getChildren(children, element.hasAttribute("data-react-children"))
  );
  const rootKey = isAlreadyHydrated(element);
  if (rootKey) {
    delete element[rootKey];
  }
  if (client === "only") {
    return reactExports.startTransition(() => {
      const root = getOrCreateRoot(element, () => {
        const r = clientExports.createRoot(element);
        element.addEventListener("astro:unmount", () => r.unmount(), { once: true });
        return r;
      });
      root.render(componentEl);
    });
  }
  reactExports.startTransition(() => {
    const root = getOrCreateRoot(element, () => {
      const r = clientExports.hydrateRoot(element, componentEl, renderOptions);
      element.addEventListener("astro:unmount", () => r.unmount(), { once: true });
      return r;
    });
    root.render(componentEl);
  });
};

export { client_default as default };
