export function getDbTarget(domains) {
  const salesDomain = domains?.find((d) => d.code === "SALES_URL")
  if (!salesDomain?.endPoint) return "db1"

  const match = salesDomain.endPoint.match(/\/\/n(\d+)\./)
  if (!match) return "db1"

  return `db${match[1]}`
}