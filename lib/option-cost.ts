export function optionCost(option: any, adults: number, children: number): number {
  const baseAdultPrice = Number(option?.adult_price ?? 0);
  const baseChildPrice = Number(option?.child_price ?? 0);
  const groups = Array.isArray(option?.pricing_groups) ? option.pricing_groups : [];
  if (groups.length) {
    const totalPeople = adults + children;
    const group = groups.find((g: any) => totalPeople >= Number(g?.from) && totalPeople <= Number(g?.to));
    if (group) {
      return Number(group.price ?? baseAdultPrice) * adults + Number(group.child_price ?? baseChildPrice) * children;
    }
  }
  return baseAdultPrice * adults + baseChildPrice * children;
}
