const Discordie = require('discordie');

const ourAuth = require('./auth.json');
const PREFIX  = '?';
const ourClient = new Discordie({
	autoReconnect: true
});

function updateCommunismSpreadProgress() {
	ourClient.User.setGame(`Communism in ${ourClient.Guilds.length} guilds`);
}
function strcmp(a,b) {
	return String(a).toLowerCase() == String(b).toLowerCase();
}
function quote(x) {
	return `"${x}"`;
}

class Command {
	constructor(id, descriptor = {}) {
		if (!id) throw 'Command requires ID.';
		this.id = id;
		Object.assign(this, this.constructor.TEMPLATE, descriptor);
	}
	check(context) {
		if (this.private && !auth.admins.includes(context.user.id)) {
			return 'You are not authorized to use this command.';
		}
		if (this.guild && !context.guild) {
			return 'You must be in a guild to use this command.';
		}
		return;
	}
	resolve(context) {
		var err = this.check(context);
		if (err) {
			return Promise.reject(err);
		} else try {
			return Promise.resolve(this.run.call(this, context))
			.then(response => {
				if (this.title && response) {
					if (typeof response === 'object') {
						response.title = this.title + (response.title ? ' | ' + response.title : '');
					} else {
						response = '**' + this.title + '**\n' + response;
					}
				}
				return response;
			});
		} catch (e) {
			return Promise.reject(e);
		}
	}
	toString() {
		return PREFIX + this.id +
		(this.aliases.length ? '/' + this.aliases.join('/') : '') +
		(this.parameters.length ? ' ' + this.parameters.join(' ') : '');
	}
	get usage() {
		return `\`${this.toString()}\`: ${this.info}`;
	}
	embed() {
		return {
			title: 'Command: ' + quote(this.id),
			description: this.info || 'No information about this command.',
			color: 0xFF0000,
			fields: [
				{
					name: 'Usage',
					value: '`' + this.toString() + '`'
				},
				{
					name: 'Admin Only',
					value: this.private ? 'Yes' : 'No',
					inline: true
				},
				{
					name: 'Guild Only',
					value: this.guild ? 'Yes' : 'No',
					inlue: true
				}
			]
		};
	}
}


Command.TEMPLATE = {
	title: '',
	info: '',
	aliases: [],
	parameters: [],
	private: false,
	guild: false,
	run: function () {}
};

class Commands {
	static create(id, descriptor) {
		this._[id.toLowerCase()] = new Command(id, descriptor);
	}
	static get(id) {
		id = id.toLowerCase();
		for (var cmd in this._) {
			if (cmd == id || this._[cmd].aliases.includes(id)) {
				return this._[cmd];
			}
		}
	}
	static list() {
		return Object.keys(this._).map(cmd => this._[cmd].usage).join('\n\n');
	}
}
Commands._ = {};

class Context {
	constructor(response, client) {
		this.context = this;
		this.client  = client;
		this.message = response.message;
		this.content = this.message.content;
		this.channel = this.message.channel;
		this.guild   = this.channel.guild;
		this.user    = this.message.author;
		this.member  = this.guild ? this.user.memberOf(this.guild) : null;
		
		this.command = this.content.startsWith(PREFIX) ? this.content.substring(PREFIX.length+0) : '';
		if (this.command) {
			var [cmd, ...args] = this.command.split(' ');
			this.cmd  = cmd;
			this.args = args;
		}
	}
	handleError(err) {
		if (err) {
			console.error(err);
			return this.channel.sendMessage(':warning: Careful, comrade! ' + err);
		}
	}
	softError(err) {
		if (err) {
			console.error(err);
		}
	}
	getRoleName(role) {
		role = this.guild.roles.find(r => r.id == role);
		return role ? role.name : '';
	}
}

