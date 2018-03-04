const Telegraf = require('telegraf');

const addPayment = require('./addPayment');


const bot = new Telegraf('524885745:AAEayzlK3n8R_Mb7P0hNYA1VWmokvuzlg9U');
addPayment(bot);

bot.startPolling();