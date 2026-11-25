import * as Location from "expo-location";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function requestLocationPermission(): Promise<boolean> {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  return status === "granted";
}

export async function getCurrentLocation(): Promise<Coordinates> {
  const hasPermission =
    await requestLocationPermission();

  if (!hasPermission) {
    throw new Error(
      "Location permission is required."
    );
  }

  const location =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}