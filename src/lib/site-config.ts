// Replace the bracketed values with the official names before the first demo.
export const SITE = {
  lguName: "Provincial Government of Sorsogon",
  officeName: "Provincial Bids and Awards Committee",
  officeShortName: "PBAC",
  systemName: "Procurement Monitoring System",
  letterhead: {
    lines: ["Republic of the Philippines", "Province of Sorsogon"],
    // Path of the official seal in /public, e.g. "/seal.png", once approved.
    sealSrc: null as string | null,
  },
} as const;
