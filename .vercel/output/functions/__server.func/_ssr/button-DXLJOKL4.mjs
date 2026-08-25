import { i as __toESM } from "../_runtime.mjs";
import { P as require_jsx_runtime, j as Slot } from "../_libs/@radix-ui/react-alert-dialog+[...].mjs";
import { i as require_react } from "../_libs/dnd-kit__accessibility+react.mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/button-DXLJOKL4.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95",
			destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:scale-105 active:scale-95",
			outline: "border-2 border-primary text-primary bg-background shadow-sm hover:bg-primary/5 hover:border-primary/80 hover:scale-105 active:scale-95",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:scale-105 active:scale-95",
			ghost: "hover:bg-accent/10 hover:text-accent hover:scale-105 active:scale-95 text-foreground",
			link: "text-primary underline-offset-4 hover:underline",
			gradient: "bg-gradient-brand text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
			"gradient-sun": "bg-gradient-sun text-sun-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
			"gradient-accent": "bg-gradient-to-r from-primary via-teal to-accent text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95",
			"gradient-warm": "bg-gradient-to-r from-tangerine to-sun text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
		},
		size: {
			default: "h-10 px-6 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-12 rounded-lg px-8 text-base",
			icon: "h-10 w-10"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
//#endregion
export { buttonVariants as n, Button as t };
