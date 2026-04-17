use serde::{Deserialize, Serialize};
use crate::geo::optics::prism_deviation_chromatic;

// ─── Types d'entrée ──────────────────────────────────────────────

#[derive(Deserialize, Debug, Default)]
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
    pub num_rays:   u32,
    #[serde(rename = "rayLength", default = "default_ray_length")]
    pub ray_length: f64,
    #[serde(default)]
    pub aberrations: bool,
}

fn default_num_rays()   -> u32 { 7 }
fn default_ray_length() -> f64 { 1200.0 }

// ─── Types de sortie ─────────────────────────────────────────────

#[derive(Serialize, Debug)]
pub struct Point2D {
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Debug)]
pub struct Ray {
    pub segments: Vec<Point2D>,
    pub wl:       f64,
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
    pub x:              f64,
    pub y:              f64,
    pub magnification:  f64,
    pub real:           bool,
    #[serde(rename = "fromLens")]
    pub from_lens:      String,
}

#[derive(Serialize, Debug)]
pub struct TraceResult {
    pub rays:          Vec<Ray>,
    pub intersections: Vec<Intersection>,
    pub images:        Vec<ConjugateImage>,
}

// ─── Moteur principal ─────────────────────────────────────────────

pub fn trace(components: &[Component], opts: &TraceOptions) -> TraceResult {
    let mut result = TraceResult {
        rays:          Vec::new(),
        intersections: Vec::new(),
        images:        Vec::new(),
    };

    let source = components.iter().find(|c| c.kind == "source");
    let source = match source {
        Some(s) => s,
        None    => return result,
    };

    let wl = source.params["wavelength"].as_f64().unwrap_or(550.0);

    let mut obstacles: Vec<&Component> = components
        .iter()
        .filter(|c| {
            matches!(
                c.kind.as_str(),
                "lens" | "mirror" | "prism" | "screen" | "blocker"
            ) && c.x > source.x
        })
        .collect();
    obstacles.sort_by(|a, b| a.x.partial_cmp(&b.x).unwrap());

    let n      = opts.num_rays as i32;
    let spread = 60.0_f64;

    for i in 0..n {
        let offset = if n > 1 {
            (i - n / 2) as f64 * (spread / (n - 1) as f64)
        } else {
            0.0
        };

        let ray = trace_single_ray(
            source.x + 25.0,
            source.y + offset,
            0.0,
            wl,
            &obstacles,
            opts,
            &mut result.intersections,
        );
        result.rays.push(ray);
    }

    let lenses: Vec<&Component> = obstacles
        .iter()
        .filter(|c| c.kind == "lens")
        .copied()
        .collect();

    if !lenses.is_empty() {
        compute_conjugate_images(source, &lenses, &mut result.images);
    }

    result
}

// ─── Tracé d'un seul rayon ────────────────────────────────────────

fn trace_single_ray(
    x0: f64, y0: f64,
    angle0: f64,
    wl: f64,
    obstacles: &[&Component],
    opts: &TraceOptions,
    intersections: &mut Vec<Intersection>,
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
        y = y + dx * angle.tan();
        x = obs.x;
        segments.push(Point2D { x, y });

        match obs.kind.as_str() {

            "lens" => {
                let f = obs.params["focalLength"].as_f64().unwrap_or(50.0);
                if f.abs() > 1e-10 {
                    let h = y - obs.y;
                    angle -= h / f;
                }
                intersections.push(Intersection {
                    x, y, kind: "refraction".to_string()
                });
            }

            "mirror" => {
                let mirror_angle = obs.params["angle"]
                    .as_f64().unwrap_or(0.0)
                    .to_radians();
                angle = -angle + 2.0 * mirror_angle;
                intersections.push(Intersection {
                    x, y, kind: "reflection".to_string()
                });
            }

            "prism" => {
                let apex = obs.params["apexAngle"]
                    .as_f64().unwrap_or(60.0)
                    .to_radians();
                let material = obs.params["material"]
                    .as_str().unwrap_or("BK7");
                let deviation = prism_deviation_chromatic(material, apex, wl);
                angle += deviation;
                intersections.push(Intersection {
                    x, y, kind: "dispersion".to_string()
                });
            }

            "screen" => {
                alive = false;
                intersections.push(Intersection {
                    x, y, kind: "detection".to_string()
                });
            }

            "blocker" => {
                let height = obs.params["height"].as_f64().unwrap_or(60.0);
                if (y - obs.y).abs() < height / 2.0 {
                    alive = false;
                    intersections.push(Intersection {
                        x, y, kind: "blocked".to_string()
                    });
                }
            }

            _ => {}
        }
    }

    if alive {
        let x_end = opts.ray_length;
        let y_end = y + (x_end - x) * angle.tan();
        segments.push(Point2D { x: x_end, y: y_end });
    }

    Ray { segments, wl }
}

// ─── Images conjuguées ───────────────────────────────────────────

fn compute_conjugate_images(
    source: &Component,
    lenses: &[&Component],
    images: &mut Vec<ConjugateImage>,
) {
    let mut x_obj = source.x;
    let mut y_obj = source.y;

    for lens in lenses {
        let f = lens.params["focalLength"].as_f64().unwrap_or(50.0);
        let d = lens.x - x_obj;

        if d.abs() < 1e-10 || (d - f).abs() < 1e-10 {
            continue;
        }

        let d_img = (d * f) / (d - f);
        let m     = -d_img / d;
        let x_img = lens.x + d_img;
        let y_img = lens.y + m * (y_obj - lens.y);

        images.push(ConjugateImage {
            x: x_img,
            y: y_img,
            magnification: m,
            real: d_img > 0.0,
            from_lens: lens.id.clone(),
        });

        x_obj = x_img;
        y_obj = y_img;
    }
}