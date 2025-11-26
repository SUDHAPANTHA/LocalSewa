export const KATHMANDU_AREAS = [
  {
    name: "Tinkune",
    slug: "tinkune",
    district: "Kathmandu",
    coordinates: { lat: 27.6889, lng: 85.3495 },
    tags: ["transport", "gateway"],
    adjacency: [
      { to: "koteshwor", distanceKm: 1.3 },
      { to: "baneshwor", distanceKm: 1.6 },
      { to: "sinamangal", distanceKm: 2.1 },
    ],
  },
  {
    name: "Koteshwor",
    slug: "koteshwor",
    district: "Kathmandu",
    coordinates: { lat: 27.6754, lng: 85.3494 },
    tags: ["residential", "commercial"],
    adjacency: [
      { to: "tinkune", distanceKm: 1.3 },
      { to: "balkumari", distanceKm: 1.7 },
      { to: "baneshwor", distanceKm: 2.4 },
    ],
  },
  {
    name: "New Baneshwor",
    slug: "baneshwor",
    district: "Kathmandu",
    coordinates: { lat: 27.6924, lng: 85.3376 },
    tags: ["business", "residential"],
    adjacency: [
      { to: "tinkune", distanceKm: 1.6 },
      { to: "putalisadak", distanceKm: 2.2 },
      { to: "maitighar", distanceKm: 1.3 },
      { to: "jawalakhel", distanceKm: 3.4 },
    ],
  },
  {
    name: "Maitighar",
    slug: "maitighar",
    district: "Kathmandu",
    coordinates: { lat: 27.6893, lng: 85.3244 },
    tags: ["government"],
    adjacency: [
      { to: "baneshwor", distanceKm: 1.3 },
      { to: "putalisadak", distanceKm: 1.2 },
      { to: "tripureshwor", distanceKm: 1.1 },
    ],
  },
  {
    name: "Putalisadak",
    slug: "putalisadak",
    district: "Kathmandu",
    coordinates: { lat: 27.7056, lng: 85.3206 },
    tags: ["education", "business"],
    adjacency: [
      { to: "maitighar", distanceKm: 1.2 },
      { to: "thamel", distanceKm: 1.8 },
      { to: "tripureshwor", distanceKm: 1.5 },
      { to: "durbarmarg", distanceKm: 1.1 },
    ],
  },
  {
    name: "Durbar Marg",
    slug: "durbarmarg",
    district: "Kathmandu",
    coordinates: { lat: 27.7121, lng: 85.3152 },
    tags: ["premium", "tourism"],
    adjacency: [
      { to: "putalisadak", distanceKm: 1.1 },
      { to: "thamel", distanceKm: 0.9 },
      { to: "lazimpat", distanceKm: 1.2 },
    ],
  },
  {
    name: "Thamel",
    slug: "thamel",
    district: "Kathmandu",
    coordinates: { lat: 27.7154, lng: 85.3123 },
    tags: ["tourism", "hospitality"],
    adjacency: [
      { to: "durbarmarg", distanceKm: 0.9 },
      { to: "putalisadak", distanceKm: 1.8 },
      { to: "lazimpat", distanceKm: 1.4 },
      { to: "swayambhu", distanceKm: 2.2 },
    ],
  },
  {
    name: "Lazimpat",
    slug: "lazimpat",
    district: "Kathmandu",
    coordinates: { lat: 27.7206, lng: 85.3212 },
    tags: ["embassy", "residential"],
    adjacency: [
      { to: "thamel", distanceKm: 1.4 },
      { to: "durbarmarg", distanceKm: 1.2 },
      { to: "maharajgunj", distanceKm: 2.3 },
    ],
  },
  {
    name: "Maharajgunj",
    slug: "maharajgunj",
    district: "Kathmandu",
    coordinates: { lat: 27.7402, lng: 85.3308 },
    tags: ["medical", "residential"],
    adjacency: [
      { to: "lazimpat", distanceKm: 2.3 },
      { to: "baluwatar", distanceKm: 1.1 },
      { to: "basundhara", distanceKm: 1.9 },
    ],
  },
  {
    name: "Baluwatar",
    slug: "baluwatar",
    district: "Kathmandu",
    coordinates: { lat: 27.7281, lng: 85.3323 },
    tags: ["government"],
    adjacency: [
      { to: "maharajgunj", distanceKm: 1.1 },
      { to: "baneshwor", distanceKm: 3.8 },
      { to: "lazimpat", distanceKm: 1.5 },
    ],
  },
  {
    name: "Jawalakhel",
    slug: "jawalakhel",
    district: "Lalitpur",
    coordinates: { lat: 27.6731, lng: 85.3156 },
    tags: ["residential", "lifestyle"],
    adjacency: [
      { to: "lalitpur", distanceKm: 1.4 },
      { to: "sanepa", distanceKm: 1.2 },
      { to: "baneshwor", distanceKm: 3.4 },
    ],
  },
  {
    name: "Patan Durbar Square",
    slug: "lalitpur",
    district: "Lalitpur",
    coordinates: { lat: 27.6722, lng: 85.3250 },
    tags: ["heritage", "tourism"],
    adjacency: [
      { to: "jawalakhel", distanceKm: 1.4 },
      { to: "kupondole", distanceKm: 1.6 },
      { to: "sanepa", distanceKm: 1.1 },
    ],
  },
  {
    name: "Sanepa",
    slug: "sanepa",
    district: "Lalitpur",
    coordinates: { lat: 27.6835, lng: 85.3075 },
    tags: ["residential", "cafes"],
    adjacency: [
      { to: "jawalakhel", distanceKm: 1.2 },
      { to: "lalitpur", distanceKm: 1.1 },
      { to: "kupondole", distanceKm: 1.4 },
      { to: "tripureshwor", distanceKm: 2.2 },
    ],
  },
  {
    name: "Kupondole",
    slug: "kupondole",
    district: "Lalitpur",
    coordinates: { lat: 27.6869, lng: 85.3177 },
    tags: ["business", "restaurants"],
    adjacency: [
      { to: "sanepa", distanceKm: 1.4 },
      { to: "tripureshwor", distanceKm: 1.3 },
      { to: "lalitpur", distanceKm: 1.6 },
    ],
  },
  {
    name: "Tripureshwor",
    slug: "tripureshwor",
    district: "Kathmandu",
    coordinates: { lat: 27.6938, lng: 85.3119 },
    tags: ["stadium", "commercial"],
    adjacency: [
      { to: "maitighar", distanceKm: 1.1 },
      { to: "putalisadak", distanceKm: 1.5 },
      { to: "sanepa", distanceKm: 2.2 },
      { to: "kalimati", distanceKm: 1.4 },
    ],
  },
  {
    name: "Kalimati",
    slug: "kalimati",
    district: "Kathmandu",
    coordinates: { lat: 27.6934, lng: 85.3008 },
    tags: ["market"],
    adjacency: [
      { to: "tripureshwor", distanceKm: 1.4 },
      { to: "kalanki", distanceKm: 2.6 },
      { to: "swayambhu", distanceKm: 1.8 },
    ],
  },
  {
    name: "Kalanki",
    slug: "kalanki",
    district: "Kathmandu",
    coordinates: { lat: 27.6931, lng: 85.2774 },
    tags: ["gateway", "transport"],
    adjacency: [
      { to: "kalimati", distanceKm: 2.6 },
      { to: "swayambhu", distanceKm: 2.3 },
      { to: "sitapaila", distanceKm: 1.9 },
    ],
  },
  {
    name: "Swayambhu",
    slug: "swayambhu",
    district: "Kathmandu",
    coordinates: { lat: 27.7148, lng: 85.2904 },
    tags: ["heritage"],
    adjacency: [
      { to: "kalanki", distanceKm: 2.3 },
      { to: "kalimati", distanceKm: 1.8 },
      { to: "thamel", distanceKm: 2.2 },
      { to: "sitapaila", distanceKm: 1.7 },
    ],
  },
  {
    name: "Sitapaila",
    slug: "sitapaila",
    district: "Kathmandu",
    coordinates: { lat: 27.7164, lng: 85.2781 },
    tags: ["residential"],
    adjacency: [
      { to: "swayambhu", distanceKm: 1.7 },
      { to: "kalanki", distanceKm: 1.9 },
      { to: "balaju", distanceKm: 2.4 },
    ],
  },
  {
    name: "Balaju",
    slug: "balaju",
    district: "Kathmandu",
    coordinates: { lat: 27.7322, lng: 85.3001 },
    tags: ["industrial", "residential"],
    adjacency: [
      { to: "sitapaila", distanceKm: 2.4 },
      { to: "swayambhu", distanceKm: 2.5 },
      { to: "thamel", distanceKm: 2.8 },
      { to: "basundhara", distanceKm: 3.1 },
    ],
  },
  {
    name: "Basundhara",
    slug: "basundhara",
    district: "Kathmandu",
    coordinates: { lat: 27.7448, lng: 85.3255 },
    tags: ["residential"],
    adjacency: [
      { to: "balaju", distanceKm: 3.1 },
      { to: "maharajgunj", distanceKm: 1.9 },
      { to: "tokha", distanceKm: 2.6 },
    ],
  },
  {
    name: "Tokha",
    slug: "tokha",
    district: "Kathmandu",
    coordinates: { lat: 27.7573, lng: 85.3349 },
    tags: ["residential", "growing"],
    adjacency: [
      { to: "basundhara", distanceKm: 2.6 },
      { to: "maharajgunj", distanceKm: 3.1 },
    ],
  },
  {
    name: "Sinamangal",
    slug: "sinamangal",
    district: "Kathmandu",
    coordinates: { lat: 27.6972, lng: 85.355 },
    tags: ["airport"],
    adjacency: [
      { to: "tinkune", distanceKm: 2.1 },
      { to: "baneshwor", distanceKm: 2.4 },
      { to: "gaushala", distanceKm: 1.5 },
    ],
  },
  {
    name: "Gaushala",
    slug: "gaushala",
    district: "Kathmandu",
    coordinates: { lat: 27.7108, lng: 85.3473 },
    tags: ["temple", "commercial"],
    adjacency: [
      { to: "sinamangal", distanceKm: 1.5 },
      { to: "baneshwor", distanceKm: 2.3 },
      { to: "chabahil", distanceKm: 1.4 },
    ],
  },
  {
    name: "Chabahil",
    slug: "chabahil",
    district: "Kathmandu",
    coordinates: { lat: 27.7208, lng: 85.3467 },
    tags: ["market"],
    adjacency: [
      { to: "gaushala", distanceKm: 1.4 },
      { to: "baluwatar", distanceKm: 2.6 },
      { to: "maharajgunj", distanceKm: 2.7 },
    ],
  },
  {
    name: "Boudha",
    slug: "boudha",
    district: "Kathmandu",
    coordinates: { lat: 27.7215, lng: 85.3616 },
    tags: ["heritage"],
    adjacency: [
      { to: "chabahil", distanceKm: 1.6 },
      { to: "jorpati", distanceKm: 1.8 },
    ],
  },
  {
    name: "Jorpati",
    slug: "jorpati",
    district: "Kathmandu",
    coordinates: { lat: 27.7286, lng: 85.3669 },
    tags: ["residential"],
    adjacency: [
      { to: "boudha", distanceKm: 1.8 },
      { to: "sundarijal", distanceKm: 4.3 },
    ],
  },
  {
    name: "Sundarijal",
    slug: "sundarijal",
    district: "Kathmandu",
    coordinates: { lat: 27.791, lng: 85.426 },
    tags: ["nature", "trails"],
    adjacency: [{ to: "jorpati", distanceKm: 4.3 }],
  },
  {
    name: "Balkumari",
    slug: "balkumari",
    district: "Lalitpur",
    coordinates: { lat: 27.6675, lng: 85.3423 },
    tags: ["education"],
    adjacency: [
      { to: "koteshwor", distanceKm: 1.7 },
      { to: "satdobato", distanceKm: 1.3 },
      { to: "jawalakhel", distanceKm: 3.1 },
    ],
  },
  {
    name: "Satdobato",
    slug: "satdobato",
    district: "Lalitpur",
    coordinates: { lat: 27.6466, lng: 85.3304 },
    tags: ["residential", "stadium"],
    adjacency: [
      { to: "balkumari", distanceKm: 1.3 },
      { to: "jawalakhel", distanceKm: 3.4 },
      { to: "imadol", distanceKm: 2.1 },
    ],
  },
  {
    name: "Imadol",
    slug: "imadol",
    district: "Lalitpur",
    coordinates: { lat: 27.6513, lng: 85.3441 },
    tags: ["residential"],
    adjacency: [
      { to: "satdobato", distanceKm: 2.1 },
      { to: "balkumari", distanceKm: 1.6 },
      { to: "koteshwor", distanceKm: 2.3 },
    ],
  },
];

