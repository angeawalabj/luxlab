use serde::{Deserialize, Serialize};

const H:  f64 = 6.626_070_15e-34;  // J·s
const C:  f64 = 299_792_458.0;     // m/s
const EV: f64 = 1.602_176_634e-19; // J

#[derive(Deserialize)]
pub struct PhotoelectricParams {
    pub wavelength_nm: f64,
}

#[derive(Serialize)]
pub struct MetalResult {
    pub name:            String,
    pub work_function_ev:f64,
    pub emitted:         bool,
    pub kinetic_ev:      f64,
    pub threshold_nm:    f64,
}

#[derive(Serialize)]
pub struct PhotoelectricResult {
    pub photon_energy_ev: f64,
    pub photon_freq_thz:  f64,
    pub wavelength_nm:    f64,
    pub metals:           Vec<MetalResult>,
}

const METALS: &[(&str, f64)] = &[
    ("Sodium",    2.28),
    ("Potassium", 2.30),
    ("Lithium",   2.38),
    ("Aluminium", 4.06),
    ("Zinc",      4.33),
    ("Cuivre",    4.70),
    ("Nickel",    5.01),
    ("Platine",   5.65),
];

pub fn compute_photoelectric(p: &PhotoelectricParams) -> PhotoelectricResult {
    let wl_m    = p.wavelength_nm * 1e-9;
    let e_joule = H * C / wl_m;
    let e_ev    = e_joule / EV;
    let freq_hz = C / wl_m;

    let metals = METALS.iter().map(|(name, phi)| {
        let ek_ev = e_ev - phi;
        MetalResult {
            name:             name.to_string(),
            work_function_ev: *phi,
            emitted:          ek_ev > 0.0,
            kinetic_ev:       if ek_ev > 0.0 { ek_ev } else { 0.0 },
            threshold_nm:     (H * C / (phi * EV)) * 1e9,
        }
    }).collect();

    PhotoelectricResult {
        photon_energy_ev: e_ev,
        photon_freq_thz:  freq_hz * 1e-12,
        wavelength_nm:    p.wavelength_nm,
        metals,
    }
}