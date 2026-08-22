/**
 * Makes Unity's case-data request carry the student's OWN selected case.
 *
 * THE PROBLEM
 * -----------
 * The Unity WebGL build fetches tooth data from a URL that is compiled into
 * the binary, with no case identifiers in it:
 *
 *     https://.../api/caseTeeth/get
 *
 * Because the request carried no case information, the backend used to resolve
 * "which case?" by reading a SINGLE GLOBAL Firestore document
 * (3dModel/caseDetails) that every student overwrote on case selection. With
 * two students active at once, the second student's selection silently
 * replaced the first's, and the first student's 3D model rendered the wrong
 * patient's teeth. No error, just wrong clinical data.
 *
 * THE FIX
 * -------
 * Unity's WebGL networking runs through the browser's XMLHttpRequest/fetch,
 * so we can append the identifiers here, in the page, before the request
 * leaves. The backend then reads them from the query string and never touches
 * shared state.
 *
 * This keeps per-student isolation without rebuilding the Unity project
 * (which we don't have). If the Unity project is ever rebuilt, the right fix
 * is to put these parameters in the URL Unity requests directly, and this
 * interceptor can be deleted.
 *
 * The active case is read from localStorage (written by CaseCard on
 * selection) rather than React context, because the interceptor is installed
 * outside the React tree and must work synchronously. localStorage also
 * survives a page refresh, which React context does not.
 */

export const ACTIVE_CASE_KEY = "activeCase";

// Matches the endpoint regardless of host, so it keeps working if the backend
// URL changes or the Unity binary is re-patched to a different origin.
const CASE_TEETH_PATH = "/caseTeeth/get";

/** Persist the student's selected case for the interceptor to pick up. */
export function setActiveCase({ caseId, mainTypeName, complaintTypeName }) {
  try {
    localStorage.setItem(
      ACTIVE_CASE_KEY,
      JSON.stringify({ caseId, mainTypeName, complaintTypeName })
    );
  } catch (e) {
    console.warn("[caseInterceptor] could not persist active case:", e);
  }
}

function getActiveCase() {
  try {
    const raw = localStorage.getItem(ACTIVE_CASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.caseId) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Append the active case identifiers to a caseTeeth/get URL.
 * Returns the URL unchanged if it isn't that endpoint, or if no case is set.
 */
function withCaseParams(url) {
  try {
    if (typeof url !== "string" || url.indexOf(CASE_TEETH_PATH) === -1) {
      return url;
    }

    const active = getActiveCase();
    if (!active) {
      console.warn(
        "[caseInterceptor] Unity requested case teeth but no active case " +
          "is stored; backend will fall back to its global pointer."
      );
      return url;
    }

    // Resolve against the page origin so relative URLs parse too.
    const parsed = new URL(url, window.location.origin);

    // Don't clobber params that are somehow already present.
    if (!parsed.searchParams.has("caseId")) {
      parsed.searchParams.set("caseId", active.caseId);
      parsed.searchParams.set("mainTypeName", active.mainTypeName);
      parsed.searchParams.set("complaintTypeName", active.complaintTypeName);
    }

    const rewritten = parsed.toString();
    console.log("[caseInterceptor] rewrote Unity request ->", rewritten);
    return rewritten;
  } catch (e) {
    // Never let this break the request; fall back to the original URL.
    console.warn("[caseInterceptor] rewrite failed, passing through:", e);
    return url;
  }
}

let installed = false;

/** Install the XHR and fetch interceptors. Safe to call more than once. */
export function installUnityCaseRequestInterceptor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Unity WebGL (Emscripten) issues UnityWebRequest calls via XMLHttpRequest.
  const NativeXHROpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    return NativeXHROpen.call(this, method, withCaseParams(url), ...rest);
  };

  // Patch fetch too, in case a future Unity/Emscripten version uses it.
  if (typeof window.fetch === "function") {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      try {
        if (typeof input === "string") {
          return nativeFetch(withCaseParams(input), init);
        }
        if (input && typeof input.url === "string") {
          const rewritten = withCaseParams(input.url);
          if (rewritten !== input.url) {
            return nativeFetch(new Request(rewritten, input), init);
          }
        }
      } catch (e) {
        console.warn("[caseInterceptor] fetch patch failed:", e);
      }
      return nativeFetch(input, init);
    };
  }

  console.log("[caseInterceptor] installed");
}
