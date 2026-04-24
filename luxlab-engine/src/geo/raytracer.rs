use serde::{Deserialize, Serialize};
use crate::geo::optics::{
    prism_deviation_chromatic, refractive_index,
};

// ─── Types d'entrée ──────────────────────────────────────────────

#[derive(Deserialize, Debug)]
pub struct Component {
    pub id:     String,
    #[serde(rename = "type")]
    pub kind:   String,
    pub x:      f64,
    pub y:      f64,
    pub params: serde_json::Value,
}

#[derive(Deserialize, Debug, Default)]
pub struct TraceOptions {
    #[serde(rename = "numRays", default = "default_num_rays")]
    pub num_rays:    u32,
    #[serde(rename = "rayLength", default = "default_ray_length")]
    pub ray_length:  f64,
    #[serde(default)]
    pub aberrations: bool,
}

fn default_num_rays()   -> u32 { 7 }
fn default_ray_length() -> f64 { 1200.0 }

// ─── Types de sortie ─────────────────────────────────────────────

#[derive(Serialize, Debug, Clone)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Debug)]
pub struct Ray {
    pub segments:  Vec<Point2D>,
    pub wl:        f64,
    pub intensity: f64,
}

#[derive(Serialize, Debug)]
pub struct Intersection {
    pub x:    f64,
    pub y:    f64,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Serialize, Debug)]
pub struct ConjugateImage {
    pub x:             f64,
    pub y:             f64,
    pub magnification: f64,
    pub real:          bool,
    #[serde(rename = "fromLens")]
    pub from_lens:     String,
}

#[derive(Serialize, Debug)]
pub struct TraceResult {
    pub rays:          Vec<Ray>,
    pub intersections: Vec<Intersection>,
    pub images:        Vec<ConjugateImage>,
    #[serde(rename = "durationMs")]
    pub duration_ms:   f64,
}

// ─── Types de source ─────────────────────────────────────────────

#[derive(Debug)]
enum SourceType {
    Point,           // rayons divergents toutes directions
    Parallel,        // rayons collimatés
    Conical,         // cône d'angle alpha
    Extended,        // surface émettrice de hauteur h
    Monochromatic,   // un seul λ (défaut)
    Polychromatic,   // plusieurs λ (lumière blanche)
    LED,             // spectre gaussien
    SpectralLamp,    // raies atomiques
    BlackBody,       // corps noir selon T
    Gaussian,        // profil gaussien TEM₀₀
    FiberOutput,     // sortie de fibre, ouverture numérique
}

impl SourceType {
    fn from_str(s: &str) -> Self {
        match s {
            "point"         => Self::Point,
            "parallel"      => Self::Parallel,
            "conical"       => Self::Conical,
            "extended"      => Self::Extended,
            "polychromatic" => Self::Polychromatic,
            "led"           => Self::LED,
            "spectral_lamp" => Self::SpectralLamp,
            "blackbody"     => Self::BlackBody,
            "gaussian"      => Self::Gaussian,
            "fiber_output"  => Self::FiberOutput,
            _               => Self::Parallel,  // défaut = laser
        }
    }
}

// ─── Longueurs d'onde selon le type de source ────────────────────

