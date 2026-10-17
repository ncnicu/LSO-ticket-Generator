export type TicketDetails = {
  holderName: string;
  eventDate: string;
  eventTime: string;
  note: string;
};

export type TicketRecord = TicketDetails & {
  id: string;
  controlNumber: string;
  downloadedAt: string;
  artworkSource: "built-in" | "uploaded";
  artworkName: string;
  resolution: string;
};

const STORAGE_KEY = "lso-ticket-records";

export function loadTicketRecords(): TicketRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((record): record is TicketRecord => {
      return (
        typeof record?.id === "string" &&
        typeof record?.controlNumber === "string" &&
        typeof record?.downloadedAt === "string" &&
        typeof record?.artworkSource === "string" &&
        typeof record?.artworkName === "string" &&
        typeof record?.resolution === "string"
      );
    });
  } catch {
    return [];
  }
}

export function saveTicketRecords(records: TicketRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function persistNewRecord(record: TicketRecord): TicketRecord[] {
  const current = loadTicketRecords();
  const next = [record, ...current].slice(0, 1000);
  saveTicketRecords(next);
  return next;
}

export function clearTicketRecords() {
  window.localStorage.removeItem(STORAGE_KEY);
}