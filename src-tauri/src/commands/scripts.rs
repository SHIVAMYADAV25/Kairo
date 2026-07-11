use crate::models::TestResult;
use rquickjs::{Context, Runtime};
use std::cell::RefCell;
use std::rc::Rc;

/// Runs a pre-request script in an isolated QuickJS context. Currently
/// exposes `console.log` for debugging; request mutation (`pm.request.*`)
/// is the natural next extension point once the pre-request script needs to
/// modify headers/body before the request is sent.
pub fn run_pre_request_script(script: &str) -> anyhow::Result<()> {
    let runtime = Runtime::new()?;
    let context = Context::full(&runtime)?;

    context.with(|ctx| -> anyhow::Result<()> {
        let console = rquickjs::Object::new(ctx.clone())?;
        console.set(
            "log",
            rquickjs::Function::new(ctx.clone(), |msg: String| {
                println!("[pre-request] {msg}");
            })?,
        )?;
        ctx.globals().set("console", console)?;
        ctx.eval::<(), _>(script)?;
        Ok(())
    })?;

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

        let test_fn = rquickjs::Function::new(ctx.clone(), move |name: String, passed: bool| {
            results_clone.borrow_mut().push(TestResult {
                name,
                passed,
                error: None,
            });
        })?;
        pm.set("test", test_fn)?;

        ctx.globals().set("pm", pm)?;

        // Wrap the user's script so `pm.test("name", () => expr)` style
        // callbacks resolve to a boolean before crossing back into Rust —
        // full try/catch-per-test error capture is the next iteration.
        let wrapped = format!(
            r#"
            (function() {{
                const __origTest = pm.test;
                pm.test = function(name, fn) {{
                    let ok = false;
                    try {{ fn(); ok = true; }} catch (e) {{ ok = false; }}
                    __origTest(name, ok);
                }};
                pm.expect = function(actual) {{
                    return {{
                        to: {{ eql: (expected) => {{ if (actual !== expected) throw new Error('mismatch'); }} }}
                    }};
                }};
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
