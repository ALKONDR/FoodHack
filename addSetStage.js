const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { enter, leave } = Stage;

const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');

const allRecipes = require('./all-food').content;
const stage_4 = require('./index');

const check = '✔';

module.exports = function addSetStage() {
    const stage_2_menu = new Scene('stage_2_menu');

    stage_2_menu.enter(async (ctx) => {
        await ctx.reply('Выбери свой набор',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Классический', 'classic')],
                [Markup.callbackButton('Семейный', 'family')],
                [Markup.callbackButton('Постный', 'post')],
                [Markup.callbackButton('Премиум', 'premium')],
                [Markup.callbackButton('Фитнес', 'fitness')],
            ])
                .extra()
        )
    });

    stage_2_menu.action('classic', async (ctx, next) => {
        const set = await allRecipes.find(rec => rec.type === 'Классическое');

        await ctx.reply(`Классический набор \n ${set.telegraph}`,
            Markup.inlineKeyboard([
                ...set.content.map((rec, ind) => [
                    Markup.callbackButton(rec.name, JSON.stringify({type: "Классическое", ind: ind}))
                ]),
                [
                    Markup.callbackButton('Продолжить', 'continue')
                ]
            ]).extra()
        );
    });

    stage_2_menu.action('family', async (ctx, next) => {
        const set = await allRecipes.find(rec => rec.type === 'Семейное');

        await ctx.reply(`Семейный набор \n ${set.telegraph}`,
            Markup.inlineKeyboard([
                ...set.content.map((rec, ind) => [
                    Markup.callbackButton(rec.name, JSON.stringify({type: "Семейное", ind: ind}))
                ]),
                [
                    Markup.callbackButton('Продолжить', 'continue')
                ]
            ]).extra()
        );
    });

    stage_2_menu.action('post', async (ctx, next) => {
        const set = await allRecipes.find(rec => rec.type === 'Постное');

        await ctx.reply(`Постный набор \n ${set.telegraph}`,
            Markup.inlineKeyboard([
                ...set.content.map((rec, ind) => [
                    Markup.callbackButton(rec.name, JSON.stringify({type: "Постное", ind: ind}))
                ]),
                [
                    Markup.callbackButton('Продолжить', 'continue')
                ]
            ]).extra()
        );
    });

    stage_2_menu.action('premium', async (ctx, next) => {
        const set = await allRecipes.find(rec => rec.type === 'Премиум');

        await ctx.reply(`Премиум набор \n ${set.telegraph}`,
            Markup.inlineKeyboard([
                ...set.content.map((rec, ind) => [
                    Markup.callbackButton(rec.name, JSON.stringify({type: "Премиум", ind: ind}))
                ]),
                [
                    Markup.callbackButton('Продолжить', 'continue')
                ]
            ]).extra()
        );
    });

    stage_2_menu.action('fitness', async (ctx, next) => {
        const set = await allRecipes.find(rec => rec.type === 'Фитнес');

        await ctx.reply(`Фитнес набор \n ${set.telegraph}`,
            Markup.inlineKeyboard([
                ...set.content.map((rec, ind) => [
                    Markup.callbackButton(rec.name, JSON.stringify({type: "Фитнес", ind: ind}))
                ]),
                [
                    Markup.callbackButton('Продолжить', 'continue')
                ]
            ]).extra()
        );
    });

    stage_2_menu.action('continue', async (ctx) => {
        await ctx.reply('Спасибо за заказ! Давай перейдем к оплате этой вкуснотени❤️');
        await ctx.scene.leave();
        await ctx.scene.enter('stage_4');
    });

    stage_2_menu.on('callback_query', async (ctx, next) => {
        const data = JSON.parse(ctx.update.callback_query.data);

        if (data.type) {
            const set = await allRecipes.find(rec => rec.type === data.type);
            const recipe = await set.content[data.ind];

            if (recipe.name.startsWith(check)) {
                recipe.name = recipe.name.substring(1);
            } else {
                recipe.name = check + recipe.name;
            }

            return ctx.editMessageReplyMarkup(
                Markup.inlineKeyboard([...set.content.map((rec, ind) => [Markup.callbackButton(rec.name, JSON.stringify({
                    type: data.type,
                    ind: ind
                }))]),
                    [Markup.callbackButton('Продолжить', 'continue')]])
            );
        } else {
            return ctx;
        }
    });

    return stage_2_menu;
};
