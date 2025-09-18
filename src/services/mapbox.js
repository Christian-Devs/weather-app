import axios from "axios";
import { getApiKeys } from "../database.js";

// Geocode entered address using Mapbox API
export async function geoAddress(address) {
    const mapboxKey = await getApiKeys("MAPBOX_TOKEN");
    if (!mapboxKey) throw new Error("Missing MAPBOX_TOKEN");

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;

    const { data } = await axios.get(url, {
        params: { access_token: mapboxKey, limit: 1 },
        timeout: 10000,
    });

    if (!data || !Array.isArray(data.features)) {
        throw new Error(data?.message || "Invalid Mapbox response");
    }
    if (data.features.length === 0) {
        throw new Error("No location found");
    }

    const [lon, lat] = data.features[0].center;
    return { lat, lon, place_name: data.features[0].place_name };
}
