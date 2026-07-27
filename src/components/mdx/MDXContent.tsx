import * as runtime from "react/jsx-runtime";
import { components } from "./registry";

type CompiledMdx = (props: { components: typeof components }) => React.ReactNode;

/**
 * Velite compiles each MDX body to a function body that closes over a JSX
 * runtime passed as its first argument. Evaluating it here, in a Server
 * Component, keeps the MDX runtime and every compiled body out of the browser
 * bundle — only the widgets in the registry cross a client boundary.
 */
function evaluate(code: string): CompiledMdx {
  return new Function(code)({ ...runtime }).default;
}

export function MDXContent({ code }: { code: string }) {
  // Called rather than mounted as <Component />. A component identity minted
  // during render is what react-hooks/static-components exists to catch, and
  // the compiled body is a fresh function on every evaluation. The distinction
  // costs nothing here: the body holds no state and no hooks, so it needs no
  // element of its own — the components it renders still get theirs.
  return evaluate(code)({ components });
}
