use crate::models::ApiRequest;
use std::collections::HashMap;

/// Replaces `{{VAR}}` occurrences throughout a request with values from the
/// active environment. Runs entirely in Rust so it's a single pass over a
/// cloned request rather than N round trips to JS.
pub fn substitute_vars_in_request(
    mut request: ApiRequest,
    vars: &HashMap<String, String>,
) -> ApiRequest {
    if vars.is_empty() {
        return request;
    }

    request.url = substitute(&request.url, vars);

    for p in request.params.iter_mut() {
        p.value = substitute(&p.value, vars);
    }
    for h in request.headers.iter_mut() {
        h.value = substitute(&h.value, vars);
    }

    if let Some(json) = request.body.json.as_mut() {
        *json = substitute(json, vars);
    }
    if let Some(raw) = request.body.raw.as_mut() {
        raw.content = substitute(&raw.content, vars);
    }
    if let Some(pairs) = request.body.url_encoded.as_mut() {
        for p in pairs.iter_mut() {
            p.value = substitute(&p.value, vars);
        }
    }

    if let Some(bearer) = request.auth.bearer.as_mut() {
        bearer.token = substitute(&bearer.token, vars);
    }
    if let Some(api_key) = request.auth.api_key.as_mut() {
        api_key.value = substitute(&api_key.value, vars);
    }

    request
}

fn substitute(input: &str, vars: &HashMap<String, String>) -> String {
    if !input.contains("{{") {
        return input.to_string();
    }
    let mut out = input.to_string();
    for (k, v) in vars {
        out = out.replace(&format!("{{{{{}}}}}", k), v);
    }
    out
}
