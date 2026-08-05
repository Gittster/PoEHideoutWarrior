// poe.ninja's exchange "details" endpoint expects a hyphenated slug of the
// item's display name as its `id` param (e.g. "Orb of Fusing" ->
// "orb-of-fusing", "Reflecting Mist" -> "reflecting-mist"). The `id`/
// `detailsId` fields on the overview/list endpoints are NOT reliable for
// this - for at least the Currency category they can be a short internal
// code (e.g. "fusing", "regret") that the details endpoint 404s on. Deriving
// the slug straight from the name has matched every known-good example.
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
