import { FastifyInstance } from 'fastify';

export async function locationRoutes(fastify: FastifyInstance) {
    // Autocomplete location search - tries Ola Maps first, falls back to Nominatim
    fastify.get('/api/location/autocomplete', async (request, reply) => {
        const { q } = request.query as { q?: string };

        if (!q || q.trim().length < 2) {
            return reply.send([]);
        }

        const query = q.trim();

        // Try Ola Maps Places Autocomplete first
        const olaApiKey = process.env.OLA_MAPS_API_KEY;
        if (olaApiKey) {
            try {
                const olaUrl = new URL('https://api.olamaps.io/places/v1/autocomplete');
                olaUrl.searchParams.set('input', query);
                olaUrl.searchParams.set('api_key', olaApiKey);

                const olaResponse = await fetch(olaUrl.toString(), {
                    headers: {
                        'X-Request-Id': `farmse-${Date.now()}`,
                    }
                });

                if (olaResponse.ok) {
                    const olaData = await olaResponse.json() as any;
                    const predictions = olaData?.predictions || [];

                    if (predictions.length > 0) {
                        const results = predictions.slice(0, 8).map((p: any) => ({
                            label: p.description || p.structured_formatting?.main_text || '',
                            sublabel: p.structured_formatting?.secondary_text || '',
                            latitude: p.geometry?.location?.lat ?? null,
                            longitude: p.geometry?.location?.lng ?? null,
                            placeId: p.place_id || null,
                            provider: 'ola' as const
                        })).filter((r: any) => r.label);

                        // If Ola returned results but without coordinates, try to geocode them
                        const needsGeocode = results.filter((r: any) => r.latitude === null && r.placeId);
                        if (needsGeocode.length > 0) {
                            await Promise.allSettled(
                                needsGeocode.map(async (r: any) => {
                                    try {
                                        const detailUrl = new URL('https://api.olamaps.io/places/v1/details');
                                        detailUrl.searchParams.set('place_id', r.placeId);
                                        detailUrl.searchParams.set('api_key', olaApiKey);
                                        const detailResp = await fetch(detailUrl.toString());
                                        if (detailResp.ok) {
                                            const detail = await detailResp.json() as any;
                                            const loc = detail?.result?.geometry?.location;
                                            if (loc) {
                                                r.latitude = loc.lat;
                                                r.longitude = loc.lng;
                                            }
                                        }
                                    } catch { /* ignore */ }
                                })
                            );
                        }

                        if (results.length > 0) {
                            return reply.send(results);
                        }
                    }
                }
            } catch {
                // Fall through to Nominatim
            }
        }

        // Fallback: Nominatim (OpenStreetMap) geocoding for India
        try {
            const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
            nominatimUrl.searchParams.set('q', query);
            nominatimUrl.searchParams.set('format', 'jsonv2');
            nominatimUrl.searchParams.set('countrycodes', 'in');
            nominatimUrl.searchParams.set('limit', '8');
            nominatimUrl.searchParams.set('addressdetails', '1');

            const nominatimResponse = await fetch(nominatimUrl.toString(), {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'FarmSe/1.0'
                }
            });

            if (!nominatimResponse.ok) {
                return reply.send([]);
            }

            const nominatimResults = await nominatimResponse.json() as any[];

            const results = nominatimResults.map((r: any) => ({
                label: r.display_name?.split(',').slice(0, 3).join(',').trim() || r.display_name || '',
                sublabel: r.display_name || '',
                latitude: Number(r.lat),
                longitude: Number(r.lon),
                placeId: null,
                provider: 'nominatim' as const
            }));

            return reply.send(results);
        } catch {
            return reply.send([]);
        }
    });

    // Reverse geocode coordinates to address
    fastify.get('/api/location/reverse', async (request, reply) => {
        const { lat, lon } = request.query as { lat?: string; lon?: string };

        if (!lat || !lon) {
            return reply.code(400).send({ error: 'lat and lon are required' });
        }

        const latitude = Number(lat);
        const longitude = Number(lon);

        if (isNaN(latitude) || isNaN(longitude)) {
            return reply.code(400).send({ error: 'Invalid coordinates' });
        }

        // Try Ola Maps reverse geocode first
        const olaApiKey = process.env.OLA_MAPS_API_KEY;
        if (olaApiKey) {
            try {
                const olaUrl = new URL('https://api.olamaps.io/places/v1/reverse-geocode');
                olaUrl.searchParams.set('latlng', `${latitude},${longitude}`);
                olaUrl.searchParams.set('api_key', olaApiKey);

                const olaResponse = await fetch(olaUrl.toString());
                if (olaResponse.ok) {
                    const olaData = await olaResponse.json() as any;
                    const results = olaData?.results;
                    if (Array.isArray(results) && results.length > 0) {
                        const best = results[0];
                        return reply.send({
                            label: best.formatted_address || best.name || '',
                            latitude,
                            longitude,
                            provider: 'ola'
                        });
                    }
                }
            } catch {
                // Fall through to Nominatim
            }
        }

        // Fallback: Nominatim reverse geocode
        try {
            const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
            nominatimUrl.searchParams.set('lat', String(latitude));
            nominatimUrl.searchParams.set('lon', String(longitude));
            nominatimUrl.searchParams.set('format', 'jsonv2');

            const response = await fetch(nominatimUrl.toString(), {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'FarmSe/1.0'
                }
            });

            if (!response.ok) {
                return reply.send({ label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude, provider: 'coords' });
            }

            const data = await response.json() as any;
            const address = data?.address;
            const city = address?.city || address?.town || address?.village || address?.state_district;
            const state = address?.state;
            let label = data?.display_name?.split(',').slice(0, 3).join(',').trim() || '';
            if (!label && city && state) label = `${city}, ${state}`;
            if (!label && city) label = city;
            if (!label) label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

            return reply.send({
                label,
                latitude,
                longitude,
                provider: 'nominatim'
            });
        } catch {
            return reply.send({ label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, latitude, longitude, provider: 'coords' });
        }
    });
}
