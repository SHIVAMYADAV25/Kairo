use crate::models::TestResult;
use rquickjs::{Context, Runtime};
use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;

/// Runs a pre-request script in an isolated QuickJS context.
///
/// Exposes:
///  - `console.log(...)` for debugging (prints to the Tauri process stdout).
///  - `pm.environment.get(key)` / `pm.environment.set(key, value)` /
///    `pm.environment.has(key)`, backed by `env_vars`. This is the piece that
///    was previously missing: a pre-request script could run but had no way
///    to actually affect the request. Now `pm.environment.set(...)` mutates
///    `env_vars` in place, the caller (`execute_request`) re-substitutes
///    `{{VAR}}` placeholders using the updated map, and persists the change
///    back to the active environment in SQLite — matching how Postman's
///    pre-request scripts behave.
pub fn run_pre_request_script(
    script: &str,
    env_vars: &mut HashMap<String, String>,
) -> anyhow::Result<()> {
    let runtime = Runtime::new()?;
    let context = Context::full(&runtime)?;
    let shared: Rc<RefCell<HashMap<String, String>>> = Rc::new(RefCell::new(env_vars.clone()));

    context.with(|ctx| -> anyhow::Result<()> {
        let console = rquickjs::Object::new(ctx.clone())?;
        console.set(
            "log",
            rquickjs::Function::new(ctx.clone(), |msg: String| {
                println!("[pre-request] {msg}");
            })?,
        )?;
        ctx.globals().set("console", console)?;

        let pm = rquickjs::Object::new(ctx.clone())?;
        let environment = rquickjs::Object::new(ctx.clone())?;

        // pm.environment.get(key) -> string ("" if unset — QuickJS's binding
        // layer round-trips String cleanly; a missing var reading as "" is
        // the same behavior {{VAR}} substitution already has elsewhere).
        let get_map = shared.clone();
        let get_fn = rquickjs::Function::new(ctx.clone(), move |key: String| -> String {
            get_map.borrow().get(&key).cloned().unwrap_or_default()
        })?;
        environment.set("get", get_fn)?;

        let has_map = shared.clone();
        let has_fn = rquickjs::Function::new(ctx.clone(), move |key: String| -> bool {
            has_map.borrow().contains_key(&key)
        })?;
        environment.set("has", has_fn)?;

        let set_map = shared.clone();
        let set_fn = rquickjs::Function::new(ctx.clone(), move |key: String, value: String| {
            set_map.borrow_mut().insert(key, value);
        })?;
        environment.set("set", set_fn)?;

        pm.set("environment", environment)?;
        ctx.globals().set("pm", pm)?;

        ctx.eval::<(), _>(script)?;
        Ok(())
    })?;

    *env_vars = Rc::try_unwrap(shared)
        .map(|cell| cell.into_inner())
        .unwrap_or_else(|rc| rc.borrow().clone());

    Ok(())
}

/// Runs a test script with a minimal `pm.test(name, fn)` / `pm.expect(...)`
/// shim, collecting pass/fail results. Real Postman-compatible `pm.*` is a
/// larger surface (pm.response.json(), pm.environment, etc.) — this gives
/// the core assertion loop now and is designed to grow: add more bound
/// functions to the `pm` object without touching the collection logic.
pub fn run_test_script(script: &str, status: u16, body: &str) -> anyhow::Result<Vec<TestResult>> {
    let runtime = Runtime::new()?;
    let context = Context::full(&runtime)?;
    let results: Rc<RefCell<Vec<TestResult>>> = Rc::new(RefCell::new(Vec::new()));

    context.with(|ctx| -> anyhow::Result<()> {
        let results_clone = results.clone();

        let pm = rquickjs::Object::new(ctx.clone())?;

        // pm.response.status / pm.response.json() equivalents exposed as
        // plain values for simplicity; a fuller build wraps these in a
        // lazily-parsed JS object.
        let response = rquickjs::Object::new(ctx.clone())?;
        response.set("status", status as i32)?;
        response.set("body", body.to_string())?;
        pm.set("response", response)?;

        let test_fn = rquickjs::Function::new(
            ctx.clone(),
            move |name: String, passed: bool, error: String| {
                results_clone.borrow_mut().push(TestResult {
                    name,
                    passed,
                    error: if error.is_empty() { None } else { Some(error) },
                });
            },
        )?;
        pm.set("test", test_fn)?;

        ctx.globals().set("pm", pm)?;

        // Wrap the user's script so `pm.test("name", () => expr)` style
        // callbacks resolve to pass/fail *and* the thrown error's message
        // before crossing back into Rust — previously the message was
        // caught and discarded, so every failure looked identical.
        let wrapped = format!(
            r#"
            (function() {{
                const __origTest = pm.test;
                pm.test = function(name, fn) {{
                    let ok = false;
                    let errMsg = "";
                    try {{ fn(); ok = true; }} catch (e) {{
                        ok = false;
                        errMsg = (e && e.message) ? e.message : String(e);
                    }}
                    __origTest(name, ok, errMsg);
                }};
                pm.expect = function(actual) {{
                    const fail = (msg) => {{ throw new Error(msg); }};
                    return {{
                        to: {{
                            eql: (expected) => {{
                                if (actual !== expected) fail(`expected ${{JSON.stringify(actual)}} to equal ${{JSON.stringify(expected)}}`);
                            }},
                            equal: (expected) => {{
                                if (actual !== expected) fail(`expected ${{JSON.stringify(actual)}} to equal ${{JSON.stringify(expected)}}`);
                            }},
                            include: (needle) => {{
                                if (typeof actual !== "string" || !actual.includes(needle)) fail(`expected ${{JSON.stringify(actual)}} to include ${{JSON.stringify(needle)}}`);
                            }},
                            be: {{
                                above: (n) => {{ if (!(actual > n)) fail(`expected ${{actual}} to be above ${{n}}`); }},
                                below: (n) => {{ if (!(actual < n)) fail(`expected ${{actual}} to be below ${{n}}`); }},
                                ok: () => {{ if (!actual) fail(`expected value to be truthy`); }},
                            }},
                        }},
                    }};
                }};
                // pm.response.json() / .text() — this is the single most
                // common line in real Postman test scripts, and was
                // previously missing entirely (pm.response only exposed the
                // raw .status/.body values), so any imported or hand-written
                // script that called it threw "pm.response.json is not a
                // function" before a single assertion ever ran.
                pm.response.json = function() {{
                    try {{ return JSON.parse(pm.response.body); }}
                    catch (e) {{ throw new Error("Response body is not valid JSON: " + e.message); }}
                }};
                pm.response.text = function() {{ return pm.response.body; }};
            }})();
            {script}
            "#
        );

        ctx.eval::<(), _>(wrapped.as_str())?;
        Ok(())
    })?;

    let out = results.borrow().clone();
    Ok(out)
}