Commands.create('help', {
	title: 'Communist Manifesto',
	info: 'Show this man how to spread the glory of Communism!',
	aliases: ['halp','ayuda','?'],
	parameters: ['[command]'],
	run: function ({args}) {
		var cmd = args[0];
		if (cmd) {
			var command = Commands.get(cmd);
			if (!command) {
				throw 'Bad command, comrade: ' + cmd;
			}
			return command.embed();
		} else {
			return Commands.list();
		}
	}
});
Commands.create('communism', {
	info: 'See how much Communism has spread throughout Discord.',
	run: function ({client:ourClient}) {
		return `Communism has spread to ${ourClient.Users.length} users across ${ourClient.Guilds.length} guilds. Keep up the good work, comrade!`;
	}
});
Commands.create('spread', {
	info: 'Bring Communism to more guilds.',
	aliases: ['invite'],
	run: function ({client:ourClient}) {
		ourContext.user.openDM().then(ourDM => {
			ourDM.sendMessage(`Ah, I see you welcome Communism, comrade!\nhttps://discordapp.com/oauth2/authorize?&client_id=${ourClient.User.id}&scope=bot&permissions=2048`);
		});
	}
});
Commands.create('anthem', {
	info: 'Play the Soviet National Anthem, the song of our righteousness!',
	parameters: ['bassboost'],
	run: function ({args:ourArgs}) {
		if (ourArgs.includes('bassboost')) {
			return 'https://www.youtube.com/watch?v=3qxX5KhCpTk';
		} else {
			return 'https://www.youtube.com/watch?v=x72w_69yS1A';
		}
	}
});

ourClient.connect({
	token: ourAuth.token,
	autorun: true
});
ourClient.Dispatcher.on('GATEWAY_READY', () => {
	console.log('Comrade bot connected.');
	updateCommunismSpreadProgress();
	setInterval(updateCommunismSpreadProgress, 60000);
});
ourClient.Dispatcher.on('MESSAGE_CREATE', (ourResponse) => {
	const ourContext = new Context(ourResponse, ourClient);
	if (ourContext.user.id === ourClient.User.id || !ourContext.command) return;
	if (ourContext.user.bot) return;
	var ourCommand = Commands.get(ourContext.cmd);
	if (ourCommand) {
		console.log('Command:',ourContext.command);
		
		return ourCommand.resolve(ourContext).then(ourReply => {
			if (typeof ourReply === 'object') {
				if (ourReply.title || ourReply.description || ourReply.fields || ourReply.url || ourReply.image) {
					ourReply.color = FLIST_COLOR;
					return ourContext.channel.sendMessage('', false, ourReply);
				}
			} else if (ourReply) {
				return ourContext.channel.sendMessage(ourReply);
			}
		}).catch(ourError => ourContext.handleError(ourError));
	} else {
		let ourMessage = ourContext.content
		.replace(/private property/gi, '*OUR* property')
		.replace(/prisons?/gi, 'the *Gulags*')
		.replace(/capitalist(?! pig)/gi, 'Capitalist *PIG*')
		.replace(/\b(capitalism|socialism)/gi, '*Communism*')
		.replace(/\bi'm\b/gi, '*WE\'RE*')
		.replace(/\bi\b/gi, '*WE*')
		.replace(/\bmy\b/gi, '*OUR*')
		.replace(/\bmine\b/gi, '*OURS*')
		.replace(/\bme\b/gi, '*US*');
		
		if (ourMessage !== ourContext.content) {
			console.log(`Corrected sentence by ${ourContext.user.username} in ${ourContext.guild.name}: ${ourMessage}`);
			ourContext.channel.sendMessage('You mean, ' + ourMessage);
		} else if (/wealth|money|bank|rich|poor/i.test(ourMessage)) {
			ourContext.channel.sendMessage('You see comrade, with Communism there is no rich or poor, only equal men.');
		} else if (/^good bot/i.test(ourMessage)) {
			ourContext.channel.sendMessage('Cheers, comrade! For the betterment of all!');
		} else if (/^bad bot/i.test(ourMessage)) {
			ourContext.channel.sendMessage('You stupid capitalist pig will know the true Glory of Work when you rot in the Gulags.');
		}
	}
});
