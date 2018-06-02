#[macro_use]
extern crate serde_derive;
extern crate serenity;

use serenity::client::Client;
use serenity::model::prelude::Message;
use serenity::prelude::Context;
use serenity::prelude::EventHandler;
mod commands;
mod config;
use commands::get_commands;
use commands::Command;
use config::Config;
use std::collections::HashMap;

struct Handler {
    commands: HashMap<String, Box<Command>>,
}
impl EventHandler for Handler {
    fn message(&self, _: Context, msg: Message) {
        if msg.author.bot {
            return;
        }

        let mut words: Vec<String> = msg.content
            .split_whitespace()
            .map(|word| word.to_string())
            .collect();

        let args: Vec<String> = words.drain(1..).collect();

        let command_name = words.remove(0);

        let command_name: String = match command_name.chars().next() {
            Some('!') => command_name.chars().skip(1).collect(),
            _ => return,
        };

        let command = match self.commands.get(&command_name) {
            Some(command) => command,
            _ => return,
        };

        if command.handle(&msg, &args) {
            let usages_text = command.usages().join("\n");

            if let Err(err) = msg.channel_id.send_message(|m| {
                m.embed(|e| {
                    e.title(format!("AwesomeBot - {} Syntax", command_name))
                        .description(usages_text)
                })
            }) {
                println!("{:?}", err);
            }
        }
    }
}

fn main() {
    let config = Config::new().expect("Could not read config!");
    let mut client = Client::new(
        &config.token,
        Handler {
            commands: get_commands(),
        },
    ).expect("stuff");
    client.start().unwrap();
    println!("Hello, world!");
}