const graphCache = {
  adjacency: null,
  lookup: null,
};

function buildGraph() {
  if (graphCache.adjacency && graphCache.lookup) {
    return graphCache;
  }
  const adjacency = new Map();
  const lookup = new Map();

  KATHMANDU_AREAS.forEach((area) => {
    const slug = area.slug;
    lookup.set(slug, area);
    lookup.set(area.name.toLowerCase(), area);
    adjacency.set(slug, new Map());
  });

  KATHMANDU_AREAS.forEach((area) => {
    const fromNode = adjacency.get(area.slug);
    area.adjacency.forEach(({ to, distanceKm }) => {
      if (!adjacency.has(to)) return;
      fromNode.set(to, distanceKm);
      // ensure bidirectional edge
      const reverseNode = adjacency.get(to);
      if (reverseNode && !reverseNode.has(area.slug)) {
        reverseNode.set(area.slug, distanceKm);
      }
    });
  });

  graphCache.adjacency = adjacency;
  graphCache.lookup = lookup;
  return graphCache;
}

export function listKathmanduAreas() {
  return KATHMANDU_AREAS.map((area) => ({
    slug: area.slug,
    name: area.name,
    district: area.district,
    coordinates: area.coordinates,
    tags: area.tags,
    neighbors: area.adjacency.map((edge) => edge.to),
  }));
}

