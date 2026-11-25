import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * The server keeps every report / SOS as an official record, so the
 * app cannot truly delete them. "Remove" just hides an item on this
 * phone.
 */
const keyFor = (kind: "reports" | "sos") => `@citylens_hidden_${kind}`;

export async function getHiddenIds(
  kind: "reports" | "sos"
): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(kind));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function hideId(
  kind: "reports" | "sos",
  id: string
): Promise<void> {
  const current = await getHiddenIds(kind);

  if (!current.includes(id)) {
    await AsyncStorage.setItem(
      keyFor(kind),
      JSON.stringify([...current, id])
    );
  }
}
