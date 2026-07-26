"""Minimal Apify REST API client (stdlib-only) for running Actors synchronously."""
import json
import urllib.error
import urllib.request
from typing import Any, Dict, List

APIFY_API_BASE = "https://api.apify.com/v2"


class ApifyError(RuntimeError):
    pass


def run_actor(
    actor_id: str,
    run_input: Dict[str, Any],
    token: str,
    timeout: int = 300,
) -> List[Dict[str, Any]]:
    """
    Run an Apify Actor synchronously and return its dataset items.

    actor_id: "username/actor-name" (or the actor's numeric ID) as shown on
        the Actor's page in the Apify Console.
    run_input: the Actor's JSON input. Field names are actor-specific — check
        the "Input" tab on the Actor's Apify Console page for the exact
        schema it expects.
    token: an Apify API token (console.apify.com/settings/integrations).
    """
    normalized_id = actor_id.replace("/", "~")
    url = f"{APIFY_API_BASE}/acts/{normalized_id}/run-sync-get-dataset-items?token={token}"

    data = json.dumps(run_input).encode("utf-8")
    request = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", errors="replace")
        raise ApifyError(
            f"Apify actor '{actor_id}' run failed ({err.code}): {body}"
        ) from err
    except urllib.error.URLError as err:
        raise ApifyError(f"Could not reach Apify for actor '{actor_id}': {err.reason}") from err
