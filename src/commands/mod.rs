use serenity::model::prelude::Message;
use std::collections::HashMap;

mod ping;
use self::ping::Ping;

pub trait Command: Send + Sync {
    fn usages(&self) -> Vec<String> {
        vec![]
    }
    fn handle(&self, _: &Message, _: &Vec<String>) -> bool {
        false
    }
}

pub fn get_commands() -> HashMap<String, Box<Command>> {
    let mut commands: HashMap<String, Box<Command>> = HashMap::new();
    commands.insert("ping".to_string(), Box::new(Ping));
    commands
}
