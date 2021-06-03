const Discord =  require('discord.js');
const mongoose = require('mongoose');

// Mongoose
const Schema = mongoose.Schema;
dbURI = process.env.dbURI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log('MongoDB connected!'))
    .catch((err) => console.log(err))

const teamateSchema = new Schema({
    guildID: {
        type: String,
        required: true
    },
    guildName: {
        type: String,
        required: true
    },
    embedId: {
        type: String,
        required: true
    },
}, {timestamps: true})
const Teamate = mongoose.model('Teamate', teamateSchema);

const client = new Discord.Client();
const prefix = '!';
const botId = '835829445167939644';
client.once('ready', () => {
    console.log('Teamate is online!');
});

client.on('message', message => {
    if(!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift();
    if(command.startsWith("tset")){
        embedId = command.split("set")[1];
        const teamate = new Teamate({
            guildID: message.guild.id,
            guildName: message.guild.name,
            embedId: embedId
        })
        teamate.save();
    }
    if(command.startsWith("team")){
        Teamate.find({ guildID: message.guild.id }).sort({'createdAt':-1}).limit(1)
        .exec(function(err, teamates){
            if(err){
                console.log('Error while connecting finding data');
            }else{
                if(teamates.length === 0){
                    message.channel.send('Use !tset following with Embed Channel ID first then use !team command');
                }else{
                    console.log('new', teamates.length);
                    const embedChannelId = teamates[0].embedId;
                    message.channel.send(embedChannelId);
                    const questions = [
                        'Which mode do you want to play? (Eg: Trio Creative Map)',
                        'How many players do you need? (Eg: 2)',
                        'Minimum rank/level of players you are looking for? (Eg: Arena 4000 Points, 1 Cash Cup win)',
                        'Congratulation! Now in any moment you\'ll start receiving DMs from players'
                    ]
                    let counter = 0
                    const filter = m => m.author.id === message.author.id;
                    const collector = new Discord.MessageCollector(message.channel, filter, {
                        max: questions.length,
                        time: 1000 * 30
                    })
                    message.channel.send(questions[counter++])
                    collector.on('collect', m => {
                        if(counter < questions.length){
                            m.channel.send(questions[counter++])
                        }
                    })
                    collector.on('end', collected => {
                        console.log(`Collected ${collected.size} messages`);
                        let counter = 0
                        let collectorQuestions = [];
                        collected.forEach((value) => {
                            collectorQuestions.push(value.content);
                            console.log(questions[counter++], value.content)
                        });
                        const mainEmbed = new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .addFields(
                                { name: 'Game Mode', value: collectorQuestions[0] },
                                { name: 'Number of Players', value: collectorQuestions[1] },
                                { name: 'Eligibility', value: collectorQuestions[2] },
                            )
                            .setTimestamp()
                            .setFooter('Teamate', 'https://i.ibb.co/4MDQFq5/Teamate.png');
                        client.channels.cache.get(embedChannelId).send(mainEmbed)
                        .then(embedMessage => {
                            embedMessage.react("✅");
                            const filter = (reaction, user) => {
                                return reaction.emoji.name === '✅' && user.id != message.author.id && user.id != botId;
                            };
                            const collector = embedMessage.createReactionCollector(filter, { max: collectorQuestions[1], time: 1000 * 30 });
            
                            collector.on('collect', (reaction, user) => {
                                if(reaction.count <= collectorQuestions[1] + 1){
                                    message.author.send(`Hi, <@${user.id}> (${user.id}) is interested in playing with you, just send him/her a DM`);
                                }
                                console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
                            });
                            
                            collector.on('end', collected => {
                                console.log(`Collected ${collected.size} items`);
                            });
                        })
                    })
                }
            }
        })
    }
});

client.login(process.env.token);
