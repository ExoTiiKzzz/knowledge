// Fichier généré par scripts/generate-countries.mjs — ne pas éditer à la main.
// Source : paquet npm `world-countries` + corrections françaises du générateur.

export const CONTINENTS = [
  'Afrique',
  'Amérique du Nord',
  'Amérique du Sud',
  'Asie',
  'Europe',
  'Océanie',
] as const

export type Continent = (typeof CONTINENTS)[number]

export type Country = {
  /** Code ISO 3166-1 alpha-2, utilisé pour l'URL du drapeau. */
  code: string
  /** Codes ISO alpha-2 et alpha-3, acceptés comme abréviation du nom du pays. */
  codes: string[]
  name: string
  capital: string
  continent: Continent
  /** Autres orthographes/appellations acceptées comme bonne réponse. */
  nameAliases: string[]
  capitalAliases: string[]
}

export const COUNTRIES: Country[] = [
  {
    "code": "AF",
    "codes": [
      "AF",
      "AFG"
    ],
    "name": "Afghanistan",
    "capital": "Kaboul",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Kabul"
    ]
  },
  {
    "code": "ZA",
    "codes": [
      "ZA",
      "ZAF"
    ],
    "name": "Afrique du Sud",
    "capital": "Pretoria",
    "continent": "Afrique",
    "nameAliases": [
      "South Africa"
    ],
    "capitalAliases": [
      "Bloemfontein",
      "Cape Town",
      "Le Cap",
      "Le Cap-Ville"
    ]
  },
  {
    "code": "AL",
    "codes": [
      "AL",
      "ALB"
    ],
    "name": "Albanie",
    "capital": "Tirana",
    "continent": "Europe",
    "nameAliases": [
      "Albania"
    ],
    "capitalAliases": []
  },
  {
    "code": "DZ",
    "codes": [
      "DZ",
      "DZA"
    ],
    "name": "Algérie",
    "capital": "Alger",
    "continent": "Afrique",
    "nameAliases": [
      "Algeria"
    ],
    "capitalAliases": [
      "Algiers"
    ]
  },
  {
    "code": "DE",
    "codes": [
      "DE",
      "DEU"
    ],
    "name": "Allemagne",
    "capital": "Berlin",
    "continent": "Europe",
    "nameAliases": [
      "Germany"
    ],
    "capitalAliases": []
  },
  {
    "code": "AD",
    "codes": [
      "AD",
      "AND"
    ],
    "name": "Andorre",
    "capital": "Andorre-la-Vieille",
    "continent": "Europe",
    "nameAliases": [
      "Andorra"
    ],
    "capitalAliases": [
      "Andorra la Vella"
    ]
  },
  {
    "code": "AO",
    "codes": [
      "AO",
      "AGO"
    ],
    "name": "Angola",
    "capital": "Luanda",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "AG",
    "codes": [
      "AG",
      "ATG"
    ],
    "name": "Antigua-et-Barbuda",
    "capital": "Saint John's",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Antigua and Barbuda"
    ],
    "capitalAliases": [
      "Saint-Jean"
    ]
  },
  {
    "code": "SA",
    "codes": [
      "SA",
      "SAU"
    ],
    "name": "Arabie Saoudite",
    "capital": "Riyad",
    "continent": "Asie",
    "nameAliases": [
      "Saudi Arabia"
    ],
    "capitalAliases": [
      "Riyadh"
    ]
  },
  {
    "code": "AR",
    "codes": [
      "AR",
      "ARG"
    ],
    "name": "Argentine",
    "capital": "Buenos Aires",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Argentina"
    ],
    "capitalAliases": []
  },
  {
    "code": "AM",
    "codes": [
      "AM",
      "ARM"
    ],
    "name": "Arménie",
    "capital": "Erevan",
    "continent": "Asie",
    "nameAliases": [
      "Armenia"
    ],
    "capitalAliases": [
      "Yerevan"
    ]
  },
  {
    "code": "AU",
    "codes": [
      "AU",
      "AUS"
    ],
    "name": "Australie",
    "capital": "Canberra",
    "continent": "Océanie",
    "nameAliases": [
      "Australia"
    ],
    "capitalAliases": []
  },
  {
    "code": "AT",
    "codes": [
      "AT",
      "AUT"
    ],
    "name": "Autriche",
    "capital": "Vienne",
    "continent": "Europe",
    "nameAliases": [
      "Austria"
    ],
    "capitalAliases": [
      "Vienna"
    ]
  },
  {
    "code": "AZ",
    "codes": [
      "AZ",
      "AZE"
    ],
    "name": "Azerbaïdjan",
    "capital": "Bakou",
    "continent": "Asie",
    "nameAliases": [
      "Azerbaijan"
    ],
    "capitalAliases": [
      "Baku"
    ]
  },
  {
    "code": "BS",
    "codes": [
      "BS",
      "BHS"
    ],
    "name": "Bahamas",
    "capital": "Nassau",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "BH",
    "codes": [
      "BH",
      "BHR"
    ],
    "name": "Bahreïn",
    "capital": "Manama",
    "continent": "Asie",
    "nameAliases": [
      "Bahrain"
    ],
    "capitalAliases": []
  },
  {
    "code": "BD",
    "codes": [
      "BD",
      "BGD"
    ],
    "name": "Bangladesh",
    "capital": "Dacca",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Dhaka"
    ]
  },
  {
    "code": "BB",
    "codes": [
      "BB",
      "BRB"
    ],
    "name": "Barbade",
    "capital": "Bridgetown",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Barbados"
    ],
    "capitalAliases": []
  },
  {
    "code": "BE",
    "codes": [
      "BE",
      "BEL"
    ],
    "name": "Belgique",
    "capital": "Bruxelles",
    "continent": "Europe",
    "nameAliases": [
      "Belgium"
    ],
    "capitalAliases": [
      "Brussels"
    ]
  },
  {
    "code": "BZ",
    "codes": [
      "BZ",
      "BLZ"
    ],
    "name": "Belize",
    "capital": "Belmopan",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "BJ",
    "codes": [
      "BJ",
      "BEN"
    ],
    "name": "Bénin",
    "capital": "Porto-Novo",
    "continent": "Afrique",
    "nameAliases": [
      "Benin"
    ],
    "capitalAliases": [
      "Cotonou"
    ]
  },
  {
    "code": "BT",
    "codes": [
      "BT",
      "BTN"
    ],
    "name": "Bhoutan",
    "capital": "Thimphou",
    "continent": "Asie",
    "nameAliases": [
      "Bhutan"
    ],
    "capitalAliases": [
      "Thimphu"
    ]
  },
  {
    "code": "BY",
    "codes": [
      "BY",
      "BLR"
    ],
    "name": "Biélorussie",
    "capital": "Minsk",
    "continent": "Europe",
    "nameAliases": [
      "Belarus",
      "Bélarus"
    ],
    "capitalAliases": []
  },
  {
    "code": "MM",
    "codes": [
      "MM",
      "MMR"
    ],
    "name": "Birmanie",
    "capital": "Naypyidaw",
    "continent": "Asie",
    "nameAliases": [
      "Myanmar"
    ],
    "capitalAliases": [
      "Rangoun",
      "Yangon"
    ]
  },
  {
    "code": "BO",
    "codes": [
      "BO",
      "BOL"
    ],
    "name": "Bolivie",
    "capital": "Sucre",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Bolivia"
    ],
    "capitalAliases": [
      "La Paz"
    ]
  },
  {
    "code": "BA",
    "codes": [
      "BA",
      "BIH"
    ],
    "name": "Bosnie-Herzégovine",
    "capital": "Sarajevo",
    "continent": "Europe",
    "nameAliases": [
      "Bosnia and Herzegovina"
    ],
    "capitalAliases": []
  },
  {
    "code": "BW",
    "codes": [
      "BW",
      "BWA"
    ],
    "name": "Botswana",
    "capital": "Gaborone",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "BR",
    "codes": [
      "BR",
      "BRA"
    ],
    "name": "Brésil",
    "capital": "Brasilia",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Brazil"
    ],
    "capitalAliases": [
      "Brasília"
    ]
  },
  {
    "code": "BN",
    "codes": [
      "BN",
      "BRN"
    ],
    "name": "Brunei",
    "capital": "Bandar Seri Begawan",
    "continent": "Asie",
    "nameAliases": [
      "Brunéi"
    ],
    "capitalAliases": []
  },
  {
    "code": "BG",
    "codes": [
      "BG",
      "BGR"
    ],
    "name": "Bulgarie",
    "capital": "Sofia",
    "continent": "Europe",
    "nameAliases": [
      "Bulgaria"
    ],
    "capitalAliases": []
  },
  {
    "code": "BF",
    "codes": [
      "BF",
      "BFA"
    ],
    "name": "Burkina Faso",
    "capital": "Ouagadougou",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "BI",
    "codes": [
      "BI",
      "BDI"
    ],
    "name": "Burundi",
    "capital": "Gitega",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": [
      "Bujumbura"
    ]
  },
  {
    "code": "KH",
    "codes": [
      "KH",
      "KHM"
    ],
    "name": "Cambodge",
    "capital": "Phnom Penh",
    "continent": "Asie",
    "nameAliases": [
      "Cambodia"
    ],
    "capitalAliases": []
  },
  {
    "code": "CM",
    "codes": [
      "CM",
      "CMR"
    ],
    "name": "Cameroun",
    "capital": "Yaoundé",
    "continent": "Afrique",
    "nameAliases": [
      "Cameroon"
    ],
    "capitalAliases": []
  },
  {
    "code": "CA",
    "codes": [
      "CA",
      "CAN"
    ],
    "name": "Canada",
    "capital": "Ottawa",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "CV",
    "codes": [
      "CV",
      "CPV"
    ],
    "name": "Cap-Vert",
    "capital": "Praia",
    "continent": "Afrique",
    "nameAliases": [
      "Cape Verde",
      "Îles du Cap-Vert"
    ],
    "capitalAliases": []
  },
  {
    "code": "CL",
    "codes": [
      "CL",
      "CHL"
    ],
    "name": "Chili",
    "capital": "Santiago",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Chile"
    ],
    "capitalAliases": [
      "Santiago du Chili"
    ]
  },
  {
    "code": "CN",
    "codes": [
      "CN",
      "CHN"
    ],
    "name": "Chine",
    "capital": "Pékin",
    "continent": "Asie",
    "nameAliases": [
      "China"
    ],
    "capitalAliases": [
      "Beijing"
    ]
  },
  {
    "code": "CY",
    "codes": [
      "CY",
      "CYP"
    ],
    "name": "Chypre",
    "capital": "Nicosie",
    "continent": "Europe",
    "nameAliases": [
      "Cyprus"
    ],
    "capitalAliases": [
      "Nicosia"
    ]
  },
  {
    "code": "VA",
    "codes": [
      "VA",
      "VAT"
    ],
    "name": "Cité du Vatican",
    "capital": "Vatican",
    "continent": "Europe",
    "nameAliases": [
      "Vatican City",
      "Vatican",
      "Saint-Siège"
    ],
    "capitalAliases": [
      "Vatican City",
      "Cité du Vatican"
    ]
  },
  {
    "code": "CO",
    "codes": [
      "CO",
      "COL"
    ],
    "name": "Colombie",
    "capital": "Bogota",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Colombia"
    ],
    "capitalAliases": [
      "Bogotá"
    ]
  },
  {
    "code": "KM",
    "codes": [
      "KM",
      "COM"
    ],
    "name": "Comores",
    "capital": "Moroni",
    "continent": "Afrique",
    "nameAliases": [
      "Comoros"
    ],
    "capitalAliases": []
  },
  {
    "code": "KP",
    "codes": [
      "KP",
      "PRK"
    ],
    "name": "Corée du Nord",
    "capital": "Pyongyang",
    "continent": "Asie",
    "nameAliases": [
      "North Korea"
    ],
    "capitalAliases": []
  },
  {
    "code": "KR",
    "codes": [
      "KR",
      "KOR"
    ],
    "name": "Corée du Sud",
    "capital": "Séoul",
    "continent": "Asie",
    "nameAliases": [
      "South Korea"
    ],
    "capitalAliases": [
      "Seoul"
    ]
  },
  {
    "code": "CR",
    "codes": [
      "CR",
      "CRI"
    ],
    "name": "Costa Rica",
    "capital": "San José",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "CI",
    "codes": [
      "CI",
      "CIV"
    ],
    "name": "Côte d'Ivoire",
    "capital": "Yamoussoukro",
    "continent": "Afrique",
    "nameAliases": [
      "Ivory Coast"
    ],
    "capitalAliases": [
      "Abidjan"
    ]
  },
  {
    "code": "HR",
    "codes": [
      "HR",
      "HRV"
    ],
    "name": "Croatie",
    "capital": "Zagreb",
    "continent": "Europe",
    "nameAliases": [
      "Croatia"
    ],
    "capitalAliases": []
  },
  {
    "code": "CU",
    "codes": [
      "CU",
      "CUB"
    ],
    "name": "Cuba",
    "capital": "La Havane",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": [
      "Havana"
    ]
  },
  {
    "code": "DK",
    "codes": [
      "DK",
      "DNK"
    ],
    "name": "Danemark",
    "capital": "Copenhague",
    "continent": "Europe",
    "nameAliases": [
      "Denmark"
    ],
    "capitalAliases": [
      "Copenhagen"
    ]
  },
  {
    "code": "DJ",
    "codes": [
      "DJ",
      "DJI"
    ],
    "name": "Djibouti",
    "capital": "Djibouti",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "DM",
    "codes": [
      "DM",
      "DMA"
    ],
    "name": "Dominique",
    "capital": "Roseau",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Dominica"
    ],
    "capitalAliases": []
  },
  {
    "code": "EG",
    "codes": [
      "EG",
      "EGY"
    ],
    "name": "Égypte",
    "capital": "Le Caire",
    "continent": "Afrique",
    "nameAliases": [
      "Egypt"
    ],
    "capitalAliases": [
      "Cairo"
    ]
  },
  {
    "code": "AE",
    "codes": [
      "AE",
      "ARE"
    ],
    "name": "Émirats arabes unis",
    "capital": "Abou Dabi",
    "continent": "Asie",
    "nameAliases": [
      "United Arab Emirates",
      "EAU",
      "UAE"
    ],
    "capitalAliases": [
      "Abu Dhabi"
    ]
  },
  {
    "code": "EC",
    "codes": [
      "EC",
      "ECU"
    ],
    "name": "Équateur",
    "capital": "Quito",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Ecuador"
    ],
    "capitalAliases": []
  },
  {
    "code": "ER",
    "codes": [
      "ER",
      "ERI"
    ],
    "name": "Érythrée",
    "capital": "Asmara",
    "continent": "Afrique",
    "nameAliases": [
      "Eritrea"
    ],
    "capitalAliases": []
  },
  {
    "code": "ES",
    "codes": [
      "ES",
      "ESP"
    ],
    "name": "Espagne",
    "capital": "Madrid",
    "continent": "Europe",
    "nameAliases": [
      "Spain"
    ],
    "capitalAliases": []
  },
  {
    "code": "EE",
    "codes": [
      "EE",
      "EST"
    ],
    "name": "Estonie",
    "capital": "Tallinn",
    "continent": "Europe",
    "nameAliases": [
      "Estonia"
    ],
    "capitalAliases": []
  },
  {
    "code": "SZ",
    "codes": [
      "SZ",
      "SWZ"
    ],
    "name": "Eswatini",
    "capital": "Mbabane",
    "continent": "Afrique",
    "nameAliases": [
      "Swaziland"
    ],
    "capitalAliases": [
      "Lobamba"
    ]
  },
  {
    "code": "US",
    "codes": [
      "US",
      "USA"
    ],
    "name": "États-Unis",
    "capital": "Washington",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "United States",
      "USA",
      "États-Unis d'Amérique",
      "Amérique"
    ],
    "capitalAliases": [
      "Washington D.C.",
      "Washington DC"
    ]
  },
  {
    "code": "ET",
    "codes": [
      "ET",
      "ETH"
    ],
    "name": "Éthiopie",
    "capital": "Addis-Abeba",
    "continent": "Afrique",
    "nameAliases": [
      "Ethiopia"
    ],
    "capitalAliases": [
      "Addis Ababa"
    ]
  },
  {
    "code": "FJ",
    "codes": [
      "FJ",
      "FJI"
    ],
    "name": "Fidji",
    "capital": "Suva",
    "continent": "Océanie",
    "nameAliases": [
      "Fiji"
    ],
    "capitalAliases": []
  },
  {
    "code": "FI",
    "codes": [
      "FI",
      "FIN"
    ],
    "name": "Finlande",
    "capital": "Helsinki",
    "continent": "Europe",
    "nameAliases": [
      "Finland"
    ],
    "capitalAliases": []
  },
  {
    "code": "FR",
    "codes": [
      "FR",
      "FRA"
    ],
    "name": "France",
    "capital": "Paris",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "GA",
    "codes": [
      "GA",
      "GAB"
    ],
    "name": "Gabon",
    "capital": "Libreville",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "GM",
    "codes": [
      "GM",
      "GMB"
    ],
    "name": "Gambie",
    "capital": "Banjul",
    "continent": "Afrique",
    "nameAliases": [
      "Gambia"
    ],
    "capitalAliases": []
  },
  {
    "code": "GE",
    "codes": [
      "GE",
      "GEO"
    ],
    "name": "Géorgie",
    "capital": "Tbilissi",
    "continent": "Asie",
    "nameAliases": [
      "Georgia"
    ],
    "capitalAliases": [
      "Tbilisi"
    ]
  },
  {
    "code": "GH",
    "codes": [
      "GH",
      "GHA"
    ],
    "name": "Ghana",
    "capital": "Accra",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "GR",
    "codes": [
      "GR",
      "GRC"
    ],
    "name": "Grèce",
    "capital": "Athènes",
    "continent": "Europe",
    "nameAliases": [
      "Greece"
    ],
    "capitalAliases": [
      "Athens"
    ]
  },
  {
    "code": "GD",
    "codes": [
      "GD",
      "GRD"
    ],
    "name": "Grenade",
    "capital": "Saint-Georges",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Grenada"
    ],
    "capitalAliases": [
      "St. George's"
    ]
  },
  {
    "code": "GT",
    "codes": [
      "GT",
      "GTM"
    ],
    "name": "Guatemala",
    "capital": "Guatemala",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": [
      "Guatemala City",
      "Ciudad de Guatemala"
    ]
  },
  {
    "code": "GN",
    "codes": [
      "GN",
      "GIN"
    ],
    "name": "Guinée",
    "capital": "Conakry",
    "continent": "Afrique",
    "nameAliases": [
      "Guinea"
    ],
    "capitalAliases": []
  },
  {
    "code": "GQ",
    "codes": [
      "GQ",
      "GNQ"
    ],
    "name": "Guinée équatoriale",
    "capital": "Malabo",
    "continent": "Afrique",
    "nameAliases": [
      "Equatorial Guinea"
    ],
    "capitalAliases": []
  },
  {
    "code": "GW",
    "codes": [
      "GW",
      "GNB"
    ],
    "name": "Guinée-Bissau",
    "capital": "Bissau",
    "continent": "Afrique",
    "nameAliases": [
      "Guinea-Bissau"
    ],
    "capitalAliases": []
  },
  {
    "code": "GY",
    "codes": [
      "GY",
      "GUY"
    ],
    "name": "Guyana",
    "capital": "Georgetown",
    "continent": "Amérique du Sud",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "HT",
    "codes": [
      "HT",
      "HTI"
    ],
    "name": "Haïti",
    "capital": "Port-au-Prince",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Haiti"
    ],
    "capitalAliases": []
  },
  {
    "code": "HN",
    "codes": [
      "HN",
      "HND"
    ],
    "name": "Honduras",
    "capital": "Tegucigalpa",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "HU",
    "codes": [
      "HU",
      "HUN"
    ],
    "name": "Hongrie",
    "capital": "Budapest",
    "continent": "Europe",
    "nameAliases": [
      "Hungary"
    ],
    "capitalAliases": []
  },
  {
    "code": "MH",
    "codes": [
      "MH",
      "MHL"
    ],
    "name": "Îles Marshall",
    "capital": "Majuro",
    "continent": "Océanie",
    "nameAliases": [
      "Marshall Islands"
    ],
    "capitalAliases": []
  },
  {
    "code": "SB",
    "codes": [
      "SB",
      "SLB"
    ],
    "name": "Îles Salomon",
    "capital": "Honiara",
    "continent": "Océanie",
    "nameAliases": [
      "Solomon Islands"
    ],
    "capitalAliases": []
  },
  {
    "code": "IN",
    "codes": [
      "IN",
      "IND"
    ],
    "name": "Inde",
    "capital": "New Delhi",
    "continent": "Asie",
    "nameAliases": [
      "India"
    ],
    "capitalAliases": [
      "Nouvelle-Delhi",
      "Delhi"
    ]
  },
  {
    "code": "ID",
    "codes": [
      "ID",
      "IDN"
    ],
    "name": "Indonésie",
    "capital": "Jakarta",
    "continent": "Asie",
    "nameAliases": [
      "Indonesia"
    ],
    "capitalAliases": [
      "Nusantara"
    ]
  },
  {
    "code": "IQ",
    "codes": [
      "IQ",
      "IRQ"
    ],
    "name": "Irak",
    "capital": "Bagdad",
    "continent": "Asie",
    "nameAliases": [
      "Iraq"
    ],
    "capitalAliases": [
      "Baghdad"
    ]
  },
  {
    "code": "IR",
    "codes": [
      "IR",
      "IRN"
    ],
    "name": "Iran",
    "capital": "Téhéran",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Tehran"
    ]
  },
  {
    "code": "IE",
    "codes": [
      "IE",
      "IRL"
    ],
    "name": "Irlande",
    "capital": "Dublin",
    "continent": "Europe",
    "nameAliases": [
      "Ireland"
    ],
    "capitalAliases": []
  },
  {
    "code": "IS",
    "codes": [
      "IS",
      "ISL"
    ],
    "name": "Islande",
    "capital": "Reykjavik",
    "continent": "Europe",
    "nameAliases": [
      "Iceland"
    ],
    "capitalAliases": []
  },
  {
    "code": "IL",
    "codes": [
      "IL",
      "ISR"
    ],
    "name": "Israël",
    "capital": "Jérusalem",
    "continent": "Asie",
    "nameAliases": [
      "Israel"
    ],
    "capitalAliases": [
      "Jerusalem"
    ]
  },
  {
    "code": "IT",
    "codes": [
      "IT",
      "ITA"
    ],
    "name": "Italie",
    "capital": "Rome",
    "continent": "Europe",
    "nameAliases": [
      "Italy"
    ],
    "capitalAliases": []
  },
  {
    "code": "JM",
    "codes": [
      "JM",
      "JAM"
    ],
    "name": "Jamaïque",
    "capital": "Kingston",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Jamaica"
    ],
    "capitalAliases": []
  },
  {
    "code": "JP",
    "codes": [
      "JP",
      "JPN"
    ],
    "name": "Japon",
    "capital": "Tokyo",
    "continent": "Asie",
    "nameAliases": [
      "Japan"
    ],
    "capitalAliases": []
  },
  {
    "code": "JO",
    "codes": [
      "JO",
      "JOR"
    ],
    "name": "Jordanie",
    "capital": "Amman",
    "continent": "Asie",
    "nameAliases": [
      "Jordan"
    ],
    "capitalAliases": []
  },
  {
    "code": "KZ",
    "codes": [
      "KZ",
      "KAZ"
    ],
    "name": "Kazakhstan",
    "capital": "Astana",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Noursoultan",
      "Nur-Sultan"
    ]
  },
  {
    "code": "KE",
    "codes": [
      "KE",
      "KEN"
    ],
    "name": "Kenya",
    "capital": "Nairobi",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "KG",
    "codes": [
      "KG",
      "KGZ"
    ],
    "name": "Kirghizistan",
    "capital": "Bichkek",
    "continent": "Asie",
    "nameAliases": [
      "Kyrgyzstan"
    ],
    "capitalAliases": [
      "Bishkek"
    ]
  },
  {
    "code": "KI",
    "codes": [
      "KI",
      "KIR"
    ],
    "name": "Kiribati",
    "capital": "Tarawa-Sud",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": [
      "South Tarawa",
      "Tarawa"
    ]
  },
  {
    "code": "KW",
    "codes": [
      "KW",
      "KWT"
    ],
    "name": "Koweït",
    "capital": "Koweït",
    "continent": "Asie",
    "nameAliases": [
      "Kuwait"
    ],
    "capitalAliases": [
      "Kuwait City",
      "Koweït City"
    ]
  },
  {
    "code": "LA",
    "codes": [
      "LA",
      "LAO"
    ],
    "name": "Laos",
    "capital": "Vientiane",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "LS",
    "codes": [
      "LS",
      "LSO"
    ],
    "name": "Lesotho",
    "capital": "Maseru",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "LV",
    "codes": [
      "LV",
      "LVA"
    ],
    "name": "Lettonie",
    "capital": "Riga",
    "continent": "Europe",
    "nameAliases": [
      "Latvia"
    ],
    "capitalAliases": []
  },
  {
    "code": "LB",
    "codes": [
      "LB",
      "LBN"
    ],
    "name": "Liban",
    "capital": "Beyrouth",
    "continent": "Asie",
    "nameAliases": [
      "Lebanon"
    ],
    "capitalAliases": [
      "Beirut"
    ]
  },
  {
    "code": "LR",
    "codes": [
      "LR",
      "LBR"
    ],
    "name": "Liberia",
    "capital": "Monrovia",
    "continent": "Afrique",
    "nameAliases": [
      "Libéria"
    ],
    "capitalAliases": []
  },
  {
    "code": "LY",
    "codes": [
      "LY",
      "LBY"
    ],
    "name": "Libye",
    "capital": "Tripoli",
    "continent": "Afrique",
    "nameAliases": [
      "Libya"
    ],
    "capitalAliases": []
  },
  {
    "code": "LI",
    "codes": [
      "LI",
      "LIE"
    ],
    "name": "Liechtenstein",
    "capital": "Vaduz",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "LT",
    "codes": [
      "LT",
      "LTU"
    ],
    "name": "Lituanie",
    "capital": "Vilnius",
    "continent": "Europe",
    "nameAliases": [
      "Lithuania"
    ],
    "capitalAliases": []
  },
  {
    "code": "LU",
    "codes": [
      "LU",
      "LUX"
    ],
    "name": "Luxembourg",
    "capital": "Luxembourg",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "MK",
    "codes": [
      "MK",
      "MKD"
    ],
    "name": "Macédoine du Nord",
    "capital": "Skopje",
    "continent": "Europe",
    "nameAliases": [
      "North Macedonia",
      "Macédoine"
    ],
    "capitalAliases": []
  },
  {
    "code": "MG",
    "codes": [
      "MG",
      "MDG"
    ],
    "name": "Madagascar",
    "capital": "Antananarivo",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": [
      "Tananarive"
    ]
  },
  {
    "code": "MY",
    "codes": [
      "MY",
      "MYS"
    ],
    "name": "Malaisie",
    "capital": "Kuala Lumpur",
    "continent": "Asie",
    "nameAliases": [
      "Malaysia"
    ],
    "capitalAliases": []
  },
  {
    "code": "MW",
    "codes": [
      "MW",
      "MWI"
    ],
    "name": "Malawi",
    "capital": "Lilongwe",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "MV",
    "codes": [
      "MV",
      "MDV"
    ],
    "name": "Maldives",
    "capital": "Malé",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "ML",
    "codes": [
      "ML",
      "MLI"
    ],
    "name": "Mali",
    "capital": "Bamako",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "MT",
    "codes": [
      "MT",
      "MLT"
    ],
    "name": "Malte",
    "capital": "La Valette",
    "continent": "Europe",
    "nameAliases": [
      "Malta"
    ],
    "capitalAliases": [
      "Valletta",
      "Valette"
    ]
  },
  {
    "code": "MA",
    "codes": [
      "MA",
      "MAR"
    ],
    "name": "Maroc",
    "capital": "Rabat",
    "continent": "Afrique",
    "nameAliases": [
      "Morocco"
    ],
    "capitalAliases": []
  },
  {
    "code": "MU",
    "codes": [
      "MU",
      "MUS"
    ],
    "name": "Maurice",
    "capital": "Port-Louis",
    "continent": "Afrique",
    "nameAliases": [
      "Mauritius",
      "Île Maurice"
    ],
    "capitalAliases": [
      "Port Louis"
    ]
  },
  {
    "code": "MR",
    "codes": [
      "MR",
      "MRT"
    ],
    "name": "Mauritanie",
    "capital": "Nouakchott",
    "continent": "Afrique",
    "nameAliases": [
      "Mauritania"
    ],
    "capitalAliases": []
  },
  {
    "code": "MX",
    "codes": [
      "MX",
      "MEX"
    ],
    "name": "Mexique",
    "capital": "Mexico",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Mexico"
    ],
    "capitalAliases": [
      "Mexico City",
      "Ciudad de México"
    ]
  },
  {
    "code": "FM",
    "codes": [
      "FM",
      "FSM"
    ],
    "name": "Micronésie",
    "capital": "Palikir",
    "continent": "Océanie",
    "nameAliases": [
      "Micronesia"
    ],
    "capitalAliases": []
  },
  {
    "code": "MD",
    "codes": [
      "MD",
      "MDA"
    ],
    "name": "Moldavie",
    "capital": "Chisinau",
    "continent": "Europe",
    "nameAliases": [
      "Moldova"
    ],
    "capitalAliases": [
      "Chișinău"
    ]
  },
  {
    "code": "MC",
    "codes": [
      "MC",
      "MCO"
    ],
    "name": "Monaco",
    "capital": "Monaco",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "MN",
    "codes": [
      "MN",
      "MNG"
    ],
    "name": "Mongolie",
    "capital": "Oulan-Bator",
    "continent": "Asie",
    "nameAliases": [
      "Mongolia"
    ],
    "capitalAliases": [
      "Ulan Bator",
      "Oulan Bator"
    ]
  },
  {
    "code": "ME",
    "codes": [
      "ME",
      "MNE"
    ],
    "name": "Monténégro",
    "capital": "Podgorica",
    "continent": "Europe",
    "nameAliases": [
      "Montenegro"
    ],
    "capitalAliases": []
  },
  {
    "code": "MZ",
    "codes": [
      "MZ",
      "MOZ"
    ],
    "name": "Mozambique",
    "capital": "Maputo",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "NA",
    "codes": [
      "NA",
      "NAM"
    ],
    "name": "Namibie",
    "capital": "Windhoek",
    "continent": "Afrique",
    "nameAliases": [
      "Namibia"
    ],
    "capitalAliases": []
  },
  {
    "code": "NR",
    "codes": [
      "NR",
      "NRU"
    ],
    "name": "Nauru",
    "capital": "Yaren",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "NP",
    "codes": [
      "NP",
      "NPL"
    ],
    "name": "Népal",
    "capital": "Katmandou",
    "continent": "Asie",
    "nameAliases": [
      "Nepal"
    ],
    "capitalAliases": [
      "Kathmandu"
    ]
  },
  {
    "code": "NI",
    "codes": [
      "NI",
      "NIC"
    ],
    "name": "Nicaragua",
    "capital": "Managua",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "NE",
    "codes": [
      "NE",
      "NER"
    ],
    "name": "Niger",
    "capital": "Niamey",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "NG",
    "codes": [
      "NG",
      "NGA"
    ],
    "name": "Nigéria",
    "capital": "Abuja",
    "continent": "Afrique",
    "nameAliases": [
      "Nigeria"
    ],
    "capitalAliases": []
  },
  {
    "code": "NO",
    "codes": [
      "NO",
      "NOR"
    ],
    "name": "Norvège",
    "capital": "Oslo",
    "continent": "Europe",
    "nameAliases": [
      "Norway"
    ],
    "capitalAliases": []
  },
  {
    "code": "NZ",
    "codes": [
      "NZ",
      "NZL"
    ],
    "name": "Nouvelle-Zélande",
    "capital": "Wellington",
    "continent": "Océanie",
    "nameAliases": [
      "New Zealand"
    ],
    "capitalAliases": []
  },
  {
    "code": "OM",
    "codes": [
      "OM",
      "OMN"
    ],
    "name": "Oman",
    "capital": "Mascate",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Muscat"
    ]
  },
  {
    "code": "UG",
    "codes": [
      "UG",
      "UGA"
    ],
    "name": "Ouganda",
    "capital": "Kampala",
    "continent": "Afrique",
    "nameAliases": [
      "Uganda"
    ],
    "capitalAliases": []
  },
  {
    "code": "UZ",
    "codes": [
      "UZ",
      "UZB"
    ],
    "name": "Ouzbékistan",
    "capital": "Tachkent",
    "continent": "Asie",
    "nameAliases": [
      "Uzbekistan"
    ],
    "capitalAliases": [
      "Tashkent"
    ]
  },
  {
    "code": "PK",
    "codes": [
      "PK",
      "PAK"
    ],
    "name": "Pakistan",
    "capital": "Islamabad",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "PW",
    "codes": [
      "PW",
      "PLW"
    ],
    "name": "Palaos",
    "capital": "Ngerulmud",
    "continent": "Océanie",
    "nameAliases": [
      "Palau",
      "Palaos (Palau)"
    ],
    "capitalAliases": []
  },
  {
    "code": "PA",
    "codes": [
      "PA",
      "PAN"
    ],
    "name": "Panama",
    "capital": "Panama",
    "continent": "Amérique du Nord",
    "nameAliases": [],
    "capitalAliases": [
      "Panama City"
    ]
  },
  {
    "code": "PG",
    "codes": [
      "PG",
      "PNG"
    ],
    "name": "Papouasie-Nouvelle-Guinée",
    "capital": "Port Moresby",
    "continent": "Océanie",
    "nameAliases": [
      "Papua New Guinea"
    ],
    "capitalAliases": []
  },
  {
    "code": "PY",
    "codes": [
      "PY",
      "PRY"
    ],
    "name": "Paraguay",
    "capital": "Asunción",
    "continent": "Amérique du Sud",
    "nameAliases": [],
    "capitalAliases": [
      "Assomption"
    ]
  },
  {
    "code": "NL",
    "codes": [
      "NL",
      "NLD"
    ],
    "name": "Pays-Bas",
    "capital": "Amsterdam",
    "continent": "Europe",
    "nameAliases": [
      "Netherlands",
      "Hollande"
    ],
    "capitalAliases": [
      "La Haye"
    ]
  },
  {
    "code": "PE",
    "codes": [
      "PE",
      "PER"
    ],
    "name": "Pérou",
    "capital": "Lima",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Peru"
    ],
    "capitalAliases": []
  },
  {
    "code": "PH",
    "codes": [
      "PH",
      "PHL"
    ],
    "name": "Philippines",
    "capital": "Manille",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Manila"
    ]
  },
  {
    "code": "PL",
    "codes": [
      "PL",
      "POL"
    ],
    "name": "Pologne",
    "capital": "Varsovie",
    "continent": "Europe",
    "nameAliases": [
      "Poland"
    ],
    "capitalAliases": [
      "Warsaw"
    ]
  },
  {
    "code": "PT",
    "codes": [
      "PT",
      "PRT"
    ],
    "name": "Portugal",
    "capital": "Lisbonne",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": [
      "Lisbon"
    ]
  },
  {
    "code": "QA",
    "codes": [
      "QA",
      "QAT"
    ],
    "name": "Qatar",
    "capital": "Doha",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "CF",
    "codes": [
      "CF",
      "CAF"
    ],
    "name": "République centrafricaine",
    "capital": "Bangui",
    "continent": "Afrique",
    "nameAliases": [
      "Central African Republic",
      "Centrafrique",
      "RCA"
    ],
    "capitalAliases": []
  },
  {
    "code": "CD",
    "codes": [
      "CD",
      "COD"
    ],
    "name": "République démocratique du Congo",
    "capital": "Kinshasa",
    "continent": "Afrique",
    "nameAliases": [
      "DR Congo",
      "Congo (Rép. dém.)",
      "RDC",
      "Congo-Kinshasa",
      "Congo (RDC)",
      "Zaïre"
    ],
    "capitalAliases": []
  },
  {
    "code": "DO",
    "codes": [
      "DO",
      "DOM"
    ],
    "name": "République dominicaine",
    "capital": "Saint-Domingue",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Dominican Republic"
    ],
    "capitalAliases": [
      "Santo Domingo"
    ]
  },
  {
    "code": "CG",
    "codes": [
      "CG",
      "COG"
    ],
    "name": "République du Congo",
    "capital": "Brazzaville",
    "continent": "Afrique",
    "nameAliases": [
      "Republic of the Congo",
      "Congo",
      "Congo-Brazzaville"
    ],
    "capitalAliases": []
  },
  {
    "code": "RO",
    "codes": [
      "RO",
      "ROU"
    ],
    "name": "Roumanie",
    "capital": "Bucarest",
    "continent": "Europe",
    "nameAliases": [
      "Romania"
    ],
    "capitalAliases": [
      "Bucharest"
    ]
  },
  {
    "code": "GB",
    "codes": [
      "GB",
      "GBR"
    ],
    "name": "Royaume-Uni",
    "capital": "Londres",
    "continent": "Europe",
    "nameAliases": [
      "United Kingdom",
      "Grande-Bretagne",
      "UK",
      "Angleterre"
    ],
    "capitalAliases": [
      "London"
    ]
  },
  {
    "code": "RU",
    "codes": [
      "RU",
      "RUS"
    ],
    "name": "Russie",
    "capital": "Moscou",
    "continent": "Europe",
    "nameAliases": [
      "Russia"
    ],
    "capitalAliases": [
      "Moscow"
    ]
  },
  {
    "code": "RW",
    "codes": [
      "RW",
      "RWA"
    ],
    "name": "Rwanda",
    "capital": "Kigali",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "KN",
    "codes": [
      "KN",
      "KNA"
    ],
    "name": "Saint-Christophe-et-Niévès",
    "capital": "Basseterre",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Saint Kitts and Nevis",
      "Saint-Kitts-et-Nevis"
    ],
    "capitalAliases": []
  },
  {
    "code": "SM",
    "codes": [
      "SM",
      "SMR"
    ],
    "name": "Saint-Marin",
    "capital": "Saint-Marin",
    "continent": "Europe",
    "nameAliases": [
      "San Marino"
    ],
    "capitalAliases": [
      "City of San Marino",
      "San Marino"
    ]
  },
  {
    "code": "VC",
    "codes": [
      "VC",
      "VCT"
    ],
    "name": "Saint-Vincent-et-les-Grenadines",
    "capital": "Kingstown",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Saint Vincent and the Grenadines"
    ],
    "capitalAliases": []
  },
  {
    "code": "LC",
    "codes": [
      "LC",
      "LCA"
    ],
    "name": "Sainte-Lucie",
    "capital": "Castries",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Saint Lucia"
    ],
    "capitalAliases": []
  },
  {
    "code": "SV",
    "codes": [
      "SV",
      "SLV"
    ],
    "name": "Salvador",
    "capital": "San Salvador",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "El Salvador"
    ],
    "capitalAliases": []
  },
  {
    "code": "WS",
    "codes": [
      "WS",
      "WSM"
    ],
    "name": "Samoa",
    "capital": "Apia",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "ST",
    "codes": [
      "ST",
      "STP"
    ],
    "name": "Sao Tomé-et-Principe",
    "capital": "São Tomé",
    "continent": "Afrique",
    "nameAliases": [
      "São Tomé and Príncipe",
      "São Tomé et Príncipe"
    ],
    "capitalAliases": [
      "Sao Tomé"
    ]
  },
  {
    "code": "SN",
    "codes": [
      "SN",
      "SEN"
    ],
    "name": "Sénégal",
    "capital": "Dakar",
    "continent": "Afrique",
    "nameAliases": [
      "Senegal"
    ],
    "capitalAliases": []
  },
  {
    "code": "RS",
    "codes": [
      "RS",
      "SRB"
    ],
    "name": "Serbie",
    "capital": "Belgrade",
    "continent": "Europe",
    "nameAliases": [
      "Serbia"
    ],
    "capitalAliases": []
  },
  {
    "code": "SC",
    "codes": [
      "SC",
      "SYC"
    ],
    "name": "Seychelles",
    "capital": "Victoria",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "SL",
    "codes": [
      "SL",
      "SLE"
    ],
    "name": "Sierra Leone",
    "capital": "Freetown",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "SG",
    "codes": [
      "SG",
      "SGP"
    ],
    "name": "Singapour",
    "capital": "Singapour",
    "continent": "Asie",
    "nameAliases": [
      "Singapore"
    ],
    "capitalAliases": [
      "Singapore"
    ]
  },
  {
    "code": "SK",
    "codes": [
      "SK",
      "SVK"
    ],
    "name": "Slovaquie",
    "capital": "Bratislava",
    "continent": "Europe",
    "nameAliases": [
      "Slovakia"
    ],
    "capitalAliases": []
  },
  {
    "code": "SI",
    "codes": [
      "SI",
      "SVN"
    ],
    "name": "Slovénie",
    "capital": "Ljubljana",
    "continent": "Europe",
    "nameAliases": [
      "Slovenia"
    ],
    "capitalAliases": []
  },
  {
    "code": "SO",
    "codes": [
      "SO",
      "SOM"
    ],
    "name": "Somalie",
    "capital": "Mogadiscio",
    "continent": "Afrique",
    "nameAliases": [
      "Somalia"
    ],
    "capitalAliases": [
      "Mogadishu"
    ]
  },
  {
    "code": "SD",
    "codes": [
      "SD",
      "SDN"
    ],
    "name": "Soudan",
    "capital": "Khartoum",
    "continent": "Afrique",
    "nameAliases": [
      "Sudan"
    ],
    "capitalAliases": []
  },
  {
    "code": "SS",
    "codes": [
      "SS",
      "SSD"
    ],
    "name": "Soudan du Sud",
    "capital": "Djouba",
    "continent": "Afrique",
    "nameAliases": [
      "South Sudan"
    ],
    "capitalAliases": [
      "Juba"
    ]
  },
  {
    "code": "LK",
    "codes": [
      "LK",
      "LKA"
    ],
    "name": "Sri Lanka",
    "capital": "Colombo",
    "continent": "Asie",
    "nameAliases": [],
    "capitalAliases": [
      "Sri Jayawardenapura Kotte"
    ]
  },
  {
    "code": "SE",
    "codes": [
      "SE",
      "SWE"
    ],
    "name": "Suède",
    "capital": "Stockholm",
    "continent": "Europe",
    "nameAliases": [
      "Sweden"
    ],
    "capitalAliases": []
  },
  {
    "code": "CH",
    "codes": [
      "CH",
      "CHE"
    ],
    "name": "Suisse",
    "capital": "Berne",
    "continent": "Europe",
    "nameAliases": [
      "Switzerland"
    ],
    "capitalAliases": [
      "Bern"
    ]
  },
  {
    "code": "SR",
    "codes": [
      "SR",
      "SUR"
    ],
    "name": "Surinam",
    "capital": "Paramaribo",
    "continent": "Amérique du Sud",
    "nameAliases": [
      "Suriname"
    ],
    "capitalAliases": []
  },
  {
    "code": "SY",
    "codes": [
      "SY",
      "SYR"
    ],
    "name": "Syrie",
    "capital": "Damas",
    "continent": "Asie",
    "nameAliases": [
      "Syria"
    ],
    "capitalAliases": [
      "Damascus"
    ]
  },
  {
    "code": "TJ",
    "codes": [
      "TJ",
      "TJK"
    ],
    "name": "Tadjikistan",
    "capital": "Douchanbé",
    "continent": "Asie",
    "nameAliases": [
      "Tajikistan"
    ],
    "capitalAliases": [
      "Dushanbe"
    ]
  },
  {
    "code": "TZ",
    "codes": [
      "TZ",
      "TZA"
    ],
    "name": "Tanzanie",
    "capital": "Dodoma",
    "continent": "Afrique",
    "nameAliases": [
      "Tanzania"
    ],
    "capitalAliases": [
      "Dar es Salaam"
    ]
  },
  {
    "code": "TD",
    "codes": [
      "TD",
      "TCD"
    ],
    "name": "Tchad",
    "capital": "N'Djaména",
    "continent": "Afrique",
    "nameAliases": [
      "Chad"
    ],
    "capitalAliases": [
      "N'Djamena"
    ]
  },
  {
    "code": "CZ",
    "codes": [
      "CZ",
      "CZE"
    ],
    "name": "Tchéquie",
    "capital": "Prague",
    "continent": "Europe",
    "nameAliases": [
      "Czechia",
      "République tchèque"
    ],
    "capitalAliases": []
  },
  {
    "code": "TH",
    "codes": [
      "TH",
      "THA"
    ],
    "name": "Thaïlande",
    "capital": "Bangkok",
    "continent": "Asie",
    "nameAliases": [
      "Thailand"
    ],
    "capitalAliases": []
  },
  {
    "code": "TL",
    "codes": [
      "TL",
      "TLS"
    ],
    "name": "Timor oriental",
    "capital": "Dili",
    "continent": "Asie",
    "nameAliases": [
      "Timor-Leste",
      "Timor Oriental"
    ],
    "capitalAliases": []
  },
  {
    "code": "TG",
    "codes": [
      "TG",
      "TGO"
    ],
    "name": "Togo",
    "capital": "Lomé",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "TO",
    "codes": [
      "TO",
      "TON"
    ],
    "name": "Tonga",
    "capital": "Nuku'alofa",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "TT",
    "codes": [
      "TT",
      "TTO"
    ],
    "name": "Trinité-et-Tobago",
    "capital": "Port-d'Espagne",
    "continent": "Amérique du Nord",
    "nameAliases": [
      "Trinidad and Tobago"
    ],
    "capitalAliases": [
      "Port of Spain"
    ]
  },
  {
    "code": "TN",
    "codes": [
      "TN",
      "TUN"
    ],
    "name": "Tunisie",
    "capital": "Tunis",
    "continent": "Afrique",
    "nameAliases": [
      "Tunisia"
    ],
    "capitalAliases": []
  },
  {
    "code": "TM",
    "codes": [
      "TM",
      "TKM"
    ],
    "name": "Turkménistan",
    "capital": "Achgabat",
    "continent": "Asie",
    "nameAliases": [
      "Turkmenistan"
    ],
    "capitalAliases": [
      "Ashgabat"
    ]
  },
  {
    "code": "TR",
    "codes": [
      "TR",
      "TUR"
    ],
    "name": "Turquie",
    "capital": "Ankara",
    "continent": "Asie",
    "nameAliases": [
      "Türkiye"
    ],
    "capitalAliases": []
  },
  {
    "code": "TV",
    "codes": [
      "TV",
      "TUV"
    ],
    "name": "Tuvalu",
    "capital": "Funafuti",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "UA",
    "codes": [
      "UA",
      "UKR"
    ],
    "name": "Ukraine",
    "capital": "Kiev",
    "continent": "Europe",
    "nameAliases": [],
    "capitalAliases": [
      "Kyiv"
    ]
  },
  {
    "code": "UY",
    "codes": [
      "UY",
      "URY"
    ],
    "name": "Uruguay",
    "capital": "Montevideo",
    "continent": "Amérique du Sud",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "VU",
    "codes": [
      "VU",
      "VUT"
    ],
    "name": "Vanuatu",
    "capital": "Port-Vila",
    "continent": "Océanie",
    "nameAliases": [],
    "capitalAliases": [
      "Port Vila"
    ]
  },
  {
    "code": "VE",
    "codes": [
      "VE",
      "VEN"
    ],
    "name": "Venezuela",
    "capital": "Caracas",
    "continent": "Amérique du Sud",
    "nameAliases": [],
    "capitalAliases": []
  },
  {
    "code": "VN",
    "codes": [
      "VN",
      "VNM"
    ],
    "name": "Vietnam",
    "capital": "Hanoï",
    "continent": "Asie",
    "nameAliases": [
      "Viêt Nam"
    ],
    "capitalAliases": [
      "Hanoi"
    ]
  },
  {
    "code": "YE",
    "codes": [
      "YE",
      "YEM"
    ],
    "name": "Yémen",
    "capital": "Sanaa",
    "continent": "Asie",
    "nameAliases": [
      "Yemen"
    ],
    "capitalAliases": [
      "Sana'a"
    ]
  },
  {
    "code": "ZM",
    "codes": [
      "ZM",
      "ZMB"
    ],
    "name": "Zambie",
    "capital": "Lusaka",
    "continent": "Afrique",
    "nameAliases": [
      "Zambia"
    ],
    "capitalAliases": []
  },
  {
    "code": "ZW",
    "codes": [
      "ZW",
      "ZWE"
    ],
    "name": "Zimbabwe",
    "capital": "Harare",
    "continent": "Afrique",
    "nameAliases": [],
    "capitalAliases": []
  }
]
