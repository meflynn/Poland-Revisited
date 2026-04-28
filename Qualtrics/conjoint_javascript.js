Qualtrics.SurveyEngine.addOnload(function() {

  // ============================================================
  // TRANSLATION LOOKUP TABLES
  // ============================================================

  var labels = {
    EN: {
      Country: {
        US: "United States",
        UK: "United Kingdom",
        CA: "Canada",
        DE: "Germany",
        TR: "Turkey"
      },
      Personnel: {
        "500":   "500",
        "2000":  "2,000",
        "5000":  "5,000",
        "10000": "10,000"
      },
      UnitType: {
        INF:  "Infantry unit — soldiers armed with small arms, traveling in light vehicles and armored cars (e.g. Humvees)",
        ARM:  "Heavy armor unit — a unit composed of tanks and large armored vehicles for transporting soldiers",
        HELO: "Attack helicopter unit — helicopters designed to attack enemy infantry and vehicles",
        ABM:  "Anti-ballistic missile defense unit — ground-based missile systems designed to intercept and destroy enemy missiles and aircraft",
        AIR:  "Air superiority fighter unit — combat aircraft whose primary mission is to fight enemy aircraft and maintain air superiority",
        ARTY: "Field artillery unit — cannons and rocket launchers used to fire on enemy soldiers and armored vehicles from greater distances"
      },
      Proximity: {
        "5KM":   "5 km",
        "100KM": "100 km",
        "250KM": "250 km"
      },
      Economic: {
        "1M":  "Expected revenue for local businesses: 1 million USD per year",
        "5M":  "Expected revenue for local businesses: 5 million USD per year",
        "10M": "Expected revenue for local businesses: 10 million USD per year"
      },
      Noise: {
        LOW:  "Minimal increase in noise levels",
        MOD:  "Moderate increase in noise levels",
        HIGH: "Significant increase in noise levels"
      },
      Environment: {
        NONE: "No negative environmental impact",
        MOD:  "Moderate negative environmental impact",
        SIG:  "Significant negative environmental impact"
      }
    },

    PL: {
      Country: {
        US: "Stany Zjednoczone",
        UK: "Wielka Brytania",
        CA: "Kanada",
        DE: "Niemcy",
        TR: "Turcja"
      },
      Personnel: {
        "500":   "500",
        "2000":  "2 000",
        "5000":  "5 000",
        "10000": "10 000"
      },
      UnitType: {
        INF:  "Jednostka piechoty — żołnierze uzbrojeni w broń ręczną, poruszający się lekkimi pojazdami, samochodami opancerzonymi (np. Humvee)",
        ARM:  "Jednostka pancerna — oddział złożony z czołgów i dużych pojazdów opancerzonych do transportu żołnierzy",
        HELO: "Jednostka śmigłowców szturmowych — śmigłowce przeznaczone do atakowania wrogiej piechoty i pojazdów",
        ABM:  "Jednostka obrony przeciwrakietowej — naziemne systemy rakietowe, które mają za zadanie przechwytywać i niszczyć wrogie pociski oraz samoloty",
        AIR:  "Jednostka lotnicza — samoloty bojowe, których głównym zadaniem jest walka z wrogimi samolotami i utrzymanie przewagi w powietrzu",
        ARTY: "Jednostka artylerii polowej — działa i wyrzutnie rakiet służące do ostrzeliwania wrogich żołnierzy oraz pojazdów pancernych z większej odległości"
      },
      Proximity: {
        "5KM":   "5 km",
        "100KM": "100 km",
        "250KM": "250 km"
      },
      Economic: {
        "1M":  "Oczekiwany przychód dla lokalnych firm: 1 milion dolarów (USD) rocznie",
        "5M":  "Oczekiwany przychód dla lokalnych firm: 5 milionów dolarów (USD) rocznie",
        "10M": "Oczekiwany przychód dla lokalnych firm: 10 milionów dolarów (USD) rocznie"
      },
      Noise: {
        LOW:  "Niewielki wzrost poziomu hałasu",
        MOD:  "Umiarkowany wzrost poziomu hałasu",
        HIGH: "Znaczny wzrost poziomu hałasu"
      },
      Environment: {
        NONE: "Brak negatywnego wpływu",
        MOD:  "Umiarkowany negatywny wpływ",
        SIG:  "Znaczący negatywny wpływ"
      }
    }
  };

  // ============================================================
  // DETECT ACTIVE LANGUAGE
  // Falls back to EN if language is not PL
  // ============================================================
  var lang = "${e://Field/Q_Language}";
  if (lang !== "PL") { lang = "EN"; }
  var t = labels[lang];

  // ============================================================
  // ATTRIBUTE LEVEL POOLS (using codes)
  // ============================================================
  var countries  = ["US", "UK", "CA", "DE", "TR"];
  var personnel  = ["500", "2000", "5000", "10000"];
  var unitTypes  = ["INF", "ARM", "HELO", "ABM", "AIR", "ARTY"];
  var proximity  = ["5KM", "100KM", "250KM"];
  var economic   = ["1M", "5M", "10M"];
  var noise      = ["LOW", "MOD", "HIGH"];
  var environment= ["NONE", "MOD", "SIG"];

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  function shuffle(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function setED(key, code, attr) {
    // Store the raw code (for data analysis)
    Qualtrics.SurveyEngine.setEmbeddedData(key, code);
    // Store the translated display label
    Qualtrics.SurveyEngine.setEmbeddedData(key + "_label", t[attr][code]);
  }

  // ============================================================
  // RANDOMIZE ATTRIBUTE ROW ORDER ONCE PER RESPONDENT
  // ============================================================
  var attrKeys = ["Country", "Personnel", "UnitType", "Proximity",
                  "Economic", "Noise", "Environment"];
  var attrOrder = shuffle(attrKeys);
  Qualtrics.SurveyEngine.setEmbeddedData("AttrOrder", attrOrder.join("|"));

  // ============================================================
  // GENERATE 10 CONJOINT SETS
  // ============================================================
  for (var set = 1; set <= 10; set++) {
    var pfx = "C" + set;

    var codes = {
      P1: {
        Country:     pick(countries),
        Personnel:   pick(personnel),
        UnitType:    pick(unitTypes),
        Proximity:   pick(proximity),
        Economic:    pick(economic),
        Noise:       pick(noise),
        Environment: pick(environment)
      },
      P2: {
        Country:     pick(countries),
        Personnel:   pick(personnel),
        UnitType:    pick(unitTypes),
        Proximity:   pick(proximity),
        Economic:    pick(economic),
        Noise:       pick(noise),
        Environment: pick(environment)
      }
    };

    ["P1", "P2"].forEach(function(p) {
      var c = codes[p];
      setED(pfx + "_" + p + "_Country",     c.Country,     "Country");
      setED(pfx + "_" + p + "_Personnel",   c.Personnel,   "Personnel");
      setED(pfx + "_" + p + "_UnitType",    c.UnitType,    "UnitType");
      setED(pfx + "_" + p + "_Proximity",   c.Proximity,   "Proximity");
      setED(pfx + "_" + p + "_Economic",    c.Economic,    "Economic");
      setED(pfx + "_" + p + "_Noise",       c.Noise,       "Noise");
      setED(pfx + "_" + p + "_Environment", c.Environment, "Environment");
    });
  }

});
