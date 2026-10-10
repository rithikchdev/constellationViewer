import sys
import json
from datetime import datetime, timezone
from skyfield.api import Star, wgs84, load

ts = load.timescale()
eph = load('de421.bsp')
earth = eph['earth']


CONSTELLATIONS = {
    "Orion": {"star": "Betelgeuse", "ra": (5, 55, 10.3), "dec": (7, 24, 25)},
    "Ursa Major": {"star": "Dubhe", "ra": (11, 3, 43.7), "dec": (61, 45, 3)},
    "Cassiopeia": {"star": "Schedar", "ra": (0, 40, 30.4), "dec": (56, 32, 14)},
    "Leo": {"star": "Regulus", "ra": (10, 8, 22.3), "dec": (11, 58, 2)},
    "Scorpius": {"star": "Antares", "ra": (16, 29, 24.4), "dec": (-26, 25, 55)},
    "Cygnus": {"star": "Deneb", "ra": (20, 41, 25.9), "dec": (45, 16, 49)},
    "Lyra": {"star": "Vega", "ra": (18, 36, 56.3), "dec": (38, 47, 1)},
    "Aquila": {"star": "Altair", "ra": (19, 50, 47.0), "dec": (8, 52, 6)},
    "Taurus": {"star": "Aldebaran", "ra": (4, 35, 55.2), "dec": (16, 30, 33)},
    "Canis Major": {"star": "Sirius", "ra": (6, 45, 8.9), "dec": (-16, 42, 58)},
    "Boötes": {"star": "Arcturus", "ra": (14, 15, 39.7), "dec": (19, 10, 56)},
    "Pegasus": {"star": "Markab", "ra": (23, 4, 45.6), "dec": (15, 12, 18)},
    "Crux": {"star": "Acrux", "ra": (12, 26, 35.9), "dec": (-63, 5, 56)}
}

def get_compass_bearing(az_deg):
    bearings = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
                "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = int((az_deg + 11.25) / 22.5) % 16
    return bearings[idx]

def main():
    if len(sys.argv) < 3:
        print(json.dumps([]))
        return

    lat = float(sys.argv[1])
    lon = float(sys.argv[2])

    observer = earth + wgs84.latlon(lat, lon)
    now_utc = datetime.now(timezone.utc)
    t = ts.from_datetime(now_utc)

    visible = []

    for name, data in CONSTELLATIONS.items():
        star = Star(ra_hours=data["ra"], dec_degrees=data["dec"])
        apparent = observer.at(t).observe(star).apparent()
        alt, az, _ = apparent.altaz()

        
        if alt.degrees > 10.0:
            visible.append({
                "name": name,
                "anchorStar": data["star"],
                "altitude": round(alt.degrees, 1),
                "azimuth": round(az.degrees, 1),
                "direction": get_compass_bearing(az.degrees)
            })

    print(json.dumps(visible))

if __name__ == "__main__":
    main()