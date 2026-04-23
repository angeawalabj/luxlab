use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct DoseParams {
    pub activity_bq:  f64,  // Bq
    pub energy_mev:   f64,  // MeV
    pub distance_m:   f64,  // m
    pub tissue_coeff: f64,  // facteur tissulaire (1.0 par défaut)
}

#[derive(Serialize)]
pub struct DoseResult {
    pub dose_rate_usvh: f64,   // µSv/h
    pub dose_rate_msvh: f64,   // mSv/h
    pub classification: String,
}

pub fn compute_dose(p: &DoseParams) -> DoseResult {
    // Formule simplifiée : D = Γ × A / r²
    // Γ ≈ 0.0877 × E (MeV) en µSv·m²/h/MBq
    let gamma    = 0.0877 * p.energy_mev * p.tissue_coeff;
    let rate     = gamma * p.activity_bq * 1e-6  // MBq
                 / (p.distance_m * p.distance_m);

    let classification = if rate < 1.0         { "Négligeable".into() }
                         else if rate < 1000.0  { "Acceptable".into()  }
                         else if rate < 100_000.0{ "Modéré".into()     }
                         else                   { "Élevé".into()       };

    DoseResult {
        dose_rate_usvh: rate,
        dose_rate_msvh: rate / 1000.0,
        classification,
    }
}