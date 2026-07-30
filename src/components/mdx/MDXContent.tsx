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
  // The contract is narrow and entirely Velite's: the compiled body reads a JSX
  // runtime off `arguments[0]` and returns `{ default: MDXContent }`. Asserting
  // that shape here is what turns a contract change — or a `code` that never
  // made it through the pipeline — into a message naming this file, instead of
  // a bare "Cannot read properties of undefined (reading 'default')" thrown
  // from inside a server render.
  const compiled: unknown = new Function(code)({ ...runtime });
  const component = (compiled as { default?: unknown } | undefined)?.default;

  if (typeof component !== "function") {
    throw new Error(
      "MDXContent: compiled MDX did not return { default: Component }. " +
        "Either this is not Velite's compiled output, or Velite's " +
        "function-body contract changed.",
    );
  }
  return component as CompiledMdx;
}

export function MDXContent({ code }: { code: string }) {
  // Called rather than mounted as <Component />. A component identity minted
  // during render is what react-hooks/static-components exists to catch, and
  // the compiled body is a fresh function on every evaluation. The distinction
  // costs nothing here: the body holds no state and no hooks, so it needs no
  // element of its own — the components it renders still get theirs.
  return evaluate(code)({ components });
}
