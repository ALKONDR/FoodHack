const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage

const config = require('./config');
const group = require('./orderSettings');

let approve = [Markup.callbackButton('Продолжить', JSON.stringify({approve: 'true'}))];

const check = '✔';

// STAGE 1
const stage_1 = new Scene('stage_1')

function fromGroupToMD(group) {
	const arr = []
	for (const obj in group) {
		let row = [];
		for (const btn in group[obj]) {
			row.push(Markup.callbackButton(group[`${obj}`][`${btn}`]['text'], group[`${obj}`][`${btn}`]['data']));
		}
		arr.push(row)
		row = [];
	}
	arr.push(approve)
	return arr;
}

function checkAnother(row, newCheck) {
	for (const obj in row) {
		let text = row[`${obj}`].text;
		if (text.startsWith(check)) {
            text = text.substring(1);
		}
        row[`${obj}`].text = text;
	}
	row[newCheck].text = check + row[newCheck].text;
	return row;
}

stage_1.enter((ctx) => {
        return ctx.reply('Для начала выбери: выбрать ужин самому из меню или дать нам подобрать его по твоим любимым/нелюбимым продуктам',
            Markup.inlineKeyboard(fromGroupToMD(group))
                .extra()
        )
    }
);

stage_1.on('callback_query', async (ctx, next) => {
	data = JSON.parse(ctx.update.callback_query.data);
	console.log(data);
	if (data.approve !== undefined) {
        await ctx.scene.leave();
        await ctx.scene.enter('stage_2');
	} else {
		if (!group[data.group][data.data].text.startsWith(check)) {
            group[data.group] = await checkAnother(group[data.group], data.data);
            return ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard(fromGroupToMD(group))
            );
		} else {
			return ctx;
		}
	}
});

// STAGE 2
const stage_2 = new Scene('stage_2')

stage_2.enter((ctx) => {
	ctx.reply('Молодец! Выбери из меню или под себя');
	ctx.reply('Из меню или под себя',
        Markup.inlineKeyboard([
        	[Markup.callbackButton('Выбрать набор из меню', 'fromMenu')],
			[Markup.callbackButton('Составь меню под себя', 'selectSet')]
		])
            .extra()
    )
});

// ------------------------------------------------------------
// Bot settings
const bot = new Telegraf(config.token);

const stage = new Stage([stage_1, stage_2], { ttl: 10 })
bot.use(session())
bot.use(stage.middleware())

bot.command('start', enter('stage_1'));

bot.startPolling()