fn get_wavelengths(params: &serde_json::Value) -> Vec<(f64, f64)> {
    // Retourne Vec<(wavelength_nm, intensity_relative)>
    let base_wl    = params["wavelength"].as_f64().unwrap_or(550.0);
    let source_type = params["sourceType"].as_str().unwrap_or("parallel");
    let lamp_element = params["lampElement"].as_str().unwrap_or("sodium");

    match source_type {
        "polychromatic" => vec![
            (404.7, 0.6),  // violet
            (436.0, 0.8),  // bleu-violet
            (487.0, 0.7),  // bleu-cyan
            (546.0, 1.0),  // vert
            (587.0, 0.9),  // jaune
            (656.0, 0.85), // rouge
            (700.0, 0.5),  // rouge foncé
        ],
        "led" => {
            // Spectre gaussien autour de base_wl
            let bandwidth = params["ledBandwidth"]
                .as_f64().unwrap_or(30.0);
            let mut wls = Vec::new();
            for i in -3i32..=3i32 {
                let wl = base_wl + i as f64 * bandwidth / 3.0;
                let sigma = bandwidth / 2.355;
                let rel_i = (-((wl - base_wl).powi(2))
                    / (2.0 * sigma * sigma)).exp();
                if wl >= 380.0 && wl <= 780.0 {
                    wls.push((wl, rel_i));
                }
            }
            wls
        },
        "spectral_lamp" => {
            match lamp_element {
                "sodium"  => vec![(589.0, 1.0), (589.6, 0.98)],
                "mercury" => vec![
                    (404.7, 0.35), (435.8, 1.0),
                    (546.1, 0.85), (578.0, 0.6),
                ],
                "helium"  => vec![
                    (447.1, 0.45), (501.6, 0.55),
                    (587.6, 1.0),  (667.8, 0.70),
                ],
                "hydrogen" => vec![
                    (410.2, 0.16), (434.0, 0.30),
                    (486.1, 0.56), (656.3, 1.0),
                ],
                "neon"    => vec![
                    (585.2, 0.70), (614.3, 0.85),
                    (640.2, 1.0),  (692.9, 0.55),
                ],
                _         => vec![(589.0, 1.0)],
            }
        },
        "blackbody" => {
            // Loi de Planck normalisée
            let temp = params["temperature"]
                .as_f64().unwrap_or(3000.0);
            let mut wls = Vec::new();
            for i in 0..=6i32 {
                let wl = 400.0 + i as f64 * 60.0;
                let planck = blackbody_relative(wl, temp);
                wls.push((wl, planck));
            }
            wls
        },
        _ => vec![(base_wl, 1.0)],  // monochromatique / laser
    }
}

fn blackbody_relative(wl_nm: f64, temp_k: f64) -> f64 {
    let wl_m  = wl_nm * 1e-9;
    let hc_kb = 0.014388;  // h*c/k_B en m·K
    let denom = (hc_kb / (wl_m * temp_k)).exp() - 1.0;
    if denom <= 0.0 { return 0.0; }
    1.0 / (wl_m.powi(5) * denom)
}

// ─── Angles initiaux selon le type de source ─────────────────────

fn get_ray_angles(
    source_type: &str,
    num_rays:    u32,
    params:      &serde_json::Value,
) -> Vec<(f64, f64)> {
    // Retourne Vec<(offset_y, angle_initial)>
    let n = num_rays as i32;

    match source_type {

        "point" => {
            // Rayons dans toutes les directions
            let spread = std::f64::consts::PI * 0.8;
            (0..n).map(|i| {
                let angle = -spread/2.0 + i as f64 * spread / (n - 1).max(1) as f64;
                (0.0, angle)
            }).collect()
        },

        "conical" => {
            // Cône d'angle alpha autour de l'axe
            let _alpha = params["coneAngle"].as_f64().unwrap_or(10.0)
                * std::f64::consts::PI / 180.0;
            let spread_px = params["beamDiameter"].as_f64().unwrap_or(30.0);
            (0..n).map(|i| {
                let t = if n > 1 { i as f64 / (n-1) as f64 } else { 0.5 };
                let offset = (t - 0.5) * spread_px;
                (offset, 0.0)
            }).collect()
        },

        "extended" => {
            // Surface émettrice — chaque point émet dans plusieurs angles
            let height = params["sourceHeight"].as_f64().unwrap_or(40.0);
            (0..n).map(|i| {
                let t      = if n > 1 { i as f64 / (n-1) as f64 } else { 0.5 };
                let offset = (t - 0.5) * height;
                (offset, 0.0)
            }).collect()
        },

        "gaussian" => {
            // Profil gaussien — plus de rayons au centre
            let w0    = params["waist"].as_f64().unwrap_or(20.0);
            let div   = params["divergence"].as_f64().unwrap_or(0.0)
                * std::f64::consts::PI / 180.0;
            (0..n).map(|i| {
                let t      = if n > 1 { i as f64 / (n-1) as f64 } else { 0.5 };
                let _sigma  = w0 / 2.0;
                let offset = (t - 0.5) * w0 * 2.5;
                let angle  = if w0 > 0.0 { offset * div / w0 } else { 0.0 };
                (offset, angle)
            }).collect()
        },

        "fiber_output" => {
            // Ouverture numérique ON = n·sin(θ_max)
            let na      = params["numericalAperture"].as_f64().unwrap_or(0.12);
            let theta_m = na.asin().min(std::f64::consts::PI / 4.0);
            (0..n).map(|i| {
                let t     = if n > 1 { i as f64 / (n-1) as f64 } else { 0.5 };
                let angle = -theta_m + t * theta_m * 2.0;
                (0.0, angle)
            }).collect()
        },

        _ => {
            // Parallèle (laser idéal) — défaut
            let spread = params["beamDiameter"].as_f64().unwrap_or(60.0);
            (0..n).map(|i| {
                let t      = if n > 1 { i as f64 / (n-1) as f64 } else { 0.5 };
                let offset = (t - 0.5) * spread;
                (offset, 0.0)
            }).collect()
        },
    }
}

