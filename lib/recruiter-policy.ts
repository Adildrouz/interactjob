export function excludedFromRecruiterOutreach(company: string, email = ""): boolean {
  const value = `${company} ${email}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return value.includes("pumpkin") || value.includes("squaremeter") || value.includes("squaremetre");
}
