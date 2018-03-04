const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { enter, leave } = Stage

const config = require('./config');
const group = require('./orderSettings');
const FoodSet = require('./FoodSet')
const foodSet = new FoodSet();

let approve = [Markup.callbackButton('Продолжить', JSON.stringify({approve: 'true'}))];

const check = '✔';
const except = '✖'

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

stage_2.enter(async (ctx) => {
	await ctx.reply('Молодец! Выбери из меню или под себя');
	await ctx.reply('Из меню или под себя',
        Markup.inlineKeyboard([
        	[Markup.callbackButton('Выбрать набор из меню', 'fromMenu')],
			[Markup.callbackButton('Составь меню под себя', 'selectSet')]
		])
            .extra()
    )
});

stage_2.action('selectSet', async (ctx, next) => {
	await ctx.scene.leave();
	await ctx.scene.enter('stage_2_1')
});

// STAGE 2_1
const stage_2_1 = new Scene('stage_2_1');
stage_2_1.enter(async (ctx) => {
    await ctx.reply('А теперь важная миссия! Получи оргазм или сдохни нахуй');
    await ctx.reply('Добавь продукты, которые тебе нравятся, или пропусти',
        Markup.inlineKeyboard([
            [Markup.callbackButton('Добавить любимые', 'addFav')],
            [Markup.callbackButton('Продолжить', 'add2Hate')]
        ])
            .extra()
    )
});

function categories2MD(cats) {
	const arr = []
	let flag = true;
	let row = [];
	for (const cat of cats) {
		row.push(Markup.callbackButton(cat, cat));
		if (row.length == 3 && flag) {
			arr.push(row);
			row = [];
			flag = false;
		} else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
		}
	}
	if (row.length !== 0) {
		arr.push(row);
	}
    arr.push([Markup.callbackButton('Идем дальше', 'return2Heated')]);
	return arr;
}

stage_2_1.action('addFav', async (ctx) => {
    await ctx.reply('Выбери категорию продуктов, которые вам нравится:',
        Markup.inlineKeyboard(categories2MD(foodSet.likedCategoriesArray))
            .extra()
    )
});

stage_2_1.action('return2Heated', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_2_2')
});

function selectLikedCategory(cat) {
	if (cat.startsWith(check)) {
		foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)] = foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)].substring(1);
	} else {
        foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)] = check + foodSet.likedCategoriesArray[foodSet.likedCategoriesArray.indexOf(cat)];
	}
}

function products2MD(products) {
	const arr = [];
	let flag = true;
	let row = [];
	for (const prod of products) {
		if (foodSet.favouriteProducts.find(k => k === prod) !== undefined) {
			row.push(Markup.callbackButton(check + prod, prod));
		} else {
            row.push(Markup.callbackButton(prod, prod));
		}
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
	}
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Вернуться к категориям', 'return2Cats')]);
    return arr;
}

stage_2_1.on('callback_query', async (ctx) => {
	if(foodSet.likedCategoriesArray.find(text => text === ctx.update.callback_query.data) !== undefined) {
		await selectLikedCategory(ctx.update.callback_query.data);
		const prds = await products2MD(foodSet.getLikedCategoryFood(ctx.update.callback_query.data));
		await ctx.editMessageText('Выберите любимые продукты: ',
			{reply_markup: { inline_keyboard: prds}}
		);
	} else if (ctx.update.callback_query.data === 'return2Cats' ) {
		await ctx.editMessageReplyMarkup(
        	Markup.inlineKeyboard(categories2MD(foodSet.likedCategoriesArray))
		);
	} else {
		const prod = ctx.update.callback_query.data;
		if (foodSet.favouriteProducts.find(k => k === prod) === undefined) {
			foodSet.addFavouriteProduct(prod);
		} else {
			foodSet.removeFavouriteProduct(prod);
		}
        const prds = await products2MD(foodSet.getLikedCategoryFood(foodSet.getCategoryByProduct(prod)));
        await ctx.editMessageText('Выберите любимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
	}
});

// STAGE 2_2
const stage_2_2 = new Scene('stage_2_2');
stage_2_2.enter(async (ctx) => {
    await ctx.reply('Теперь подумай, какие продукты исключить');
    await ctx.reply('Убери нелюбимые продукты из своего ужина',
        Markup.inlineKeyboard([
            [Markup.callbackButton('Исключить нелюбимые', 'addHate')],
            [Markup.callbackButton('Без учета нелюбимых продуктов', 'toSetPersonal')]
        ])
            .extra()
    )
});

function categories2MDh(cats) {
    const arr = []
    let flag = true;
    let row = [];
    for (const cat of cats) {
        row.push(Markup.callbackButton(cat, cat));
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
    }
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Идем дальше', 'toSetPersonal')]);
    return arr;
}

stage_2_2.action('addHate', async (ctx) => {
    await ctx.reply('Выбери категорию продуктов, которые вам НЕ нравится:',
        Markup.inlineKeyboard(categories2MDh(foodSet.hatedCategoriesArray))
            .extra()
    )
});

stage_2_2.action('toSetPersonal', async (ctx) => {
    await ctx.scene.leave();
    await ctx.scene.enter('stage_3')
});

function selectHatedCategory(cat) {
    if (cat.startsWith(check)) {
        foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)] = foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)].substring(1);
    } else {
        foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)] = except + foodSet.hatedCategoriesArray[foodSet.hatedCategoriesArray.indexOf(cat)];
    }
}

function products2MDh(products) {
    const arr = [];
    let flag = true;
    let row = [];
    for (const prod of products) {
        if (foodSet.hatedProducts.find(k => k === prod) !== undefined) {
            row.push(Markup.callbackButton(except + prod, prod));
        } else {
            row.push(Markup.callbackButton(prod, prod));
        }
        if (row.length == 3 && flag) {
            arr.push(row);
            row = [];
            flag = false;
        } else if (row.length == 2 && !flag) {
            arr.push(row);
            row = [];
            flag = true;
        }
    }
    if (row.length !== 0) {
        arr.push(row);
    }
    arr.push([Markup.callbackButton('Вернуться к категориям', 'return2Cats')]);
    return arr;
}

stage_2_2.on('callback_query', async (ctx) => {
    if(foodSet.hatedCategoriesArray.find(text => text === ctx.update.callback_query.data) !== undefined) {
        await selectHatedCategory(ctx.update.callback_query.data);
        const prds = await products2MDh(foodSet.getHatedCategoryFood(ctx.update.callback_query.data));
        await ctx.editMessageText('Выберите нелюбимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
    } else if (ctx.update.callback_query.data === 'return2Cats' ) {
        await ctx.editMessageReplyMarkup(
            Markup.inlineKeyboard(categories2MDh(foodSet.hatedCategoriesArray))
        );
    } else {
        const prod = ctx.update.callback_query.data;
        if (foodSet.hatedProducts.find(k => k === prod) === undefined) {
            foodSet.addHatedProduct(prod);
        } else {
            foodSet.removeHatedProduct(prod);
        }
        const prds = await products2MDh(foodSet.getHatedCategoryFood(foodSet.getCategoryByProduct(prod)));
        await ctx.editMessageText('Выберите нелюбимые продукты: ',
            {reply_markup: { inline_keyboard: prds}}
        );
    }
});

// ------------------------------------------------------------
// Bot settings
const bot = new Telegraf(config.token);

const stage = new Stage([stage_1, stage_2, stage_2_1, stage_2_2], { ttl: 10 })
bot.use(session())
bot.use(stage.middleware())

bot.command('start', enter('stage_1'));

bot.startPolling()