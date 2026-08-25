import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { t as createSsrRpc } from "./createSsrRpc-Dix0zMzD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/products.functions-DumvJucT.js
var getAdminProducts = createServerFn({ method: "GET" }).handler(createSsrRpc("63dca7bdf94d16710d79005fe4d62aa8ece1b7ae5078dca9aa66593a5c5177bc"));
var getPublicProducts = createServerFn({ method: "GET" }).handler(createSsrRpc("06b79c102cdad9360930a00ea009b4fe5cc4fdc50a938ba6f6595222f149b730"));
createServerFn({ method: "GET" }).handler(createSsrRpc("8e28ffefb35b7f29bda8f5128c6f8fb45636d264c3d475770b9bb49c082743e7"));
//#endregion
export { getPublicProducts as n, getAdminProducts as t };