export function findAreaByIdentifier(identifier) {
  if (!identifier) return null;
  const key = identifier.toString().toLowerCase();
  const { lookup } = buildGraph();
  return lookup.get(key) || lookup.get(key.replace(/\s+/g, ""));
}

export function dijkstraShortestRoute(sourceSlug, targetSlug) {
  const { adjacency, lookup } = buildGraph();
  const normalizedSource = findAreaByIdentifier(sourceSlug)?.slug;
  const normalizedTarget = findAreaByIdentifier(targetSlug)?.slug;
  if (!normalizedSource || !normalizedTarget) {
    return null;
  }
  if (normalizedSource === normalizedTarget) {
    return {
      distanceKm: 0,
      path: [lookup.get(normalizedSource)],
    };
  }

  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  adjacency.forEach((_value, key) => {
    distances.set(key, Infinity);
    previous.set(key, null);
  });
  distances.set(normalizedSource, 0);

  const queue = new Set(adjacency.keys());

  while (queue.size > 0) {
    const current = [...queue].reduce((closest, node) => {
      if (closest === null) return node;
      return distances.get(node) < distances.get(closest) ? node : closest;
    }, null);

    if (current === null) break;
    queue.delete(current);

    if (current === normalizedTarget) break;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current);
    neighbors.forEach((edgeWeight, neighbor) => {
      if (!queue.has(neighbor)) return;
      const alt = distances.get(current) + edgeWeight;
      if (alt < distances.get(neighbor)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
      }
    });
  }

  if (!previous.get(normalizedTarget) && normalizedSource !== normalizedTarget) {
    return null;
  }

  const path = [];
  let node = normalizedTarget;
  while (node) {
    path.unshift(lookup.get(node));
    node = previous.get(node);
  }

  return {
    distanceKm: Number(distances.get(normalizedTarget).toFixed(2)),
    path,
  };
}

export function getNearbyAreas(slugOrName, radiusKm = 3) {
  const origin = findAreaByIdentifier(slugOrName);
  if (!origin) return [];
  const { lookup } = buildGraph();
  const matches = [];
  lookup.forEach((area, key) => {
    if (!area || area.slug === origin.slug) return;
    if (key !== area.slug) return; // skip alias entries
    const distance = haversine(
      origin.coordinates.lat,
      origin.coordinates.lng,
      area.coordinates.lat,
      area.coordinates.lng
    );
    if (distance <= radiusKm) {
      matches.push({ ...area, distanceKm: Number(distance.toFixed(2)) });
    }
  });
  return matches.sort((a, b) => a.distanceKm - b.distanceKm);
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

