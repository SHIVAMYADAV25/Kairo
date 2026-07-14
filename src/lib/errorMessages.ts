/**
 * Turns a raw error string (usually coming straight from the Rust/reqwest
 * layer, e.g. "error sending request for url (...): error trying to connect:
 * dns error: failed to lookup address information") into something a
 * student learning APIs can actually understand.
 *
 * The raw error is never thrown away — the UI shows it too, just secondary,
 * so more experienced users can still see exactly what happened.
 */
export interface FriendlyError {
  title: string;
  message: string;
  tip?: string;
  icon: "network" | "timeout" | "ssl" | "url" | "refused" | "generic";
}

export function getFriendlyError(raw: string | null | undefined): FriendlyError {
  const err = (raw ?? "").toLowerCase();

  if (!raw) {
    return {
      title: "Something went wrong",
      message: "The request couldn't be completed, but no further details were given.",
      tip: "Try sending the request again. If it keeps happening, double-check the URL and your internet connection.",
      icon: "generic",
    };
  }

  if (err.includes("dns") || err.includes("lookup address") || err.includes("nodename")) {
    return {
      title: "Server not found",
      message: "We couldn't find a server at this address. This usually means the domain name is misspelled or doesn't exist.",
      tip: "Double-check the URL for typos — e.g. \"api.exmaple.com\" instead of \"api.example.com\".",
      icon: "url",
    };
  }

  if (err.includes("connection refused") || err.includes("refused")) {
    return {
      title: "Connection refused",
      message: "The server actively refused the connection. This usually means nothing is running on that address/port, or it's blocking requests.",
      tip: "If this is a local server (like localhost), make sure it's actually running before sending the request.",
      icon: "refused",
    };
  }

  if (err.includes("timed out") || err.includes("timeout")) {
    return {
      title: "Request timed out",
      message: "The server took too long to respond, so the request was cancelled. This can mean the server is slow, overloaded, or unreachable.",
      tip: "Try again in a moment, or increase the timeout in Settings if the server is expected to be slow.",
      icon: "timeout",
    };
  }

  if (err.includes("certificate") || err.includes("ssl") || err.includes("tls")) {
    return {
      title: "Security certificate problem",
      message: "The server's HTTPS certificate couldn't be verified. Browsers and apps block this by default to keep you safe.",
      tip: "This is common with self-signed certificates on local/test servers. If you trust this server, you can disable SSL verification in Settings — but avoid doing this for real websites.",
      icon: "ssl",
    };
  }

  if (err.includes("invalid url") || err.includes("relative url") || err.includes("empty url") || err.includes("builder error")) {
    return {
      title: "That doesn't look like a valid URL",
      message: "The address you entered isn't a URL the app can send a request to.",
      tip: "Make sure it starts with \"http://\" or \"https://\", e.g. https://api.example.com/users",
      icon: "url",
    };
  }

  if (err.includes("connection reset") || err.includes("broken pipe") || err.includes("connection closed")) {
    return {
      title: "Connection was interrupted",
      message: "The connection to the server closed unexpectedly before the response finished.",
      tip: "This can happen with unstable networks or servers that crash mid-request. Try sending it again.",
      icon: "network",
    };
  }

  if (err.includes("too many redirects")) {
    return {
      title: "Too many redirects",
      message: "The server kept redirecting the request back and forth without ever giving a final answer.",
      tip: "This is usually a server misconfiguration (e.g. redirecting to itself). Check the URL, or try turning off \"Follow redirects\" in Settings to see the first redirect response.",
      icon: "generic",
    };
  }

  if (err.includes("failed to lookup") || err.includes("network is unreachable") || err.includes("could not connect")) {
    return {
      title: "No internet connection",
      message: "We couldn't reach any server at all. This is usually a local network problem rather than something wrong with the request.",
      tip: "Check that you're connected to the internet, then try again.",
      icon: "network",
    };
  }

  // Fallback: we don't recognize the exact wording, but still be encouraging
  return {
    title: "Request failed",
    message: "The request couldn't be completed. This is usually caused by an unreachable server, a network issue, or an incorrect URL — not a mistake in your request format.",
    tip: "Check the URL is correct and reachable (try opening it in a browser), then try again.",
    icon: "generic",
  };
}