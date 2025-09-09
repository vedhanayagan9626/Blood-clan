import math
from typing import List, Tuple

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # \"\"\"
    # Calculate the great circle distance between two points 
    # on the earth (specified in decimal degrees)
    # Returns distance in kilometers
    # \"\"\"
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    return c * r

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # \"\"\"Wrapper for haversine distance calculation\"\"\"
    return haversine(lat1, lon1, lat2, lon2)

def filter_by_distance(user_lat: float, user_lng: float, requests: List, max_km: float = 15) -> List:
    # \"\"\"
    # Filter requests by distance from user location
    # Returns list of requests within max_km radius, sorted by distance
    # \"\"\"
    requests_with_distance = []
    
    for req in requests:
        if req.lat is not None and req.lng is not None:
            distance = calculate_distance(user_lat, user_lng, req.lat, req.lng)
            if distance <= max_km:
                # Add distance to request object (temporary attribute)
                req.distance_km = distance
                requests_with_distance.append(req)
    
    # Sort by distance
    requests_with_distance.sort(key=lambda x: x.distance_km)
    return requests_with_distance

def get_nearest_requests(user_lat: float, user_lng: float, requests: List, max_km: float = 15, limit: int = 10) -> List:
    # \"\"\"
    # Get nearest requests within radius, limited to specified count
    # \"\"\"
    filtered_requests = filter_by_distance(user_lat, user_lng, requests, max_km)
    return filtered_requests[:limit]