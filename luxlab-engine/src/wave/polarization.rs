use serde::{Deserialize, Serialize};

/// Matrice de Jones 2×2 (complexe simplifié en amplitude + phase)
#[derive(Serialize, Clone)]
pub struct JonesMatrix {
    pub j00r: f64, pub j00i: f64,
    pub j01r: f64, pub j01i: f64,
    pub j10r: f64, pub j10i: f64,
    pub j11r: f64, pub j11i: f64,
}

impl JonesMatrix {
    pub fn identity() -> Self {
        Self { j00r:1.0,j00i:0.0, j01r:0.0,j01i:0.0,
               j10r:0.0,j10i:0.0, j11r:1.0,j11i:0.0 }
    }

    pub fn linear_polarizer(angle_deg: f64) -> Self {
        let t  = angle_deg * std::f64::consts::PI / 180.0;
        let c  = t.cos();
        let s  = t.sin();
        Self {
            j00r: c*c,  j00i:0.0,
            j01r: c*s,  j01i:0.0,
            j10r: c*s,  j10i:0.0,
            j11r: s*s,  j11i:0.0,
        }
    }

    pub fn half_wave_plate(angle_deg: f64) -> Self {
        let t  = angle_deg * std::f64::consts::PI / 180.0;
        let c  = (2.0*t).cos();
        let s  = (2.0*t).sin();
        Self {
            j00r: c,  j00i:0.0,
            j01r: s,  j01i:0.0,
            j10r: s,  j10i:0.0,
            j11r:-c,  j11i:0.0,
        }
    }

    pub fn quarter_wave_plate(angle_deg: f64) -> Self {
        let t  = angle_deg * std::f64::consts::PI / 180.0;
        let c  = t.cos();
        let s  = t.sin();
        // Phase π/2 sur la composante lente
        Self {
            j00r: c*c,  j00i: s*s,
            j01r: c*s,  j01i:-c*s,
            j10r: c*s,  j10i:-c*s,
            j11r: s*s,  j11i: c*c,
        }
    }

    /// Multiplie deux matrices de Jones
    pub fn mul(&self, other: &JonesMatrix) -> JonesMatrix {
        let cmul = |ar:f64,ai:f64,br:f64,bi:f64| (ar*br-ai*bi, ar*bi+ai*br);
        let cadd = |a:(f64,f64),b:(f64,f64)| (a.0+b.0, a.1+b.1);

        let (j00r,j00i) = cadd(cmul(self.j00r,self.j00i,other.j00r,other.j00i),
                               cmul(self.j01r,self.j01i,other.j10r,other.j10i));
        let (j01r,j01i) = cadd(cmul(self.j00r,self.j00i,other.j01r,other.j01i),
                               cmul(self.j01r,self.j01i,other.j11r,other.j11i));
        let (j10r,j10i) = cadd(cmul(self.j10r,self.j10i,other.j00r,other.j00i),
                               cmul(self.j11r,self.j11i,other.j10r,other.j10i));
        let (j11r,j11i) = cadd(cmul(self.j10r,self.j10i,other.j01r,other.j01i),
                               cmul(self.j11r,self.j11i,other.j11r,other.j11i));

        JonesMatrix { j00r,j00i,j01r,j01i,j10r,j10i,j11r,j11i }
    }

    /// Applique la matrice à un vecteur de Jones (Ex, Ey)
    pub fn apply(&self, ex_r:f64,ex_i:f64,ey_r:f64,ey_i:f64)
        -> (f64,f64,f64,f64)
    {
        let out_x_r = self.j00r*ex_r - self.j00i*ex_i
                    + self.j01r*ey_r - self.j01i*ey_i;
        let out_x_i = self.j00r*ex_i + self.j00i*ex_r
                    + self.j01r*ey_i + self.j01i*ey_r;
        let out_y_r = self.j10r*ex_r - self.j10i*ex_i
                    + self.j11r*ey_r - self.j11i*ey_i;
        let out_y_i = self.j10r*ex_i + self.j10i*ex_r
                    + self.j11r*ey_i + self.j11i*ey_r;
        (out_x_r, out_x_i, out_y_r, out_y_i)
    }

    /// Intensité de la sortie
    pub fn intensity_out(&self, ex_r:f64,ey_r:f64) -> f64 {
        let (oxr,oxi,oyr,oyi) = self.apply(ex_r,0.0,ey_r,0.0);
        oxr*oxr + oxi*oxi + oyr*oyr + oyi*oyi
    }
}

#[derive(Deserialize)]
pub struct MalusParams {
    pub angle1_deg: f64,
    pub angle2_deg: f64,
    pub i0:         f64,
}

#[derive(Serialize)]
pub struct MalusResult {
    pub transmittance: f64,
    pub intensity_out: f64,
    pub angle_diff:    f64,
}

pub fn compute_malus(p: &MalusParams) -> MalusResult {
    let theta = (p.angle2_deg - p.angle1_deg) * std::f64::consts::PI / 180.0;
    let t     = theta.cos().powi(2);
    MalusResult {
        transmittance: t,
        intensity_out: p.i0 * t,
        angle_diff:    (p.angle2_deg - p.angle1_deg).abs(),
    }
}

#[derive(Deserialize)]
pub struct PolarizationTrainParams {
    pub elements: Vec<PolarizationElement>,
    pub input_angle: f64,  // angle de polarisation d'entrée
    pub i0: f64,
}

#[derive(Deserialize)]
pub struct PolarizationElement {
    pub element_type: String,  // "polarizer"|"hwp"|"qwp"
    pub angle_deg:    f64,
}

#[derive(Serialize)]
pub struct PolarizationTrainResult {
    pub final_intensity:    f64,
    pub final_angle_deg:    f64,
    pub step_intensities:   Vec<f64>,
}

pub fn compute_polarization_train(p: &PolarizationTrainParams)
    -> PolarizationTrainResult
{
    let mut m = JonesMatrix::identity();
    let mut steps = Vec::new();

    // Vecteur d'entrée (polarisation linéaire à input_angle)
    let ang0  = p.input_angle * std::f64::consts::PI / 180.0;
    let ex    = ang0.cos();
    let ey    = ang0.sin();
    let i_in  = p.i0;

    for elem in &p.elements {
        let elem_matrix = match elem.element_type.as_str() {
            "polarizer" => JonesMatrix::linear_polarizer(elem.angle_deg),
            "hwp"       => JonesMatrix::half_wave_plate(elem.angle_deg),
            "qwp"       => JonesMatrix::quarter_wave_plate(elem.angle_deg),
            _           => JonesMatrix::identity(),
        };
        m = elem_matrix.mul(&m);
        let (oxr,_,oyr,_) = m.apply(ex, 0.0, ey, 0.0);
        let i_out = (oxr*oxr + oyr*oyr) * i_in;
        steps.push(i_out);
    }

    let (oxr,_,oyr,_) = m.apply(ex, 0.0, ey, 0.0);
    let final_angle = oyr.atan2(oxr) * 180.0 / std::f64::consts::PI;
    let final_int   = (oxr*oxr + oyr*oyr) * i_in;

    PolarizationTrainResult {
        final_intensity:  final_int,
        final_angle_deg:  final_angle,
        step_intensities: steps,
    }
}