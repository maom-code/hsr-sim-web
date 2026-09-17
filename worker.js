// hsr-sim の計算を担う Web Worker（モジュール）。tools/build_site.py が書き出す
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

let dispatch = null;
const ready = (async () => {
  const pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/" });
  const res = await fetch("hsr-bundle.zip");
  if (!res.ok) throw new Error("hsr-bundle.zip が取れません (" + res.status + ")");
  pyodide.unpackArchive(await res.arrayBuffer(), "zip", { extractDir: "/home/pyodide/hsr-sim" });
  dispatch = pyodide.runPython(`
import sys
sys.path.insert(0, "/home/pyodide/hsr-sim/src")
from hsr.gui import dispatch_json
dispatch_json
`);
})();

self.onmessage = async (ev) => {
  const { id, name, payload } = ev.data;
  try {
    await ready;
    const out = JSON.parse(dispatch(name, JSON.stringify(payload || {})));
    self.postMessage("error" in out ? { id, error: out.error } : { id, ok: out.ok });
  } catch (e) {
    self.postMessage({ id, fatal: String(e && e.message || e) });
  }
};
