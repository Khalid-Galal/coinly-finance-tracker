/** Default 2-level category taxonomy (FR-2.1). Seeded on first run. */
export const DEFAULT_TAXONOMY: { parent: string; children: string[] }[] = [
  { parent: "Food", children: ["Groceries", "Dining Out"] },
  { parent: "Transport", children: ["Fuel", "Ride-hailing", "Public Transport"] },
  { parent: "Bills", children: ["Utilities", "Internet & Phone", "Rent"] },
  { parent: "Shopping", children: ["Clothing", "Electronics", "General"] },
  { parent: "Entertainment", children: ["Streaming", "Events", "Hobbies"] },
  { parent: "Health", children: ["Pharmacy", "Medical"] },
  { parent: "Income", children: ["Salary", "Other Income"] },
  { parent: "Transfers", children: ["Internal Transfer", "Savings"] },
  { parent: "Other", children: ["Uncategorized", "Fees"] },
];
