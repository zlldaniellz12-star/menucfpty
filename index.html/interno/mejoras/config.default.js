// config.default.js
window.CAKEFIT_DEFAULT = {
  updatedAt: new Date().toISOString(),
  items: [
    {
      id: "zanahoria-avena",
      name: "Zanahoria Avena",
      img: "img/zanahoria-avena.png",
      tags: { glutenFree: true, sugarFree: true, dairyFree: false },
      available: true,
      sizes: {
        "6": { enabled: false, price: 39.99, pax: "6–9 pax" },
        "7": { enabled: false, price: 53.99, pax: "10–12 pax" },
        "8": { enabled: false, price: 66.99, pax: "13–16 pax" },
        "9": { enabled: true,  price: 79.98, pax: "17–20 pax" }
      }
    }
  ],
  extras: {
    almondFlour: { enabled: false, bySize: { "6":6, "7":8, "8":10, "9":12 } }
  }
};