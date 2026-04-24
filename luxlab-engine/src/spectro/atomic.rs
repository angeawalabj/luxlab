use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize)]
pub struct SpectralLine {
    pub wl_nm:    f64,
    pub intensity:f64,
    pub name:     String,
}

fn gaussian(wl_c: f64, i: f64, wl: f64, sigma: f64) -> f64 {
    let dx = wl - wl_c;
    i * (-dx * dx / (2.0 * sigma * sigma)).exp()
}

pub fn get_lines(element: &str) -> Vec<SpectralLine> {
    match element {
        "Hydrogène" => vec![
            SpectralLine { wl_nm:656.3, intensity:1.00, name:"Hα".into() },
            SpectralLine { wl_nm:486.1, intensity:0.56, name:"Hβ".into() },
            SpectralLine { wl_nm:434.0, intensity:0.30, name:"Hγ".into() },
            SpectralLine { wl_nm:410.2, intensity:0.16, name:"Hδ".into() },
            SpectralLine { wl_nm:397.0, intensity:0.09, name:"Hε".into() },
        ],
        "Sodium" => vec![
            SpectralLine { wl_nm:589.0, intensity:1.00, name:"D₂".into() },
            SpectralLine { wl_nm:589.6, intensity:0.98, name:"D₁".into() },
            SpectralLine { wl_nm:568.8, intensity:0.12, name:"Vert".into()},
            SpectralLine { wl_nm:498.3, intensity:0.08, name:"Bleu".into()},
        ],
        "Mercure" => vec![
            SpectralLine { wl_nm:404.7, intensity:0.35, name:"Violet".into()},
            SpectralLine { wl_nm:435.8, intensity:1.00, name:"Bleu".into()  },
            SpectralLine { wl_nm:546.1, intensity:0.85, name:"Vert".into()  },
            SpectralLine { wl_nm:577.0, intensity:0.60, name:"Jaune".into() },
            SpectralLine { wl_nm:579.1, intensity:0.58, name:"Jaune".into() },
        ],
        "Hélium" => vec![
            SpectralLine { wl_nm:447.1, intensity:0.45, name:"Bleu".into()  },
            SpectralLine { wl_nm:501.6, intensity:0.55, name:"Vert".into()  },
            SpectralLine { wl_nm:587.6, intensity:1.00, name:"Jaune".into() },
            SpectralLine { wl_nm:667.8, intensity:0.70, name:"Rouge".into() },
            SpectralLine { wl_nm:706.5, intensity:0.25, name:"IR proche".into()},
        ],
        "Néon" => vec![
            SpectralLine { wl_nm:585.2, intensity:0.70, name:"Jaune".into()      },
            SpectralLine { wl_nm:614.3, intensity:0.85, name:"Orange-rouge".into()},
            SpectralLine { wl_nm:640.2, intensity:1.00, name:"Rouge".into()      },
            SpectralLine { wl_nm:692.9, intensity:0.55, name:"Rouge foncé".into()},
            SpectralLine { wl_nm:703.2, intensity:0.45, name:"Rouge foncé".into()},
        ],
        "Calcium" => vec![
            SpectralLine { wl_nm:393.4, intensity:0.80, name:"K".into() },
            SpectralLine { wl_nm:396.8, intensity:0.60, name:"H".into() },
            SpectralLine { wl_nm:422.7, intensity:1.00, name:"Violet".into()},
            SpectralLine { wl_nm:616.2, intensity:0.30, name:"Orange".into()},
        ],
        _ => vec![],
    }
}

#[derive(Deserialize)]
pub struct SpectrumParams {
    pub element: String,
    pub steps:   usize,
    pub sigma:   f64,  // largeur des raies en nm (résolution)
}

#[derive(Serialize)]
pub struct SpectrumPoint {
    pub wl: f64,
    pub i:  f64,
}

pub fn compute_spectrum(p: &SpectrumParams) -> Vec<SpectrumPoint> {
    let lines = get_lines(&p.element);
    let steps = p.steps.max(100).min(1600);
    let sigma = p.sigma.max(0.1).min(10.0);

    (0..=steps).map(|i| {
        let wl = 380.0 + (i as f64 / steps as f64) * 400.0;
        let intensity = lines.iter()
            .map(|l| gaussian(l.wl_nm, l.intensity, wl, sigma))
            .fold(0.0_f64, |a,b| a+b)
            .min(1.0);
        SpectrumPoint { wl, i: intensity }
    }).collect()
}