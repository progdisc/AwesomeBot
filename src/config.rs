extern crate toml;

use std::error::Error;

#[derive(Deserialize)]
pub struct Config {
    pub token: String,
}

impl Config {
    pub fn new() -> Result<Self, Box<Error>> {
        use std::fs::File;
        use std::io::Read;

        let mut buffer = String::new();
        File::open("config.toml")?.read_to_string(&mut buffer)?;

        Ok(toml::from_str(&buffer)?)
    }
}
