use serde::Serialize;

#[derive(Serialize)]
pub struct LuxError {
    pub error: String,
    pub code:  String,
}

impl LuxError {
    pub fn new(code: &str, msg: &str) -> Self {
        Self {
            error: msg.to_string(),
            code:  code.to_string(),
        }
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self)
            .unwrap_or_else(|_| r#"{"error":"serialization failed","code":"INTERNAL"}"#.to_string())
    }
}

/// Macro pour retourner une erreur JSON depuis une fonction String
#[macro_export]
macro_rules! lux_err {
    ($code:expr, $msg:expr) => {
        return crate::error::LuxError::new($code, $msg).to_json()
    };
}