// ─── Moteur principal ─────────────────────────────────────────────

pub fn trace(components: &[Component], opts: &TraceOptions) -> TraceResult {
    let t0 = std::time::Instant::now();
    let mut result = TraceResult {
        rays:          Vec::new(),
        intersections: Vec::new(),
        images:        Vec::new(),
        duration_ms:   0.0,
    };

    let source = match components.iter().find(|c| c.kind == "source") {
        Some(s) => s,
        None    => {
            result.duration_ms = ms_elapsed(&t0);
            return result;
        }
    };

    let intensity    = source.params["intensity"].as_f64().unwrap_or(1.0);
    let source_type  = source.params["sourceType"].as_str().unwrap_or("parallel");
    let wavelengths  = get_wavelengths(&source.params);
    let ray_angles   = get_ray_angles(source_type, opts.num_rays, &source.params);

    // Obstacles triés par X, après la source
    let mut obstacles: Vec<&Component> = components
        .iter()
        .filter(|c| {
            matches!(c.kind.as_str(),
                "lens"|"mirror"|"prism"|"screen"|"blocker"|"filter")
            && c.x > source.x
        })
        .collect();
    obstacles.sort_by(|a, b| a.x.partial_cmp(&b.x).unwrap());

    // Tracer pour chaque longueur d'onde
    for (wl, wl_intensity) in &wavelengths {
        for (offset_y, init_angle) in &ray_angles {
            let ray = trace_single_ray(
                source.x + 25.0,
                source.y + offset_y,
                *init_angle,
                *wl,
                intensity * wl_intensity,
                &obstacles,
                opts,
                &mut result.intersections,
            );
            result.rays.push(ray);
        }
    }

    // Images conjuguées (première longueur d'onde seulement)
    let lenses: Vec<&Component> = obstacles
        .iter().filter(|c| c.kind == "lens").copied().collect();

    if !lenses.is_empty() {
        compute_conjugate_images(source, &lenses, &mut result.images);
    }

    result.duration_ms = ms_elapsed(&t0);
    result
}

// ─── Tracé d'un rayon ────────────────────────────────────────────

