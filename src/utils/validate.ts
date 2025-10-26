export function parseNumbers(input: string): number[] {
  if (!input) throw new Error("Prazan unos brojeva.");
  const parts = input.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length < 6 || parts.length > 10) {
    throw new Error("Broj odabranih brojeva mora biti između 6 i 10.");
  }
  const nums = parts.map(p => {
    const n = Number(p);
    if (!Number.isInteger(n)) throw new Error("Svi unosi moraju biti cijeli brojevi.");
    if (n < 1 || n > 45) throw new Error("Svi brojevi moraju biti u rasponu 1–45.");
    return n;
  });
  const set = new Set(nums);
  if (set.size !== nums.length) throw new Error("Nisu dopušteni duplikati među brojevima.");
  return Array.from(set).sort((a,b)=>a-b);
}

export function validateIdNumber(idNumber: string) {
  if (!idNumber) throw new Error("Broj osobne iskaznice/putovnice je obavezan.");
  if (idNumber.length > 20) throw new Error("Broj osobne/putovnice ne smije imati više od 20 znakova.");
}
