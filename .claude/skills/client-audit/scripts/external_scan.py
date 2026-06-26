#!/usr/bin/env python3
"""
External Technical & Security Scanner — Utility script for the client-audit Claude Code Skill.
Performs passive, read-only reconnaissance of a public website: security headers, TLS
configuration, common exposed-path checks, robots.txt hints, and basic CMS fingerprinting.

No exploitation, no auth bypass, no port scanning beyond 80/443 -- every check here is a
plain HEAD/GET request to a publicly routable path, equivalent to what free scanners like
SecurityHeaders.com or SSL Labs already do against any public site.
"""

import sys
import json
import socket
import ssl
import datetime
import urllib.request
import urllib.error
from urllib.parse import urlparse

USER_AGENT = "Mozilla/5.0 (compatible; ClientAuditBot/1.0)"

SENSITIVE_PATHS = [
    "/.git/config",
    "/.env",
    "/.env.local",
    "/wp-config.php.bak",
    "/phpinfo.php",
    "/.well-known/security.txt",
    "/server-status",
    "/.DS_Store",
    "/backup.zip",
    "/.aws/credentials",
]

SECURITY_HEADERS = [
    "Strict-Transport-Security",
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
]

CMS_SIGNATURES = {
    "wp-content": "WordPress",
    "wp-includes": "WordPress",
    "Drupal.settings": "Drupal",
    "cdn.shopify.com": "Shopify",
    "static.wixstatic.com": "Wix",
    "squarespace.com": "Squarespace",
    "webflow.com": "Webflow",
}


def fetch(url, method="GET", timeout=10):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT}, method=method)
    ctx = ssl.create_default_context()
    try:
        resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
        body = resp.read() if method == "GET" else b""
        return resp.status, dict(resp.headers), body
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), b""
    except Exception as e:
        return None, {}, str(e).encode()


def check_tls(hostname, port=443, timeout=10):
    ctx = ssl.create_default_context()
    try:
        with socket.create_connection((hostname, port), timeout=timeout) as sock:
            with ctx.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                protocol = ssock.version()
                not_after = cert.get("notAfter")
                expiry_iso, days_left = None, None
                if not_after:
                    expiry = datetime.datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
                    expiry_iso = expiry.isoformat()
                    days_left = (expiry - datetime.datetime.utcnow()).days
                issuer = dict(x[0] for x in cert.get("issuer", []))
                return {
                    "protocol": protocol,
                    "cert_expiry": expiry_iso,
                    "days_until_expiry": days_left,
                    "issuer": issuer.get("organizationName", issuer.get("commonName", "unknown")),
                }
    except Exception as e:
        return {"error": str(e)}


def check_http_to_https_redirect(domain):
    status, headers, _ = fetch(f"http://{domain}/", method="HEAD")
    location = headers.get("Location", "")
    redirects = bool(status in (301, 302, 307, 308) and location.startswith("https://"))
    return {"status": status, "redirects_to_https": redirects, "location": location}


def check_sensitive_paths(base_url):
    findings = []
    for path in SENSITIVE_PATHS:
        status, _, body = fetch(base_url.rstrip("/") + path, method="GET", timeout=8)
        findings.append({
            "path": path,
            "status": status,
            "exposed": status == 200 and len(body) > 0,
        })
    return findings


def check_cookies(headers):
    set_cookie = headers.get("Set-Cookie", "")
    if not set_cookie:
        return {"present": False}
    return {
        "present": True,
        "has_secure": "Secure" in set_cookie,
        "has_httponly": "HttpOnly" in set_cookie,
        "has_samesite": "SameSite" in set_cookie,
    }


def detect_cms(body_text):
    return list({name for sig, name in CMS_SIGNATURES.items() if sig.lower() in body_text.lower()})


def check_robots(base_url):
    status, _, body = fetch(base_url.rstrip("/") + "/robots.txt", method="GET", timeout=8)
    if status != 200:
        return {"exists": False}
    text = body.decode("utf-8", errors="replace")
    disallowed = [l.split(":", 1)[1].strip() for l in text.splitlines() if l.lower().startswith("disallow:")]
    hints = [d for d in disallowed if any(k in d.lower() for k in ("admin", "backup", "config", ".env", "private"))]
    return {"exists": True, "disallow_count": len(disallowed), "sensitive_hints": hints}


def scan(url):
    if not url.startswith("http"):
        url = "https://" + url
    parsed = urlparse(url)
    domain = parsed.netloc
    base_url = f"{parsed.scheme}://{domain}"

    status, headers, body = fetch(base_url, method="GET")
    if status is None:
        return {"url": url, "status": "error", "message": "Could not reach host"}

    body_text = body.decode("utf-8", errors="replace")
    security_headers = {h: (h in headers) for h in SECURITY_HEADERS}
    sensitive_paths = check_sensitive_paths(base_url)
    exposed = [f for f in sensitive_paths if f["exposed"]]

    return {
        "url": url,
        "status": "success",
        "scanned_at": datetime.datetime.utcnow().isoformat() + "Z",
        "http_status": status,
        "server_header": headers.get("Server", "unknown"),
        "x_powered_by": headers.get("X-Powered-By", ""),
        "security_headers": security_headers,
        "missing_security_headers": [h for h, present in security_headers.items() if not present],
        "cookies": check_cookies(headers),
        "tls": check_tls(domain) if parsed.scheme == "https" else {"error": "site not served over https"},
        "http_to_https_redirect": check_http_to_https_redirect(domain) if parsed.scheme == "https" else {"checked": False},
        "sensitive_paths": sensitive_paths,
        "exposed_path_count": len(exposed),
        "exposed_paths": exposed,
        "robots": check_robots(base_url),
        "cms_detected": detect_cms(body_text),
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "usage": "python3 external_scan.py <url>",
            "example": "python3 external_scan.py https://example.com",
            "description": "Passive external technical/security recon of a public website.",
        }, indent=2))
        return
    print(json.dumps(scan(sys.argv[1]), indent=2, default=str))


if __name__ == "__main__":
    main()