fn trace_single_ray(
    x0:           f64,
    y0:           f64,
    angle0:       f64,
    wl:           f64,
    intensity:    f64,
    obstacles:    &[&Component],
    opts:         &TraceOptions,
    intersections:&mut Vec<Intersection>,
) -> Ray {
    let mut x     = x0;
    let mut y     = y0;
    let mut angle = angle0;
    let mut alive = true;
    let mut segments = vec![Point2D { x, y }];

    for obs in obstacles {
        if !alive { break }
        if obs.x <= x { continue }

        let dx = obs.x - x;
        y      = y + dx * angle.tan();
        x      = obs.x;
        segments.push(Point2D { x, y });

        match obs.kind.as_str() {

            "lens" => {
                let f        = obs.params["focalLength"].as_f64().unwrap_or(50.0);
                let diameter = obs.params["diameter"].as_f64().unwrap_or(40.0);
                let half_d   = diameter * 0.4;

                if (y - obs.y).abs() > half_d {
                    // Vignettage : rayon hors du diamètre
                    alive = false;
                    intersections.push(Intersection { x, y, kind:"blocked".into() });
                } else {
                    // Réfraction paraxiale + dispersion chromatique
                    if f.abs() > 1e-10 {
                        let material = obs.params["material"]
                            .as_str().unwrap_or("BK7");
                        let n     = refractive_index(material, wl);
                        let n_ref = refractive_index(material, 550.0);
                        // Correction chromatique : f varie avec n
                        let f_corrected = f * (n_ref - 1.0) / (n - 1.0);
                        angle -= (y - obs.y) / f_corrected;
                    }
                    intersections.push(Intersection {
                        x, y, kind:"refraction".into()
                    });
                }
            },

            "mirror" => {
                let mirror_angle = obs.params["angle"]
                    .as_f64().unwrap_or(45.0)
                    .to_radians();
                let reflectance  = obs.params["reflectance"]
                    .as_f64().unwrap_or(0.98);
                // Réflexion partielle : on continue avec l'intensité réduite
                angle = 2.0 * mirror_angle - angle;
                intersections.push(Intersection {
                    x, y, kind:"reflection".into()
                });
                // Note : on ignore la perte d'intensité pour l'instant
                let _ = reflectance;
            },

            "prism" => {
                let material = obs.params["material"]
                    .as_str().unwrap_or("BK7");
                let apex     = obs.params["apexAngle"]
                    .as_f64().unwrap_or(60.0)
                    .to_radians();
                // Déviation réelle dépendant de λ via l'indice de Cauchy
                let deviation = prism_deviation_chromatic(material, apex, wl);
                angle += deviation;
                intersections.push(Intersection {
                    x, y, kind:"dispersion".into()
                });
            },

            "filter" => {
                let center    = obs.params["centerWL"]
                    .as_f64().unwrap_or(550.0);
                let bandwidth = obs.params["bandwidth"]
                    .as_f64().unwrap_or(50.0);
                let sigma     = bandwidth / 2.355;
                let dist      = (wl - center).abs();
                let transmission = (-dist * dist / (2.0 * sigma * sigma)).exp();

                if transmission < 0.05 {
                    alive = false;
                    intersections.push(Intersection {
                        x, y, kind:"blocked".into()
                    });
                } else {
                    intersections.push(Intersection {
                        x, y, kind:"refraction".into()
                    });
                }
            },

            "screen" => {
                alive = false;
                intersections.push(Intersection {
                    x, y, kind:"detection".into()
                });
            },

            "blocker" => {
                let height = obs.params["height"].as_f64().unwrap_or(60.0);
                if (y - obs.y).abs() < height / 2.0 {
                    alive = false;
                    intersections.push(Intersection {
                        x, y, kind:"blocked".into()
                    });
                }
            },

            _ => {}
        }
    }

    if alive {
        let x_end = opts.ray_length;
        let y_end = y + (x_end - x) * angle.tan();
        segments.push(Point2D { x: x_end, y: y_end });
    }

    Ray { segments, wl, intensity }
}

// ─── Images conjuguées ───────────────────────────────────────────

fn compute_conjugate_images(
    source:  &Component,
    lenses:  &[&Component],
    images:  &mut Vec<ConjugateImage>,
) {
    let mut x_obj = source.x;
    let mut y_obj = source.y;

    for lens in lenses {
        let f = lens.params["focalLength"].as_f64().unwrap_or(50.0);
        let d = lens.x - x_obj;

        if d.abs() < 1e-10 || (d - f).abs() < 1e-10 { continue; }

        let d_img = (d * f) / (d - f);
        let m     = -d_img / d;
        let x_img = lens.x + d_img;
        let y_img = lens.y + m * (y_obj - lens.y);

        images.push(ConjugateImage {
            x:             x_img,
            y:             y_img,
            magnification: m,
            real:          d_img > 0.0,
            from_lens:     lens.id.clone(),
        });

        x_obj = x_img;
        y_obj = y_img;
    }
}

// ─── Utils ───────────────────────────────────────────────────────

fn ms_elapsed(t0: &std::time::Instant) -> f64 {
    t0.elapsed().as_secs_f64() * 1000.0
}