/**
 * Shared Jellyfin API proxy — used by JellyfinCard and JellyfinNowPlaying.
 */

export async function fetchJellyfin(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `/api/jellyfin/${cleanEndpoint}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
}
