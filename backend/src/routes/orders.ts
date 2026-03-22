import { FastifyInstance } from 'fastify';
import { db } from '../db/index';
import { orders, products, users, harvests } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { generateId } from '../utils/auth';
import { sendSms } from '../utils/notifications';

export async function orderRoutes(fastify: FastifyInstance) {
    type RoutePoint = { latitude: number; longitude: number };

    const formatEnumLabel = (value: string) => value.split('_').map(part => part[0]?.toUpperCase() + part.slice(1)).join(' ');

    const geocodeLocation = async (label: string): Promise<RoutePoint | null> => {
        const trimmedLabel = label.trim();
        if (!trimmedLabel) {
            return null;
        }

        try {
            const geocodeUrl = new URL('https://nominatim.openstreetmap.org/search');
            geocodeUrl.searchParams.set('q', trimmedLabel);
            geocodeUrl.searchParams.set('format', 'jsonv2');
            geocodeUrl.searchParams.set('limit', '1');

            const response = await fetch(geocodeUrl.toString(), {
                headers: {
                    Accept: 'application/json',
                    'User-Agent': 'FarmSe/1.0'
                }
            });

            if (!response.ok) {
                return null;
            }

            const results = await response.json() as Array<{ lat: string; lon: string }>;
            const firstResult = results?.[0];

            if (!firstResult) {
                return null;
            }

            const latitude = Number(firstResult.lat);
            const longitude = Number(firstResult.lon);

            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                return null;
            }

            return { latitude, longitude };
        } catch {
            return null;
        }
    };

    const decodePolyline = (encoded: string, precision = 5, swapLatLng = false): RoutePoint[] => {
        const points: RoutePoint[] = [];
        let index = 0;
        let latitude = 0;
        let longitude = 0;
        const factor = Math.pow(10, precision);

        while (index < encoded.length) {
            let shift = 0;
            let result = 0;
            let byte: number;

            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const deltaLatitude = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
            latitude += deltaLatitude;

            shift = 0;
            result = 0;

            do {
                byte = encoded.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            const deltaLongitude = (result & 1) !== 0 ? ~(result >> 1) : (result >> 1);
            longitude += deltaLongitude;

            const decodedLatitude = latitude / factor;
            const decodedLongitude = longitude / factor;

            points.push({
                latitude: swapLatLng ? decodedLongitude : decodedLatitude,
                longitude: swapLatLng ? decodedLatitude : decodedLongitude
            });
        }

        return points;
    };

    const normalizeDecodedPolyline = (
        encoded: string,
        startLatitude: number,
        startLongitude: number,
        endLatitude: number,
        endLongitude: number
    ): RoutePoint[] | null => {
        const variants: RoutePoint[][] = [
            decodePolyline(encoded, 5, false),
            decodePolyline(encoded, 6, false),
            decodePolyline(encoded, 5, true),
            decodePolyline(encoded, 6, true)
        ];

        let bestVariant: RoutePoint[] | null = null;
        let bestScore = Number.POSITIVE_INFINITY;

        for (const variant of variants) {
            if (variant.length < 2) continue;

            const directScore =
                haversineDistanceKm(variant[0].latitude, variant[0].longitude, startLatitude, startLongitude) +
                haversineDistanceKm(variant[variant.length - 1].latitude, variant[variant.length - 1].longitude, endLatitude, endLongitude);

            const reverseScore =
                haversineDistanceKm(variant[0].latitude, variant[0].longitude, endLatitude, endLongitude) +
                haversineDistanceKm(variant[variant.length - 1].latitude, variant[variant.length - 1].longitude, startLatitude, startLongitude);

            const candidate = reverseScore < directScore ? [...variant].reverse() : variant;
            const candidateScore = Math.min(directScore, reverseScore);

            if (candidateScore < bestScore) {
                bestScore = candidateScore;
                bestVariant = candidate;
            }
        }

        // Reject decoded routes whose start/end are too far from true buyer/farm points
        if (!bestVariant || bestScore > 150) {
            return null;
        }

        return bestVariant;
    };

    const haversineDistanceKm = (
        startLatitude: number,
        startLongitude: number,
        endLatitude: number,
        endLongitude: number
    ) => {
        const earthRadiusKm = 6371;
        const toRadians = (value: number) => value * (Math.PI / 180);

        const latitudeDelta = toRadians(endLatitude - startLatitude);
        const longitudeDelta = toRadians(endLongitude - startLongitude);
        const a =
            Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
            Math.cos(toRadians(startLatitude)) *
            Math.cos(toRadians(endLatitude)) *
            Math.sin(longitudeDelta / 2) *
            Math.sin(longitudeDelta / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    };

    const extractRoutePoints = (data: any): RoutePoint[] | null => {
        const firstRoute = data?.routes?.[0] ?? data?.route ?? null;
        const geometryCoordinates = firstRoute?.geometry?.coordinates;

        if (Array.isArray(geometryCoordinates) && geometryCoordinates.length > 1) {
            const points = geometryCoordinates
                .map((coordinate: any) => {
                    if (!Array.isArray(coordinate) || coordinate.length < 2) return null;

                    const longitude = Number(coordinate[0]);
                    const latitude = Number(coordinate[1]);

                    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
                    return { latitude, longitude };
                })
                .filter(Boolean) as RoutePoint[];

            return points.length > 1 ? points : null;
        }

        const routePoints = firstRoute?.points ?? data?.points ?? null;
        if (Array.isArray(routePoints) && routePoints.length > 1) {
            const points = routePoints
                .map((point: any) => {
                    const latitude = Number(point?.latitude ?? point?.lat);
                    const longitude = Number(point?.longitude ?? point?.lng ?? point?.lon);

                    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
                    return { latitude, longitude };
                })
                .filter(Boolean) as RoutePoint[];

            return points.length > 1 ? points : null;
        }

        return null;
    };

    const parseOlaDistanceResponse = (
        data: any,
        startLatitude: number,
        startLongitude: number,
        endLatitude: number,
        endLongitude: number
    ) => {
        const firstMatrixElement = data?.rows?.[0]?.elements?.[0] ?? null;

        if (firstMatrixElement) {
            const matrixDistance = Number(firstMatrixElement?.distance);
            const matrixDuration = Number(firstMatrixElement?.duration);
            const matrixPolyline = firstMatrixElement?.polyline;
            const decodedPoints = typeof matrixPolyline === 'string'
                ? normalizeDecodedPolyline(matrixPolyline, startLatitude, startLongitude, endLatitude, endLongitude)
                : null;

            if (!Number.isNaN(matrixDistance)) {
                return {
                    provider: 'ola' as const,
                    distanceKm: Number((matrixDistance / 1000).toFixed(2)),
                    etaMinutes: !Number.isNaN(matrixDuration)
                        ? Math.max(1, Math.round(matrixDuration / 60))
                        : null,
                    routePoints: decodedPoints && decodedPoints.length > 1 ? decodedPoints : null
                };
            }
        }

        const firstRoute = data?.routes?.[0] ?? data?.route ?? null;

        const distanceMeters =
            data?.distanceInMeters ??
            data?.distance_meters ??
            firstRoute?.distanceInMeters ??
            firstRoute?.distance_meters ??
            firstRoute?.distance ??
            null;

        const durationSeconds =
            data?.durationInSeconds ??
            data?.duration_seconds ??
            firstRoute?.durationInSeconds ??
            firstRoute?.duration_seconds ??
            firstRoute?.duration ??
            null;

        if (typeof distanceMeters !== 'number') {
            return null;
        }

        return {
            provider: 'ola' as const,
            distanceKm: Number((distanceMeters / 1000).toFixed(2)),
            etaMinutes: typeof durationSeconds === 'number'
                ? Math.max(1, Math.round(durationSeconds / 60))
                : null,
            routePoints: extractRoutePoints(data)
        };
    };

    const tryOlaDistance = async (
        startLatitude: number,
        startLongitude: number,
        endLatitude: number,
        endLongitude: number
    ) => {
        const olaApiKey = process.env.OLA_MAPS_API_KEY;
        const olaDistanceUrl = process.env.OLA_MAPS_DISTANCE_URL || 'https://api.olamaps.io/routing/v1/directions';

        if (!olaApiKey) {
            return null;
        }

        try {
            const requestUrl = new URL(olaDistanceUrl);
            requestUrl.searchParams.set('api_key', olaApiKey);

            const commonHeaders = {
                Authorization: `Bearer ${olaApiKey}`,
                'x-api-key': olaApiKey,
                api_key: olaApiKey,
                'Content-Type': 'application/json'
            };

            const payloadVariants = [
                {
                    origin: { latitude: startLatitude, longitude: startLongitude },
                    destination: { latitude: endLatitude, longitude: endLongitude }
                },
                {
                    source: { latitude: startLatitude, longitude: startLongitude },
                    destination: { latitude: endLatitude, longitude: endLongitude }
                },
                {
                    origin: `${startLatitude},${startLongitude}`,
                    destination: `${endLatitude},${endLongitude}`
                }
            ];

            for (const payload of payloadVariants) {
                const response = await fetch(requestUrl.toString(), {
                    method: 'POST',
                    headers: commonHeaders,
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    continue;
                }

                const data = await response.json() as any;
                const parsed = parseOlaDistanceResponse(
                    data,
                    startLatitude,
                    startLongitude,
                    endLatitude,
                    endLongitude
                );
                if (parsed) {
                    return parsed;
                }
            }

            const getVariants: Array<[string, string]> = [
                [`${startLatitude},${startLongitude}`, `${endLatitude},${endLongitude}`],
                [`${startLongitude},${startLatitude}`, `${endLongitude},${endLatitude}`]
            ];

            for (const [origin, destination] of getVariants) {
                const getUrl = new URL(requestUrl.toString());
                getUrl.searchParams.set('origin', origin);
                getUrl.searchParams.set('destination', destination);

                const getResponse = await fetch(getUrl.toString(), {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${olaApiKey}`,
                        'x-api-key': olaApiKey,
                        api_key: olaApiKey
                    }
                });

                if (getResponse.ok) {
                    const getData = await getResponse.json() as any;
                    const parsed = parseOlaDistanceResponse(
                        getData,
                        startLatitude,
                        startLongitude,
                        endLatitude,
                        endLongitude
                    );
                    if (parsed) return parsed;
                }

                const getUrlSourceDestination = new URL(requestUrl.toString());
                getUrlSourceDestination.searchParams.set('source', origin);
                getUrlSourceDestination.searchParams.set('destination', destination);

                const sourceDestinationResponse = await fetch(getUrlSourceDestination.toString(), {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${olaApiKey}`,
                        'x-api-key': olaApiKey,
                        api_key: olaApiKey
                    }
                });

                if (sourceDestinationResponse.ok) {
                    const sourceDestinationData = await sourceDestinationResponse.json() as any;
                    const parsed = parseOlaDistanceResponse(
                        sourceDestinationData,
                        startLatitude,
                        startLongitude,
                        endLatitude,
                        endLongitude
                    );
                    if (parsed) return parsed;
                }

                const getUrlMatrix = new URL(requestUrl.toString());
                getUrlMatrix.searchParams.set('origins', origin);
                getUrlMatrix.searchParams.set('destinations', destination);

                const matrixResponse = await fetch(getUrlMatrix.toString(), {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${olaApiKey}`,
                        'x-api-key': olaApiKey,
                        api_key: olaApiKey
                    }
                });

                if (matrixResponse.ok) {
                    const matrixData = await matrixResponse.json() as any;
                    const parsed = parseOlaDistanceResponse(
                        matrixData,
                        startLatitude,
                        startLongitude,
                        endLatitude,
                        endLongitude
                    );
                    if (parsed) return parsed;
                }
            }

            return null;
        } catch {
            return null;
        }
    };

    const attachProductDetails = async (rawOrders: any[]) => {
        if (rawOrders.length === 0) return [];

        const productIds = [...new Set(rawOrders.map(order => order.productId).filter(Boolean))];
        const harvestIds = [...new Set(rawOrders.map(order => order.harvestId).filter(Boolean))];
        
        // Fetch from products table
        const productRows = productIds.length > 0 ? await db
            .select({
                id: products.id,
                cropName: products.cropName,
                image: products.image,
                location: products.location,
                price: products.price
            })
            .from(products)
            .where(inArray(products.id, productIds)) : [];

        // Fetch from harvests table (for preorders)
        const harvestRows = harvestIds.length > 0 ? await db
            .select({
                id: harvests.id,
                cropName: harvests.cropName,
                image: harvests.image,
                location: harvests.location,
                price: harvests.basePricePerKg
            })
            .from(harvests)
            .where(inArray(harvests.id, harvestIds)) : [];

        const productMap = new Map();
        productRows.forEach(p => productMap.set(p.id, p));
        const harvestMap = new Map();
        harvestRows.forEach(h => harvestMap.set(h.id, h));

        return rawOrders.map(order => {
            const product = order.productId ? productMap.get(order.productId) : null;
            const harvest = order.harvestId ? harvestMap.get(order.harvestId) : null;
            const item = product || harvest;
            
            return {
                ...order,
                cropName: item?.cropName ?? 'Unknown Product',
                productImage: item?.image ?? '',
                productLocation: item?.location ?? '',
                productUnitPrice: item?.price ?? null
            };
        });
    };

    // Distance preview between buyer and farm before placing order
    fastify.get('/api/orders/distance/:productId', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { productId } = request.params as { productId: string };

        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can view distance preview' });
            }

            const [product] = await db
                .select({
                    id: products.id,
                    farmerId: products.farmerId,
                    location: products.location
                })
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            const [farmer] = await db
                .select({
                    id: users.id,
                    name: users.name,
                    location: users.location,
                    latitude: users.latitude,
                    longitude: users.longitude
                })
                .from(users)
                .where(eq(users.id, product.farmerId))
                .limit(1);

            if (!farmer) {
                return reply.code(404).send({ error: 'Farmer not found' });
            }

            const buyerLabel = request.user!.location;
            const buyerCoordinates = await geocodeLocation(buyerLabel);
            const buyerLatitude = buyerCoordinates?.latitude ?? null;
            const buyerLongitude = buyerCoordinates?.longitude ?? null;
            const farmerLatitude = farmer.latitude;
            const farmerLongitude = farmer.longitude;

            if (
                buyerLatitude === null ||
                buyerLongitude === null ||
                farmerLatitude === null ||
                farmerLongitude === null
            ) {
                return reply.code(400).send({
                    error: 'Coordinates missing for buyer or farmer',
                    needsLocationSetup: true
                });
            }

            const olaDistance = await tryOlaDistance(
                buyerLatitude,
                buyerLongitude,
                farmerLatitude,
                farmerLongitude
            );

            const fallbackDistanceKm = haversineDistanceKm(
                buyerLatitude,
                buyerLongitude,
                farmerLatitude,
                farmerLongitude
            );
            const fallbackRoutePoints: RoutePoint[] = [
                { latitude: buyerLatitude, longitude: buyerLongitude },
                { latitude: farmerLatitude, longitude: farmerLongitude }
            ];

            const distanceKm = olaDistance?.distanceKm ?? Number(fallbackDistanceKm.toFixed(2));
            const etaMinutes = olaDistance?.etaMinutes ?? Math.max(5, Math.round(distanceKm * 3));
            const routePoints = olaDistance?.routePoints ?? fallbackRoutePoints;

            return reply.send({
                productId: product.id,
                distanceKm,
                etaMinutes,
                provider: olaDistance?.provider ?? 'haversine',
                routePoints,
                from: {
                    latitude: buyerLatitude,
                    longitude: buyerLongitude,
                    label: buyerLabel
                },
                to: {
                    latitude: farmerLatitude,
                    longitude: farmerLongitude,
                    label: product.location || farmer.location
                }
            });
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Get user's orders
    fastify.get('/api/orders', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        try {
            let rawOrders;

            if (request.user!.role === 'farmer') {
                // Get orders for farmer's products
                rawOrders = await db
                    .select()
                    .from(orders)
                    .where(eq(orders.farmerId, request.user!.id));
            } else {
                // Get buyer's orders
                rawOrders = await db
                    .select()
                    .from(orders)
                    .where(eq(orders.buyerId, request.user!.id));
            }

            const userOrders = await attachProductDetails(rawOrders);

            return reply.send(userOrders);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Create order
    fastify.post('/api/orders', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { productId, quantity, deliveryMethod, paymentMethod, orderType } = request.body as {
            productId: string;
            quantity: number;
            deliveryMethod: 'buyer_pickup' | 'farmer_delivery' | 'local_transport';
            paymentMethod: 'upi' | 'bank_transfer' | 'cash_on_delivery';
            orderType?: string;
        };

        try {
            if (request.user!.role !== 'buyer') {
                return reply.code(403).send({ error: 'Only buyers can create orders' });
            }

            // Get product
            const [product] = await db
                .select()
                .from(products)
                .where(eq(products.id, productId))
                .limit(1);

            if (!product) {
                return reply.code(404).send({ error: 'Product not found' });
            }

            if (product.quantity < quantity) {
                return reply.code(400).send({ error: 'Insufficient quantity' });
            }

            const [farmer] = await db
                .select({
                    id: users.id,
                    name: users.name,
                    phone: users.phone
                })
                .from(users)
                .where(eq(users.id, product.farmerId))
                .limit(1);

            if (!farmer) {
                return reply.code(404).send({ error: 'Farmer not found' });
            }

            // Enforce 10km radius for farmer delivery
            if (deliveryMethod === 'farmer_delivery') {
                const buyerLat = request.user!.latitude;
                const buyerLng = request.user!.longitude;

                const [farmerUser] = await db
                    .select({ latitude: users.latitude, longitude: users.longitude })
                    .from(users)
                    .where(eq(users.id, product.farmerId))
                    .limit(1);

                const farmerLat = farmerUser?.latitude;
                const farmerLng = farmerUser?.longitude;

                if (buyerLat != null && buyerLng != null && farmerLat != null && farmerLng != null) {
                    const distance = haversineDistanceKm(buyerLat, buyerLng, farmerLat, farmerLng);
                    if (distance > 10) {
                        return reply.code(400).send({
                            error: `Farmer delivery is only available within 10 km. You are ${distance.toFixed(1)} km away. Please choose Buyer Pickup instead.`
                        });
                    }
                }
            }

            // Calculate total price
            const totalPrice = product.price * quantity;

            // Generate OTP immediately
            const otpValue = Math.floor(1000 + Math.random() * 9000).toString();

            // Create order
            const orderId = generateId();
            await db.insert(orders).values({
                id: orderId,
                productId,
                farmerId: product.farmerId,
                buyerId: request.user!.id,
                quantity,
                totalPrice,
                deliveryMethod,
                paymentMethod,
                paymentStatus: 'pending',
                orderStatus: 'pending',
                orderType: orderType || 'normal',
                otp: otpValue
            });

            // Update product quantity
            await db
                .update(products)
                .set({ quantity: product.quantity - quantity })
                .where(eq(products.id, productId));

            const [newOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, orderId))
                .limit(1);

            const shortOrderId = orderId.slice(0, 8);
            const buyerMessage = [
                `FarmSe Order Confirmed (#${shortOrderId})`,
                `Product: ${product.cropName}`,
                `Quantity: ${quantity} kg`,
                `Total: ₹${totalPrice.toFixed(2)}`,
                `Delivery: ${formatEnumLabel(deliveryMethod)}`,
                `Payment: ${formatEnumLabel(paymentMethod)}`
            ].join('\n');

            const farmerMessage = [
                `New FarmSe Order (#${shortOrderId})`,
                `Buyer: ${request.user!.name}`,
                `Product: ${product.cropName}`,
                `Quantity: ${quantity} kg`,
                `Total: ₹${totalPrice.toFixed(2)}`,
                `Delivery: ${formatEnumLabel(deliveryMethod)}`,
                `Payment: ${formatEnumLabel(paymentMethod)}`
            ].join('\n');

            void Promise.allSettled([
                sendSms(request.user!.phone, buyerMessage),
                sendSms(farmer.phone, farmerMessage)
            ]).then(results => {
                const failures = results.filter(result => result.status === 'rejected');
                if (failures.length > 0) {
                    fastify.log.warn({ failures, orderId }, 'Order created but one or more SMS notifications failed');
                }
            });

            return reply.send(newOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Accept order (farmer only)
    fastify.put('/api/orders/:id/accept', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can accept orders' });
            }

            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(orders)
                .set({ orderStatus: 'accepted' })
                .where(eq(orders.id, id));

            const [updatedOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            // Notify buyer
            (fastify as any).io.to(order.buyerId).emit('order_status_updated', {
                orderId: id,
                status: 'accepted'
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Pack order (farmer only)
    fastify.put('/api/orders/:id/pack', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        try {
            if (request.user!.role !== 'farmer') return reply.code(403).send({ error: 'Only farmers can pack orders' });
            const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            if (!order) return reply.code(404).send({ error: 'Order not found' });
            if (order.farmerId !== request.user!.id) return reply.code(403).send({ error: 'Not authorized' });
            await db.update(orders).set({ orderStatus: 'packed' }).where(eq(orders.id, id));
            const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

            // Notify buyer
            (fastify as any).io.to(order.buyerId).emit('order_status_updated', {
                orderId: id,
                status: 'packed'
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Ship order / Out for Delivery (farmer only)
    fastify.put('/api/orders/:id/ship', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        try {
            if (request.user!.role !== 'farmer') return reply.code(403).send({ error: 'Only farmers can ship orders' });
            const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            if (!order) return reply.code(404).send({ error: 'Order not found' });
            if (order.farmerId !== request.user!.id) return reply.code(403).send({ error: 'Not authorized' });

            // Use existing OTP or generate if missing for some reason
            const otpCode = order.otp || Math.floor(1000 + Math.random() * 9000).toString();
 
            await db.update(orders).set({
                orderStatus: 'out_for_delivery',
                otp: otpCode
            }).where(eq(orders.id, id));
 
            const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
 
            // Notify buyer
            (fastify as any).io.to(order.buyerId).emit('order_status_updated', {
                orderId: id,
                status: 'out_for_delivery',
                otp: otpCode
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Verify OTP and Deliver (farmer only)
    fastify.put('/api/orders/:id/verify-otp', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        const { otp } = request.body as { otp: string };

        try {
            if (request.user!.role !== 'farmer') return reply.code(403).send({ error: 'Only farmers can verify delivery' });
            const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            if (!order) return reply.code(404).send({ error: 'Order not found' });
            if (order.farmerId !== request.user!.id) return reply.code(403).send({ error: 'Not authorized' });

            if (order.otp !== otp) {
                return reply.code(400).send({ error: 'Invalid OTP' });
            }

            await db.update(orders).set({
                orderStatus: 'delivered',
                paymentStatus: 'pending', // Explicitly keep as pending until buyer finalizes
                deliveryDate: new Date().toISOString()
            }).where(eq(orders.id, id));

            const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

            // Notify buyer
            (fastify as any).io.to(order.buyerId).emit('order_status_updated', {
                orderId: id,
                status: 'delivered'
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Finalize payment (buyer only)
    fastify.put('/api/orders/:id/finalize-payment', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            if (!order) return reply.code(404).send({ error: 'Order not found' });
            
            if (order.buyerId !== request.user!.id && request.user!.role !== 'admin') {
                return reply.code(403).send({ error: 'Only the buyer can finalize payment' });
            }

            if (order.orderStatus !== 'delivered') {
                return reply.code(400).send({ error: 'Order must be delivered before payment finalization' });
            }

            await db.update(orders).set({
                paymentStatus: 'completed',
                orderStatus: 'completed'
            }).where(eq(orders.id, id));

            const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

            // Notify farmer
            (fastify as any).io.to(order.farmerId).emit('order_status_updated', {
                orderId: id,
                status: 'completed',
                paymentStatus: 'completed'
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Cancel order (buyer or farmer depending on status)
    fastify.put('/api/orders/:id/cancel', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };
        try {
            const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
            if (!order) return reply.code(404).send({ error: 'Order not found' });

            // Only allow cancellation if not yet shipped
            if (['out_for_delivery', 'delivered'].includes(order.orderStatus)) {
                return reply.code(400).send({ error: 'Cannot cancel order after it has been shipped or delivered' });
            }

            if (order.buyerId !== request.user!.id && order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db.update(orders).set({ orderStatus: 'cancelled' }).where(eq(orders.id, id));
            const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);

            // Notify parties
            (fastify as any).io.to(order.buyerId).emit('order_status_updated', {
                orderId: id,
                status: 'cancelled'
            });
            (fastify as any).io.to(order.farmerId).emit('order_status_updated', {
                orderId: id,
                status: 'cancelled'
            });

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });

    // Reject order (farmer only)
    fastify.put('/api/orders/:id/reject', {
        preHandler: authenticate
    }, async (request: AuthenticatedRequest, reply) => {
        const { id } = request.params as { id: string };

        try {
            if (request.user!.role !== 'farmer') {
                return reply.code(403).send({ error: 'Only farmers can reject orders' });
            }

            const [order] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            if (!order) {
                return reply.code(404).send({ error: 'Order not found' });
            }

            if (order.farmerId !== request.user!.id) {
                return reply.code(403).send({ error: 'Not authorized' });
            }

            await db
                .update(orders)
                .set({ orderStatus: 'rejected' })
                .where(eq(orders.id, id));

            const [updatedOrder] = await db
                .select()
                .from(orders)
                .where(eq(orders.id, id))
                .limit(1);

            return reply.send(updatedOrder);
        } catch (error: any) {
            return reply.code(500).send({ error: error.message });
        }
    });
}
