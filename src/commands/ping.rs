use super::Command;
use serenity::model::prelude::Message;

pub struct Ping;

impl Command for Ping {
    fn usages(&self) -> Vec<String> {
        vec!["ping - pong".to_string()]
    }
    fn handle(&self, msg: &Message, _: &Vec<String>) -> bool {
        if let Err(err) = msg.channel_id.say("Pong!") {
            println!("{:?}", err);
        }

        true
    }
}
