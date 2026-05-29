export interface City {
  slug: string;
  name: string;
  region: string;
  vol: number;
  nearby?: string[];
}

export const cities: City[] = [
  { slug: 'casablanca',  name: 'Casablanca',  region: 'Grand Casablanca-Settat',          vol: 50000, nearby: ['mohammedia','el-jadida','rabat'] },
  { slug: 'rabat',       name: 'Rabat',        region: 'Rabat-Salé-Kénitra',              vol: 5000,  nearby: ['kenitra','casablanca','meknes'] },
  { slug: 'marrakech',   name: 'Marrakech',    region: 'Marrakech-Safi',                  vol: 5000,  nearby: ['essaouira','safi','agadir'] },
  { slug: 'agadir',      name: 'Agadir',       region: 'Souss-Massa',                     vol: 5000,  nearby: ['marrakech','essaouira','safi'] },
  { slug: 'tanger',      name: 'Tanger',       region: 'Tanger-Tétouan-Al Hoceïma',       vol: 5000,  nearby: ['tetouan','kenitra','rabat'] },
  { slug: 'fes',         name: 'Fès',          region: 'Fès-Meknès',                      vol: 5000,  nearby: ['meknes','rabat','oujda'] },
  { slug: 'meknes',      name: 'Meknès',       region: 'Fès-Meknès',                      vol: 5000,  nearby: ['fes','rabat','kenitra'] },
  { slug: 'oujda',       name: 'Oujda',        region: 'Oriental',                        vol: 5000,  nearby: ['fes','tanger','rabat'] },
  { slug: 'kenitra',     name: 'Kénitra',      region: 'Rabat-Salé-Kénitra',              vol: 5000,  nearby: ['rabat','tanger','casablanca'] },
  { slug: 'tetouan',     name: 'Tétouan',      region: 'Tanger-Tétouan-Al Hoceïma',       vol: 5000,  nearby: ['tanger','kenitra','rabat'] },
  { slug: 'mohammedia',  name: 'Mohammedia',   region: 'Grand Casablanca-Settat',          vol: 5000,  nearby: ['casablanca','el-jadida','rabat'] },
  { slug: 'el-jadida',   name: 'El Jadida',    region: 'Grand Casablanca-Settat',          vol: 5000,  nearby: ['casablanca','mohammedia','safi'] },
  { slug: 'safi',        name: 'Safi',         region: 'Marrakech-Safi',                  vol: 5000,  nearby: ['marrakech','el-jadida','agadir'] },
  { slug: 'essaouira',   name: 'Essaouira',    region: 'Marrakech-Safi',                  vol: 500,   nearby: ['marrakech','agadir','safi'] },
];

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}
