# Cosmic Park — Sitemap & Booking Rules

*8-Bedroom Private Villa · Anaikatti, Coimbatore · Prepared by Phoenixx IT*

> **Guiding principle (from the brief):** Sell the **whole villa as a single high-capacity retreat**, not a multi-category hotel. Content architecture leads with the *property experience*; room-level detail is a secondary layer for groups planning sleeping arrangements. Tone = warm, homely, nature-led, curator-style (the SaffronStays lane), never "5-star / opulent."
>
> Items marked **[CONFIRM]** need a decision from the property owner before build/launch (they carry legal or financial weight, or aren't publicly sourceable).

---

## 1. Sitemap

```
Cosmic Park
│
├── Home  ......................................  hero + day-in-the-life + signature features + booking teaser
│
├── The Villa
│   ├── Overview  ..............................  the 8-BR villa as ONE bookable unit; capacity, layout, floor split
│   ├── Bedroom Gallery  .......................  per-bedroom photos/detail  [CONFIRM: bedroom-by-bedroom differentiation]
│   └── Shared Spaces  .........................  pool deck · lawn · al fresco dining · bonfire pit · games area
│
├── Experiences
│   ├── A Day at Cosmic Park  ..................  scroll-based itinerary (Morning → Night, from Section 5 of brief)
│   └── Activities & Amenities  ................  badminton · football · carrom · pool · bathtub · breakfast
│
├── Gallery  ...................................  photo + video (the 6 signature features + day-in-life sequence)
│
├── Rates & Availability  ......................  seasonal tiers, calendar, min-stay, what's included
│
├── Book Your Stay  ★  .........................  BOOKING ENGINE (dates → stay → add-ons → summary → pay)
│   └── Booking Confirmation  ..................  invoice with GST-inclusive breakdown  (utility page)
│
├── Add-Ons & Experiences  .....................  bonfire · in-villa spa · dining/meal packages · airport transfer
│
├── Location & Getting Here  ...................  Anaikatti map, ~35 km / drive time from Coimbatore (CJB)
│
├── Our Story / About  .........................  brand narrative (curator voice)
│
├── Policies  ..................................  check-in/out · cancellation · deposit · ID · pets · smoking · children
│
├── FAQ
│
├── Contact / Enquire  .........................  group enquiry form + WhatsApp + phone
│
├── [Footer / Legal]
│   ├── Privacy Policy
│   ├── Terms of Service
│   └── Cancellation Policy
│
└── [Utility]  .................................  Manage My Booking · 404 · Thank-You
```

★ = the two screens delivered as a clickable wireframe (**Home** and **Book Your Stay**).

**Primary navigation (recommended, 6 items):** The Villa · Experiences · Gallery · Rates & Availability · Location · **Book Your Stay** (CTA button). Secondary items (Story, Policies, FAQ, Contact) live in the footer + a "More" menu to keep the header uncluttered and experience-led.

---

## 2. Booking Rules

### 2.1 Booking model — whole villa first

Cosmic Park is booked as **one unit of 8 bedrooms**. The engine has two selectable modes; whole-villa is the default and hero path.

| Mode | What it is | When shown |
|------|-----------|------------|
| **Whole Villa** (default) | All 8 bedrooms, full property, base occupancy **16 guests** | Always — primary CTA |
| **Per-Bedroom block** *(optional)* | Sell a subset of bedrooms on quiet dates | **[CONFIRM]** whether owner allows shared-property stays. Brief leans *no* ("without sharing with strangers") — recommend keeping this **off** at launch |

Recommendation: launch **whole-villa only**. Keep per-bedroom pricing modelled below but hidden until the owner explicitly wants partial lets.

### 2.2 Date-range availability

- Guest picks **check-in** and **check-out**; the villa is reserved for the full inclusive range.
- **Check-in:** 2:00 PM · **Check-out:** 11:00 AM–12:00 PM. *(Early check-in / late check-out subject to availability, extra cost.)*
- A date is **bookable** only if every night in the range is open (no partial-night or overlapping bookings — it's one property).
- Calendar states: **Available**, **Booked/blocked**, **Past** (disabled), **Selected range**.
- **Turnover buffer:** block the checkout day from being another booking's check-in if same-day turnover isn't feasible **[CONFIRM staff turnover time]**.
- Availability source of truth = the owner's calendar / channel manager; the site must prevent double-booking (single-unit lock).

### 2.3 Per-"type" pricing (seasonal rate tiers)

Because it's one villa, the "room types" that drive price are **seasonal tiers**, evaluated **per night** and summed across the stay. All figures are **placeholders — [CONFIRM base rate + tier structure]** (brief Section 9, item 2).

| Tier | Applies to (rule) | Nightly (whole villa) | Min stay |
|------|-------------------|----------------------:|:--------:|
| **Off-Peak** | Weekday nights, low season (≈ Jun–Sep) | ₹45,000 | 1 night |
| **Peak** | Weekend nights (Fri/Sat) or high season (≈ Oct–May) | ₹65,000 | 2 nights |
| **Festive** | 20 Dec – 5 Jan + notified long weekends | ₹85,000 | 3 nights |

- **Base occupancy:** 16 guests included in the nightly rate.
- **Extra guests:** ₹1,500 / extra mattress / night, up to hard **max occupancy [CONFIRM]** (base vs. with extra mattresses).
- **Optional per-bedroom rate** (only if partial lets are enabled): ₹7,000 / bedroom / night off-peak · ₹9,500 peak — **[CONFIRM]**. Note the GST slab implication in 2.6.
- Mixed-tier stays are priced night-by-night (e.g., a Fri–Sun stay = 2 peak nights), so the quote is always the true sum, not a flat guess.

### 2.4 Minimum stay

- Enforced by the **check-in night's tier** (table above): 1 / 2 / 3 nights.
- Long weekends and festive blocks may raise the minimum — driven by a per-date override in the calendar, not hard-coded.
- If the selected range is shorter than the minimum, the engine blocks checkout and shows an inline message ("This date needs a 2-night minimum").

### 2.5 Add-ons & experiences

Framed as **experiences, not line-item fees** (borrowed from Lohono, per brief Section 8 takeaway). All add-ons are optional and priced transparently.

| Add-on | Price (placeholder) | Unit | Taxable |
|--------|--------------------:|------|:-------:|
| Breakfast | **Included** | — | included in rate |
| Bonfire evening | ₹1,000 | per person | 18% GST *(from brief)* |
| In-villa spa / massage | ₹2,500 | per session | 18% GST **[CONFIRM]** |
| Meal package (lunch/dinner) | ₹800 | per person / meal | 18% GST **[CONFIRM in-house chef vs guest-arranged]** |
| Airport transfer (CJB ↔ villa, ~35 km) | ₹2,500 one-way / ₹4,500 round-trip | per vehicle | 18% GST **[CONFIRM]** |

### 2.6 Tax & fee handling

The checkout must show a **clear GST-inclusive breakdown, base stay separated from taxable add-ons** (brief Section 6).

- **Room rent GST:** Indian GST on accommodation is **12%** when tariff ≤ ₹7,500/unit/night and **18%** above. A whole-villa tariff is well above ₹7,500, so the wireframe applies **18% on room rent** — but this is exactly the item the brief flags: **[CONFIRM applicable GST rate/slab on room rent, separately from F&B].**
- **Add-on GST:** **18%** on bonfire, spa, meals, transfer (per brief; note restaurant F&B can be 5% without ITC — **[CONFIRM]** if an in-house chef changes the slab).
- **Security deposit:** ₹25,000 **[CONFIRM amount]**, shown as a **separate, refundable, non-taxed** line; refunded within **7 days** post-checkout less any damage **[CONFIRM]**.
- **No hidden service fee** — direct booking; if a cleaning fee is ever added it must be a visible line.
- **Advance vs balance:** collect **[CONFIRM %, e.g. 30%]** advance to confirm; balance due before/at check-in. Show both "Payable now" and "Balance at check-in."
- **Invoice:** GST invoice needs the villa's **GSTIN [CONFIRM]** (brief Section 1).

**Worked example — 2 nights, 16 guests, 1 peak + 1 off-peak night, bonfire for 10:**

```
Room rent          1 × ₹65,000 (peak)      = ₹65,000
                   1 × ₹45,000 (off-peak)  = ₹45,000
Subtotal (stay)                              ₹1,10,000
GST on room rent @ 18%                       ₹19,800
                                            ----------
Stay total                                   ₹1,29,800

Bonfire            10 × ₹1,000             = ₹10,000
GST on add-ons @ 18%                         ₹1,800
                                            ----------
Add-ons total                                ₹11,800

Security deposit (refundable, no GST)        ₹25,000
                                            ==========
Grand total (incl. deposit)                  ₹1,66,600
Payable now (30% of taxed total + deposit)   ₹67,480   [CONFIRM advance %]
```

### 2.7 Cancellation (reference framework — needs owner sign-off)

Modelled on the micro-market norm (StayVista ≈ full refund 14+ days out, ~50% within 7 days) — a **reference, not to copy verbatim** (brief Section 7).

| Notice before check-in | Refund |
|------------------------|--------|
| 14+ days | Full refund of stay charges |
| 7–14 days | 50% refund |
| < 7 days | No refund |

Security deposit is always refundable (less damages). **[DEFINE / owner sign-off required.]**

### 2.8 Other policy inputs surfaced at booking

ID (govt photo ID for all adults at check-in) · **pets [DEFINE]** · **smoking/party policy [DEFINE]** · **children age cutoff & extra-bed charge [DEFINE]**. These appear as checkboxes/notices in the booking flow and full text on the Policies page.

---

## 3. Open items blocking a *final* build (from brief Section 9)

1. Bedroom-by-bedroom layout + total max occupancy
2. Base rate + number of seasonal tiers
3. Cancellation, deposit, pet, children policies
4. Meal-package structure beyond complimentary breakfast
5. GST treatment: room rent vs. F&B/add-ons (+ GSTIN)
6. Final photography/video for the 6 signature features + day-in-life sequence

The wireframe uses clearly-labelled placeholders for all of the above so the structure can be reviewed before this data lands.
