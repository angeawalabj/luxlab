use serde::{Deserialize, Serialize};

// Coefficients d'atténuation massique (cm²/g) × densité (g/cm³)
// Source : NIST XCOM
fn get_mu_linear(material: &str, energy_mev: f64) -> f64 {
    // Table simplifiée : mu_massique * rho
    let tables: &[(&str, f64, &[(f64, f64)])] = &[
        ("Plomb",     11.35, &[(0.1,59.7),(0.5,1.636),(1.0,0.776),(2.0,0.520)]),
        ("Béton",     2.3,   &[(0.1,0.400),(0.5,0.150),(1.0,0.110),(2.0,0.075)]),
        ("Eau",       1.0,   &[(0.1,0.167),(0.5,0.096),(1.0,0.071),(2.0,0.049)]),
        ("Aluminium", 2.7,   &[(0.1,0.459),(0.5,0.161),(1.0,0.116),(2.0,0.076)]),
        ("Tissu",     1.04,  &[(0.1,0.170),(0.5,0.097),(1.0,0.072),(2.0,0.050)]),
    ];

    let entry = tables.iter().find(|(name,_,_)| *name == material);
    let (_, rho, mu_table) = match entry {
        Some(e) => e,
        None    => return 0.1,
    };

    // Interpolation log-linéaire
    let keys: Vec<f64> = mu_table.iter().map(|(e,_)| *e).collect();
    let vals: Vec<f64> = mu_table.iter().map(|(_,m)| *m).collect();

    let n = keys.len();
    if energy_mev <= keys[0]   { return vals[0]   * rho }
    if energy_mev >= keys[n-1] { return vals[n-1] * rho }

    for i in 0..n-1 {
        if energy_mev >= keys[i] && energy_mev <= keys[i+1] {
            let t  = (energy_mev - keys[i]) / (keys[i+1] - keys[i]);
            let mu = vals[i] + t * (vals[i+1] - vals[i]);
            return mu * rho;
        }
    }
    0.1
}

#[derive(Deserialize)]
pub struct AttenuationParams {
    pub material:    String,
    pub energy_mev:  f64,
    pub max_thick:   f64,  // cm
    pub steps:       usize,
}

#[derive(Serialize)]
pub struct AttenuationPoint {
    pub x: f64,  // épaisseur cm
    pub i: f64,  // intensité relative
}

#[derive(Serialize)]
pub struct AttenuationResult {
    pub profile:    Vec<AttenuationPoint>,
    pub hvl:        f64,  // couche demi-valeur cm
    pub tvl:        f64,  // couche dixième-valeur cm
}

pub fn compute_attenuation(p: &AttenuationParams) -> AttenuationResult {
    let mu    = get_mu_linear(&p.material, p.energy_mev);
    let steps = p.steps.max(50).min(500);

    let profile = (0..=steps).map(|i| {
        let x = (i as f64 / steps as f64) * p.max_thick;
        let intensity = (-mu * x).exp();
        AttenuationPoint { x, i: intensity }
    }).collect();

    let hvl = if mu > 1e-12 { std::f64::consts::LN_2 / mu } else { f64::INFINITY };
    let tvl = if mu > 1e-12 { 10_f64.ln() / mu } else { f64::INFINITY };

    AttenuationResult { profile, hvl, tvl }
}