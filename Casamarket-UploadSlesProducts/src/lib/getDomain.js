export function getDomain(domains, code) {
  return domains.find((d) => d.code === code)?.endPoint;
}