// Source of the Web Worker that runs practice cells. A worker has no access to the page,
// so learner code can't read anything else on it, and a stuck run can be terminated.
const PYODIDE_VERSION = "0.27.7";

const PYTHON_RUNNER = `
import base64, io, json, sys, traceback
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt

plt.show = lambda *args, **kwargs: None

def _epigram_run(code):
    buffer = io.StringIO()
    stdout, stderr = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = buffer
    failed = False
    try:
        exec(compile(code, "<practice cell>", "exec"), {"__name__": "__main__"})
    except BaseException:
        failed = True
        lines = traceback.format_exc().splitlines()
        print("\\n".join([lines[0]] + lines[3:]))
    finally:
        sys.stdout, sys.stderr = stdout, stderr
    charts = []
    for number in plt.get_fignums():
        image = io.BytesIO()
        plt.figure(number).savefig(image, format="png", dpi=110, bbox_inches="tight")
        charts.append(base64.b64encode(image.getvalue()).decode())
    plt.close("all")
    return json.dumps({"text": buffer.getvalue(), "charts": charts, "failed": failed})
`;

const WORKER_SOURCE = `
importScripts("https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js");
const ready = (async () => {
  const pyodide = await loadPyodide();
  await pyodide.loadPackage(["numpy", "pandas", "matplotlib"]);
  await pyodide.runPythonAsync(${JSON.stringify(PYTHON_RUNNER)});
  return pyodide;
})();
self.onmessage = async (event) => {
  try {
    const pyodide = await ready;
    pyodide.globals.set("_epigram_code", event.data.code);
    const result = pyodide.runPython("_epigram_run(_epigram_code)");
    self.postMessage({ id: event.data.id, ...JSON.parse(result) });
  } catch (error) {
    self.postMessage({ id: event.data.id, text: String(error), charts: [], failed: true });
  }
};
`;

export interface LabResult {
  text: string;
  charts: string[];
  failed: boolean;
}

let worker: Worker | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" })));
  }
  return worker;
}

export function resetLabWorker() {
  worker?.terminate();
  worker = null;
}

export function runLabCode(code: string): Promise<LabResult> {
  const id = crypto.randomUUID();
  const target = getWorker();
  return new Promise((resolve, reject) => {
    const onMessage = (event: MessageEvent) => {
      if (event.data.id !== id) return;
      target.removeEventListener("message", onMessage);
      target.removeEventListener("error", onError);
      resolve({ text: event.data.text, charts: event.data.charts, failed: event.data.failed });
    };
    const onError = () => {
      target.removeEventListener("message", onMessage);
      target.removeEventListener("error", onError);
      resetLabWorker();
      reject(new Error("The Python environment couldn't load."));
    };
    target.addEventListener("message", onMessage);
    target.addEventListener("error", onError);
    target.postMessage({ id, code });
  });
}
