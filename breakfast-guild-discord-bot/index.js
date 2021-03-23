const dotenv = require('dotenv');
dotenv.config();

const validator = require("email-validator");
const Discord = require("discord.js");
const fetch = require('node-fetch');
const { prefix } = require('./config.json')

var ManagementClient = require('auth0').ManagementClient;


var management = new ManagementClient({
  token: process.env.AUTH0_TEMP_TOKEN,
  domain: process.env.AUTH0_DOMAIN
});


const client = new Discord.Client();


client.once("ready", () => {
    console.log("Ready!");
    client.user.setActivity('/table help', { type: "PLAYING" });
});

client.on("message", function(message){
    
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    
    console.log("Parsing valid message: '" + message.content + "' from " + message.member.nickname + ".");
    
    const commandBody = message.content.slice(prefix.length);
    const args = commandBody.trim().split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'test') {
        message.channel.send("<@" + message.author.id + "> \n" +
        "Second line. **Bold text.**");
        
    }

    if (command === 'help') {
        const embed = new Discord.MessageEmbed()
            .setColor('#00ffff')
            .setTitle('Information')
            .setURL("https://breakfast.vercel.app/")
            .setAuthor('Breakfast Table')
            .setDescription('For administrative commands, please call this command on admin channels.')            
            .setTimestamp()
            .setFooter('Breakfast Guild')
            .addFields(
                { name: 'Register on our Webapp', value: '/table register youruser youremail@mail.com' }
            );
        
        if(message.channel.name === "admin") {
            embed.addField('Get Registered Members', '/table getusers');
            message.channel.send(embed);
        } else {
            message.channel.send(embed);
        }
    }
        
    if (command === 'getusers') {
        if(message.channel.name === "admin") {
            management.getUsers()
            .then((result) => {
                message.reply("There are " + result.length + " registered members.");
            })
            .catch((err) => {
                console.error(err);
            });
        } else {
            message.reply("This command is exclusive to administrators.");
        }
    }

    if (command === "register") {
        var currentTime = new Date();
        currentTime.toLocaleDateString();
        
        console.log("Command /register requested by " + message.author.username + message.author.discriminator + " at " + currentTime);
        
        
        
        // Check if user is not registered already
        if(!message.member.roles.cache.some(r => r.name === "Registered")) {

            // Validate args
            if(args.length) {
                let username = args[0].toLowerCase();
                let email = args[1].toLowerCase();
                
                // Validate Username
                if(username.length >= 3 && username.length <= 15) {

                    // Validate Email
                    if(validator.validate(email)) {

                        console.log('Registering username ' + args[0]);
                        
                        var randomString = Math.random().toString(36).slice(-8);
                        console.log(randomString);
                        
                        const body = {
                            "client_id": process.env.AUTH0_CLIENTID,
                            "connection": process.env.AUTH0_DB_CONNECTION,
                            "email": email,
                            "username": username,
                            "password": randomString,
                            "picture": message.author.avatarURL(),
                            "user_metadata": { 
                                createdAt: currentTime, 
                                createdByDiscordUsedId: message.author.id, 
                                discordUsernameAtCreation: message.author.username + "#" + message.author.discriminator,
                                discordRank: "meal",
                            },
                        };

                        fetch("https://" + process.env.AUTH0_DOMAIN + "/dbconnections/signup", {
                            method: "POST",
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body),
                        })
                        .then(
                            (res) => {
                                if (res.status != 200) {

                                } else {
                                    var role = message.guild.roles.cache.find(role => role.name === "Registered");
                                    message.member.roles.add(role);
                                    message.author.send(
                                        "**Hey <@" + message.author.id + ">**\n" + 
                                        "Your account was succesfully registered at our Webapp.\n" +
                                        "\n" +
                                        "**Email: **" + email + " **Username:** " + username + "\n" +
                                        "\n" + 
                                        "We sent you a verification email. It should take a minute for you to receive it. \n" +
                                        'After your account verification, head to our **Login** page and click on "Forgot Password?" to reset your password.\n' +
                                        "We have set a randomized password so you can change it to whatever you'd like without the need to send it publicily on our discord channels. \n" +
                                        "\n"+
                                        "Follow the instructions on the email that you received. \n" + 
                                        "That's pretty much it. Welcome!"
                                    )
                                    console.log("Status 200: Registered a new user successfully.");
                                    // console.log(res);
                                    message.delete();
                                }
                            }
                        )
                        .catch(
                            (err) => {
                                console.error(err.message);
                            }
                        );
                    } else {
                        // Handle Err for Email Format
                        valid = false;
                        DMSendErr(message, 'Incorrect email format.');
                        message.delete();
                    }
                } else {
                    // Handle Err for Username Length
                    valid = false;
                    DMSendErr(message, 'Username length needs to be between 3 and 15 characters.');
                    message.delete();
                }
            } else {
                // Handle Err for Incorrect args length
                console.log('Args length: '+ args.length);
                valid = false;
                DMSendErr(message, 'You should provide your IGN in the following format, e.g.: ' + '"**/table register coffee coffee@gmail.com**".');
                message.delete();
            }
        } else {
            console.log("Registered user attempted to register another account."); // maybe call a function to FETCH POST to a DB so I can log and check if someone is trying to multi-register
            message.reply("You have already registered an account. If you need help, please contact our staff members.");
            message.delete();
        }
    }
});


client.login(process.env.DISCORD_APP_TOKEN);


function DMSendErr(messageHandler, errMsg) {
    messageHandler.author.send('**Hey ' + messageHandler.author.username + '!**');
    messageHandler.author.send('Your command "**' + messageHandler.content + '**" is invalid.');
    messageHandler.author.send(errMsg);

    console.log('User ' + messageHandler.author.username + ' failed due to err: ' + errMsg);
}