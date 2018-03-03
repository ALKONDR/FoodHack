const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

const invoice = {
    provider_token: '381764678:TEST:4685',
    start_parameter: 'time-machine-sku',
    title: 'Working Time Machine',
    description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
    currency: 'RUB',
    photo_url: 'https://img.clipartfest.com/5a7f4b14461d1ab2caaa656bcee42aeb_future-me-fredo-and-pidjin-the-webcomic-time-travel-cartoon_390-240.png',
    is_flexible: true,
    prices: [
        {label: 'Working Time Machine', amount: 100000},
        {label: 'Gift wrapping', amount: 100000}
    ],
    payload: {
        coupon: 'BLACK FRIDAY'
    }
};

const shippingOptions = [
    {
        id: 'unicorn',
        title: 'Unicorn express',
        prices: [{label: 'Unicorn', amount: 200000}]
    },
    {
        id: 'slowpoke',
        title: 'Slowpoke mail',
        prices: [{label: 'Slowpoke', amount: 200000}]
    }
];

const replyOptions = Markup.inlineKeyboard([
    Markup.payButton('💸 Buy'),
    Markup.urlButton('❤️', 'http://telegraf.js.org')
]).extra();

const bot = new Telegraf('524885745:AAEayzlK3n8R_Mb7P0hNYA1VWmokvuzlg9U');
bot.start(({replyWithInvoice}) => replyWithInvoice(invoice));
bot.command('/buy', ({replyWithInvoice}) => replyWithInvoice(invoice, replyOptions));
bot.on('shipping_query', ({answerShippingQuery}) => answerShippingQuery(true, shippingOptions));
bot.on('pre_checkout_query', ({answerPreCheckoutQuery}) => answerPreCheckoutQuery(true));
bot.on('successful_payment', () => console.log('Woohoo'));
bot.startPolling();