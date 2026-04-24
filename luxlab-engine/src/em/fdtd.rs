use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct FDTDParams {
    pub grid_size:   usize,   // N×N grid (ex: 128)
    pub wavelength:  f64,     // nm
    pub steps:       usize,   // nombre d'itérations temporelles
    pub source_x:    f64,     // position source (0.0–1.0)
    pub source_y:    f64,
    pub obstacle:    Option<FDTDObstacle>,
}

#[derive(Deserialize)]
pub struct FDTDObstacle {
    pub x1: f64, pub y1: f64,
    pub x2: f64, pub y2: f64,
    pub refractive_index: f64,
}

#[derive(Serialize)]
pub struct FDTDResult {
    pub field:       Vec<f32>,  // Ez field flattened N×N → f32 pour compacité
    pub grid_size:   usize,
    pub max_val:     f32,
    pub duration_ms: f64,
}

pub fn run_fdtd(p: &FDTDParams) -> FDTDResult {
    let t0   = std::time::Instant::now();
    let n    = p.grid_size.max(32).min(256);
    let nt   = p.steps.max(10).min(2000);

    // Courant électrique Ez, champs magnétiques Hx, Hy
    let mut ez  = vec![0.0_f32; n * n];
    let mut hx  = vec![0.0_f32; n * n];
    let mut hy  = vec![0.0_f32; n * n];

    // Carte des indices de réfraction (1.0 = air)
    let mut eps = vec![1.0_f32; n * n];

    // Obstacle diélectrique optionnel
    if let Some(obs) = &p.obstacle {
        let x1 = (obs.x1 * n as f64) as usize;
        let y1 = (obs.y1 * n as f64) as usize;
        let x2 = (obs.x2 * n as f64) as usize;
        let y2 = (obs.y2 * n as f64) as usize;
        let eps_r = (obs.refractive_index * obs.refractive_index) as f32;

        for j in y1.min(n)..y2.min(n) {
            for i in x1.min(n)..x2.min(n) {
                eps[j * n + i] = eps_r;
            }
        }
    }

    // Position source
    let sx = (p.source_x * n as f64) as usize;
    let sy = (p.source_y * n as f64) as usize;

    // Constantes FDTD (schéma de Yee)
    let courant = 0.7_f32;   // nombre de Courant < 1/√2
    let sc      = courant;

    // Longueur d'onde en cellules de grille
    let lambda_cells = (p.wavelength / 10.0) as f32;  // approximation
    let k = 2.0 * std::f32::consts::PI / lambda_cells;

    // Boucle temporelle principale
    for t in 0..nt {
        let t_f = t as f32;

        // Mise à jour Hx : Hx[i,j] = Hx[i,j] - sc * (Ez[i,j+1] - Ez[i,j])
        for j in 0..n-1 {
            for i in 0..n {
                let idx  = j * n + i;
                let idxp = (j+1) * n + i;
                hx[idx] -= sc * (ez[idxp] - ez[idx]);
            }
        }

        // Mise à jour Hy : Hy[i,j] = Hy[i,j] + sc * (Ez[i+1,j] - Ez[i,j])
        for j in 0..n {
            for i in 0..n-1 {
                let idx  = j * n + i;
                let idxp = j * n + i + 1;
                hy[idx] += sc * (ez[idxp] - ez[idx]);
            }
        }

        // Mise à jour Ez
        for j in 1..n-1 {
            for i in 1..n-1 {
                let idx = j * n + i;
                ez[idx] += (sc / eps[idx]) * (
                    (hy[idx] - hy[idx - 1])
                  - (hx[idx] - hx[(j-1) * n + i])
                );
            }
        }

        // Source sinusoïdale à (sx, sy)
        if sx < n && sy < n {
            let amplitude = (k * t_f - 0.0).sin();
            let env = if t < 30 { t as f32 / 30.0 } else { 1.0 }; // enveloppe
            ez[sy * n + sx] += amplitude * env;
        }

        // Conditions aux limites absorbantes (ABC de Mur, ordre 1)
        // Bord gauche
        for j in 0..n { ez[j * n] = ez[j * n + 1]; }
        // Bord droit
        for j in 0..n { ez[j * n + n - 1] = ez[j * n + n - 2]; }
        // Bord bas
        for i in 0..n { ez[i] = ez[n + i]; }
        // Bord haut
        for i in 0..n { ez[(n-1)*n + i] = ez[(n-2)*n + i]; }
    }

    // Normaliser pour l'affichage
    let max_val = ez.iter().map(|v| v.abs()).fold(0.0_f32, f32::max);
    let norm    = if max_val > 1e-10 { max_val } else { 1.0 };

    FDTDResult {
        field:       ez.iter().map(|v| v / norm).collect(),
        grid_size:   n,
        max_val:     norm,
        duration_ms: t0.elapsed().as_secs_f64() * 1000.0,
    }
}